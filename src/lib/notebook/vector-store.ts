/**
 * Vector Store Service - Abstraction layer for vector databases
 * Supports SQLite (default), Milvus, ChromaDB, Weaviate, Pinecone, Qdrant
 */

import { prisma } from "@/lib/prisma";

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorStoreConfig {
  provider: "sqlite" | "milvus" | "chromadb" | "weaviate" | "pinecone" | "qdrant";
  host?: string;
  port?: string;
  apiKey?: string;
  collection: string;
}

/**
 * Abstract Vector Store interface
 */
export interface IVectorStore {
  insert(doc: VectorDocument): Promise<void>;
  insertBatch(docs: VectorDocument[]): Promise<void>;
  search(query: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorSearchResult[]>;
  delete(id: string): Promise<void>;
  deleteByFilter(filter: Record<string, unknown>): Promise<void>;
}

/**
 * Vector Store Factory - Creates appropriate store based on config
 */
export class VectorStoreFactory {
  private static configCache: VectorStoreConfig | null = null;
  private static configCacheTime = 0;
  private static CONFIG_CACHE_TTL = 60000; // 1 minute

  /**
   * Get configured vector store instance
   */
  static async getStore(): Promise<IVectorStore> {
    const config = await this.getConfig();
    
    switch (config.provider) {
      case "milvus":
        return new MilvusVectorStore(config);
      case "chromadb":
        return new ChromaDBVectorStore(config);
      case "weaviate":
        return new WeaviateVectorStore(config);
      case "pinecone":
        return new PineconeVectorStore(config);
      case "qdrant":
        return new QdrantVectorStore(config);
      case "sqlite":
      default:
        return new SQLiteVectorStore();
    }
  }

  /**
   * Get current configuration
   */
  static async getConfig(): Promise<VectorStoreConfig> {
    if (this.configCache && Date.now() - this.configCacheTime < this.CONFIG_CACHE_TTL) {
      return this.configCache;
    }

    try {
      const [provider, host, port, apiKey, collection] = await Promise.all([
        prisma.systemConfig.findUnique({ where: { key: "VECTORDB_PROVIDER" } }),
        prisma.systemConfig.findUnique({ where: { key: "VECTORDB_HOST" } }),
        prisma.systemConfig.findUnique({ where: { key: "VECTORDB_PORT" } }),
        prisma.systemConfig.findUnique({ where: { key: "VECTORDB_API_KEY" } }),
        prisma.systemConfig.findUnique({ where: { key: "VECTORDB_COLLECTION" } }),
      ]);

      const config: VectorStoreConfig = {
        provider: (provider?.value as VectorStoreConfig["provider"]) || "sqlite",
        host: host?.value || "localhost",
        port: port?.value || undefined,
        apiKey: apiKey?.value || undefined,
        collection: collection?.value || "aura_vectors",
      };

      this.configCache = config;
      this.configCacheTime = Date.now();
      return config;
    } catch (error) {
      console.warn("Failed to get vector store config:", error);
      return { provider: "sqlite", collection: "aura_vectors" };
    }
  }

  /**
   * Clear config cache
   */
  static clearCache(): void {
    this.configCache = null;
    this.configCacheTime = 0;
  }
}

/**
 * SQLite Vector Store - Uses Prisma KnowledgeChunk table
 */
class SQLiteVectorStore implements IVectorStore {
  async insert(doc: VectorDocument): Promise<void> {
    await prisma.knowledgeChunk.update({
      where: { id: doc.id },
      data: { embedding: JSON.stringify(doc.embedding) },
    });
  }

  async insertBatch(docs: VectorDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.insert(doc);
    }
  }

  async search(query: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorSearchResult[]> {
    // SQLite doesn't support native vector search, so we do in-memory cosine similarity
    let whereClause: Record<string, unknown> = { embedding: { not: null } };
    
    if (filter?.sourceId) {
      whereClause = { ...whereClause, sourceId: filter.sourceId as string };
    }
    if (filter?.sourceIds) {
      whereClause = { ...whereClause, sourceId: { in: filter.sourceIds as string[] } };
    }

    const chunks = await prisma.knowledgeChunk.findMany({
      where: whereClause,
      select: { id: true, content: true, embedding: true, sourceId: true },
    });

    // Calculate cosine similarity for each chunk
    const results = chunks
      .filter(chunk => chunk.embedding)
      .map(chunk => {
        const embedding = JSON.parse(chunk.embedding as string) as number[];
        const score = this.cosineSimilarity(query, embedding);
        return {
          id: chunk.id,
          content: chunk.content,
          score,
          metadata: { sourceId: chunk.sourceId },
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }

  async delete(id: string): Promise<void> {
    await prisma.knowledgeChunk.update({
      where: { id },
      data: { embedding: null },
    });
  }

  async deleteByFilter(filter: Record<string, unknown>): Promise<void> {
    if (filter.sourceId) {
      await prisma.knowledgeChunk.updateMany({
        where: { sourceId: filter.sourceId as string },
        data: { embedding: null },
      });
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Milvus Vector Store
 */
class MilvusVectorStore implements IVectorStore {
  private baseUrl: string;
  private collection: string;

  constructor(config: VectorStoreConfig) {
    this.baseUrl = `http://${config.host}:${config.port || "19530"}`;
    this.collection = config.collection;
  }

  async insert(doc: VectorDocument): Promise<void> {
    await this.insertBatch([doc]);
  }

  async insertBatch(docs: VectorDocument[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/vector/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: this.collection,
          data: docs.map(d => ({
            id: d.id,
            vector: d.embedding,
            content: d.content,
            ...d.metadata,
          })),
        }),
      });
      if (!response.ok) {
        throw new Error(`Milvus insert failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Milvus insert error:", error);
      throw error;
    }
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/vector/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: this.collection,
          vector: query,
          limit: topK,
          outputFields: ["content", "id"],
        }),
      });

      if (!response.ok) {
        throw new Error(`Milvus search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((item: { id: string; content: string; distance: number }) => ({
        id: item.id,
        content: item.content,
        score: 1 - item.distance, // Convert distance to similarity
      })) || [];
    } catch (error) {
      console.error("Milvus search error:", error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/v1/vector/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: this.collection,
          filter: `id == "${id}"`,
        }),
      });
    } catch (error) {
      console.error("Milvus delete error:", error);
    }
  }

  async deleteByFilter(): Promise<void> {
    // Implement as needed
  }
}

/**
 * ChromaDB Vector Store
 */
class ChromaDBVectorStore implements IVectorStore {
  private baseUrl: string;
  private collection: string;

  constructor(config: VectorStoreConfig) {
    this.baseUrl = `http://${config.host}:${config.port || "8000"}`;
    this.collection = config.collection;
  }

  async insert(doc: VectorDocument): Promise<void> {
    await this.insertBatch([doc]);
  }

  async insertBatch(docs: VectorDocument[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collection}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: docs.map(d => d.id),
          embeddings: docs.map(d => d.embedding),
          documents: docs.map(d => d.content),
          metadatas: docs.map(d => d.metadata || {}),
        }),
      });
      if (!response.ok) {
        throw new Error(`ChromaDB insert failed: ${response.status}`);
      }
    } catch (error) {
      console.error("ChromaDB insert error:", error);
      throw error;
    }
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collection}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_embeddings: [query],
          n_results: topK,
          include: ["documents", "distances"],
        }),
      });

      if (!response.ok) {
        throw new Error(`ChromaDB search failed: ${response.status}`);
      }

      const data = await response.json();
      const ids = data.ids?.[0] || [];
      const documents = data.documents?.[0] || [];
      const distances = data.distances?.[0] || [];

      return ids.map((id: string, i: number) => ({
        id,
        content: documents[i] || "",
        score: 1 - (distances[i] || 0), // Convert distance to similarity
      }));
    } catch (error) {
      console.error("ChromaDB search error:", error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/collections/${this.collection}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch (error) {
      console.error("ChromaDB delete error:", error);
    }
  }

  async deleteByFilter(): Promise<void> {
    // Implement as needed
  }
}

/**
 * Weaviate Vector Store
 */
class WeaviateVectorStore implements IVectorStore {
  private baseUrl: string;
  private collection: string;
  private apiKey?: string;

  constructor(config: VectorStoreConfig) {
    this.baseUrl = `http://${config.host}:${config.port || "8080"}`;
    this.collection = config.collection;
    this.apiKey = config.apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async insert(doc: VectorDocument): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/v1/objects`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          class: this.collection,
          id: doc.id,
          properties: { content: doc.content, ...doc.metadata },
          vector: doc.embedding,
        }),
      });
    } catch (error) {
      console.error("Weaviate insert error:", error);
      throw error;
    }
  }

  async insertBatch(docs: VectorDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.insert(doc);
    }
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    try {
      const graphql = {
        query: `{
          Get {
            ${this.collection}(nearVector: {vector: [${query.join(",")}]}, limit: ${topK}) {
              _additional { id distance }
              content
            }
          }
        }`,
      };

      const response = await fetch(`${this.baseUrl}/v1/graphql`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(graphql),
      });

      if (!response.ok) {
        throw new Error(`Weaviate search failed: ${response.status}`);
      }

      const data = await response.json();
      const results = data.data?.Get?.[this.collection] || [];

      return results.map((item: { _additional: { id: string; distance: number }; content: string }) => ({
        id: item._additional.id,
        content: item.content,
        score: 1 - item._additional.distance,
      }));
    } catch (error) {
      console.error("Weaviate search error:", error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/v1/objects/${this.collection}/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error("Weaviate delete error:", error);
    }
  }

  async deleteByFilter(): Promise<void> {
    // Implement as needed
  }
}

/**
 * Pinecone Vector Store
 */
class PineconeVectorStore implements IVectorStore {
  private baseUrl: string;
  private apiKey: string;
  private namespace: string;

  constructor(config: VectorStoreConfig) {
    // Pinecone URL format: https://index-name-project-id.svc.environment.pinecone.io
    this.baseUrl = config.host || "";
    this.apiKey = config.apiKey || "";
    this.namespace = config.collection;
  }

  async insert(doc: VectorDocument): Promise<void> {
    await this.insertBatch([doc]);
  }

  async insertBatch(docs: VectorDocument[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vectors/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          namespace: this.namespace,
          vectors: docs.map(d => ({
            id: d.id,
            values: d.embedding,
            metadata: { content: d.content, ...d.metadata },
          })),
        }),
      });
      if (!response.ok) {
        throw new Error(`Pinecone insert failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Pinecone insert error:", error);
      throw error;
    }
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          namespace: this.namespace,
          vector: query,
          topK,
          includeMetadata: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Pinecone search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.matches?.map((m: { id: string; score: number; metadata: { content: string } }) => ({
        id: m.id,
        content: m.metadata?.content || "",
        score: m.score,
      })) || [];
    } catch (error) {
      console.error("Pinecone search error:", error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/vectors/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          namespace: this.namespace,
          ids: [id],
        }),
      });
    } catch (error) {
      console.error("Pinecone delete error:", error);
    }
  }

  async deleteByFilter(): Promise<void> {
    // Implement as needed
  }
}

/**
 * Qdrant Vector Store
 */
class QdrantVectorStore implements IVectorStore {
  private baseUrl: string;
  private collection: string;

  constructor(config: VectorStoreConfig) {
    this.baseUrl = `http://${config.host}:${config.port || "6333"}`;
    this.collection = config.collection;
  }

  async insert(doc: VectorDocument): Promise<void> {
    await this.insertBatch([doc]);
  }

  async insertBatch(docs: VectorDocument[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collection}/points`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: docs.map(d => ({
            id: d.id,
            vector: d.embedding,
            payload: { content: d.content, ...d.metadata },
          })),
        }),
      });
      if (!response.ok) {
        throw new Error(`Qdrant insert failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Qdrant insert error:", error);
      throw error;
    }
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collection}/points/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vector: query,
          limit: topK,
          with_payload: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Qdrant search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.result?.map((item: { id: string; score: number; payload: { content: string } }) => ({
        id: item.id,
        content: item.payload?.content || "",
        score: item.score,
      })) || [];
    } catch (error) {
      console.error("Qdrant search error:", error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/collections/${this.collection}/points/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: [id] }),
      });
    } catch (error) {
      console.error("Qdrant delete error:", error);
    }
  }

  async deleteByFilter(): Promise<void> {
    // Implement as needed
  }
}
