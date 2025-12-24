/**
 * Processing Pipeline - Orchestrates knowledge source processing
 * Normalization → Chunking → Tagging → Embedding → Indexing
 */

import { prisma } from "@/lib/prisma";
import { ChunkingService } from "./chunking-service";
import { EmbeddingService } from "./embedding-service";
import { VectorStoreFactory } from "./vector-store";
import crypto from "crypto";

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  extractKeywords?: boolean;
  autoOptimize?: boolean; // 스마트 최적화 사용 여부 (기본: true)
}

export interface ProcessingResult {
  success: boolean;
  sourceId: string;
  chunksCreated: number;
  error?: string;
  optimizationApplied?: string; // 적용된 최적화 전략
}

/**
 * Smart Pipeline Optimizer - 문서 유형에 따른 자동 최적화
 */
export class SmartPipelineOptimizer {
  // 문서 유형별 최적 설정
  private static readonly PROFILES: Record<string, {
    name: string;
    chunkSize: number;
    overlap: number;
    description: string;
  }> = {
    pdf_technical: {
      name: "기술 문서 (PDF)",
      chunkSize: 1024,
      overlap: 128,
      description: "긴 단락과 복잡한 구조를 위한 큰 청크",
    },
    pdf_general: {
      name: "일반 PDF",
      chunkSize: 768,
      overlap: 100,
      description: "표준 PDF 문서용 중간 크기 청크",
    },
    docx: {
      name: "Word 문서",
      chunkSize: 512,
      overlap: 64,
      description: "구조화된 문서용 표준 청크",
    },
    code: {
      name: "소스 코드",
      chunkSize: 600,
      overlap: 100,
      description: "코드 블록 보존을 위한 설정",
    },
    markdown: {
      name: "마크다운/노트",
      chunkSize: 500,
      overlap: 50,
      description: "짧은 섹션 기반 문서용",
    },
    text_short: {
      name: "짧은 텍스트",
      chunkSize: 2000,
      overlap: 0,
      description: "분할 불필요한 짧은 텍스트",
    },
    text_long: {
      name: "긴 텍스트",
      chunkSize: 800,
      overlap: 100,
      description: "긴 평문 텍스트용",
    },
    url: {
      name: "웹 페이지",
      chunkSize: 600,
      overlap: 75,
      description: "웹 콘텐츠용 중간 크기 청크",
    },
    default: {
      name: "기본 설정",
      chunkSize: 512,
      overlap: 64,
      description: "범용 기본 설정",
    },
  };

  /**
   * 소스 정보를 기반으로 최적 처리 설정 결정
   */
  static getOptimalSettings(source: {
    type: string;
    fileType?: string | null;
    originalName?: string | null;
    content: string;
  }): { chunkSize: number; overlap: number; profile: string } {
    const contentLength = source.content?.length || 0;
    const fileName = source.originalName?.toLowerCase() || "";
    const fileType = source.fileType?.toLowerCase() || "";

    // 짧은 텍스트 (2KB 미만) - 분할 불필요
    if (contentLength < 2000) {
      return { ...this.PROFILES.text_short, profile: "text_short" };
    }

    // URL/웹 콘텐츠
    if (source.type === "URL") {
      return { ...this.PROFILES.url, profile: "url" };
    }

    // PDF 문서
    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
      // 기술 문서 감지 (긴 문서, 코드 포함)
      const isTechnical = contentLength > 50000 || 
        /\bfunction\b|\bclass\b|\bdef\b|\bimport\b|\bexport\b/i.test(source.content.slice(0, 5000));
      return isTechnical 
        ? { ...this.PROFILES.pdf_technical, profile: "pdf_technical" }
        : { ...this.PROFILES.pdf_general, profile: "pdf_general" };
    }

    // Word 문서
    if (fileType.includes("word") || fileType.includes("docx") || 
        fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      return { ...this.PROFILES.docx, profile: "docx" };
    }

    // 마크다운
    if (fileName.endsWith(".md") || fileName.endsWith(".markdown")) {
      return { ...this.PROFILES.markdown, profile: "markdown" };
    }

    // 소스 코드
    const codeExtensions = [".js", ".ts", ".py", ".java", ".cpp", ".c", ".go", ".rs", ".tsx", ".jsx"];
    if (codeExtensions.some(ext => fileName.endsWith(ext))) {
      return { ...this.PROFILES.code, profile: "code" };
    }

    // 일반 텍스트
    if (source.type === "TEXT" || fileName.endsWith(".txt")) {
      return contentLength > 10000
        ? { ...this.PROFILES.text_long, profile: "text_long" }
        : { ...this.PROFILES.text_short, profile: "text_short" };
    }

    // 기본값
    return { ...this.PROFILES.default, profile: "default" };
  }

  /**
   * 관리자 설정된 PipelineConfig 조회 및 적용
   */
  static async getAdminConfig(notebookId?: string) {
    try {
      // 노트북별 설정 우선, 없으면 기본(isDefault) 설정
      const config = await prisma.pipelineConfig.findFirst({
        where: {
          isActive: true,
          OR: [
            { notebookId: notebookId || undefined },
            { isDefault: true },
          ],
        },
        orderBy: [
          { notebookId: "desc" }, // 노트북별 설정 우선
          { isDefault: "desc" },
        ],
      });

      if (config) {
        return {
          chunkSize: config.chunkSize,
          overlap: config.chunkOverlap,
          profile: `admin:${config.name}`,
        };
      }
    } catch {
      // PipelineConfig 테이블이 없거나 에러 시 무시
    }
    return null;
  }
}

export class ProcessingPipeline {
  /**
   * Process a knowledge source
   */
  static async processSource(
    sourceId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    try {
      // Update status to PROCESSING
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: "PROCESSING" },
      });

      // Get the source
      const source = await prisma.knowledgeSource.findUnique({
        where: { id: sourceId },
        include: { notebook: true },
      });

      if (!source) {
        throw new Error("Source not found");
      }

      // Step 1: Normalize content
      const normalizedContent = this.normalizeContent(source.content);

      // Step 2: Generate content hash for deduplication
      const contentHash = this.generateHash(normalizedContent);

      // Check for duplicates within the same notebook
      const duplicate = await prisma.knowledgeSource.findFirst({
        where: {
          notebookId: source.notebookId,
          contentHash,
          id: { not: sourceId },
        },
      });

      if (duplicate) {
        await prisma.knowledgeSource.update({
          where: { id: sourceId },
          data: {
            status: "ERROR",
            errorMessage: `중복 콘텐츠: "${duplicate.title}"와 동일한 내용입니다.`,
          },
        });
        return {
          success: false,
          sourceId,
          chunksCreated: 0,
          error: "Duplicate content",
        };
      }

      // Update hash
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { contentHash },
      });

      // Step 3: Determine optimal chunking settings
      let chunkSize = options.chunkSize;
      let chunkOverlap = options.chunkOverlap;
      let optimizationProfile = "manual";

      // 자동 최적화 (옵션이 명시되지 않은 경우)
      if (options.autoOptimize !== false && (!chunkSize || !chunkOverlap)) {
        // 관리자 설정 우선
        const adminConfig = await SmartPipelineOptimizer.getAdminConfig(source.notebookId);
        
        if (adminConfig) {
          chunkSize = chunkSize || adminConfig.chunkSize;
          chunkOverlap = chunkOverlap || adminConfig.overlap;
          optimizationProfile = adminConfig.profile;
        } else {
          // 스마트 자동 최적화
          const smartSettings = SmartPipelineOptimizer.getOptimalSettings({
            type: source.type,
            fileType: source.fileType,
            originalName: source.originalName,
            content: normalizedContent,
          });
          chunkSize = chunkSize || smartSettings.chunkSize;
          chunkOverlap = chunkOverlap || smartSettings.overlap;
          optimizationProfile = `smart:${smartSettings.profile}`;
        }
      }

      // 기본값 폴백
      chunkSize = chunkSize || 512;
      chunkOverlap = chunkOverlap || 64;

      console.log(`[Pipeline] Processing ${source.title} with profile: ${optimizationProfile} (chunk: ${chunkSize}, overlap: ${chunkOverlap})`);

      // Step 4: Chunk the content
      // Try element-based chunking for PDFs with Upstage elements
      let chunks: {
        content: string;
        chunkIndex: number;
        startOffset: number;
        endOffset: number;
        elementIds?: string[];
        page?: number;
        coordinates?: { x: number; y: number; width: number; height: number };
        elementsInfo?: Array<{ id: string; text: string; coordinates?: { x: number; y: number; width: number; height: number } }>;
      }[];
      
      let metadata: { elements?: Array<{ id: string; category?: string; text: string; page: number; coordinates?: { x: number; y: number; width: number; height: number } }> } | null = null;
      try {
        metadata = source.metadata ? JSON.parse(source.metadata as string) : null;
      } catch {
        metadata = null;
      }
      
      if (source.fileType === "application/pdf" && metadata?.elements && Array.isArray(metadata.elements) && metadata.elements.length > 0) {
        // Use element-based chunking for PDFs with Upstage elements
        console.log(`[Pipeline] Using element-based chunking for PDF (${metadata.elements.length} elements)`);
        chunks = ChunkingService.chunkByElements(metadata.elements, {
          maxChunkSize: chunkSize,
          overlap: chunkOverlap,
        });
      } else {
        // Fallback to text-based chunking
        chunks = ChunkingService.chunk(normalizedContent, {
          maxChunkSize: chunkSize,
          overlap: chunkOverlap,
        });
      }

      // Step 4: Generate embeddings in batch
      const chunkTexts = chunks.map(c => c.content);
      const { embeddings, model: embeddingModel } = await EmbeddingService.embedBatch(chunkTexts);

      // Step 5: Extract keywords if enabled
      const extractKeywords = options.extractKeywords !== false;

      // Get vector store instance
      const vectorStore = await VectorStoreFactory.getStore();

      // Step 6: Create chunks in database and index in vector store
      const vectorDocs: Array<{
        id: string;
        content: string;
        embedding: number[];
        metadata: Record<string, unknown>;
      }> = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const keywords = extractKeywords
          ? ChunkingService.extractKeywords(chunk.content, 5)
          : [];

        const dbChunk = await prisma.knowledgeChunk.create({
          data: {
            sourceId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
            embedding: JSON.stringify(embedding),
            embeddingModel,
            keywords: JSON.stringify(keywords),
          },
        });

        vectorDocs.push({
          id: dbChunk.id,
          content: chunk.content,
          embedding,
          metadata: {
            sourceId,
            notebookId: source.notebookId,
            chunkIndex: chunk.chunkIndex,
            // Element-based metadata for PDF highlighting
            page: chunk.page,
            coordinates: chunk.coordinates,
            elementIds: chunk.elementIds,
            elementsInfo: chunk.elementsInfo,
          },
        });
      }

      // Step 7: Index in vector store (batch insert)
      try {
        await vectorStore.insertBatch(vectorDocs);
      } catch (vectorError) {
        console.warn("Vector store indexing failed (continuing with SQLite):", vectorError);
        // Even if external vector store fails, SQLite embeddings are already saved
      }

      // Update source status
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: {
          status: "COMPLETED",
          errorMessage: null,
        },
      });

      return {
        success: true,
        sourceId,
        chunksCreated: chunks.length,
      };
    } catch (error) {
      console.error(`Processing error for source ${sourceId}:`, error);

      // Update status to ERROR
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: {
          status: "ERROR",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        sourceId,
        chunksCreated: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Reprocess a source (delete old chunks and reprocess)
   */
  static async reprocessSource(
    sourceId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    // Get vector store instance
    const vectorStore = await VectorStoreFactory.getStore();

    // Get existing chunk IDs to delete from vector store
    const existingChunks = await prisma.knowledgeChunk.findMany({
      where: { sourceId },
      select: { id: true },
    });

    // Delete from vector store
    for (const chunk of existingChunks) {
      try {
        await vectorStore.delete(chunk.id);
      } catch (e) {
        console.warn("Failed to delete from vector store:", e);
      }
    }

    // Delete existing chunks from DB
    await prisma.knowledgeChunk.deleteMany({
      where: { sourceId },
    });

    // Increment version
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { version: { increment: 1 } },
    });

    // Reprocess
    return this.processSource(sourceId, options);
  }

  /**
   * Process all pending sources for a notebook
   */
  static async processNotebook(notebookId: string): Promise<ProcessingResult[]> {
    const pendingSources = await prisma.knowledgeSource.findMany({
      where: {
        notebookId,
        status: "PENDING",
      },
    });

    const results: ProcessingResult[] = [];

    for (const source of pendingSources) {
      const result = await this.processSource(source.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Normalize content (encoding, whitespace, etc.)
   */
  private static normalizeContent(content: string): string {
    return content
      // Normalize unicode
      .normalize("NFC")
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize multiple spaces
      .replace(/[ \t]+/g, " ")
      // Normalize multiple newlines (keep at most 2)
      .replace(/\n{3,}/g, "\n\n")
      // Trim
      .trim();
  }

  /**
   * Generate content hash for deduplication
   */
  private static generateHash(content: string): string {
    // Remove all whitespace for comparison
    const normalized = content.replace(/\s+/g, "").toLowerCase();
    return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
  }

  /**
   * Get processing statistics
   */
  static async getStats(notebookId?: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    error: number;
  }> {
    const where = notebookId ? { notebookId } : {};

    const [pending, processing, completed, error] = await Promise.all([
      prisma.knowledgeSource.count({ where: { ...where, status: "PENDING" } }),
      prisma.knowledgeSource.count({ where: { ...where, status: "PROCESSING" } }),
      prisma.knowledgeSource.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.knowledgeSource.count({ where: { ...where, status: "ERROR" } }),
    ]);

    return { pending, processing, completed, error };
  }
}
