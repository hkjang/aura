/**
 * Chunking Rules API - CRUD operations for chunking rule overrides
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/chunking-rules - List all chunking rule overrides
export async function GET() {
  try {
    const rules = await prisma.chunkingRuleOverride.findMany({
      where: { isActive: true },
      orderBy: [
        { documentType: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch chunking rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

// POST /api/chunking-rules - Create a new chunking rule override
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, 
      notebookId, 
      documentType, 
      minTokens, 
      maxTokens, 
      overlapTokens,
      similarityThreshold,
      minParagraphs,
      primaryStrategy,
      secondaryStrategy,
    } = body;

    if (!name || !documentType) {
      return NextResponse.json(
        { error: "name and documentType are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.chunkingRuleOverride.create({
      data: {
        name,
        notebookId: notebookId || null,
        documentType,
        minTokens: minTokens || null,
        maxTokens: maxTokens || null,
        overlapTokens: overlapTokens || null,
        similarityThreshold: similarityThreshold || null,
        minParagraphs: minParagraphs || null,
        primaryStrategy: primaryStrategy || null,
        secondaryStrategy: secondaryStrategy || null,
        isActive: true,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create chunking rule:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}

// PATCH /api/chunking-rules - Update chunking rule
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rule = await prisma.chunkingRuleOverride.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Failed to update chunking rule:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

// DELETE /api/chunking-rules - Delete chunking rule
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.chunkingRuleOverride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chunking rule:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
