/**
 * Chunk Usage API - Get search/answer usage history for a chunk
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/chunks/[id]/usage - Get chunk usage in searches and answers
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get chunk info
    const chunk = await prisma.knowledgeChunk.findUnique({
      where: { id },
      include: {
        source: {
          select: { id: true, title: true, type: true, notebookId: true },
        },
      },
    });

    if (!chunk) {
      return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
    }

    // Get RAG trace usage
    const traceUsage = await prisma.rAGTraceChunk.findMany({
      where: { chunkId: id },
      include: {
        trace: {
          select: {
            id: true,
            originalQuery: true,
            answer: true,
            createdAt: true,
            userId: true,
            notebookId: true,
          },
        },
      },
      orderBy: { trace: { createdAt: "desc" } },
      take: limit,
    });

    // Calculate usage stats
    const usageStats = {
      totalUses: traceUsage.length,
      usedInAnswers: traceUsage.filter(t => t.isUsedInAnswer).length,
      avgRank: traceUsage.length > 0
        ? traceUsage.reduce((s, t) => s + t.rank, 0) / traceUsage.length
        : 0,
      avgSimilarity: traceUsage.length > 0
        ? traceUsage.reduce((s, t) => s + t.similarity, 0) / traceUsage.length
        : 0,
      lastUsed: traceUsage.length > 0 ? traceUsage[0].trace.createdAt : null,
    };

    // Group by date for trend
    const usageByDate = new Map<string, number>();
    traceUsage.forEach(t => {
      const date = new Date(t.trace.createdAt).toISOString().split("T")[0];
      usageByDate.set(date, (usageByDate.get(date) || 0) + 1);
    });

    const usageTrend = [...usageByDate.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    return NextResponse.json({
      chunk: {
        id: chunk.id,
        content: chunk.content,
        position: chunk.position,
        tokenCount: chunk.tokenCount,
        keywords: chunk.keywords,
        metadata: chunk.metadata,
        source: chunk.source,
        createdAt: chunk.createdAt,
      },
      usage: traceUsage.map(t => ({
        traceId: t.trace.id,
        query: t.trace.originalQuery,
        answer: t.trace.answer?.substring(0, 200) + "...",
        rank: t.rank,
        similarity: t.similarity,
        isUsedInAnswer: t.isUsedInAnswer,
        adjustedScore: t.adjustedScore,
        appliedRules: t.appliedRules,
        createdAt: t.trace.createdAt,
      })),
      stats: usageStats,
      trend: usageTrend,
    });
  } catch (error) {
    console.error("Failed to fetch chunk usage:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
