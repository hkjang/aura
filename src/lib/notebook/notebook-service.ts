/**
 * Notebook Service - CRUD operations for notebooks
 */

import { prisma } from "@/lib/prisma";

export interface CreateNotebookInput {
  name: string;
  description?: string;
  scope?: "PERSONAL" | "TEAM" | "ORGANIZATION";
  ownerId: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateNotebookInput {
  name?: string;
  description?: string;
  scope?: "PERSONAL" | "TEAM" | "ORGANIZATION";
  isPublic?: boolean;
  tags?: string[];
}

export type NotebookPermission = "READ" | "EDIT" | "ADMIN";

export class NotebookService {
  /**
   * Create a new notebook
   */
  static async create(input: CreateNotebookInput) {
    const notebook = await prisma.notebook.create({
      data: {
        name: input.name,
        description: input.description,
        scope: input.scope || "PERSONAL",
        ownerId: input.ownerId,
        isPublic: input.isPublic || false,
        tags: JSON.stringify(input.tags || []),
      },
    });

    // Log the creation
    await prisma.notebookAudit.create({
      data: {
        notebookId: notebook.id,
        userId: input.ownerId,
        action: "CREATE",
        details: JSON.stringify({ name: input.name }),
      },
    });

    return notebook;
  }

  /**
   * Get a notebook by ID
   */
  static async getById(id: string, includeRelations = true) {
    return prisma.notebook.findUnique({
      where: { id },
      include: includeRelations ? {
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
          select: {
            sources: true,
            qnaHistory: true,
          },
        },
      } : undefined,
    });
  }

  /**
   * Get all notebooks for a user (owned + shared)
   */
  static async getByUserId(userId: string) {
    const [owned, shared] = await Promise.all([
      prisma.notebook.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: { sources: true, qnaHistory: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.notebook.findMany({
        where: {
          shares: {
            some: { userId },
          },
        },
        include: {
          shares: {
            where: { userId },
          },
          _count: {
            select: { sources: true, qnaHistory: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      owned,
      shared: shared.map(n => ({
        ...n,
        permission: n.shares[0]?.permission || "READ",
      })),
    };
  }

  /**
   * Update a notebook
   */
  static async update(id: string, userId: string, input: UpdateNotebookInput) {
    const notebook = await prisma.notebook.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        scope: input.scope,
        isPublic: input.isPublic,
        tags: input.tags ? JSON.stringify(input.tags) : undefined,
      },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId: id,
        userId,
        action: "UPDATE",
        details: JSON.stringify(input),
      },
    });

    return notebook;
  }

  /**
   * Delete a notebook
   */
  static async delete(id: string, userId: string) {
    // Delete is cascading, so sources and chunks will be removed too
    await prisma.notebook.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Check user permission on a notebook
   */
  static async checkPermission(
    notebookId: string,
    userId: string
  ): Promise<NotebookPermission | null> {
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      include: {
        shares: {
          where: { userId },
        },
      },
    });

    if (!notebook) return null;

    // Owner has full access
    if (notebook.ownerId === userId) return "ADMIN";

    // Check shares
    if (notebook.shares.length > 0) {
      return notebook.shares[0].permission as NotebookPermission;
    }

    // Public notebooks allow read access
    if (notebook.isPublic) return "READ";

    return null;
  }

  /**
   * Share a notebook with a user
   */
  static async share(
    notebookId: string,
    targetUserId: string,
    permission: NotebookPermission,
    actorId: string
  ) {
    const share = await prisma.notebookShare.upsert({
      where: {
        notebookId_userId: {
          notebookId,
          userId: targetUserId,
        },
      },
      create: {
        notebookId,
        userId: targetUserId,
        permission,
      },
      update: {
        permission,
      },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId,
        userId: actorId,
        action: "SHARE",
        details: JSON.stringify({ targetUserId, permission }),
      },
    });

    return share;
  }

  /**
   * Remove a share
   */
  static async unshare(notebookId: string, targetUserId: string, actorId: string) {
    await prisma.notebookShare.delete({
      where: {
        notebookId_userId: {
          notebookId,
          userId: targetUserId,
        },
      },
    });

    await prisma.notebookAudit.create({
      data: {
        notebookId,
        userId: actorId,
        action: "UNSHARE",
        details: JSON.stringify({ targetUserId }),
      },
    });

    return { success: true };
  }

  /**
   * Get notebook statistics
   */
  static async getStats(notebookId: string) {
    const [sources, chunks, qna] = await Promise.all([
      prisma.knowledgeSource.count({ where: { notebookId } }),
      prisma.knowledgeChunk.count({
        where: { source: { notebookId } },
      }),
      prisma.qnAHistory.count({ where: { notebookId } }),
    ]);

    const totalContent = await prisma.knowledgeSource.aggregate({
      where: { notebookId },
      _sum: { fileSize: true },
    });

    return {
      sourceCount: sources,
      chunkCount: chunks,
      qnaCount: qna,
      totalSize: totalContent._sum.fileSize || 0,
    };
  }
}
