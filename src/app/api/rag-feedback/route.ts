/**
 * RAG Feedback API - Collect and manage user feedback for accuracy improvement
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/rag-feedback - Get feedback entries
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const traceId = searchParams.get("traceId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const feedback = await prisma.rAGFeedback.findMany({
      where: {
        ...(traceId ? { traceId } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Calculate stats
    const stats = await prisma.rAGFeedback.aggregate({
      _avg: { rating: true },
      _count: { id: true },
      where: {
        ...(traceId ? { traceId } : {}),
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    });

    const helpfulCount = await prisma.rAGFeedback.count({
      where: {
        isHelpful: true,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const totalCount = await prisma.rAGFeedback.count({
      where: {
        isHelpful: { not: null },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      feedback,
      stats: {
        avgRating: stats._avg.rating,
        totalFeedback: stats._count.id,
        helpfulRate: totalCount > 0 ? helpfulCount / totalCount : null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

// POST /api/rag-feedback - Submit feedback
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      traceId,
      userId,
      rating,
      isHelpful,
      comment,
      feedbackType = "RATING",
      suggestedChunks,
      missedInfo,
    } = body;

    if (!traceId || !userId) {
      return NextResponse.json(
        { error: "traceId and userId are required" },
        { status: 400 }
      );
    }

    // Check if feedback already exists for this trace from this user
    const existing = await prisma.rAGFeedback.findFirst({
      where: { traceId, userId },
    });

    if (existing) {
      // Update existing feedback
      const updated = await prisma.rAGFeedback.update({
        where: { id: existing.id },
        data: {
          rating,
          isHelpful,
          comment,
          feedbackType,
          suggestedChunks: suggestedChunks ? JSON.stringify(suggestedChunks) : null,
          missedInfo,
        },
      });

      return NextResponse.json({ feedback: updated });
    }

    // Create new feedback
    const feedback = await prisma.rAGFeedback.create({
      data: {
        traceId,
        userId,
        rating: rating || 0,
        isHelpful,
        comment,
        feedbackType,
        suggestedChunks: suggestedChunks ? JSON.stringify(suggestedChunks) : null,
        missedInfo,
      },
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

// DELETE /api/rag-feedback - Delete feedback
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.rAGFeedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
