/**
 * RAG Trace API - Store and retrieve query-chunk-answer traces
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/rag-traces - List traces with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const notebookId = searchParams.get("notebookId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const traceId = searchParams.get("id");

    // Get single trace with chunks
    if (traceId) {
      const trace = await prisma.rAGTrace.findUnique({
        where: { id: traceId },
        include: {
          chunks: {
            orderBy: { rank: "asc" },
          },
        },
      });

      if (!trace) {
        return NextResponse.json({ error: "Trace not found" }, { status: 404 });
      }

      return NextResponse.json({ trace });
    }

    // List traces
    const traces = await prisma.rAGTrace.findMany({
      where: notebookId ? { notebookId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        chunks: {
          orderBy: { rank: "asc" },
        },
      },
    });

    return NextResponse.json({ traces });
  } catch (error) {
    console.error("Failed to fetch RAG traces:", error);
    return NextResponse.json({ error: "Failed to fetch traces" }, { status: 500 });
  }
}

// POST /api/rag-traces - Create a new trace
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      notebookId,
      userId,
      originalQuery,
      processedQuery,
      answer,
      model,
      generationTime,
      chunks, // Array of chunk data
    } = body;

    if (!notebookId || !originalQuery || !answer) {
      return NextResponse.json(
        { error: "notebookId, originalQuery, and answer are required" },
        { status: 400 }
      );
    }

    const usedChunks = chunks?.filter((c: { isUsedInAnswer: boolean }) => c.isUsedInAnswer).length || 0;
    const totalChunks = chunks?.length || 0;
    const avgSimilarity = chunks?.length
      ? chunks.reduce((sum: number, c: { similarity: number }) => sum + c.similarity, 0) / chunks.length
      : null;

    const trace = await prisma.rAGTrace.create({
      data: {
        notebookId,
        userId: userId || "system",
        originalQuery,
        processedQuery,
        answer,
        model,
        generationTime,
        totalChunks,
        usedChunks,
        avgSimilarity,
        chunks: chunks ? {
          create: chunks.map((chunk: {
            chunkId: string;
            rank: number;
            similarity: number;
            qualityScore?: number;
            qualityGrade?: string;
            documentName?: string;
            documentType?: string;
            content: string;
            tokenCount?: number;
            isUsedInAnswer?: boolean;
          }, index: number) => ({
            chunkId: chunk.chunkId || `chunk-${index}`,
            rank: chunk.rank || index + 1,
            similarity: chunk.similarity,
            qualityScore: chunk.qualityScore,
            qualityGrade: chunk.qualityGrade,
            documentName: chunk.documentName,
            documentType: chunk.documentType,
            content: chunk.content,
            tokenCount: chunk.tokenCount,
            isUsedInAnswer: chunk.isUsedInAnswer || false,
          })),
        } : undefined,
      },
      include: {
        chunks: true,
      },
    });

    return NextResponse.json({ trace }, { status: 201 });
  } catch (error) {
    console.error("Failed to create RAG trace:", error);
    return NextResponse.json({ error: "Failed to create trace" }, { status: 500 });
  }
}

// DELETE /api/rag-traces - Delete a trace
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.rAGTrace.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete RAG trace:", error);
    return NextResponse.json({ error: "Failed to delete trace" }, { status: 500 });
  }
}
