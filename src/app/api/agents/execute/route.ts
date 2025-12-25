// API: Execute agent
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeAgent, getAgent } from "@/lib/agents/agent-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { agentId, input, provider, model, saveOnly, output: providedOutput, duration: providedDuration } = body;
    
    if (!agentId || !input?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, input" },
        { status: 400 }
      );
    }
    
    // Get agent
    const agent = await getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    
    // Check role requirement
    if (agent.requiredRole && session.user.role !== agent.requiredRole && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    
    // SaveOnly mode - just save the provided output to database (used after streaming)
    if (saveOnly && providedOutput) {
      const tokensIn = Math.ceil(input.length / 4);
      const tokensOut = Math.ceil(providedOutput.length / 4);
      
      const execution = await executeAgent({
        agentId: agent.id,
        userId: session.user.id,
        input,
        output: providedOutput,
        duration: providedDuration || 0,
        tokensIn,
        tokensOut,
        status: "SUCCESS"
      });
      
      return NextResponse.json({
        execution: {
          id: execution.id,
          agentId: execution.agentId,
          input: execution.input,
          output: execution.output,
          duration: execution.duration,
          status: execution.status,
          createdAt: execution.createdAt
        }
      });
    }
    
    const startTime = Date.now();
    
    // Call chat API internally with model config
    const chatResponse = await fetch(new URL("/api/chat", req.url).href, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": req.headers.get("cookie") || ""
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: agent.systemPrompt },
          { role: "user", content: input }
        ],
        provider: provider,  // Forward provider
        model: model         // Forward model
      })
    });
    
    const duration = Date.now() - startTime;
    
    let outputText = "";
    let status = "SUCCESS";
    let errorMessage: string | undefined;
    let tokensIn = 0;
    let tokensOut = 0;
    
    if (!chatResponse.ok) {
      // Try to parse error as JSON
      try {
        const errorData = await chatResponse.json();
        errorMessage = errorData.error || "Agent execution failed";
      } catch {
        errorMessage = await chatResponse.text() || "Agent execution failed";
      }
      status = "ERROR";
      outputText = errorMessage || "Agent execution failed";
    } else {
      // Chat API returns streaming text, read it as text
      const responseText = await chatResponse.text();
      
      // The response format includes content followed by ---USAGE--- and JSON
      const usageSeparator = "\n---USAGE---\n";
      const separatorIndex = responseText.indexOf(usageSeparator);
      
      if (separatorIndex !== -1) {
        outputText = responseText.substring(0, separatorIndex);
        try {
          const usageJson = responseText.substring(separatorIndex + usageSeparator.length);
          const usageData = JSON.parse(usageJson);
          tokensIn = usageData.tokensIn || 0;
          tokensOut = usageData.tokensOut || 0;
        } catch (e) {
          console.warn("Failed to parse usage data:", e);
        }
      } else {
        outputText = responseText;
      }
    }
    
    // Fallback token calculation if not provided
    if (tokensIn === 0) tokensIn = Math.ceil(input.length / 4);
    if (tokensOut === 0) tokensOut = Math.ceil(outputText.length / 4);
    
    // Record execution
    const execution = await executeAgent({
      agentId: agent.id,
      userId: session.user.id,
      input,
      output: outputText,
      duration,
      tokensIn,
      tokensOut,
      status,
      errorMessage
    });
    
    return NextResponse.json({
      execution: {
        id: execution.id,
        agentId: execution.agentId,
        input: execution.input,
        output: execution.output,
        duration: execution.duration,
        status: execution.status,
        createdAt: execution.createdAt
      }
    });
  } catch (error) {
    console.error("Error executing agent:", error);
    return NextResponse.json(
      { error: "Failed to execute agent" },
      { status: 500 }
    );
  }
}
