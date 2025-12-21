import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";

interface ScoreBreakdown {
  length: { score: number; reason: string };
  speed: { score: number; reason: string };
  relevance: { score: number; reason: string };
  format: { score: number; reason: string };
  base: { score: number; reason: string };
}

interface ComparisonResult {
  model: string;
  provider: string;
  response: string;
  latency: number;
  tokens?: number;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  error?: string;
}

interface ModelSpec {
  modelId: string;
  provider: string;
}

export interface ScoringWeights {
  lengthMax: number;      // 응답 길이 최대 점수
  speedMax: number;       // 응답 속도 최대 점수
  relevanceMax: number;   // 관련성 최대 점수
  formatMax: number;      // 형식 최대 점수
  baseScore: number;      // 기본 점수
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  lengthMax: 25,
  speedMax: 25,
  relevanceMax: 25,
  formatMax: 15,
  baseScore: 10
};

/**
 * ModelComparison - Compare responses from different AI models
 * Sends the same query to multiple models and compares their responses
 */
export class ModelComparison {
  /**
   * Get scoring weights from database or use defaults
   */
  static async getScoringWeights(): Promise<ScoringWeights> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'MODEL_COMPARISON_WEIGHTS' }
      });
      if (config?.value) {
        return { ...DEFAULT_WEIGHTS, ...JSON.parse(config.value) };
      }
    } catch (error) {
      console.warn("Failed to get scoring weights from DB:", error);
    }
    return DEFAULT_WEIGHTS;
  }

  /**
   * Run the same query against multiple models and compare results
   */
  static async compareModels(
    query: string,
    models: ModelSpec[]
  ): Promise<ComparisonResult[]> {
    // Get model configurations from database
    const modelConfigs = await prisma.modelConfig.findMany({
      where: {
        modelId: { in: models.map(m => m.modelId) }
      }
    });

    // Get scoring weights
    const weights = await this.getScoringWeights();

    // Create a map for quick lookup
    const configMap = new Map(modelConfigs.map(c => [c.modelId, c]));

    // Run all model calls in parallel for fair comparison
    const promises = models.map(async (modelSpec) => {
      const startTime = Date.now();
      
      try {
        // Get config from DB or create a default one
        const dbConfig = configMap.get(modelSpec.modelId);
        
        const config: AIModelConfig = {
          id: dbConfig?.id || 'temp',
          providerId: (dbConfig?.provider || modelSpec.provider) as AIProviderId,
          modelId: dbConfig?.modelId || modelSpec.modelId,
          baseUrl: dbConfig?.baseUrl || this.getDefaultBaseUrl(modelSpec.provider),
          apiKey: dbConfig?.apiKey || process.env.OPENAI_API_KEY,
        };

        const languageModel = AIProviderFactory.createModel(config);

        const { text, usage } = await generateText({
          model: languageModel,
          prompt: query,
        });

        return {
          model: modelSpec.modelId,
          provider: modelSpec.provider,
          response: text,
          latency: Date.now() - startTime,
          tokens: usage?.totalTokens,
        };
      } catch (error) {
        console.error(`Error calling ${modelSpec.modelId}:`, error);
        return {
          model: modelSpec.modelId,
          provider: modelSpec.provider,
          response: `Error: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          latency: Date.now() - startTime,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        };
      }
    });

    const results = await Promise.all(promises);
    return this.scoreResponses(results, query, weights);
  }

  /**
   * Get default base URL for a provider
   */
  private static getDefaultBaseUrl(provider: string): string | undefined {
    switch (provider) {
      case 'ollama':
        return 'http://localhost:11434/v1';
      case 'vllm':
        return 'http://localhost:8000/v1';
      default:
        return process.env.OPENAI_BASE_URL;
    }
  }

  /**
   * Score responses based on various criteria with detailed breakdown
   */
  private static scoreResponses(
    results: ComparisonResult[], 
    query: string, 
    weights: ScoringWeights
  ): ComparisonResult[] {
    const queryKeywords = this.extractKeywords(query);
    
    return results.map((result) => {
      if (result.error) {
        return { 
          ...result, 
          score: 0,
          scoreBreakdown: {
            length: { score: 0, reason: '오류 발생' },
            speed: { score: 0, reason: '오류 발생' },
            relevance: { score: 0, reason: '오류 발생' },
            format: { score: 0, reason: '오류 발생' },
            base: { score: 0, reason: '오류로 인해 기본 점수 미부여' }
          }
        };
      }

      const breakdown: ScoreBreakdown = {
        length: { score: 0, reason: '' },
        speed: { score: 0, reason: '' },
        relevance: { score: 0, reason: '' },
        format: { score: 0, reason: '' },
        base: { score: weights.baseScore, reason: '정상 응답에 대한 기본 점수' }
      };

      // 1. 응답 길이 점수
      const responseLength = result.response.length;
      if (responseLength > 500) {
        breakdown.length = { 
          score: weights.lengthMax, 
          reason: `${responseLength}자 - 매우 상세한 응답` 
        };
      } else if (responseLength > 300) {
        breakdown.length = { 
          score: Math.round(weights.lengthMax * 0.8), 
          reason: `${responseLength}자 - 상세한 응답` 
        };
      } else if (responseLength > 150) {
        breakdown.length = { 
          score: Math.round(weights.lengthMax * 0.6), 
          reason: `${responseLength}자 - 적절한 길이` 
        };
      } else if (responseLength > 50) {
        breakdown.length = { 
          score: Math.round(weights.lengthMax * 0.4), 
          reason: `${responseLength}자 - 짧은 응답` 
        };
      } else {
        breakdown.length = { 
          score: 0, 
          reason: `${responseLength}자 - 너무 짧은 응답` 
        };
      }
      
      // 2. 응답 속도 점수
      const latency = result.latency;
      if (latency < 1000) {
        breakdown.speed = { 
          score: weights.speedMax, 
          reason: `${latency}ms - 매우 빠른 응답` 
        };
      } else if (latency < 2000) {
        breakdown.speed = { 
          score: Math.round(weights.speedMax * 0.8), 
          reason: `${latency}ms - 빠른 응답` 
        };
      } else if (latency < 3000) {
        breakdown.speed = { 
          score: Math.round(weights.speedMax * 0.6), 
          reason: `${latency}ms - 보통 속도` 
        };
      } else if (latency < 5000) {
        breakdown.speed = { 
          score: Math.round(weights.speedMax * 0.4), 
          reason: `${latency}ms - 느린 응답` 
        };
      } else {
        breakdown.speed = { 
          score: Math.round(weights.speedMax * 0.2), 
          reason: `${latency}ms - 매우 느린 응답` 
        };
      }
      
      // 3. 관련성 점수
      const responseLower = result.response.toLowerCase();
      const matchedKeywords = queryKeywords.filter(kw => 
        responseLower.includes(kw.toLowerCase())
      );
      const relevanceRatio = queryKeywords.length > 0 
        ? matchedKeywords.length / queryKeywords.length 
        : 0;
      const relevanceScore = Math.round(relevanceRatio * weights.relevanceMax);
      breakdown.relevance = { 
        score: relevanceScore, 
        reason: `키워드 ${matchedKeywords.length}/${queryKeywords.length}개 포함 (${Math.round(relevanceRatio * 100)}%)` 
      };
      
      // 4. 형식 점수
      let formatScore = 0;
      const formatReasons: string[] = [];
      
      if (result.response.includes('\n\n')) {
        formatScore += Math.round(weights.formatMax / 3);
        formatReasons.push('단락 구분');
      }
      if (result.response.includes('- ') || result.response.includes('• ')) {
        formatScore += Math.round(weights.formatMax / 3);
        formatReasons.push('불릿 리스트');
      }
      if (result.response.includes('1.') || result.response.includes('2.')) {
        formatScore += Math.round(weights.formatMax / 3);
        formatReasons.push('번호 매기기');
      }
      
      breakdown.format = { 
        score: formatScore, 
        reason: formatReasons.length > 0 ? formatReasons.join(', ') : '특별한 형식 없음' 
      };

      // 총점 계산
      const totalScore = breakdown.base.score + 
                         breakdown.length.score + 
                         breakdown.speed.score + 
                         breakdown.relevance.score + 
                         breakdown.format.score;

      return { 
        ...result, 
        score: totalScore,
        scoreBreakdown: breakdown
      };
    });
  }

  /**
   * Extract keywords from query for relevance scoring
   */
  private static extractKeywords(query: string): string[] {
    const stopWords = ['을', '를', '이', '가', '은', '는', '에', '에서', '의', '와', '과', '도', '만', '로', '으로', 
                       '에게', '한테', '께', '부터', '까지', '라고', '고', '해주세요', '알려주세요', '뭐', '어떻게'];
    
    const words = query
      .replace(/[?!.,]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word));
    
    return words;
  }
}
