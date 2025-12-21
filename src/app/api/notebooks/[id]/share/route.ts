/**
 * Notebook Share API - Manage notebook sharing
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";

export const dynamic = "force-dynamic";

// GET /api/notebooks/[id]/share - Get share list
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

    // Only owner can view shares
    const notebook = await prisma.notebook.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!notebook || notebook.ownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const shares = await prisma.notebookShare.findMany({
      where: { notebookId: id },
      orderBy: { createdAt: "desc" },
    });

    // Get user info for each share
    const userIds = shares.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const sharesWithUsers = shares.map((s) => ({
      ...s,
      user: userMap.get(s.userId) || { id: s.userId, name: "Unknown", email: null },
    }));

    return NextResponse.json({ shares: sharesWithUsers });
  } catch (error) {
    console.error("Error fetching shares:", error);
    return NextResponse.json({ error: "Failed to fetch shares" }, { status: 500 });
  }
}

// POST /api/notebooks/[id]/share - Add a share
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

    // Only owner can share
    const notebook = await prisma.notebook.findUnique({
      where: { id },
      select: { ownerId: true, name: true },
    });

    if (!notebook || notebook.ownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { email, permission = "READ" } = body;

    if (!email) {
      return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "해당 이메일의 사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (targetUser.id === userId) {
      return NextResponse.json({ error: "자신에게는 공유할 수 없습니다." }, { status: 400 });
    }

    // Create share
    const share = await NotebookService.share(id, targetUser.id, permission, userId);

    return NextResponse.json({
      share: {
        ...share,
        user: targetUser,
      },
    });
  } catch (error) {
    console.error("Error creating share:", error);
    return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
  }
}

// DELETE /api/notebooks/[id]/share - Remove a share
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

    // Only owner can unshare
    const notebook = await prisma.notebook.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!notebook || notebook.ownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "userId 파라미터가 필요합니다." }, { status: 400 });
    }

    await NotebookService.unshare(id, targetUserId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing share:", error);
    return NextResponse.json({ error: "Failed to remove share" }, { status: 500 });
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
