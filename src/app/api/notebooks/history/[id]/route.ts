/**
 * Q&A History Item API - Get, Update, Delete individual Q&A
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/notebooks/history/[id] - Get single Q&A
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

    const qna = await prisma.qnAHistory.findUnique({
      where: { id },
      include: {
        notebook: {
          select: { id: true, name: true },
        },
      },
    });

    if (!qna) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (qna.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      qna: {
        ...qna,
        citations: JSON.parse(qna.citations || "[]"),
        tags: JSON.parse(qna.tags || "[]"),
        linkedQnaIds: JSON.parse(qna.linkedQnaIds || "[]"),
      },
    });
  } catch (error) {
    console.error("Error fetching Q&A:", error);
    return NextResponse.json({ error: "Failed to fetch Q&A" }, { status: 500 });
  }
}

// PATCH /api/notebooks/history/[id] - Update Q&A (save, rate, tag)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const qna = await prisma.qnAHistory.findUnique({ where: { id } });

    if (!qna) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (qna.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { isSaved, rating, tags, linkedQnaIds } = body;

    const updated = await prisma.qnAHistory.update({
      where: { id },
      data: {
        isSaved: isSaved !== undefined ? isSaved : undefined,
        rating: rating !== undefined ? rating : undefined,
        tags: tags ? JSON.stringify(tags) : undefined,
        linkedQnaIds: linkedQnaIds ? JSON.stringify(linkedQnaIds) : undefined,
      },
    });

    return NextResponse.json({
      qna: {
        ...updated,
        citations: JSON.parse(updated.citations || "[]"),
        tags: JSON.parse(updated.tags || "[]"),
        linkedQnaIds: JSON.parse(updated.linkedQnaIds || "[]"),
      },
    });
  } catch (error) {
    console.error("Error updating Q&A:", error);
    return NextResponse.json(
      { error: "Failed to update Q&A" },
      { status: 500 }
    );
  }
}

// DELETE /api/notebooks/history/[id] - Delete Q&A
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

    const qna = await prisma.qnAHistory.findUnique({ where: { id } });

    if (!qna) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (qna.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.qnAHistory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Q&A:", error);
    return NextResponse.json(
      { error: "Failed to delete Q&A" },
      { status: 500 }
    );
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
