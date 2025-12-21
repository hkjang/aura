/**
 * Single Source API - Get, Delete source
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";
import { VectorStoreFactory } from "@/lib/notebook/vector-store";
import { ProcessingPipeline } from "@/lib/notebook/processing-pipeline";

export const dynamic = "force-dynamic";

// GET /api/notebooks/[id]/sources/[sourceId] - Get source details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const source = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId, notebookId: id },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
          select: {
            id: true,
            chunkIndex: true,
            content: true,
            startOffset: true,
            endOffset: true,
            keywords: true,
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    return NextResponse.json({ source });
  } catch (error) {
    console.error("Error fetching source:", error);
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}

// DELETE /api/notebooks/[id]/sources/[sourceId] - Delete source
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission || permission === "READ") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get source info before deletion
    const source = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId, notebookId: id },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Remove from vector store
    const vectorStore = await VectorStoreFactory.getStore();
    await vectorStore.deleteByFilter({ sourceId });

    // Delete source (cascades to chunks)
    await prisma.knowledgeSource.delete({
      where: { id: sourceId },
    });

    // Log the action
    await prisma.notebookAudit.create({
      data: {
        notebookId: id,
        userId,
        action: "REMOVE_SOURCE",
        details: JSON.stringify({ sourceId, title: source.title }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting source:", error);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks/[id]/sources/[sourceId] - Reprocess source
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission || permission === "READ") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "reprocess";

    if (action === "reprocess") {
      // Reprocess the source
      const result = await ProcessingPipeline.reprocessSource(sourceId);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing source:", error);
    return NextResponse.json(
      { error: "Failed to process source" },
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
