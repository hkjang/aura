/**
 * Embedding Service - Generate embeddings for text chunks
 * Supports Upstage, OpenAI, Ollama, and HuggingFace embedding APIs
 * Reads configuration from SystemConfig table
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

export interface EmbeddingConfig {
  provider: "upstage" | "openai" | "ollama" | "huggingface" | "mock";
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

const EMBEDDING_DIMENSION = 1024; // Standard dimension for most models

export class EmbeddingService {
  private static configCache: EmbeddingConfig | null = null;
  private static configCacheTime = 0;
  private static CONFIG_CACHE_TTL = 60000; // 1 minute cache

  /**
   * Get embedding for a single text
   */
  static async embed(text: string): Promise<EmbeddingResult> {
    const config = await this.getConfig();
    
    switch (config.provider) {
      case "upstage":
        if (config.apiKey) return this.embedWithUpstage(text, config.apiKey, config.model);
        break;
      case "openai":
        if (config.apiKey) return this.embedWithOpenAI(text, config.apiKey, config.model);
        break;
      case "ollama":
        return this.embedWithOllama(text, config.baseUrl || "http://localhost:11434", config.model);
      case "huggingface":
        if (config.apiKey) return this.embedWithHuggingFace(text, config.apiKey, config.model);
        break;
    }
    
    // Fallback to mock embedding
    return this.mockEmbed(text);
  }

  /**
   * Get embeddings for multiple texts (batch)
   */
  static async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const config = await this.getConfig();
    
    switch (config.provider) {
      case "upstage":
        if (config.apiKey) return this.batchEmbedWithUpstage(texts, config.apiKey, config.model);
        break;
      case "openai":
        if (config.apiKey) return this.batchEmbedWithOpenAI(texts, config.apiKey, config.model);
        break;
      case "ollama":
        return this.batchEmbedWithOllama(texts, config.baseUrl || "http://localhost:11434", config.model);
      case "huggingface":
        if (config.apiKey) return this.batchEmbedWithHuggingFace(texts, config.apiKey, config.model);
        break;
    }
    
    // Fallback to mock embedding
    const embeddings = texts.map(t => this.generateMockEmbedding(t));
    return { embeddings, model: "mock" };
  }

  /**
   * Get current embedding configuration
   */
  static async getCurrentConfig(): Promise<EmbeddingConfig> {
    return this.getConfig();
  }

  /**
   * Clear config cache (call after settings change)
   */
  static clearConfigCache(): void {
    this.configCache = null;
    this.configCacheTime = 0;
  }

  /**
   * Get embedding configuration from database (with caching)
   * Priority: 1) EmbeddingModelConfig (isDefault=true), 2) SystemConfig, 3) Env vars, 4) Mock
   */
  private static async getConfig(): Promise<EmbeddingConfig> {
    // Return cached config if still valid
    if (this.configCache && Date.now() - this.configCacheTime < this.CONFIG_CACHE_TTL) {
      return this.configCache;
    }

    try {
      // Priority 1: Get default model from EmbeddingModelConfig table
      const defaultModel = await prisma.embeddingModelConfig.findFirst({
        where: { isDefault: true, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (defaultModel) {
        const config: EmbeddingConfig = {
          provider: defaultModel.provider as EmbeddingConfig["provider"],
          model: defaultModel.modelId,
          apiKey: defaultModel.apiKey || undefined,
          baseUrl: defaultModel.baseUrl || undefined,
        };
        
        this.configCache = config;
        this.configCacheTime = Date.now();
        console.log(`[EmbeddingService] Using default model: ${defaultModel.name} (${defaultModel.provider}/${defaultModel.modelId})`);
        return config;
      }

      // Priority 2: Read from legacy EMBEDDING_* settings in SystemConfig
      const [providerConfig, modelConfig, apiKeyConfig, baseUrlConfig] = await Promise.all([
        prisma.systemConfig.findUnique({ where: { key: "EMBEDDING_PROVIDER" } }),
        prisma.systemConfig.findUnique({ where: { key: "EMBEDDING_MODEL" } }),
        prisma.systemConfig.findUnique({ where: { key: "EMBEDDING_API_KEY" } }),
        prisma.systemConfig.findUnique({ where: { key: "EMBEDDING_BASE_URL" } }),
      ]);

      if (providerConfig?.value) {
        const config: EmbeddingConfig = {
          provider: providerConfig.value as EmbeddingConfig["provider"],
          model: modelConfig?.value || this.getDefaultModel(providerConfig.value),
          apiKey: apiKeyConfig?.value || undefined,
          baseUrl: baseUrlConfig?.value || undefined,
        };
        
        // Cache the config
        this.configCache = config;
        this.configCacheTime = Date.now();
        return config;
      }

      // Priority 3: Legacy settings (UPSTAGE_API_KEY)
      const upstageKey = await prisma.systemConfig.findUnique({
        where: { key: "UPSTAGE_API_KEY" },
      });
      if (upstageKey?.value) {
        const config: EmbeddingConfig = {
          provider: "upstage",
          apiKey: upstageKey.value,
          model: "solar-embedding-1-large",
        };
        this.configCache = config;
        this.configCacheTime = Date.now();
        return config;
      }

      // Priority 4: Check environment variables
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
   * Get default model for provider
   */
  private static getDefaultModel(provider: string): string {
    switch (provider) {
      case "upstage": return "solar-embedding-1-large";
      case "openai": return "text-embedding-3-small";
      case "ollama": return "nomic-embed-text";
      case "huggingface": return "BAAI/bge-m3";
      default: return "mock";
    }
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
   * Embed with Ollama (local)
   */
  private static async embedWithOllama(
    text: string,
    baseUrl: string,
    model: string
  ): Promise<EmbeddingResult> {
    try {
      const response = await fetch(`${baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        console.error("Ollama embedding error");
        return this.mockEmbed(text);
      }

      const data = await response.json();
      return {
        embedding: data.embedding,
        model,
      };
    } catch (error) {
      console.error("Ollama connection error:", error);
      return this.mockEmbed(text);
    }
  }

  /**
   * Batch embed with Ollama
   */
  private static async batchEmbedWithOllama(
    texts: string[],
    baseUrl: string,
    model: string
  ): Promise<BatchEmbeddingResult> {
    // Ollama doesn't support batch, so we do sequential
    const embeddings: number[][] = [];
    for (const text of texts) {
      const result = await this.embedWithOllama(text, baseUrl, model);
      embeddings.push(result.embedding);
    }
    return { embeddings, model };
  }

  /**
   * Embed with HuggingFace Inference API
   */
  private static async embedWithHuggingFace(
    text: string,
    apiKey: string,
    model: string
  ): Promise<EmbeddingResult> {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true },
          }),
        }
      );

      if (!response.ok) {
        console.error("HuggingFace embedding error");
        return this.mockEmbed(text);
      }

      const data = await response.json();
      // HuggingFace returns nested array, take mean pooling
      const embedding = Array.isArray(data[0]) 
        ? this.meanPooling(data) 
        : data;
      
      return { embedding, model };
    } catch (error) {
      console.error("HuggingFace connection error:", error);
      return this.mockEmbed(text);
    }
  }

  /**
   * Batch embed with HuggingFace
   */
  private static async batchEmbedWithHuggingFace(
    texts: string[],
    apiKey: string,
    model: string
  ): Promise<BatchEmbeddingResult> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const result = await this.embedWithHuggingFace(text, apiKey, model);
      embeddings.push(result.embedding);
    }
    return { embeddings, model };
  }

  /**
   * Mean pooling for token embeddings
   */
  private static meanPooling(tokenEmbeddings: number[][]): number[] {
    if (tokenEmbeddings.length === 0) return [];
    const dim = tokenEmbeddings[0].length;
    const result = new Array(dim).fill(0);
    
    for (const embedding of tokenEmbeddings) {
      for (let i = 0; i < dim; i++) {
        result[i] += embedding[i];
      }
    }
    
    return result.map(v => v / tokenEmbeddings.length);
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
    
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      const charCode = normalized.charCodeAt(i % normalized.length) || 0;
      const seed = (charCode * (i + 1) * 31) % 1000;
      embedding.push((seed / 500) - 1);
    }

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
