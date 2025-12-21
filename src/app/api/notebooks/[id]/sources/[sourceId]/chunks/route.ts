/**
 * Knowledge Chunks API - Get chunks for a source
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";

export const dynamic = "force-dynamic";

// GET /api/notebooks/[id]/sources/[sourceId]/chunks
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

    const chunks = await prisma.knowledgeChunk.findMany({
      where: { sourceId },
      orderBy: { chunkIndex: "asc" },
      select: {
        id: true,
        chunkIndex: true,
        content: true,
        keywords: true,
      },
    });

    return NextResponse.json({ chunks });
  } catch (error) {
    console.error("Error fetching chunks:", error);
    return NextResponse.json(
      { error: "Failed to fetch chunks" },
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
