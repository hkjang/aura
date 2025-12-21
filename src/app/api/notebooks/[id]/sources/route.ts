/**
 * Knowledge Sources API - List and Add sources to notebook
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";
import { ProcessingPipeline } from "@/lib/notebook/processing-pipeline";

export const dynamic = "force-dynamic";

// GET /api/notebooks/[id]/sources - Get sources for a notebook
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

    // Check permission
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sources = await prisma.knowledgeSource.findMany({
      where: { notebookId: id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    // Get processing stats
    const stats = await ProcessingPipeline.getStats(id);

    return NextResponse.json({ sources, stats });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks/[id]/sources - Add a new source
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission (need EDIT or ADMIN)
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission || permission === "READ") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";

    let source;

    if (contentType.includes("multipart/form-data")) {
      // File upload
      source = await handleFileUpload(req, id, userId);
    } else {
      // JSON body (text or URL)
      const body = await req.json();
      source = await handleJsonSource(body, id, userId);
    }

    // Start processing in background
    ProcessingPipeline.processSource(source.id).catch(console.error);

    // Log the action
    await prisma.notebookAudit.create({
      data: {
        notebookId: id,
        userId,
        action: "ADD_SOURCE",
        details: JSON.stringify({ sourceId: source.id, title: source.title }),
      },
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error("Error adding source:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add source" },
      { status: 500 }
    );
  }
}

// Handle file upload
async function handleFileUpload(req: Request, notebookId: string, userId: string) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("파일이 필요합니다.");
  }

  // Read file content
  const buffer = await file.arrayBuffer();
  let content: string;

  const fileType = file.type || "";
  const fileName = file.name;

  // Parse based on file type
  if (fileType === "text/plain" || fileName.endsWith(".txt") || fileName.endsWith(".md")) {
    content = new TextDecoder("utf-8").decode(buffer);
  } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    // For PDF, try Upstage or store placeholder
    content = await parseWithUpstage(file);
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    // For DOCX, try Upstage or mammoth
    content = await parseWithUpstage(file);
  } else {
    throw new Error(`지원하지 않는 파일 형식입니다: ${fileType || fileName}`);
  }

  if (!content || content.trim().length < 10) {
    throw new Error("파일에서 충분한 텍스트를 추출할 수 없습니다.");
  }

  // Create source record
  const source = await prisma.knowledgeSource.create({
    data: {
      notebookId,
      type: "FILE",
      title: fileName,
      originalName: fileName,
      content,
      fileSize: file.size,
      fileType: fileType || "unknown",
      uploaderId: userId,
      status: "PENDING",
      metadata: JSON.stringify({
        uploadedAt: new Date().toISOString(),
      }),
    },
  });

  return source;
}

// Handle JSON source (text or URL or document import)
async function handleJsonSource(
  body: { type: string; title?: string; content?: string; url?: string; documentId?: string },
  notebookId: string,
  userId: string
) {
  const { type, title, content, url, documentId } = body;

  if (type === "TEXT") {
    if (!content || content.trim().length < 10) {
      throw new Error("텍스트 내용이 너무 짧습니다.");
    }

    return prisma.knowledgeSource.create({
      data: {
        notebookId,
        type: "TEXT",
        title: title || "텍스트 입력",
        content: content.trim(),
        uploaderId: userId,
        status: "PENDING",
      },
    });
  } else if (type === "URL") {
    if (!url) {
      throw new Error("URL이 필요합니다.");
    }

    // Fetch URL content
    const urlContent = await fetchUrlContent(url);

    return prisma.knowledgeSource.create({
      data: {
        notebookId,
        type: "URL",
        title: title || url,
        content: urlContent,
        url,
        uploaderId: userId,
        status: "PENDING",
        metadata: JSON.stringify({
          crawledAt: new Date().toISOString(),
        }),
      },
    });
  } else if (type === "DOCUMENT") {
    // Import from existing knowledge base document
    if (!documentId) {
      throw new Error("문서 ID가 필요합니다.");
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("문서를 찾을 수 없습니다.");
    }

    // Check if already imported
    const existing = await prisma.knowledgeSource.findFirst({
      where: {
        notebookId,
        metadata: { contains: documentId },
      },
    });

    if (existing) {
      throw new Error("이미 가져온 문서입니다.");
    }

    return prisma.knowledgeSource.create({
      data: {
        notebookId,
        type: "DOCUMENT",
        title: title || document.title,
        content: document.content,
        uploaderId: userId,
        status: "PENDING",
        metadata: JSON.stringify({
          documentId: document.id,
          importedAt: new Date().toISOString(),
          originalCreatedAt: document.createdAt.toISOString(),
        }),
      },
    });
  }

  throw new Error("유효하지 않은 소스 타입입니다.");
}

// Parse file with Upstage Document AI
async function parseWithUpstage(file: File): Promise<string> {
  const upstageKey = process.env.UPSTAGE_API_KEY;
  
  if (!upstageKey) {
    // Try to get from DB
    const config = await prisma.systemConfig.findUnique({
      where: { key: "UPSTAGE_API_KEY" },
    });
    
    if (!config?.value) {
      throw new Error("PDF/DOCX 처리를 위해 Upstage API 키가 필요합니다.");
    }
  }

  const formData = new FormData();
  formData.append("document", file);
  formData.append("output_formats", JSON.stringify(["text"]));

  const apiKey = upstageKey || (await prisma.systemConfig.findUnique({
    where: { key: "UPSTAGE_API_KEY" },
  }))?.value;

  const response = await fetch("https://api.upstage.ai/v1/document-digitization", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upstage 문서 파싱 실패");
  }

  const result = await response.json();
  return result.content?.text || result.content?.markdown || result.text || "";
}

// Fetch URL content
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AuraBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`URL 요청 실패: ${response.status}`);
    }

    const html = await response.text();

    // Simple HTML to text (production: use proper library)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 50) {
      throw new Error("URL에서 충분한 텍스트를 추출할 수 없습니다.");
    }

    return text;
  } catch (error) {
    throw new Error(
      `URL 크롤링 실패: ${error instanceof Error ? error.message : "Unknown error"}`
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
