/**
 * Embedding Models API - CRUD operations for embedding model configurations
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/embedding-models - List all embedding models
export async function GET() {
  try {
    const models = await prisma.embeddingModelConfig.findMany({
      orderBy: [
        { isDefault: "desc" },
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Hide API keys
    const safeModels = models.map((m) => ({
      ...m,
      apiKey: m.apiKey ? "***" : null,
    }));

    return NextResponse.json({ models: safeModels });
  } catch (error) {
    console.error("Failed to fetch embedding models:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

// POST /api/embedding-models - Create a new embedding model
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, provider, modelId, dimension, baseUrl, apiKey, isDefault } = body;

    if (!name || !provider || !modelId) {
      return NextResponse.json(
        { error: "name, provider, modelId are required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.embeddingModelConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await prisma.embeddingModelConfig.create({
      data: {
        name,
        provider,
        modelId,
        dimension: dimension || 1536,
        baseUrl: baseUrl || null,
        apiKey: apiKey || null,
        isDefault: isDefault || false,
        isActive: true,
      },
    });

    return NextResponse.json({ model: { ...model, apiKey: model.apiKey ? "***" : null } }, { status: 201 });
  } catch (error) {
    console.error("Failed to create embedding model:", error);
    return NextResponse.json({ error: "Failed to create model" }, { status: 500 });
  }
}

// PATCH /api/embedding-models - Update embedding model
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await prisma.embeddingModelConfig.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Don't update apiKey if not provided or is masked
    if (!updates.apiKey || updates.apiKey === "***") {
      delete updates.apiKey;
    }

    const model = await prisma.embeddingModelConfig.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ model: { ...model, apiKey: model.apiKey ? "***" : null } });
  } catch (error) {
    console.error("Failed to update embedding model:", error);
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}

// DELETE /api/embedding-models - Delete embedding model
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.embeddingModelConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete embedding model:", error);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
