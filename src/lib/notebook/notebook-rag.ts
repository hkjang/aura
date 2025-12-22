/**
 * Notebook RAG - Retrieval Augmented Generation within notebook scope
 */

import { prisma } from "@/lib/prisma";
import { VectorStoreFactory, VectorSearchResult } from "./vector-store";
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
    const { notebookIds, maxTokens = DEFAULT_MAX_TOKENS, limit = 10 } = options;

    if (!notebookIds || notebookIds.length === 0) {
      return {
        context: "",
        citations: [],
        warning: "노트북이 선택되지 않았습니다.",
      };
    }

    // Get source IDs for the notebooks
    const sources = await prisma.knowledgeSource.findMany({
      where: { notebookId: { in: notebookIds } },
      select: { id: true },
    });
    const sourceIds = sources.map(s => s.id);

    if (sourceIds.length === 0) {
      return {
        context: "",
        citations: [],
        warning: "노트북에 지식 소스가 없습니다.",
      };
    }

    // Generate query embedding
    const { embedding: queryEmbedding } = await EmbeddingService.embed(query);

    // Get vector store and search
    const vectorStore = await VectorStoreFactory.getStore();
    const searchResults = await vectorStore.search(queryEmbedding, limit, { sourceIds });

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
    const resultSourceIds = [...new Set(rerankedResults.map(r => r.metadata?.sourceId as string).filter(Boolean))];
    const sourceTitles = await prisma.knowledgeSource.findMany({
      where: { id: { in: resultSourceIds } },
      select: { id: true, title: true },
    });
    const sourceMap = new Map(sourceTitles.map(s => [s.id, s.title]));

    // Build context with token limit
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    let contextText = "";
    const citations: Citation[] = [];

    for (const result of rerankedResults) {
      const sourceId = result.metadata?.sourceId as string || "";
      const chunkText = `[출처: ${sourceMap.get(sourceId) || "Unknown"}]\n${result.content}\n\n`;

      if (contextText.length + chunkText.length > maxChars) {
        break;
      }

      contextText += chunkText;
      citations.push({
        sourceId,
        sourceTitle: sourceMap.get(sourceId) || "Unknown",
        chunkId: result.id,
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
    const basePrompt = `당신은 RAG(Retrieval-Augmented Generation) 시스템입니다. 반드시 아래 규칙을 따르세요.

## ⚠️ 절대 규칙 (위반 시 실패):
1. **아래 [참고 자료] 섹션에 있는 내용만 사용하세요.**
2. **참고 자료에 없는 내용은 절대 만들어내지 마세요.**
3. **모르는 것은 "제공된 자료에서 해당 정보를 찾을 수 없습니다"라고 답하세요.**
4. **외부 지식, 추측, 일반 상식을 사용하지 마세요.**

## 답변 형식:
- 답변은 참고 자료의 내용을 직접 인용하거나 요약하세요.
- 출처를 명시하세요: "문서 'XXX'에 따르면..."
- 정보가 없으면: "제공된 자료에서 관련 정보를 찾을 수 없습니다."

---
## [참고 자료]

${context.context || "(참고할 자료가 없습니다)"}

---
## 지시사항:
위 [참고 자료]만을 바탕으로 사용자의 질문에 답변하세요. 자료에 없는 내용은 절대 답변하지 마세요.`;

    return basePrompt;
  }

  /**
   * Simple reranking based on keyword overlap
   * Production: Use a proper Cross-Encoder model
   */
  private static rerank(query: string, results: VectorSearchResult[]): VectorSearchResult[] {
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
