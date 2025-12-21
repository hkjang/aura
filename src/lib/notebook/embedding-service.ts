/**
 * Embedding Service - Generate embeddings for text chunks
 * Supports Upstage and OpenAI embedding APIs with fallback to mock embeddings
 */

import { prisma } from "@/lib/prisma";

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
}

const EMBEDDING_DIMENSION = 1024; // Standard dimension for most models

export class EmbeddingService {
  /**
   * Get embedding for a single text
   */
  static async embed(text: string): Promise<EmbeddingResult> {
    const config = await this.getConfig();
    
    if (config.provider === "upstage" && config.apiKey) {
      return this.embedWithUpstage(text, config.apiKey, config.model);
    } else if (config.provider === "openai" && config.apiKey) {
      return this.embedWithOpenAI(text, config.apiKey, config.model);
    } else {
      // Fallback to mock embedding
      return this.mockEmbed(text);
    }
  }

  /**
   * Get embeddings for multiple texts (batch)
   */
  static async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const config = await this.getConfig();
    
    if (config.provider === "upstage" && config.apiKey) {
      return this.batchEmbedWithUpstage(texts, config.apiKey, config.model);
    } else if (config.provider === "openai" && config.apiKey) {
      return this.batchEmbedWithOpenAI(texts, config.apiKey, config.model);
    } else {
      // Fallback to mock embedding
      const embeddings = texts.map(t => this.generateMockEmbedding(t));
      return { embeddings, model: "mock" };
    }
  }

  /**
   * Get embedding configuration from database or environment
   */
  private static async getConfig(): Promise<{
    provider: "upstage" | "openai" | "mock";
    apiKey?: string;
    model: string;
  }> {
    try {
      // Check for Upstage first
      const upstageKey = await prisma.systemConfig.findUnique({
        where: { key: "UPSTAGE_API_KEY" },
      });
      if (upstageKey?.value) {
        return {
          provider: "upstage",
          apiKey: upstageKey.value,
          model: "solar-embedding-1-large",
        };
      }

      // Check for OpenAI
      const openaiKey = await prisma.systemConfig.findUnique({
        where: { key: "OPENAI_API_KEY" },
      });
      if (openaiKey?.value) {
        return {
          provider: "openai",
          apiKey: openaiKey.value,
          model: "text-embedding-3-small",
        };
      }

      // Check environment variables
      if (process.env.UPSTAGE_API_KEY) {
        return {
          provider: "upstage",
          apiKey: process.env.UPSTAGE_API_KEY,
          model: "solar-embedding-1-large",
        };
      }
      if (process.env.OPENAI_API_KEY) {
        return {
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY,
          model: "text-embedding-3-small",
        };
      }
    } catch (error) {
      console.warn("Failed to get embedding config from DB:", error);
    }

    return { provider: "mock", model: "mock" };
  }

  /**
   * Embed with Upstage Solar Embedding API
   */
  private static async embedWithUpstage(
    text: string,
    apiKey: string,
    model: string
  ): Promise<EmbeddingResult> {
    const response = await fetch("https://api.upstage.ai/v1/solar/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Upstage embedding error:", error);
      // Fallback to mock
      return this.mockEmbed(text);
    }

    const data = await response.json();
    return {
      embedding: data.data[0].embedding,
      model,
    };
  }

  /**
   * Batch embed with Upstage
   */
  private static async batchEmbedWithUpstage(
    texts: string[],
    apiKey: string,
    model: string
  ): Promise<BatchEmbeddingResult> {
    const response = await fetch("https://api.upstage.ai/v1/solar/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: texts,
      }),
    });

    if (!response.ok) {
      console.error("Upstage batch embedding error");
      const embeddings = texts.map(t => this.generateMockEmbedding(t));
      return { embeddings, model: "mock" };
    }

    const data = await response.json();
    return {
      embeddings: data.data.map((d: { embedding: number[] }) => d.embedding),
      model,
    };
  }

  /**
   * Embed with OpenAI Embedding API
   */
  private static async embedWithOpenAI(
    text: string,
    apiKey: string,
    model: string
  ): Promise<EmbeddingResult> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI embedding error");
      return this.mockEmbed(text);
    }

    const data = await response.json();
    return {
      embedding: data.data[0].embedding,
      model,
    };
  }

  /**
   * Batch embed with OpenAI
   */
  private static async batchEmbedWithOpenAI(
    texts: string[],
    apiKey: string,
    model: string
  ): Promise<BatchEmbeddingResult> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: texts,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI batch embedding error");
      const embeddings = texts.map(t => this.generateMockEmbedding(t));
      return { embeddings, model: "mock" };
    }

    const data = await response.json();
    return {
      embeddings: data.data.map((d: { embedding: number[] }) => d.embedding),
      model,
    };
  }

  /**
   * Generate a mock embedding (for development/fallback)
   */
  private static mockEmbed(text: string): EmbeddingResult {
    return {
      embedding: this.generateMockEmbedding(text),
      model: "mock",
    };
  }

  /**
   * Create a deterministic pseudo-embedding from text
   */
  private static generateMockEmbedding(text: string): number[] {
    const embedding: number[] = [];
    const normalized = text.toLowerCase().trim();
    
    // Generate a hash-like embedding
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      const charCode = normalized.charCodeAt(i % normalized.length) || 0;
      const seed = (charCode * (i + 1) * 31) % 1000;
      // Normalize to [-1, 1] range
      embedding.push((seed / 500) - 1);
    }

    // Normalize vector
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / (norm || 1));
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
