import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFile } from "@/lib/rag/parser";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Parse content
    const content = await parseFile(file);

    // 2. Setup metadata
    const metadata = {
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };

    // 3. Store in DB (Simple Text Storage for MVP)
    // In a real RAG, we would chunk this content and generate embeddings here
    const doc = await prisma.document.create({
      data: {
        title: file.name,
        content: content,
        metadata: JSON.stringify(metadata),
      }
    });

    return NextResponse.json({ success: true, doc });
  } catch (error) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ error: "Failed to ingest document" }, { status: 500 });
  }
}
