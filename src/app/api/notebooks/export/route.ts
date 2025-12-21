/**
 * Export API - Export notebooks and Q&A history
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";

export const dynamic = "force-dynamic";

// POST /api/notebooks/export - Export notebook or Q&A
export async function POST(req: Request) {
  try {
    const userId = await getMockUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, format, notebookId, qnaIds } = body;

    if (type === "notebook" && notebookId) {
      return exportNotebook(notebookId, format, userId);
    } else if (type === "qna" && qnaIds) {
      return exportQnA(qnaIds, format, userId);
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

// Export notebook as Markdown
async function exportNotebook(
  notebookId: string,
  format: string,
  userId: string
) {
  const permission = await NotebookService.checkPermission(notebookId, userId);
  if (!permission) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId },
    include: {
      sources: {
        orderBy: { createdAt: "asc" },
        include: {
          chunks: {
            orderBy: { chunkIndex: "asc" },
            select: {
              content: true,
              chunkIndex: true,
              keywords: true,
            },
          },
        },
      },
    },
  });

  if (!notebook) {
    return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
  }

  if (format === "md" || format === "markdown") {
    const markdown = generateNotebookMarkdown(notebook);
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(notebook.name)}.md"`,
      },
    });
  } else if (format === "json") {
    return NextResponse.json({
      notebook: {
        ...notebook,
        tags: JSON.parse(notebook.tags || "[]"),
      },
    });
  } else {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  }
}

// Export Q&A history as Markdown
async function exportQnA(qnaIds: string[], format: string, userId: string) {
  const qnas = await prisma.qnAHistory.findMany({
    where: {
      id: { in: qnaIds },
      userId,
    },
    include: {
      notebook: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (qnas.length === 0) {
    return NextResponse.json({ error: "No Q&A found" }, { status: 404 });
  }

  if (format === "md" || format === "markdown") {
    const markdown = generateQnAMarkdown(qnas);
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="qa-export-${Date.now()}.md"`,
      },
    });
  } else if (format === "json") {
    return NextResponse.json({
      qnas: qnas.map((q) => ({
        ...q,
        citations: JSON.parse(q.citations || "[]"),
        tags: JSON.parse(q.tags || "[]"),
      })),
    });
  } else {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  }
}

// Generate Markdown for notebook export
function generateNotebookMarkdown(notebook: {
  name: string;
  description: string | null;
  tags: string;
  createdAt: Date;
  sources: Array<{
    title: string;
    type: string;
    content: string;
    createdAt: Date;
    chunks: Array<{
      content: string;
      chunkIndex: number;
      keywords: string;
    }>;
  }>;
}): string {
  let md = `# ${notebook.name}\n\n`;

  if (notebook.description) {
    md += `> ${notebook.description}\n\n`;
  }

  const tags = JSON.parse(notebook.tags || "[]");
  if (tags.length > 0) {
    md += `**태그:** ${tags.join(", ")}\n\n`;
  }

  md += `**생성일:** ${notebook.createdAt.toLocaleDateString("ko-KR")}\n\n`;
  md += `---\n\n`;
  md += `## 지식 소스\n\n`;

  for (const source of notebook.sources) {
    md += `### 📄 ${source.title}\n\n`;
    md += `- **유형:** ${source.type}\n`;
    md += `- **추가일:** ${source.createdAt.toLocaleDateString("ko-KR")}\n`;
    md += `- **청크 수:** ${source.chunks.length}\n\n`;

    md += `#### 내용\n\n`;
    md += `\`\`\`\n${source.content.substring(0, 2000)}${source.content.length > 2000 ? "\n... (더 보기)" : ""}\n\`\`\`\n\n`;

    if (source.chunks.length > 0) {
      const allKeywords = new Set<string>();
      for (const chunk of source.chunks) {
        try {
          const kws = JSON.parse(chunk.keywords || "[]");
          kws.forEach((k: string) => allKeywords.add(k));
        } catch {
          // Ignore
        }
      }
      if (allKeywords.size > 0) {
        md += `**키워드:** ${Array.from(allKeywords).slice(0, 10).join(", ")}\n\n`;
      }
    }

    md += `---\n\n`;
  }

  return md;
}

// Generate Markdown for Q&A export
function generateQnAMarkdown(
  qnas: Array<{
    question: string;
    answer: string;
    citations: string;
    createdAt: Date;
    notebook: { name: string } | null;
  }>
): string {
  let md = `# Q&A 대화 내역\n\n`;
  md += `**내보내기 일시:** ${new Date().toLocaleString("ko-KR")}\n`;
  md += `**총 대화 수:** ${qnas.length}\n\n`;
  md += `---\n\n`;

  for (let i = 0; i < qnas.length; i++) {
    const qna = qnas[i];
    md += `## 대화 ${i + 1}\n\n`;

    if (qna.notebook) {
      md += `**노트북:** ${qna.notebook.name}\n`;
    }
    md += `**일시:** ${qna.createdAt.toLocaleString("ko-KR")}\n\n`;

    md += `### 질문\n\n${qna.question}\n\n`;
    md += `### 답변\n\n${qna.answer}\n\n`;

    const citations = JSON.parse(qna.citations || "[]");
    if (citations.length > 0) {
      md += `### 출처\n\n`;
      for (const cite of citations) {
        md += `- ${cite.sourceTitle || cite.sourceId}\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  return md;
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
