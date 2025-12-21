/**
 * Notebook Audit API - View change history
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";

export const dynamic = "force-dynamic";

// GET /api/notebooks/[id]/audit - Get audit log
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

    // Check access (need at least READ)
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const [logs, total] = await Promise.all([
      prisma.notebookAudit.findMany({
        where: { notebookId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.notebookAudit.count({ where: { notebookId: id } }),
    ]);

    // Get user info
    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const logsWithUsers = logs.map((l) => ({
      ...l,
      details: l.details ? JSON.parse(l.details) : null,
      user: userMap.get(l.userId) || { id: l.userId, name: "Unknown", email: null },
    }));

    return NextResponse.json({
      logs: logsWithUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
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
