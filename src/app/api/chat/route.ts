import { streamText } from "ai";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma"; // If we want to load config from DB
import { searchDocumentsTool } from "@/lib/ai/tools/search";

export async function POST(req: Request) {
  const { messages, provider, model } = await req.json();

  // In a real app, we would look up the full config from the DB based on 'model' ID
  // For this demo, we can iterate with a default config or partial override
  const config: AIModelConfig = {
    id: "temp",
    providerId: (provider as AIProviderId) || "openai",
    modelId: model || "gpt-3.5-turbo",
    // baseUrl could come from env or request for testing
    baseUrl: process.env.VLLM_URL || process.env.OLLAMA_URL
  };

  try {
    const languageModel = AIProviderFactory.createModel(config);

    const result = streamText({
      model: languageModel,
      messages,
      tools: {
        searchDocuments: searchDocumentsTool,
      },
      onFinish: async ({ usage }) => {
        // @ts-ignore - Usage types might vary in recent SDK versions
        const { promptTokens = 0, completionTokens = 0 } = usage || {};
        
        // Simple cost estimation (e.g. $0.002 per 1k input, $0.002 per 1k output)
        const cost = (promptTokens * 0.000002) + (completionTokens * 0.000002);

        try {
          await prisma.usageLog.create({
            data: {
              model: config.modelId,
              tokensIn: promptTokens,
              tokensOut: completionTokens,
              cost,
              type: "chat"
            }
          });
        } catch (e) {
          console.error("Failed to log usage", e);
        }
      }
    });

    // @ts-ignore
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
