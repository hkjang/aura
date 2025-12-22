/**
 * Admin Audit Log API
 * GET: List audit logs with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const notebookId = searchParams.get("notebookId");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: Record<string, unknown> = {};

    if (notebookId) where.notebookId = notebookId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.notebookAudit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notebookAudit.count({ where }),
    ]);

    // Get unique actions for filter options
    const actionTypes = await prisma.notebookAudit.groupBy({
      by: ["action"],
      _count: { id: true },
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      actionTypes: actionTypes.map(a => ({
        action: a.action,
        count: a._count.id,
      })),
    });
  } catch (error) {
    console.error("Admin audit GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
