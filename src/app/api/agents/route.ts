// API: GET/POST agents
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAgents, createAgent, seedDefaultAgents, getAgentStats } from "@/lib/agents/agent-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get("stats") === "true";
    
    // Seed defaults if empty (first run)
    const agents = await getAgents(userId);
    
    if (agents.length === 0) {
      await seedDefaultAgents();
      const seededAgents = await getAgents(userId);
      
      if (includeStats) {
        const stats = await getAgentStats();
        return NextResponse.json({ agents: seededAgents, stats });
      }
      return NextResponse.json({ agents: seededAgents });
    }
    
    if (includeStats) {
      const stats = await getAgentStats();
      return NextResponse.json({ agents, stats });
    }
    
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check admin role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const body = await req.json();
    
    if (!body.name || !body.slug || !body.description || !body.systemPrompt) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, description, systemPrompt" },
        { status: 400 }
      );
    }
    
    const agent = await createAgent({
      ...body,
      createdBy: session.user.id
    });
    
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
