/**
 * Chunks API - CRUD and analytics for knowledge chunks
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/chunks - List chunks with filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");
    const notebookId = searchParams.get("notebookId");
    const minQuality = parseInt(searchParams.get("minQuality") || "0");
    const maxQuality = parseInt(searchParams.get("maxQuality") || "100");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeUsage = searchParams.get("includeUsage") === "true";

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (sourceId) {
      where.sourceId = sourceId;
    }
    
    if (notebookId) {
      // Get sources for notebook first
      const sources = await prisma.knowledgeSource.findMany({
        where: { notebookId },
        select: { id: true },
      });
      where.sourceId = { in: sources.map(s => s.id) };
    }

    // Get chunks with source info
    const chunks = await prisma.knowledgeChunk.findMany({
      where,
      include: {
        source: {
          select: {
            id: true,
            title: true,
            type: true,
            notebookId: true,
          },
        },
      },
      orderBy: { chunkIndex: "asc" },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.knowledgeChunk.count({ where });

    // Enrich with usage data if requested
    let enrichedChunks = chunks;
    if (includeUsage) {
      const chunkIds = chunks.map(c => c.id);
      const usageCounts = await prisma.rAGTraceChunk.groupBy({
        by: ["chunkId"],
        where: { chunkId: { in: chunkIds } },
        _count: { id: true },
      });
      
      const usageMap = new Map(usageCounts.map(u => [u.chunkId, u._count.id]));
      
      enrichedChunks = chunks.map(c => ({
        ...c,
        usageCount: usageMap.get(c.id) || 0,
      }));
    }

    // Calculate quality stats
    const qualityStats = {
      excellent: chunks.filter(c => (c.metadata as any)?.qualityScore >= 80).length,
      good: chunks.filter(c => {
        const score = (c.metadata as any)?.qualityScore || 70;
        return score >= 60 && score < 80;
      }).length,
      fair: chunks.filter(c => {
        const score = (c.metadata as any)?.qualityScore || 70;
        return score >= 40 && score < 60;
      }).length,
      poor: chunks.filter(c => (c.metadata as any)?.qualityScore < 40).length,
    };

    return NextResponse.json({
      chunks: enrichedChunks,
      total,
      qualityStats,
      pagination: {
        limit,
        offset,
        hasMore: offset + chunks.length < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch chunks:", error);
    return NextResponse.json({ error: "Failed to fetch chunks" }, { status: 500 });
  }
}

// POST /api/chunks - Trigger re-chunking or update metadata
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, chunkIds, sourceId, options } = body;

    // Update chunk metadata (e.g., quality scores, approval status)
    if (action === "update_metadata") {
      const updates = await Promise.all(
        chunkIds.map((id: string) =>
          prisma.knowledgeChunk.update({
            where: { id },
            data: {
              metadata: options.metadata,
            },
          })
        )
      );
      return NextResponse.json({ updated: updates.length });
    }

    // Exclude chunks from search
    if (action === "exclude") {
      await Promise.all(
        chunkIds.map((id: string) =>
          prisma.knowledgeChunk.update({
            where: { id },
            data: {
              metadata: {
                excluded: true,
                excludedAt: new Date().toISOString(),
                excludedReason: options.reason,
              },
            },
          })
        )
      );
      return NextResponse.json({ excluded: chunkIds.length });
    }

    // Approve chunks (boost trust)
    if (action === "approve") {
      await Promise.all(
        chunkIds.map((id: string) =>
          prisma.knowledgeChunk.update({
            where: { id },
            data: {
              metadata: {
                approved: true,
                approvedAt: new Date().toISOString(),
                approvedBy: options.userId,
              },
            },
          })
        )
      );
      return NextResponse.json({ approved: chunkIds.length });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process chunk action:", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
