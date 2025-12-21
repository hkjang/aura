/**
 * Processing Pipeline - Orchestrates knowledge source processing
 * Normalization → Chunking → Tagging → Embedding → Indexing
 */

import { prisma } from "@/lib/prisma";
import { ChunkingService } from "./chunking-service";
import { EmbeddingService } from "./embedding-service";
import { VectorStore } from "./vector-store";
import crypto from "crypto";

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  extractKeywords?: boolean;
}

export interface ProcessingResult {
  success: boolean;
  sourceId: string;
  chunksCreated: number;
  error?: string;
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

      // Step 3: Chunk the content
      const chunks = ChunkingService.chunk(normalizedContent, {
        maxChunkSize: options.chunkSize || 1000,
        overlap: options.chunkOverlap || 100,
      });

      // Step 4: Generate embeddings in batch
      const chunkTexts = chunks.map(c => c.content);
      const { embeddings, model: embeddingModel } = await EmbeddingService.embedBatch(chunkTexts);

      // Step 5: Extract keywords if enabled
      const extractKeywords = options.extractKeywords !== false;

      // Step 6: Create chunks in database
      const createdChunks: Array<{
        chunkId: string;
        sourceId: string;
        notebookId: string;
        content: string;
        embedding: number[];
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

        createdChunks.push({
          chunkId: dbChunk.id,
          sourceId,
          notebookId: source.notebookId,
          content: chunk.content,
          embedding,
        });
      }

      // Step 7: Index in vector store
      await VectorStore.indexChunks(createdChunks);

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
    // Delete existing chunks
    await prisma.knowledgeChunk.deleteMany({
      where: { sourceId },
    });

    // Remove from vector store
    await VectorStore.removeBySource(sourceId);

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
