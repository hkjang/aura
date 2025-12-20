import { streamText } from "ai";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma"; // If we want to load config from DB

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
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
