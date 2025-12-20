
import { streamText } from "ai";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma"; // If we want to load config from DB
import { searchDocumentsTool } from "@/lib/ai/tools/search";
import { CostCalculator } from "@/lib/cost/calculator"; 
import { PolicyEngine } from "@/lib/governance/policy-engine";
import { AuditService } from "@/lib/governance/audit";
import { DeploymentService } from "@/lib/mlops/deployment-service"; // NEW IMPORT

export async function POST(req: Request) {
  const { messages, provider, model } = await req.json();

  // MOCK USER ID for now (since we don't have auth headers passed easily in this demo)
  // In real app: const session = await auth(); const userId = session.user.id;
  const userId = "mock-user-id";

  // 0. CHECK GOVERNANCE POLICY
  // Check the last user message for policy violations
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
      const evaluation = await PolicyEngine.evaluate(lastMessage.content, userId);
      
      // Log the attempt
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

  // 2. RESOLVE MLOPS DEPLOYMENT (Routing)
  // Check if there is an active deployment for this model name
  const deployment = await DeploymentService.getActiveDeployment(model || "gpt-3.5-turbo");
  
  // Use deployment config if available, otherwise fallback to existing logic
  // In a real app, 'deployment.endpoint' would be the baseUrl
  const deploymentModelId = deployment ? deployment.version : (model || "gpt-3.5-turbo");
  const deploymentBaseUrl = deployment ? deployment.endpoint : (process.env.VLLM_URL || process.env.OLLAMA_URL);

  // In a real app, we would look up the full config from the DB based on 'model' ID
  // For this demo, we can iterate with a default config or partial override
  const config: AIModelConfig = {
    id: "temp",
    providerId: (provider as AIProviderId) || "openai",
    modelId: deploymentModelId,
    // baseUrl could come from env or request for testing
    baseUrl: deploymentBaseUrl
  };

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

    const result = streamText({
      model: languageModel,
      messages,
      tools: activeTools,
      onFinish: async ({ usage }) => {
        // @ts-ignore - Usage types might vary in recent SDK versions
        const { promptTokens = 0, completionTokens = 0 } = usage || {};
        
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

    // @ts-ignore
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
