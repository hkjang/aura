import { CoreMessage, LanguageModel } from "ai";

export type AIProviderId = "openai" | "ollama" | "vllm";

export interface AIModelConfig {
  id: string; // internal id
  providerId: AIProviderId;
  modelId: string; // The actual model string name (e.g. 'gpt-4')
  baseUrl?: string;
  apiKey?: string;
}

export interface AIProviderService {
  createInstance(config: AIModelConfig): LanguageModel;
}
