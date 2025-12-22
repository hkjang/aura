/**
 * Notebook Admin Service - Admin-only operations for notebook management
 */

import { prisma } from "@/lib/prisma";

export type NotebookStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export interface NotebookListFilters {
  status?: NotebookStatus;
  scope?: "PERSONAL" | "TEAM" | "ORGANIZATION";
  ownerId?: string;
  search?: string;
  hasTemplate?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}

export class NotebookAdminService {
  /**
   * Get all notebooks with filtering and pagination
   */
  static async getAllNotebooks(
    filters: NotebookListFilters = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    } else {
      // By default, exclude soft-deleted
      where.status = { not: "DELETED" };
    }

    if (filters.scope) {
      where.scope = filters.scope;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.hasTemplate !== undefined) {
      where.templateId = filters.hasTemplate ? { not: null } : null;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        (where.createdAt as Record<string, Date>).gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        (where.createdAt as Record<string, Date>).lte = filters.createdBefore;
      }
    }

    const [notebooks, total] = await Promise.all([
      prisma.notebook.findMany({
        where,
        include: {
          _count: {
            select: { sources: true, qnaHistory: true, shares: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notebook.count({ where }),
    ]);

    return {
      notebooks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get notebook by ID with full admin details
   */
  static async getNotebookById(id: string) {
    return prisma.notebook.findUnique({
      where: { id },
      include: {
        sources: {
          orderBy: { createdAt: "desc" },
          include: {
            chunks: {
              select: { id: true, chunkIndex: true },
            },
          },
        },
        shares: true,
        _count: {
          select: { sources: true, qnaHistory: true, comments: true },
        },
      },
    });
  }

  /**
   * Update notebook status
   */
  static async updateNotebookStatus(
    id: string,
    status: NotebookStatus,
    actorId: string
  ) {
    const notebook = await prisma.notebook.update({
      where: { id },
      data: {
        status,
        deletedAt: status === "DELETED" ? new Date() : null,
      },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId: id,
        userId: actorId,
        action: "STATUS_CHANGE",
        details: JSON.stringify({ newStatus: status }),
      },
    });

    return notebook;
  }

  /**
   * Soft delete a notebook
   */
  static async softDeleteNotebook(id: string, actorId: string) {
    return this.updateNotebookStatus(id, "DELETED", actorId);
  }

  /**
   * Restore a soft-deleted notebook
   */
  static async restoreNotebook(id: string, actorId: string) {
    return this.updateNotebookStatus(id, "ACTIVE", actorId);
  }

  /**
   * Permanently delete a notebook (hard delete)
   */
  static async permanentlyDelete(id: string, actorId: string) {
    await prisma.notebookAudit.create({
      data: {
        notebookId: id,
        userId: actorId,
        action: "PERMANENT_DELETE",
      },
    });

    await prisma.notebook.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Duplicate notebook as a template
   */
  static async duplicateAsTemplate(
    notebookId: string,
    templateName: string,
    actorId: string
  ) {
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
    });

    if (!notebook) {
      throw new Error("Notebook not found");
    }

    const template = await prisma.notebookTemplate.create({
      data: {
        name: templateName,
        description: `템플릿: ${notebook.name}`,
        defaultScope: notebook.scope,
        defaultTags: notebook.tags,
        createdBy: actorId,
      },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId,
        userId: actorId,
        action: "CREATE_TEMPLATE",
        details: JSON.stringify({ templateId: template.id }),
      },
    });

    return template;
  }

  /**
   * Create notebook from template
   */
  static async createFromTemplate(
    templateId: string,
    name: string,
    ownerId: string
  ) {
    const template = await prisma.notebookTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      throw new Error("Template not found or inactive");
    }

    const notebook = await prisma.notebook.create({
      data: {
        name,
        description: template.description,
        scope: template.defaultScope,
        tags: template.defaultTags,
        ownerId,
        templateId,
      },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId: notebook.id,
        userId: ownerId,
        action: "CREATE_FROM_TEMPLATE",
        details: JSON.stringify({ templateId }),
      },
    });

    return notebook;
  }

  /**
   * Bulk update status
   */
  static async bulkUpdateStatus(
    ids: string[],
    status: NotebookStatus,
    actorId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        await this.updateNotebookStatus(id, status, actorId);
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
   * Bulk delete (soft)
   */
  static async bulkDelete(
    ids: string[],
    actorId: string
  ): Promise<BulkOperationResult> {
    return this.bulkUpdateStatus(ids, "DELETED", actorId);
  }

  /**
   * Get overall admin statistics
   */
  static async getAdminStats() {
    const [
      totalNotebooks,
      activeNotebooks,
      inactiveNotebooks,
      deletedNotebooks,
      totalSources,
      totalChunks,
      totalQnA,
      recentQnA,
    ] = await Promise.all([
      prisma.notebook.count(),
      prisma.notebook.count({ where: { status: "ACTIVE" } }),
      prisma.notebook.count({ where: { status: "INACTIVE" } }),
      prisma.notebook.count({ where: { status: "DELETED" } }),
      prisma.knowledgeSource.count(),
      prisma.knowledgeChunk.count(),
      prisma.qnAHistory.count(),
      prisma.qnAHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    // Processing jobs stats
    const jobStats = await prisma.notebookProcessingJob.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const processingStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    jobStats.forEach((stat) => {
      const key = stat.status.toLowerCase() as keyof typeof processingStats;
      if (key in processingStats) {
        processingStats[key] = stat._count.id;
      }
    });

    return {
      notebooks: {
        total: totalNotebooks,
        active: activeNotebooks,
        inactive: inactiveNotebooks,
        deleted: deletedNotebooks,
      },
      knowledge: {
        sources: totalSources,
        chunks: totalChunks,
      },
      qna: {
        total: totalQnA,
        last24Hours: recentQnA,
      },
      processing: processingStats,
    };
  }

  /**
   * Get notebooks by owner count (grouped by user)
   */
  static async getNotebooksByOwner(limit: number = 10) {
    const result = await prisma.notebook.groupBy({
      by: ["ownerId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    return result.map((r) => ({
      ownerId: r.ownerId,
      count: r._count.id,
    }));
  }
}
