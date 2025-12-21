/**
 * Notebook Detail API - Get, Update, Delete notebook
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";
import { VectorStore } from "@/lib/notebook/vector-store";

export const dynamic = "force-dynamic";

// GET /api/notebooks/[id] - Get notebook details
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

    // Check permission
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const notebook = await NotebookService.getById(id, true);
    if (!notebook) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    // Get stats
    const stats = await NotebookService.getStats(id);

    return NextResponse.json({
      notebook,
      stats,
      permission,
    });
  } catch (error) {
    console.error("Error fetching notebook:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebook" },
      { status: 500 }
    );
  }
}

// PATCH /api/notebooks/[id] - Update notebook
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

    // Check permission (need EDIT or ADMIN)
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission || permission === "READ") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, scope, isPublic, tags } = body;

    const notebook = await NotebookService.update(id, userId, {
      name: name?.trim(),
      description: description?.trim(),
      scope,
      isPublic,
      tags,
    });

    return NextResponse.json({ notebook });
  } catch (error) {
    console.error("Error updating notebook:", error);
    return NextResponse.json(
      { error: "Failed to update notebook" },
      { status: 500 }
    );
  }
}

// DELETE /api/notebooks/[id] - Delete notebook
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

    // Check permission (need ADMIN)
    const permission = await NotebookService.checkPermission(id, userId);
    if (permission !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Remove from vector store first
    await VectorStore.removeByNotebook(id);

    // Delete notebook (cascades to sources, chunks, etc.)
    await NotebookService.delete(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notebook:", error);
    return NextResponse.json(
      { error: "Failed to delete notebook" },
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
