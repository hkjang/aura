/**
 * Notebook RAG - Retrieval Augmented Generation within notebook scope
 */

import { prisma } from "@/lib/prisma";
import { VectorStore, SearchResult } from "./vector-store";
import { EmbeddingService } from "./embedding-service";

export interface Citation {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  content: string;
  score: number;
}

export interface RAGContext {
  context: string;
  citations: Citation[];
  warning?: string;
}

export interface RAGQueryResult {
  context: RAGContext;
  systemPrompt: string;
}

const DEFAULT_MAX_TOKENS = 4000;
const CHARS_PER_TOKEN = 4; // Approximate

export class NotebookRAG {
  /**
   * Build RAG context from notebook(s)
   */
  static async buildContext(
    query: string,
    options: {
      notebookIds: string[];
      maxTokens?: number;
      limit?: number;
      useHybridSearch?: boolean;
    }
  ): Promise<RAGContext> {
    const { notebookIds, maxTokens = DEFAULT_MAX_TOKENS, limit = 10, useHybridSearch = true } = options;

    if (!notebookIds || notebookIds.length === 0) {
      return {
        context: "",
        citations: [],
        warning: "노트북이 선택되지 않았습니다.",
      };
    }

    // Search for relevant chunks
    let searchResults: SearchResult[];

    if (useHybridSearch) {
      searchResults = await VectorStore.hybridSearch(query, {
        notebookIds,
        limit,
      });
    } else {
      searchResults = await VectorStore.search(query, {
        notebookIds,
        limit,
        threshold: 0.3,
      });
    }

    // If no results found
    if (searchResults.length === 0) {
      return {
        context: "",
        citations: [],
        warning: "관련 내용을 찾을 수 없습니다. 다른 질문을 시도해보세요.",
      };
    }

    // Rerank results (simplified cross-encoder simulation using keyword overlap)
    const rerankedResults = this.rerank(query, searchResults);

    // Get source titles
    const sourceIds = [...new Set(rerankedResults.map(r => r.sourceId))];
    const sources = await prisma.knowledgeSource.findMany({
      where: { id: { in: sourceIds } },
      select: { id: true, title: true },
    });
    const sourceMap = new Map(sources.map(s => [s.id, s.title]));

    // Build context with token limit
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    let contextText = "";
    const citations: Citation[] = [];

    for (const result of rerankedResults) {
      const chunkText = `[출처: ${sourceMap.get(result.sourceId) || "Unknown"}]\n${result.content}\n\n`;

      if (contextText.length + chunkText.length > maxChars) {
        break;
      }

      contextText += chunkText;
      citations.push({
        sourceId: result.sourceId,
        sourceTitle: sourceMap.get(result.sourceId) || "Unknown",
        chunkId: result.chunkId,
        content: result.content.substring(0, 200) + (result.content.length > 200 ? "..." : ""),
        score: result.score,
      });
    }

    // Generate warning if coverage might be incomplete
    let warning: string | undefined;
    const avgScore = citations.reduce((sum, c) => sum + c.score, 0) / citations.length;

    if (avgScore < 0.5) {
      warning = "관련성이 낮은 결과입니다. 더 구체적인 질문을 해보세요.";
    } else if (citations.length === 1 && avgScore < 0.7) {
      warning = "참고할 수 있는 정보가 제한적입니다.";
    }

    return {
      context: contextText.trim(),
      citations,
      warning,
    };
  }

  /**
   * Build complete RAG query with system prompt
   */
  static async buildQuery(
    query: string,
    options: {
      notebookIds: string[];
      maxContextTokens?: number;
      systemPromptOverride?: string;
    }
  ): Promise<RAGQueryResult> {
    const context = await this.buildContext(query, {
      notebookIds: options.notebookIds,
      maxTokens: options.maxContextTokens || DEFAULT_MAX_TOKENS,
    });

    // Build system prompt
    const systemPrompt = options.systemPromptOverride || this.buildSystemPrompt(context);

    return {
      context,
      systemPrompt,
    };
  }

  /**
   * Build a system prompt for knowledge-grounded responses
   */
  private static buildSystemPrompt(context: RAGContext): string {
    const basePrompt = `당신은 주어진 지식 베이스를 기반으로 질문에 답변하는 AI 어시스턴트입니다.

## 중요 규칙:
1. **오직 제공된 컨텍스트 내의 정보만 사용하세요.** 외부 지식이나 추측을 사용하지 마세요.
2. 답변할 때 반드시 출처를 인용하세요. 예: "문서 'XYZ'에 따르면..."
3. 정보가 충분하지 않으면 솔직하게 "제공된 자료에서 관련 정보를 찾을 수 없습니다"라고 답하세요.
4. 여러 출처에서 정보가 상충하면 이를 명시하세요.
5. 답변은 명확하고 구조적으로 작성하세요.

---
## 참고 자료:

${context.context || "(참고할 자료가 없습니다)"}

---
위 자료를 바탕으로 사용자의 질문에 답변하세요.`;

    return basePrompt;
  }

  /**
   * Simple reranking based on keyword overlap
   * Production: Use a proper Cross-Encoder model
   */
  private static rerank(query: string, results: SearchResult[]): SearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    const scored = results.map(result => {
      const contentLower = result.content.toLowerCase();
      let keywordBoost = 0;

      for (const term of queryTerms) {
        if (contentLower.includes(term)) {
          keywordBoost += 0.05;
        }
      }

      // Check for exact phrase match
      if (contentLower.includes(query.toLowerCase())) {
        keywordBoost += 0.2;
      }

      return {
        ...result,
        score: Math.min(result.score + keywordBoost, 1.0),
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Get suggested questions based on notebook content
   */
  static async getSuggestedQuestions(notebookId: string, limit: number = 5): Promise<string[]> {
    // Get recent chunks from the notebook
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        source: { notebookId },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        content: true,
        keywords: true,
      },
    });

    if (chunks.length === 0) {
      return [
        "이 노트북에는 어떤 내용이 있나요?",
        "주요 주제를 요약해주세요.",
      ];
    }

    // Extract keywords from chunks
    const allKeywords: string[] = [];
    for (const chunk of chunks) {
      try {
        const keywords = JSON.parse(chunk.keywords || "[]") as string[];
        allKeywords.push(...keywords);
      } catch {
        // Ignore parsing errors
      }
    }

    // Count keyword frequency
    const keywordFreq: Record<string, number> = {};
    for (const kw of allKeywords) {
      keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
    }

    // Get top keywords
    const topKeywords = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);

    // Generate questions based on keywords
    const templates = [
      (kw: string) => `${kw}에 대해 설명해주세요.`,
      (kw: string) => `${kw}의 주요 특징은 무엇인가요?`,
      (kw: string) => `${kw}와 관련된 내용을 요약해주세요.`,
    ];

    const questions: string[] = [
      "전체 내용을 요약해주세요.",
    ];

    for (let i = 0; i < Math.min(topKeywords.length, limit - 1); i++) {
      const template = templates[i % templates.length];
      questions.push(template(topKeywords[i]));
    }

    return questions.slice(0, limit);
  }

  /**
   * Save Q&A to history
   */
  static async saveQnA(
    userId: string,
    notebookId: string | null,
    question: string,
    answer: string,
    citations: Citation[]
  ): Promise<string> {
    const qna = await prisma.qnAHistory.create({
      data: {
        userId,
        notebookId,
        question,
        answer,
        citations: JSON.stringify(citations.map(c => ({
          sourceId: c.sourceId,
          chunkId: c.chunkId,
          snippet: c.content,
        }))),
        isSaved: true,
      },
    });

    return qna.id;
  }
}
