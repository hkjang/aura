/**
 * Knowledge Sources API - List sources for document tree
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/knowledge-sources - List knowledge sources
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const notebookId = searchParams.get("notebookId");

    const where: Record<string, unknown> = {};
    if (notebookId) {
      where.notebookId = notebookId;
    }

    const sources = await prisma.knowledgeSource.findMany({
      where,
      include: {
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      sources: sources.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        status: s.status,
        notebookId: s.notebookId,
        chunkCount: s._count.chunks,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch knowledge sources:", error);
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
  }
}
