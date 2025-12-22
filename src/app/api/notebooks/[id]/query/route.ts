/**
 * Notebook Query API - RAG-based Q&A within notebook scope
 */

import { NextResponse } from "next/server";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { NotebookService } from "@/lib/notebook/notebook-service";
import { NotebookRAG, Citation } from "@/lib/notebook/notebook-rag";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

// POST /api/notebooks/[id]/query - Query notebook with RAG
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

    // Check permission
    const permission = await NotebookService.checkPermission(id, userId);
    if (!permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const {
      question,
      additionalNotebookIds = [],
      model = "gpt-3.5-turbo",
      provider = "openai",
      saveHistory = true,
    } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "질문을 입력해주세요." },
        { status: 400 }
      );
    }

    // Build RAG context from notebook(s)
    const notebookIds = [id, ...additionalNotebookIds];
    const { context, systemPrompt } = await NotebookRAG.buildQuery(question, {
      notebookIds,
      maxContextTokens: 3000,
    });

    // If no context found, return early with warning as a stream
    if (!context.context && context.warning) {
      const encoder = new TextEncoder();
      const warningStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(context.warning || "관련 내용을 찾을 수 없습니다."));
          const metadata = {
            citations: [],
            warning: context.warning,
          };
          controller.enqueue(
            encoder.encode(`\n---CITATIONS---\n${JSON.stringify(metadata)}`)
          );
          controller.close();
        },
      });

      return new Response(warningStream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }


    // Resolve model configuration
    let providerId = provider as AIProviderId;
    let modelId = model;
    let baseUrl: string | undefined;
    let apiKey: string | undefined;

    // If no model specified, get default from SystemConfig
    if (!modelId || modelId === "gpt-3.5-turbo") {
      const systemConfigs = await prisma.systemConfig.findMany({
        where: { key: { in: ["AI_PROVIDER", "AI_MODEL", "AI_BASE_URL", "AI_API_KEY", "OPENAI_API_KEY", "OLLAMA_BASE_URL"] } },
      });
      
      const configMap = new Map<string, string>(
        systemConfigs.map((c: { key: string; value: string }) => [c.key, c.value])
      );
      
      const defaultProvider = configMap.get("AI_PROVIDER");
      const defaultModel = configMap.get("AI_MODEL");
      
      if (defaultProvider && defaultModel) {
        providerId = defaultProvider as AIProviderId;
        modelId = defaultModel;
        baseUrl = (configMap.get("AI_BASE_URL") || configMap.get("OLLAMA_BASE_URL")) as string | undefined;
        apiKey = (configMap.get("AI_API_KEY") || configMap.get("OPENAI_API_KEY")) as string | undefined;
        
        console.log("[Query] Using default AI model from SystemConfig:", providerId, modelId);
      }
    }

    // Check DB for specific model config
    const modelConfig = await prisma.modelConfig.findFirst({
      where: { modelId, isActive: true },
    });

    if (modelConfig) {
      providerId = (modelConfig.provider as AIProviderId) || providerId;
      baseUrl = modelConfig.baseUrl || baseUrl;
      apiKey = modelConfig.apiKey || apiKey;
    }

    // Provider defaults
    if (!baseUrl) {
      if (providerId === "ollama") {
        baseUrl = "http://localhost:11434/v1";
      } else if (providerId === "vllm") {
        baseUrl = "http://localhost:8000/v1";
      }
    }

    const config: AIModelConfig = {
      id: "temp",
      providerId,
      modelId,
      baseUrl,
      apiKey,
    };

    // Check if this is a reasoning model (GPT-OSS)
    const isReasoningModel = modelId.toLowerCase().includes('gpt-oss') || modelId.toLowerCase().includes('deepseek-r1');
    console.log("[Query] isReasoningModel:", isReasoningModel);

    const languageModel = AIProviderFactory.createModel(config, isReasoningModel);

    // Stream the response
    const result = await streamText({
      model: languageModel,
      system: systemPrompt,
      messages: [
        { role: "user", content: question },
      ],
    });

    // Build streaming response with citations
    const encoder = new TextEncoder();
    let fullAnswer = "";

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          console.log("[Query] Starting stream, context length:", context.context?.length || 0);
          console.log("[Query] System prompt length:", systemPrompt?.length || 0);
          
          let chunkCount = 0;
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
            fullAnswer += chunk;
            chunkCount++;
          }
          
          console.log("[Query] Stream complete, chunks:", chunkCount, "answer length:", fullAnswer.length);

          // Append citations as metadata
          const metadata = {
            citations: context.citations,
            warning: context.warning,
          };
          controller.enqueue(
            encoder.encode(`\n---CITATIONS---\n${JSON.stringify(metadata)}`)
          );

          // Save to history if requested
          if (saveHistory && fullAnswer.length > 0) {
            await NotebookRAG.saveQnA(
              userId,
              id,
              question,
              fullAnswer,
              context.citations
            );
          }

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
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}

// GET /api/notebooks/[id]/query - Get suggested questions
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

    const suggestions = await NotebookRAG.getSuggestedQuestions(id);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
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
