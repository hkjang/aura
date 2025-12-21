/**
 * Notebook Comments API - Add and list comments
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";

export const dynamic = "force-dynamic";

// GET /api/notebooks/[id]/comments - Get comments
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check access
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");

    const where: Record<string, unknown> = { notebookId: id };
    if (sourceId) {
      where.sourceId = sourceId;
    }

    const comments = await prisma.notebookComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Get user info
    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const commentsWithUsers = comments.map((c) => ({
      ...c,
      user: userMap.get(c.userId) || { id: c.userId, name: "Unknown", email: null },
    }));

    return NextResponse.json({ comments: commentsWithUsers });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/notebooks/[id]/comments - Add a comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check access (need at least READ)
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { content, sourceId, chunkId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
    }

    const comment = await prisma.notebookComment.create({
      data: {
        notebookId: id,
        userId,
        content: content.trim(),
        sourceId: sourceId || null,
        chunkId: chunkId || null,
      },
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      comment: {
        ...comment,
        user: user || { id: userId, name: "Unknown", email: null },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

// DELETE /api/notebooks/[id]/comments - Delete a comment
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId 파라미터가 필요합니다." }, { status: 400 });
    }

    // Check if user owns the comment or is admin
    const comment = await prisma.notebookComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const permission = await NotebookService.checkPermission(id, userId);
    
    if (comment.userId !== userId && permission !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.notebookComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

// Helper to get mock user ID
async function getMockUserId(): Promise<string | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "admin@aura.local" },
    });
    return user?.id || null;
  } catch {
    return null;
  }
}
