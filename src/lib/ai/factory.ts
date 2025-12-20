import { createOpenAI } from "@ai-sdk/openai";
import { AIModelConfig, AIProviderService } from "./types";

export class AIProviderFactory {
  static createModel(config: AIModelConfig) {
    switch (config.providerId) {
      case "openai":
      case "vllm": // vLLM is OpenAI-compatible often
        return AIProviderFactory.createOpenAICompatible(config);
      case "ollama":
        // For simplicity in this demo, treating Ollama as OpenAI compatible via its compat API
        // Real implementation might use a dedicated Ollama driver if streaming behaviors differ
        return AIProviderFactory.createOpenAICompatible(config);
      default:
        throw new Error(`Provider ${config.providerId} not supported`);
    }
  }

  private static createOpenAICompatible(config: AIModelConfig) {
    const openai = createOpenAI({
      baseURL: config.baseUrl || "https://api.openai.com/v1",
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || "dummy-key",
      // compatibility: "strict", // Removed as per type definition
    });
  }
}
