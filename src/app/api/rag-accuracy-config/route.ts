/**
 * RAG Accuracy Config API - CRUD for accuracy rule settings
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/rag-accuracy-config - List or get specific config
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const scope = searchParams.get("scope");
    const notebookId = searchParams.get("notebookId");
    const getDefault = searchParams.get("default") === "true";

    // Get single config by ID
    if (id) {
      const config = await prisma.rAGAccuracyConfig.findUnique({
        where: { id },
      });
      
      if (!config) {
        return NextResponse.json({ error: "Config not found" }, { status: 404 });
      }
      
      return NextResponse.json({ config });
    }

    // Get default config
    if (getDefault) {
      const defaultConfig = await prisma.rAGAccuracyConfig.findFirst({
        where: { isDefault: true, isActive: true },
      });
      
      return NextResponse.json({ config: defaultConfig });
    }

    // List configs with optional filters
    const configs = await prisma.rAGAccuracyConfig.findMany({
      where: {
        ...(scope ? { scope } : {}),
        ...(notebookId ? { notebookId } : {}),
        isActive: true,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Failed to fetch accuracy configs:", error);
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 });
  }
}

// POST /api/rag-accuracy-config - Create new config
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, scope = "GLOBAL", notebookId, documentType, ...settings } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (settings.isDefault) {
      await prisma.rAGAccuracyConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const config = await prisma.rAGAccuracyConfig.create({
      data: {
        name,
        scope,
        notebookId,
        documentType,
        ...settings,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error("Failed to create accuracy config:", error);
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 });
  }
}

// PATCH /api/rag-accuracy-config - Update config
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const body = await req.json();

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.rAGAccuracyConfig.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const config = await prisma.rAGAccuracyConfig.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to update accuracy config:", error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}

// DELETE /api/rag-accuracy-config - Delete config
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.rAGAccuracyConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete accuracy config:", error);
    return NextResponse.json({ error: "Failed to delete config" }, { status: 500 });
  }
}
