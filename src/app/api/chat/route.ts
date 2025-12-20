
import { streamText } from "ai";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma"; // If we want to load config from DB
import { searchDocumentsTool } from "@/lib/ai/tools/search";
import { CostCalculator } from "@/lib/cost/calculator"; 
import { PolicyEngine } from "@/lib/governance/policy-engine";
import { AuditService } from "@/lib/governance/audit";
import { DeploymentService } from "@/lib/mlops/deployment-service"; // NEW IMPORT

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages, provider, model, systemPrompt } = await req.json();
  console.log("DEBUG: POST /api/chat", { provider, model, messagesLength: messages?.length, hasSystemPrompt: !!systemPrompt });

  // 0. FETCH USER (Fixes Foreign Key Issue)
  // In a real app, this comes from auth session.
  // We try to find the seeded admin user to prevent FK errors.
  let userId = "mock-user-id";
  try {
    const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@aura.local' }
    });
    if (adminUser) userId = adminUser.id;
  } catch (e) {
    console.warn("Failed to fetch admin user for mock session", e);
  }

  // 0.1 CHECK GOVERNANCE POLICY
  // Check the last user message for policy violations
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
      const evaluation = await PolicyEngine.evaluate(lastMessage.content, userId);
      
      // Log the attempt (Now safe with real userId if found)
      await AuditService.log(userId, "CHAT_REQUEST", "model-inference", {
          model,
          policyAction: evaluation.action,
          violations: evaluation.violations
      });

      if (!evaluation.allowed) {
          return new Response(JSON.stringify({ 
              error: `Request blocked by policy: ${evaluation.violations.join(", ")}` 
          }), { status: 403 });
      }
  }

  // 1. CHECK BUDGET
  const { allowed, remaining } = await CostCalculator.checkBudget(userId);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Budget exceeded. Please upgrade your plan." }), { status: 403 });
  }

  // 2. RESOLVE MODEL CONFIGURATION
  // Priority:
  // 1. Database ModelConfig (Admin settings) - Highest priority for user-defined models
  // 2. Deployment (MLOps) - Fallback for generic routing
  // 3. Defaults

  let providerId = (provider as AIProviderId) || "openai";
  let modelId = model || "gpt-3.5-turbo";
  let baseUrl =  process.env.VLLM_URL || process.env.OLLAMA_URL;
  let apiKey = undefined;

  // A. Check Database ModelConfig (PRIORITY)
  const modelConfig = await prisma.modelConfig.findFirst({
    where: { modelId: modelId, isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  let configFound = false;

  if (modelConfig) {
    console.log("DEBUG: Found DB Config:", modelConfig.name);
    providerId = (modelConfig.provider as AIProviderId) || providerId;
    // Use the modelId from the config (it might be different from the requested ID in some cases)
    // But usually modelConfig.modelId is the one we want to traverse.
    // However, if we want to support aliases, we might need a mapping.
    // Here we trust the DB config.
    baseUrl = modelConfig.baseUrl || baseUrl;
    apiKey = modelConfig.apiKey || undefined;
    configFound = true;
  }

  // B. Check for Active Deployment (MLOps) - ONLY IF NOT FOUND IN DB
  // Or should deployment override? Usually Admin Config is specific, Deployment is general.
  // We'll let Admin Config win to solve the user's issue.
  if (!configFound) {
      const deployment = await DeploymentService.getActiveDeployment(modelId);
      if (deployment) {
        console.log("DEBUG: Found Deployment:", deployment.name);
        modelId = deployment.version;
        baseUrl = deployment.endpoint;
        // Deployment implies a certain provider usually, but we stick to current providerId unless we infer?
        // Typically deployment endpoints are OpenAI compatible
      }
  }

  // C. Provider-specific Defaults (Final Fallback)
  if (!baseUrl) {
    if (providerId === "ollama") {
      baseUrl = "http://localhost:11434/v1";
    } else if (providerId === "vllm") {
      baseUrl = "http://localhost:8000/v1";
    }
  }

  const config: AIModelConfig = {
    id: "temp",
    providerId: providerId,
    modelId: modelId,
    baseUrl: baseUrl,
    apiKey: apiKey
  };

  console.log("DEBUG: Constructed AI Config:", { ...config, apiKey: apiKey ? '***' : undefined });

  try {
    const languageModel = AIProviderFactory.createModel(config);

    // 1. Fetch enabled tools from DB
    const toolConfigs = await prisma.toolConfig.findMany({
      where: { isEnabled: true }
    });

    const activeTools: Record<string, any> = {};

    // 2. Map DB keys to actual tool definitions
    // This allows us to enable/disable them at runtime
    if (toolConfigs.some(t => t.key === "search_documents")) {
      activeTools["searchDocuments"] = searchDocumentsTool;
    }

    // Verify tool support: sending tools to models that don't support them (like some Ollama models) causes 400 errors.
    const supportsTools = providerId !== 'ollama'; 

    // Inject system prompt if provided
    const finalMessages = systemPrompt 
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      tools: supportsTools ? activeTools : undefined, // Only pass tools if supported
      onFinish: async ({ usage }) => {
        // Usage types might vary in recent SDK versions
        const { promptTokens = 0, completionTokens = 0 } = (usage as any) || {};
        
        // 2. CALCULATE EXACT COST
        const { estimatedCost } = await CostCalculator.calculate(config.modelId, promptTokens, completionTokens);

        // 3. TRACK BUDGET SPEND
        await CostCalculator.trackCost(userId, estimatedCost);

        try {
          await prisma.usageLog.create({
            data: {
              model: config.modelId,
              tokensIn: promptTokens,
              tokensOut: completionTokens,
              cost: estimatedCost, // Use precise cost
              type: "chat"
            }
          });
        } catch (e) {
          console.error("Failed to log usage", e);
        }
      }
    });

    // Return text stream response - useChat needs streamProtocol: 'text'
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
