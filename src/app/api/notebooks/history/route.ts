/**
 * Q&A History API - Manage saved Q&A sessions
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/notebooks/history - Get Q&A history
export async function GET(req: Request) {
  try {
    const userId = await getMockUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notebookId = searchParams.get("notebookId");
    const savedOnly = searchParams.get("savedOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Record<string, unknown> = { userId };

    if (notebookId) {
      where.notebookId = notebookId;
    }

    if (savedOnly) {
      where.isSaved = true;
    }

    const [history, total] = await Promise.all([
      prisma.qnAHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          notebook: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.qnAHistory.count({ where }),
    ]);

    return NextResponse.json({
      history: history.map((h) => ({
        ...h,
        citations: JSON.parse(h.citations || "[]"),
        tags: JSON.parse(h.tags || "[]"),
        linkedQnaIds: JSON.parse(h.linkedQnaIds || "[]"),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks/history - Create or save Q&A
export async function POST(req: Request) {
  try {
    const userId = await getMockUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notebookId, question, answer, citations, tags } = body;

    const qna = await prisma.qnAHistory.create({
      data: {
        userId,
        notebookId: notebookId || null,
        question,
        answer,
        citations: JSON.stringify(citations || []),
        tags: JSON.stringify(tags || []),
        isSaved: true,
      },
    });

    return NextResponse.json({ qna }, { status: 201 });
  } catch (error) {
    console.error("Error creating history:", error);
    return NextResponse.json(
      { error: "Failed to create history" },
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
