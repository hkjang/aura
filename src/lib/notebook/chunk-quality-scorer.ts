/**
 * Chunk Quality Scorer - Calculate quality scores for document chunks
 * Combines structural, semantic, and operational metrics
 * Score range: 0-100
 */

import { EmbeddingService } from "./embedding-service";

// ============ Types ============

export interface ChunkQualityMetrics {
  structureScore: number;      // 문단 경계 일치율 (0-100)
  semanticScore: number;       // 의미 응집도 (0-100)
  lengthScore: number;         // 길이 적정성 (0-100)
  overlapPenalty: number;      // 중복도 감점 (0-30)
  qaFitnessScore: number;      // QA 적합도 (0-100)
  referencePenalty: number;    // 참조 무결성 감점 (0-20)
}

export interface ChunkQualityResult {
  chunkId: string;
  metrics: ChunkQualityMetrics;
  totalScore: number;          // 최종 점수 (0-100)
  grade: QualityGrade;
  issues: QualityIssue[];
  needsReChunking: boolean;
}

export interface DocumentQualityResult {
  documentId: string;
  averageScore: number;
  variance: number;
  minScore: number;
  maxScore: number;
  chunkCount: number;
  poorChunkRate: number;       // 기준 미만 비율
  overallGrade: QualityGrade;
  recommendation: DocumentRecommendation;
  chunkResults: ChunkQualityResult[];
}

export type QualityGrade = "Excellent" | "Good" | "Fair" | "Poor" | "Critical";

export type DocumentRecommendation = 
  | "MAINTAIN"           // 양호 - 유지
  | "FINE_TUNE"          // 미세 튜닝
  | "ADJUST_RULES"       // 규칙 보정
  | "RE_CHUNK"           // 재청킹
  | "REDESIGN_DSL";      // DSL 재설계

export interface QualityIssue {
  type: IssueType;
  severity: "low" | "medium" | "high";
  message: string;
  suggestion?: string;
}

export type IssueType = 
  | "TOO_SHORT"
  | "TOO_LONG"
  | "LOW_COHERENCE"
  | "HIGH_OVERLAP"
  | "BROKEN_REFERENCE"
  | "POOR_STRUCTURE"
  | "LOW_QA_FITNESS";

// ============ Configuration ============

export interface ScoringWeights {
  structure: number;
  semantic: number;
  length: number;
  qaFitness: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  structure: 0.20,   // 20%
  semantic: 0.30,    // 30%
  length: 0.20,      // 20%
  qaFitness: 0.30,   // 30%
};

const TOKEN_RANGES = {
  min: 50,
  optimal_min: 100,
  optimal_max: 500,
  max: 800,
};

const GRADE_THRESHOLDS = {
  Excellent: 90,
  Good: 75,
  Fair: 60,
  Poor: 40,
};

// ============ Main Scorer Class ============

export class ChunkQualityScorer {
  private weights: ScoringWeights;

  constructor(weights: ScoringWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Calculate quality score for a single chunk
   */
  async scoreChunk(
    chunk: {
      id: string;
      content: string;
      tokenCount: number;
      startOffset: number;
      endOffset: number;
    },
    context: {
      originalContent: string;
      previousChunk?: { content: string };
      nextChunk?: { content: string };
    }
  ): Promise<ChunkQualityResult> {
    const issues: QualityIssue[] = [];

    // 1. Structure Score (문단 경계 일치율)
    const structureScore = this.calculateStructureScore(
      chunk.content,
      chunk.startOffset,
      chunk.endOffset,
      context.originalContent
    );

    // 2. Semantic Score (의미 응집도)
    const semanticScore = await this.calculateSemanticScore(chunk.content);

    // 3. Length Score (길이 적정성)
    const lengthResult = this.calculateLengthScore(chunk.tokenCount);
    if (lengthResult.issue) {
      issues.push(lengthResult.issue);
    }

    // 4. Overlap Penalty (중복도)
    const overlapPenalty = await this.calculateOverlapPenalty(
      chunk.content,
      context.previousChunk?.content,
      context.nextChunk?.content
    );
    if (overlapPenalty > 10) {
      issues.push({
        type: "HIGH_OVERLAP",
        severity: overlapPenalty > 20 ? "high" : "medium",
        message: `인접 청크와 ${overlapPenalty.toFixed(0)}% 중복`,
        suggestion: "오버랩 토큰 수를 줄이거나 청킹 전략을 변경하세요",
      });
    }

    // 5. QA Fitness Score (QA 적합도) - Rule-based for offline
    const qaFitnessScore = this.calculateQAFitnessScore(chunk.content);
    if (qaFitnessScore < 60) {
      issues.push({
        type: "LOW_QA_FITNESS",
        severity: qaFitnessScore < 40 ? "high" : "medium",
        message: "질문-응답 맥락이 불충분합니다",
        suggestion: "청크 크기를 늘리거나 문맥 보존 전략을 사용하세요",
      });
    }

    // 6. Reference Penalty (참조 무결성)
    const referencePenalty = this.calculateReferencePenalty(chunk.content);
    if (referencePenalty > 0) {
      issues.push({
        type: "BROKEN_REFERENCE",
        severity: referencePenalty > 10 ? "high" : "medium",
        message: "표, 코드, 각주 등의 참조가 손상되었습니다",
        suggestion: "참조 보존 옵션을 활성화하세요",
      });
    }

    // Add structure/semantic issues
    if (structureScore < 60) {
      issues.push({
        type: "POOR_STRUCTURE",
        severity: structureScore < 40 ? "high" : "medium",
        message: "문서 구조와 청크 경계가 일치하지 않습니다",
        suggestion: "HEADING_BASED 또는 ARTICLE_BASED 전략을 사용하세요",
      });
    }

    if (semanticScore < 60) {
      issues.push({
        type: "LOW_COHERENCE",
        severity: semanticScore < 40 ? "high" : "medium",
        message: "청크 내 의미적 일관성이 낮습니다",
        suggestion: "SEMANTIC_PARAGRAPH 전략을 사용하세요",
      });
    }

    // Calculate metrics
    const metrics: ChunkQualityMetrics = {
      structureScore,
      semanticScore,
      lengthScore: lengthResult.score,
      overlapPenalty,
      qaFitnessScore,
      referencePenalty,
    };

    // Calculate total score with weighted average
    const baseScore = 
      structureScore * this.weights.structure +
      semanticScore * this.weights.semantic +
      lengthResult.score * this.weights.length +
      qaFitnessScore * this.weights.qaFitness;

    // Apply penalties
    const totalScore = Math.max(0, Math.min(100, 
      baseScore - overlapPenalty - referencePenalty
    ));

    const grade = this.getGrade(totalScore);

    return {
      chunkId: chunk.id,
      metrics,
      totalScore,
      grade,
      issues,
      needsReChunking: totalScore < GRADE_THRESHOLDS.Poor,
    };
  }

  /**
   * Calculate document-level quality aggregation
   */
  async scoreDocument(
    documentId: string,
    chunks: Array<{
      id: string;
      content: string;
      tokenCount: number;
      startOffset: number;
      endOffset: number;
    }>,
    originalContent: string
  ): Promise<DocumentQualityResult> {
    const chunkResults: ChunkQualityResult[] = [];

    // Score each chunk
    for (let i = 0; i < chunks.length; i++) {
      const result = await this.scoreChunk(chunks[i], {
        originalContent,
        previousChunk: i > 0 ? chunks[i - 1] : undefined,
        nextChunk: i < chunks.length - 1 ? chunks[i + 1] : undefined,
      });
      chunkResults.push(result);
    }

    // Calculate aggregated stats
    const scores = chunkResults.map(r => r.totalScore);
    const averageScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    const variance = this.calculateVariance(scores, averageScore);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const poorChunkRate = chunkResults.filter(r => r.needsReChunking).length / (chunks.length || 1);

    const overallGrade = this.getGrade(averageScore);
    const recommendation = this.getRecommendation(averageScore, poorChunkRate, variance);

    return {
      documentId,
      averageScore,
      variance,
      minScore,
      maxScore,
      chunkCount: chunks.length,
      poorChunkRate,
      overallGrade,
      recommendation,
      chunkResults,
    };
  }

  // ============ Metric Calculations ============

  /**
   * Calculate structure score based on paragraph boundary alignment
   */
  private calculateStructureScore(
    chunkContent: string,
    startOffset: number,
    endOffset: number,
    originalContent: string
  ): number {
    let score = 100;

    // Check if chunk starts at a natural boundary
    const beforeStart = originalContent.slice(Math.max(0, startOffset - 10), startOffset);
    const startsAtBoundary = 
      startOffset === 0 ||
      /\n\n$/.test(beforeStart) ||
      /^[#제第]/.test(chunkContent) ||
      /^\d+\.\s/.test(chunkContent);

    if (!startsAtBoundary) {
      score -= 15;
    }

    // Check if chunk ends at a natural boundary
    const afterEnd = originalContent.slice(endOffset, endOffset + 10);
    const endsAtBoundary = 
      endOffset >= originalContent.length ||
      /^\n\n/.test(afterEnd) ||
      /[.!?。]\s*$/.test(chunkContent);

    if (!endsAtBoundary) {
      score -= 15;
    }

    // Check for heading preservation
    const hasHeading = /^[#제第]|^Article|^Section|^\d+[.조항]/.test(chunkContent);
    const headingComplete = hasHeading && chunkContent.includes("\n");
    if (hasHeading && !headingComplete) {
      score -= 20;
    }

    // Check for list integrity
    const hasListItems = /^\s*[-*•]\s|\n\s*[-*•]\s|\n\s*\d+[.)]\s/m.test(chunkContent);
    const listBroken = hasListItems && !chunkContent.trim().match(/[.!?。]$/);
    if (listBroken) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate semantic coherence score
   */
  private async calculateSemanticScore(content: string): Promise<number> {
    // Split into sentences
    const sentences = content.split(/(?<=[.!?。])\s+/).filter(s => s.trim().length > 10);
    
    if (sentences.length < 2) {
      return 85; // Single sentence chunks are assumed coherent
    }

    try {
      // Get embeddings for sentences
      const embeddings: number[][] = [];
      for (const sentence of sentences.slice(0, 5)) { // Limit to 5 for performance
        const result = await EmbeddingService.embed(sentence);
        embeddings.push(result.embedding);
      }

      // Calculate average pairwise similarity
      let totalSimilarity = 0;
      let pairCount = 0;

      for (let i = 0; i < embeddings.length - 1; i++) {
        const similarity = EmbeddingService.cosineSimilarity(embeddings[i], embeddings[i + 1]);
        totalSimilarity += similarity;
        pairCount++;
      }

      const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
      
      // Convert to 0-100 score (assuming similarity range 0.5-1.0 is good)
      return Math.min(100, Math.max(0, (avgSimilarity - 0.3) * 142));
    } catch {
      // Fallback to rule-based scoring
      return this.calculateSemanticScoreRuleBased(content);
    }
  }

  /**
   * Rule-based semantic score fallback
   */
  private calculateSemanticScoreRuleBased(content: string): number {
    let score = 70; // Base score

    // Consistent topic indicators
    const sentences = content.split(/(?<=[.!?。])\s+/);
    
    // Check for topic consistency (simple keyword overlap)
    if (sentences.length >= 2) {
      const firstWords = new Set(sentences[0].toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const lastWords = new Set(sentences[sentences.length - 1].toLowerCase().split(/\s+/).filter(w => w.length > 3));
      
      const overlap = [...firstWords].filter(w => lastWords.has(w)).length;
      score += Math.min(15, overlap * 5);
    }

    // Penalty for abrupt topic changes (marked by "그러나", "반면", "한편")
    const transitionCount = (content.match(/그러나|반면|한편|however|but|meanwhile/gi) || []).length;
    score -= transitionCount * 5;

    // Bonus for consistent structure (all list items or all paragraphs)
    const hasConsistentStructure = 
      (content.match(/^\s*[-*]\s/gm) || []).length >= 3 ||
      (content.match(/^\s*\d+[.)]\s/gm) || []).length >= 3;
    if (hasConsistentStructure) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate length score
   */
  private calculateLengthScore(tokenCount: number): { score: number; issue?: QualityIssue } {
    let issue: QualityIssue | undefined;

    if (tokenCount < TOKEN_RANGES.min) {
      const score = (tokenCount / TOKEN_RANGES.min) * 60;
      issue = {
        type: "TOO_SHORT",
        severity: tokenCount < TOKEN_RANGES.min / 2 ? "high" : "medium",
        message: `토큰 수 (${tokenCount})가 최소 권장 (${TOKEN_RANGES.min})보다 작습니다`,
        suggestion: "청크 병합 규칙을 조정하세요",
      };
      return { score, issue };
    }

    if (tokenCount > TOKEN_RANGES.max) {
      const overRatio = tokenCount / TOKEN_RANGES.max;
      const score = Math.max(0, 100 - (overRatio - 1) * 50);
      issue = {
        type: "TOO_LONG",
        severity: tokenCount > TOKEN_RANGES.max * 1.5 ? "high" : "medium",
        message: `토큰 수 (${tokenCount})가 최대 권장 (${TOKEN_RANGES.max})을 초과합니다`,
        suggestion: "최대 토큰 수를 줄이세요",
      };
      return { score, issue };
    }

    if (tokenCount >= TOKEN_RANGES.optimal_min && tokenCount <= TOKEN_RANGES.optimal_max) {
      return { score: 100 }; // Optimal range
    }

    // Linear interpolation for sub-optimal ranges
    if (tokenCount < TOKEN_RANGES.optimal_min) {
      const ratio = (tokenCount - TOKEN_RANGES.min) / (TOKEN_RANGES.optimal_min - TOKEN_RANGES.min);
      return { score: 60 + ratio * 40 };
    } else {
      const ratio = (tokenCount - TOKEN_RANGES.optimal_max) / (TOKEN_RANGES.max - TOKEN_RANGES.optimal_max);
      return { score: 100 - ratio * 40 };
    }
  }

  /**
   * Calculate overlap penalty
   */
  private async calculateOverlapPenalty(
    content: string,
    prevContent?: string,
    nextContent?: string
  ): Promise<number> {
    let totalPenalty = 0;

    // Simple text overlap check
    const words = new Set(content.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    if (prevContent) {
      const prevWords = new Set(prevContent.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const overlap = [...words].filter(w => prevWords.has(w)).length;
      const overlapRate = overlap / (words.size || 1);
      totalPenalty += overlapRate * 15; // Max 15 for previous
    }

    if (nextContent) {
      const nextWords = new Set(nextContent.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const overlap = [...words].filter(w => nextWords.has(w)).length;
      const overlapRate = overlap / (words.size || 1);
      totalPenalty += overlapRate * 15; // Max 15 for next
    }

    return Math.min(30, totalPenalty);
  }

  /**
   * Calculate QA fitness score (rule-based for offline)
   */
  private calculateQAFitnessScore(content: string): number {
    let score = 60; // Base score

    // Length check (sufficient context)
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 30) score += 10;
    if (wordCount >= 50) score += 5;

    // Contains complete sentences
    const sentenceCount = (content.match(/[.!?。]\s/g) || []).length + 1;
    if (sentenceCount >= 2) score += 5;
    if (sentenceCount >= 3) score += 5;

    // Contains factual content (numbers, proper nouns)
    const hasNumbers = /\d+/.test(content);
    const hasProperNouns = /[A-Z가-힣]{2,}/.test(content);
    if (hasNumbers) score += 5;
    if (hasProperNouns) score += 5;

    // Penalty for fragments
    if (!content.trim().match(/[.!?。]$/)) score -= 10;

    // Penalty for starting mid-sentence
    if (/^[a-z가-힣]/.test(content.trim()) && !/^[가-힣]+는|^[가-힣]+이|^[가-힣]+을/.test(content)) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate reference integrity penalty
   */
  private calculateReferencePenalty(content: string): number {
    let penalty = 0;

    // Check for broken table references
    if (/\|[^|]+$/.test(content) || /^[^|]+\|/.test(content)) {
      penalty += 10;
    }

    // Check for broken code blocks
    const codeBlockStarts = (content.match(/```/g) || []).length;
    if (codeBlockStarts % 2 !== 0) {
      penalty += 10;
    }

    // Check for broken numbered references
    if (/참조\s*\d+|see\s+\d+|그림\s*\d+|표\s*\d+/i.test(content)) {
      // Check if the reference target exists in the chunk
      const refNumbers = content.match(/[그림표참조]\s*(\d+)/g) || [];
      for (const ref of refNumbers) {
        const num = ref.match(/\d+/)?.[0];
        if (num && !new RegExp(`^\\s*${num}[.)]|${num}[.)]\\s`).test(content)) {
          penalty += 5;
        }
      }
    }

    // Check for broken parenthetical references
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      penalty += 5;
    }

    return Math.min(20, penalty);
  }

  // ============ Helpers ============

  private getGrade(score: number): QualityGrade {
    if (score >= GRADE_THRESHOLDS.Excellent) return "Excellent";
    if (score >= GRADE_THRESHOLDS.Good) return "Good";
    if (score >= GRADE_THRESHOLDS.Fair) return "Fair";
    if (score >= GRADE_THRESHOLDS.Poor) return "Poor";
    return "Critical";
  }

  private getRecommendation(
    avgScore: number,
    poorRate: number,
    variance: number
  ): DocumentRecommendation {
    if (avgScore >= 90 && poorRate < 0.05) return "MAINTAIN";
    if (avgScore >= 75 && poorRate < 0.15) return "FINE_TUNE";
    if (avgScore >= 60 && poorRate < 0.30) return "ADJUST_RULES";
    if (avgScore >= 40 || variance > 400) return "RE_CHUNK";
    return "REDESIGN_DSL";
  }

  private calculateVariance(scores: number[], mean: number): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  }
}

// Export singleton instance
export const chunkQualityScorer = new ChunkQualityScorer();

// ============ Utility Functions ============

/**
 * Get recommendation message in Korean
 */
export function getRecommendationMessage(rec: DocumentRecommendation): string {
  switch (rec) {
    case "MAINTAIN": return "양호 - 현재 설정 유지";
    case "FINE_TUNE": return "미세 튜닝 권장";
    case "ADJUST_RULES": return "DSL 규칙 보정 필요";
    case "RE_CHUNK": return "재청킹 필요";
    case "REDESIGN_DSL": return "DSL 재설계 권장";
  }
}

/**
 * Get grade color
 */
export function getGradeColor(grade: QualityGrade): string {
  switch (grade) {
    case "Excellent": return "#22c55e";
    case "Good": return "#3b82f6";
    case "Fair": return "#eab308";
    case "Poor": return "#f97316";
    case "Critical": return "#ef4444";
  }
}
