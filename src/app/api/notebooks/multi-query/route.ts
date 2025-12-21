/**
 * Multi-notebook Query API - Query across multiple notebooks
 */

import { NextResponse } from "next/server";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { NotebookRAG, Citation } from "@/lib/notebook/notebook-rag";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

// POST /api/notebooks/multi-query - Query across multiple notebooks
export async function POST(req: Request) {
  try {
    const userId = await getMockUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      question,
      notebookIds,
      model = "gpt-3.5-turbo",
      provider = "openai",
      compareMode = false, // If true, show results per notebook
    } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "질문을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!notebookIds || notebookIds.length === 0) {
      return NextResponse.json(
        { error: "노트북을 선택해주세요." },
        { status: 400 }
      );
    }

    // Verify user has access to all notebooks
    for (const nbId of notebookIds) {
      const notebook = await prisma.notebook.findUnique({
        where: { id: nbId },
        include: { shares: { where: { userId } } },
      });

      if (!notebook) {
        return NextResponse.json(
          { error: `노트북을 찾을 수 없습니다: ${nbId}` },
          { status: 404 }
        );
      }

      const hasAccess =
        notebook.ownerId === userId ||
        notebook.shares.length > 0 ||
        notebook.isPublic;

      if (!hasAccess) {
        return NextResponse.json(
          { error: `접근 권한이 없습니다: ${notebook.name}` },
          { status: 403 }
        );
      }
    }

    if (compareMode) {
      // Compare mode: Get separate results from each notebook
      return handleCompareMode(question, notebookIds, userId, model, provider);
    } else {
      // Merged mode: Combine results from all notebooks
      return handleMergedMode(question, notebookIds, userId, model, provider);
    }
  } catch (error) {
    console.error("Multi-query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}

// Compare mode: Separate responses per notebook
async function handleCompareMode(
  question: string,
  notebookIds: string[],
  userId: string,
  model: string,
  provider: string
) {
  const results: Array<{
    notebookId: string;
    notebookName: string;
    context: string;
    citations: Citation[];
    warning?: string;
  }> = [];

  // Get context from each notebook separately
  for (const nbId of notebookIds) {
    const notebook = await prisma.notebook.findUnique({
      where: { id: nbId },
      select: { name: true },
    });

    const { context } = await NotebookRAG.buildQuery(question, {
      notebookIds: [nbId],
      maxContextTokens: 2000,
    });

    results.push({
      notebookId: nbId,
      notebookName: notebook?.name || "Unknown",
      context: context.context,
      citations: context.citations,
      warning: context.warning,
    });
  }

  // Build comparison prompt
  const systemPrompt = buildComparisonPrompt(question, results);

  // Resolve model configuration
  const config = await resolveModelConfig(model, provider);
  const languageModel = AIProviderFactory.createModel(config);

  // Stream response
  const result = await streamText({
    model: languageModel,
    system: systemPrompt,
    messages: [{ role: "user", content: question }],
  });

  const encoder = new TextEncoder();
  let fullAnswer = "";

  const customStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
          fullAnswer += chunk;
        }

        // Append metadata
        const metadata = {
          mode: "compare",
          notebooks: results.map((r) => ({
            id: r.notebookId,
            name: r.notebookName,
            citationCount: r.citations.length,
            warning: r.warning,
          })),
          citations: results.flatMap((r) =>
            r.citations.map((c) => ({
              ...c,
              notebookName: r.notebookName,
            }))
          ),
        };
        controller.enqueue(
          encoder.encode(`\n---CITATIONS---\n${JSON.stringify(metadata)}`)
        );

        // Save to history
        await NotebookRAG.saveQnA(
          userId,
          null, // Multi-notebook query
          question,
          fullAnswer,
          results.flatMap((r) => r.citations)
        );

        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(customStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Merged mode: Combined response from all notebooks
async function handleMergedMode(
  question: string,
  notebookIds: string[],
  userId: string,
  model: string,
  provider: string
) {
  // Build context from all notebooks
  const { context, systemPrompt } = await NotebookRAG.buildQuery(question, {
    notebookIds,
    maxContextTokens: 4000,
  });

  if (!context.context && context.warning) {
    return NextResponse.json({
      answer: context.warning,
      citations: [],
      warning: context.warning,
    });
  }

  // Resolve model configuration
  const config = await resolveModelConfig(model, provider);
  const languageModel = AIProviderFactory.createModel(config);

  // Stream response
  const result = await streamText({
    model: languageModel,
    system: systemPrompt,
    messages: [{ role: "user", content: question }],
  });

  const encoder = new TextEncoder();
  let fullAnswer = "";

  const customStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
          fullAnswer += chunk;
        }

        // Get notebook names for citations
        const notebooks = await prisma.notebook.findMany({
          where: { id: { in: notebookIds } },
          select: { id: true, name: true },
        });
        const notebookMap = new Map(notebooks.map((n) => [n.id, n.name]));

        // Enhance citations with notebook names
        const enhancedCitations = context.citations.map((c) => {
          const source = prisma.knowledgeSource.findUnique({
            where: { id: c.sourceId },
            select: { notebookId: true },
          });
          return c;
        });

        const metadata = {
          mode: "merged",
          citations: context.citations,
          warning: context.warning,
          notebookCount: notebookIds.length,
        };
        controller.enqueue(
          encoder.encode(`\n---CITATIONS---\n${JSON.stringify(metadata)}`)
        );

        // Save to history
        await NotebookRAG.saveQnA(
          userId,
          null,
          question,
          fullAnswer,
          context.citations
        );

        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(customStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Build comparison prompt
function buildComparisonPrompt(
  question: string,
  results: Array<{
    notebookName: string;
    context: string;
    citations: Citation[];
  }>
): string {
  let prompt = `당신은 여러 지식 베이스의 정보를 비교 분석하는 AI 어시스턴트입니다.

## 중요 규칙:
1. 각 노트북의 정보를 개별적으로 분석하고 비교하세요.
2. 정보가 일치하는 부분과 상이한 부분을 명시하세요.
3. 각 노트북에서 온 정보를 명확히 출처와 함께 표시하세요.
4. 정보가 충돌하는 경우 이를 명확히 언급하세요.

---
## 노트북별 참고 자료:

`;

  for (const result of results) {
    prompt += `### 📚 ${result.notebookName}\n`;
    if (result.context) {
      prompt += `${result.context}\n\n`;
    } else {
      prompt += `(관련 정보 없음)\n\n`;
    }
  }

  prompt += `---
위 자료들을 비교 분석하여 사용자의 질문에 답변하세요.
각 노트북의 관점을 명확히 구분하여 설명하세요.`;

  return prompt;
}

// Resolve model configuration
async function resolveModelConfig(
  model: string,
  provider: string
): Promise<AIModelConfig> {
  let providerId = (provider as AIProviderId) || "openai";
  let modelId = model;
  let baseUrl: string | undefined;
  let apiKey: string | undefined;

  const modelConfig = await prisma.modelConfig.findFirst({
    where: { modelId, isActive: true },
  });

  if (modelConfig) {
    providerId = (modelConfig.provider as AIProviderId) || providerId;
    baseUrl = modelConfig.baseUrl || undefined;
    apiKey = modelConfig.apiKey || undefined;
  }

  if (!baseUrl) {
    if (providerId === "ollama") {
      baseUrl = "http://localhost:11434/v1";
    } else if (providerId === "vllm") {
      baseUrl = "http://localhost:8000/v1";
    }
  }

  return {
    id: "temp",
    providerId,
    modelId,
    baseUrl,
    apiKey,
  };
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
