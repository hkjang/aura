/**
 * Vector Store - In-memory vector storage with notebook scoping
 * Production: Replace with Milvus/Pinecone/Chroma
 */

import { prisma } from "@/lib/prisma";
import { EmbeddingService } from "./embedding-service";

export interface VectorDocument {
  id: string;
  chunkId: string;
  sourceId: string;
  notebookId: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  chunkId: string;
  sourceId: string;
  notebookId: string;
  content: string;
  score: number;
  sourceTitle?: string;
  metadata?: Record<string, unknown>;
}

/**
 * In-memory vector store (singleton)
 * Note: This is cleared on server restart. Production should use persistent storage.
 */
class InMemoryVectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private initialized = false;

  /**
   * Initialize store by loading from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          embedding: { not: null },
        },
        include: {
          source: {
            select: {
              id: true,
              notebookId: true,
              title: true,
            },
          },
        },
      });

      for (const chunk of chunks) {
        if (!chunk.embedding) continue;
        
        try {
          const embedding = JSON.parse(chunk.embedding) as number[];
          this.documents.set(chunk.id, {
            id: chunk.id,
            chunkId: chunk.id,
            sourceId: chunk.sourceId,
            notebookId: chunk.source.notebookId,
            content: chunk.content,
            embedding,
          });
        } catch (e) {
          console.warn(`Failed to parse embedding for chunk ${chunk.id}`);
        }
      }

      this.initialized = true;
      console.log(`VectorStore initialized with ${this.documents.size} documents`);
    } catch (error) {
      console.error("Failed to initialize vector store:", error);
    }
  }

  /**
   * Add a document to the store
   */
  add(doc: VectorDocument): void {
    this.documents.set(doc.chunkId, doc);
  }

  /**
   * Add multiple documents
   */
  addBatch(docs: VectorDocument[]): void {
    for (const doc of docs) {
      this.documents.set(doc.chunkId, doc);
    }
  }

  /**
   * Remove a document
   */
  remove(chunkId: string): void {
    this.documents.delete(chunkId);
  }

  /**
   * Remove all documents for a source
   */
  removeBySource(sourceId: string): void {
    for (const [id, doc] of this.documents) {
      if (doc.sourceId === sourceId) {
        this.documents.delete(id);
      }
    }
  }

  /**
   * Remove all documents for a notebook
   */
  removeByNotebook(notebookId: string): void {
    for (const [id, doc] of this.documents) {
      if (doc.notebookId === notebookId) {
        this.documents.delete(id);
      }
    }
  }

  /**
   * Search with vector similarity
   */
  search(
    queryEmbedding: number[],
    options: {
      notebookIds?: string[];
      limit?: number;
      threshold?: number;
    } = {}
  ): SearchResult[] {
    const { notebookIds, limit = 10, threshold = 0.3 } = options;
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      // Filter by notebook scope
      if (notebookIds && !notebookIds.includes(doc.notebookId)) {
        continue;
      }

      const score = EmbeddingService.cosineSimilarity(queryEmbedding, doc.embedding);
      
      if (score >= threshold) {
        results.push({
          chunkId: doc.chunkId,
          sourceId: doc.sourceId,
          notebookId: doc.notebookId,
          content: doc.content,
          score,
          metadata: doc.metadata,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }

  /**
   * Get document count
   */
  size(): number {
    return this.documents.size;
  }

  /**
   * Get document count by notebook
   */
  countByNotebook(notebookId: string): number {
    let count = 0;
    for (const doc of this.documents.values()) {
      if (doc.notebookId === notebookId) count++;
    }
    return count;
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
    this.initialized = false;
  }
}

// Singleton instance
const vectorStore = new InMemoryVectorStore();

export class VectorStore {
  /**
   * Initialize the vector store
   */
  static async initialize(): Promise<void> {
    await vectorStore.initialize();
  }

  /**
   * Index a chunk (add to vector store)
   */
  static async indexChunk(
    chunkId: string,
    sourceId: string,
    notebookId: string,
    content: string,
    embedding: number[]
  ): Promise<void> {
    vectorStore.add({
      id: chunkId,
      chunkId,
      sourceId,
      notebookId,
      content,
      embedding,
    });
  }

  /**
   * Index multiple chunks
   */
  static async indexChunks(
    chunks: Array<{
      chunkId: string;
      sourceId: string;
      notebookId: string;
      content: string;
      embedding: number[];
    }>
  ): Promise<void> {
    vectorStore.addBatch(
      chunks.map(c => ({
        id: c.chunkId,
        ...c,
      }))
    );
  }

  /**
   * Remove chunks for a source
   */
  static async removeBySource(sourceId: string): Promise<void> {
    vectorStore.removeBySource(sourceId);
  }

  /**
   * Remove chunks for a notebook
   */
  static async removeByNotebook(notebookId: string): Promise<void> {
    vectorStore.removeByNotebook(notebookId);
  }

  /**
   * Semantic search within notebook scope
   */
  static async search(
    query: string,
    options: {
      notebookIds?: string[];
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<SearchResult[]> {
    await vectorStore.initialize();
    
    // Generate query embedding
    const { embedding } = await EmbeddingService.embed(query);
    
    return vectorStore.search(embedding, options);
  }

  /**
   * Search with pre-computed embedding
   */
  static async searchWithEmbedding(
    embedding: number[],
    options: {
      notebookIds?: string[];
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<SearchResult[]> {
    await vectorStore.initialize();
    return vectorStore.search(embedding, options);
  }

  /**
   * Hybrid search (keyword + vector)
   */
  static async hybridSearch(
    query: string,
    options: {
      notebookIds?: string[];
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { notebookIds, limit = 10 } = options;

    // Get vector results
    const vectorResults = await this.search(query, {
      notebookIds,
      limit: limit * 2,
      threshold: 0.2,
    });

    // Get keyword results from DB
    try {
      const whereClause: Record<string, unknown> = {
        OR: [
          { content: { contains: query } },
        ],
      };

      if (notebookIds && notebookIds.length > 0) {
        whereClause.source = {
          notebookId: { in: notebookIds },
        };
      }

      const keywordResults = await prisma.knowledgeChunk.findMany({
        where: whereClause,
        take: limit,
        include: {
          source: {
            select: {
              id: true,
              notebookId: true,
              title: true,
            },
          },
        },
      });

      // Merge results
      const resultMap = new Map<string, SearchResult>();

      for (const result of vectorResults) {
        resultMap.set(result.chunkId, result);
      }

      for (const chunk of keywordResults) {
        if (resultMap.has(chunk.id)) {
          // Boost existing result
          const existing = resultMap.get(chunk.id)!;
          existing.score = Math.min(existing.score + 0.2, 1.0);
        } else {
          resultMap.set(chunk.id, {
            chunkId: chunk.id,
            sourceId: chunk.sourceId,
            notebookId: chunk.source.notebookId,
            content: chunk.content,
            score: 0.6, // Keyword match base score
            sourceTitle: chunk.source.title,
          });
        }
      }

      // Sort and limit
      return Array.from(resultMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error("Hybrid search error:", error);
      return vectorResults.slice(0, limit);
    }
  }

  /**
   * Get store statistics
   */
  static getStats(): { totalDocuments: number } {
    return {
      totalDocuments: vectorStore.size(),
    };
  }
}
