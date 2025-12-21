import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/knowledge/search?q=query - Search documents
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  }

  try {
    // Simple text search (case-insensitive)
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        metadata: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      documents,
      query,
      count: documents.length 
    });
  } catch (error) {
    console.error("Error searching documents:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
