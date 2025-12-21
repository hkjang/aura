import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET /api/summarize/history - Get summarization history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build where clause
    const where = userId ? { userId } : {};

    const [history, total] = await Promise.all([
      prisma.summaryHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.summaryHistory.count({ where }),
    ]);

    // Parse JSON fields
    const formattedHistory = history.map((item: { keyPoints: string; keywords: string; [key: string]: unknown }) => ({
      ...item,
      keyPoints: JSON.parse(item.keyPoints || "[]"),
      keywords: JSON.parse(item.keywords || "[]"),
    }));

    return NextResponse.json({
      history: formattedHistory,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching summary history:", error);
    return NextResponse.json(
      { error: "히스토리를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/summarize/history?id=xxx - Delete a history item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
    }

    await prisma.summaryHistory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting summary history:", error);
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
