/**
 * Pipeline Admin Service - Admin operations for processing pipeline management
 */

import { prisma } from "@/lib/prisma";

export interface PipelineStatus {
  notebookId: string;
  totalSources: number;
  processedSources: number;
  pendingSources: number;
  failedSources: number;
  totalChunks: number;
  lastProcessedAt: Date | null;
}

export class PipelineAdminService {
  /**
   * Get global default pipeline config
   */
  static async getDefaultConfig() {
    return prisma.pipelineConfig.findFirst({
      where: { isDefault: true, isActive: true },
    });
  }

  /**
   * Get pipeline config for notebook (or default)
   */
  static async getConfigForNotebook(notebookId: string) {
    const notebookConfig = await prisma.pipelineConfig.findFirst({
      where: {
        notebookId,
        isActive: true,
      },
    });

    if (notebookConfig) return notebookConfig;

    return this.getDefaultConfig();
  }

  /**
   * Create or update pipeline config
   */
  static async upsertConfig(
    data: {
      name: string;
      description?: string;
      chunkingStrategy?: string;
      chunkSize?: number;
      chunkOverlap?: number;
      embeddingModel?: string;
      embeddingDimension?: number;
      indexType?: string;
      indexParameters?: string;
      notebookId?: string;
      isDefault?: boolean;
    },
    actorId: string
  ) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.pipelineConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const config = await prisma.pipelineConfig.create({
      data: {
        name: data.name,
        description: data.description,
        chunkingStrategy: data.chunkingStrategy || "SENTENCE",
        chunkSize: data.chunkSize || 512,
        chunkOverlap: data.chunkOverlap || 50,
        embeddingModel: data.embeddingModel || "text-embedding-ada-002",
        embeddingDimension: data.embeddingDimension || 1536,
        indexType: data.indexType || "HNSW",
        indexParameters: data.indexParameters || "{}",
        scope: data.notebookId ? "NOTEBOOK" : "GLOBAL",
        notebookId: data.notebookId,
        isDefault: data.isDefault || false,
      },
    });

    return config;
  }

  /**
   * Update existing config
   */
  static async updateConfig(
    configId: string,
    data: Partial<{
      name: string;
      description: string;
      chunkingStrategy: string;
      chunkSize: number;
      chunkOverlap: number;
      embeddingModel: string;
      embeddingDimension: number;
      indexType: string;
      indexParameters: string;
      isDefault: boolean;
      isActive: boolean;
    }>
  ) {
    if (data.isDefault) {
      await prisma.pipelineConfig.updateMany({
        where: { isDefault: true, id: { not: configId } },
        data: { isDefault: false },
      });
    }

    return prisma.pipelineConfig.update({
      where: { id: configId },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Get pipeline status for a notebook
   */
  static async getNotebookPipelineStatus(
    notebookId: string
  ): Promise<PipelineStatus> {
    const [
      totalSources,
      processedSources,
      pendingSources,
      failedSources,
      totalChunks,
      lastSource,
    ] = await Promise.all([
      prisma.knowledgeSource.count({ where: { notebookId } }),
      prisma.knowledgeSource.count({
        where: { notebookId, status: "COMPLETED" },
      }),
      prisma.knowledgeSource.count({
        where: { notebookId, status: { in: ["PENDING", "PROCESSING"] } },
      }),
      prisma.knowledgeSource.count({ where: { notebookId, status: "ERROR" } }),
      prisma.knowledgeChunk.count({
        where: { source: { notebookId } },
      }),
      prisma.knowledgeSource.findFirst({
        where: { notebookId, status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    return {
      notebookId,
      totalSources,
      processedSources,
      pendingSources,
      failedSources,
      totalChunks,
      lastProcessedAt: lastSource?.updatedAt || null,
    };
  }

  /**
   * Trigger reindex for notebook
   */
  static async triggerReindex(notebookId: string, actorId: string) {
    // Get all sources
    const sources = await prisma.knowledgeSource.findMany({
      where: { notebookId },
      select: { id: true },
    });

    // Create reindex job
    const job = await prisma.notebookProcessingJob.create({
      data: {
        notebookId,
        jobType: "REINDEX",
        totalItems: sources.length,
        createdBy: actorId,
      },
    });

    // Mark all sources for reprocessing
    await prisma.knowledgeSource.updateMany({
      where: { notebookId },
      data: { status: "PENDING" },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId,
        userId: actorId,
        action: "TRIGGER_REINDEX",
        details: JSON.stringify({ jobId: job.id, sourceCount: sources.length }),
      },
    });

    return job;
  }

  /**
   * Trigger embedding update with new model
   */
  static async triggerEmbeddingUpdate(
    notebookId: string,
    newModel: string,
    actorId: string
  ) {
    const sources = await prisma.knowledgeSource.findMany({
      where: { notebookId },
      select: { id: true },
    });

    const job = await prisma.notebookProcessingJob.create({
      data: {
        notebookId,
        jobType: "EMBEDDING_UPDATE",
        totalItems: sources.length,
        createdBy: actorId,
      },
    });

    // Delete all existing chunks (will be regenerated with new embeddings)
    await prisma.knowledgeChunk.deleteMany({
      where: { source: { notebookId } },
    });

    await prisma.knowledgeSource.updateMany({
      where: { notebookId },
      data: { status: "PENDING" },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId,
        userId: actorId,
        action: "CHANGE_EMBEDDING_MODEL",
        details: JSON.stringify({
          jobId: job.id,
          newModel,
          sourceCount: sources.length,
        }),
      },
    });

    return job;
  }

  /**
   * Get all processing jobs
   */
  static async getProcessingJobs(
    filters: {
      status?: string;
      jobType?: string;
      notebookId?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.jobType) where.jobType = filters.jobType;
    if (filters.notebookId) where.notebookId = filters.notebookId;

    const [jobs, total] = await Promise.all([
      prisma.notebookProcessingJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notebookProcessingJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Retry failed job
   */
  static async retryJob(jobId: string, actorId: string) {
    const job = await prisma.notebookProcessingJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== "FAILED") {
      throw new Error("Job not found or not in failed state");
    }

    if (job.retryCount >= job.maxRetries) {
      throw new Error("Max retries exceeded");
    }

    return prisma.notebookProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        retryCount: { increment: 1 },
        errorMessage: null,
        scheduledAt: new Date(),
      },
    });
  }

  /**
   * Cancel pending job
   */
  static async cancelJob(jobId: string) {
    return prisma.notebookProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: "Cancelled by admin",
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get all pipeline configs
   */
  static async getAllConfigs() {
    return prisma.pipelineConfig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
