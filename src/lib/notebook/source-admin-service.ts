/**
 * Source Admin Service - Admin operations for knowledge source management
 */

import { prisma } from "@/lib/prisma";

export interface UploadValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QualityCheckResult {
  sourceId: string;
  issues: Array<{
    type: "EMPTY" | "DUPLICATE" | "TOO_SHORT" | "NO_CONTENT" | "ENCODING_ERROR";
    severity: "ERROR" | "WARNING";
    message: string;
  }>;
  score: number; // 0-100
}

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}

// Default upload policies
const DEFAULT_ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/json",
];
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

export class SourceAdminService {
  /**
   * Validate upload against policies
   */
  static async validateUpload(
    fileType: string,
    fileSize: number,
    notebookId?: string
  ): Promise<UploadValidation> {
    const result: UploadValidation = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Get active upload policy
    const policy = await prisma.notebookPolicy.findFirst({
      where: {
        policyType: "UPLOAD",
        isActive: true,
      },
      orderBy: { priority: "desc" },
    });

    let allowedTypes = DEFAULT_ALLOWED_TYPES;
    let maxSize = DEFAULT_MAX_SIZE;

    if (policy) {
      try {
        const rules = JSON.parse(policy.rules);
        if (rules.allowedFileTypes) allowedTypes = rules.allowedFileTypes;
        if (rules.maxFileSize) maxSize = rules.maxFileSize;
      } catch (e) {
        console.error("Failed to parse policy rules:", e);
      }
    }

    // Check file type
    if (!allowedTypes.includes(fileType)) {
      result.valid = false;
      result.errors.push(`파일 형식이 허용되지 않음: ${fileType}`);
    }

    // Check file size
    if (fileSize > maxSize) {
      result.valid = false;
      result.errors.push(
        `파일 크기 초과: ${(fileSize / 1024 / 1024).toFixed(2)}MB (최대: ${(maxSize / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    // Check notebook-level limits if applicable
    if (notebookId) {
      const sourceCount = await prisma.knowledgeSource.count({
        where: { notebookId },
      });

      if (sourceCount >= 100) {
        result.warnings.push(
          `노트북 소스 수가 많습니다 (${sourceCount}개). 성능 저하 가능`
        );
      }
    }

    return result;
  }

  /**
   * Check quality of a knowledge source
   */
  static async checkQuality(sourceId: string): Promise<QualityCheckResult> {
    const source = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: {
        chunks: true,
      },
    });

    const result: QualityCheckResult = {
      sourceId,
      issues: [],
      score: 100,
    };

    if (!source) {
      result.issues.push({
        type: "NO_CONTENT",
        severity: "ERROR",
        message: "소스를 찾을 수 없음",
      });
      result.score = 0;
      return result;
    }

    // Check for empty content
    if (!source.content || source.content.trim().length === 0) {
      result.issues.push({
        type: "EMPTY",
        severity: "ERROR",
        message: "콘텐츠가 비어있음",
      });
      result.score -= 50;
    }

    // Check for too short content
    if (source.content && source.content.length < 100) {
      result.issues.push({
        type: "TOO_SHORT",
        severity: "WARNING",
        message: `콘텐츠가 너무 짧음 (${source.content.length}자)`,
      });
      result.score -= 20;
    }

    // Check for no chunks
    if (source.chunks.length === 0 && source.status === "COMPLETED") {
      result.issues.push({
        type: "NO_CONTENT",
        severity: "WARNING",
        message: "청크가 생성되지 않음",
      });
      result.score -= 30;
    }

    result.score = Math.max(0, result.score);
    return result;
  }

  /**
   * Check for duplicate content in notebook
   */
  static async checkDuplicates(notebookId: string) {
    const sources = await prisma.knowledgeSource.findMany({
      where: { notebookId },
      select: { id: true, title: true, contentHash: true },
    });

    const hashMap = new Map<string, string[]>();
    sources.forEach((source) => {
      if (source.contentHash) {
        const existing = hashMap.get(source.contentHash) || [];
        existing.push(source.id);
        hashMap.set(source.contentHash, existing);
      }
    });

    const duplicates: Array<{ hash: string; sourceIds: string[] }> = [];
    hashMap.forEach((sourceIds, hash) => {
      if (sourceIds.length > 1) {
        duplicates.push({ hash, sourceIds });
      }
    });

    return duplicates;
  }

  /**
   * Bulk delete sources
   */
  static async bulkDelete(
    sourceIds: string[],
    actorId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const id of sourceIds) {
      try {
        const source = await prisma.knowledgeSource.findUnique({
          where: { id },
          select: { notebookId: true },
        });

        if (source) {
          await prisma.knowledgeSource.delete({ where: { id } });

          await prisma.notebookAudit.create({
            data: {
              notebookId: source.notebookId,
              userId: actorId,
              action: "REMOVE_SOURCE",
              details: JSON.stringify({ sourceId: id }),
            },
          });

          result.processedCount++;
        }
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    result.success = result.failedCount === 0;
    return result;
  }

  /**
   * Bulk tag sources
   */
  static async bulkTag(
    sourceIds: string[],
    tags: string[],
    actorId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const id of sourceIds) {
      try {
        await prisma.knowledgeChunk.updateMany({
          where: { sourceId: id },
          data: { tags: JSON.stringify(tags) },
        });
        result.processedCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    result.success = result.failedCount === 0;
    return result;
  }

  /**
   * Force reprocess a source
   */
  static async forceReprocess(sourceId: string, actorId: string) {
    const source = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error("Source not found");
    }

    // Delete existing chunks
    await prisma.knowledgeChunk.deleteMany({
      where: { sourceId },
    });

    // Update source status
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: {
        status: "PENDING",
        errorMessage: null,
      },
    });

    // Create processing job
    const job = await prisma.notebookProcessingJob.create({
      data: {
        sourceId,
        notebookId: source.notebookId,
        jobType: "REPROCESS",
        createdBy: actorId,
      },
    });

    return job;
  }

  /**
   * Get all sources with filtering
   */
  static async getAllSources(
    filters: {
      notebookId?: string;
      status?: string;
      type?: string;
      search?: string;
    } = {},
    page: number = 1,
    pageSize: number = 50
  ) {
    const where: Record<string, unknown> = {};

    if (filters.notebookId) where.notebookId = filters.notebookId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { originalName: { contains: filters.search } },
      ];
    }

    const [sources, total] = await Promise.all([
      prisma.knowledgeSource.findMany({
        where,
        include: {
          notebook: { select: { id: true, name: true } },
          _count: { select: { chunks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.knowledgeSource.count({ where }),
    ]);

    return {
      sources,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
