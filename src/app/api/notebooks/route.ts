/**
 * Notebooks API - List and Create notebooks
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";
import { PolicyAdminService } from "@/lib/notebook/policy-admin-service";

export const dynamic = "force-dynamic";

// GET /api/notebooks - Get user's notebooks
export async function GET(req: Request) {
  try {
    // Get user from session (mock for now)
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owned, shared } = await NotebookService.getByUserId(userId);

    return NextResponse.json({
      owned,
      shared,
      total: owned.length + shared.length,
    });
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebooks" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks - Create a new notebook
export async function POST(req: Request) {
  try {
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 정책 검사: 노트북 생성 가능 여부 확인
    const canCreate = await PolicyAdminService.canCreateNotebook(userId);
    if (!canCreate.allowed) {
      return NextResponse.json(
        { error: canCreate.reason || "노트북 생성이 제한되었습니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, scope, isPublic, tags } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "노트북 이름은 필수입니다." },
        { status: 400 }
      );
    }

    const notebook = await NotebookService.create({
      name: name.trim(),
      description: description?.trim(),
      scope: scope || "PERSONAL",
      ownerId: userId,
      isPublic: isPublic || false,
      tags: tags || [],
    });

    return NextResponse.json({ notebook }, { status: 201 });
  } catch (error) {
    console.error("Error creating notebook:", error);
    return NextResponse.json(
      { error: "Failed to create notebook" },
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
