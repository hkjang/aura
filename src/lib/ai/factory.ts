import { createOpenAI } from "@ai-sdk/openai";
import { AIModelConfig } from "./types";

export class AIProviderFactory {
  static createModel(config: AIModelConfig, isReasoningModel: boolean = false, reasoningEffort: 'low' | 'medium' | 'high' = 'medium') {
    switch (config.providerId) {
      case "openai":
        return AIProviderFactory.createOpenAIModel(config);
      case "vllm":
      case "ollama":
        // vLLM and Ollama use OpenAI-compatible API
        if (isReasoningModel) {
          return AIProviderFactory.createReasoningModel(config, reasoningEffort);
        }
        return AIProviderFactory.createOpenAICompatibleModel(config);
      default:
        throw new Error(`Provider ${config.providerId} not supported`);
    }
  }

  private static createOpenAIModel(config: AIModelConfig) {
    const openai = createOpenAI({
      baseURL: config.baseUrl || "https://api.openai.com/v1",
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || "dummy-key",
    });

    return openai.chat(config.modelId);
  }

  private static createOpenAICompatibleModel(config: AIModelConfig) {
    // For Ollama/vLLM, use .chat() to explicitly use Chat Completions API
    const openai = createOpenAI({
      baseURL: config.baseUrl || "http://localhost:11434/v1",
      apiKey: config.apiKey || "ollama", // Ollama doesn't require a real key
    });

    // Use .chat() to ensure we use the Chat Completions API endpoint
    return openai.chat(config.modelId);
  }

  private static createReasoningModel(config: AIModelConfig, reasoningEffort: 'low' | 'medium' | 'high' = 'medium') {
    // Custom fetch that injects reasoning_effort into the request body
    const customFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      if (init?.body && typeof init.body === 'string') {
        try {
          const body = JSON.parse(init.body);
          body.reasoning_effort = reasoningEffort;
          init = {
            ...init,
            body: JSON.stringify(body)
          };
          console.log(`[ReasoningModel] Injected reasoning_effort: ${reasoningEffort}`);
        } catch (e) {
          console.error("[ReasoningModel] Failed to inject reasoning_effort", e);
        }
      }
      return fetch(url, init);
    };

    const openai = createOpenAI({
      baseURL: config.baseUrl || "http://localhost:11434/v1",
      apiKey: config.apiKey || "ollama",
      fetch: customFetch,
    });

    return openai.chat(config.modelId);
  }
}
