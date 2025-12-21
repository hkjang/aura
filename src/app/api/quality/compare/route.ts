import { NextRequest, NextResponse } from "next/server";
import { ModelComparison } from "@/lib/quality/model-comparison";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * POST /api/quality/compare
 * Compare the same query across multiple models
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, models } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Get available models from DB if not specified
    let modelsToCompare = models;
    if (!modelsToCompare || modelsToCompare.length === 0) {
      const dbModels = await prisma.modelConfig.findMany({
        where: { isActive: true },
        take: 3,
        select: { modelId: true, provider: true }
      });

      modelsToCompare = dbModels.length > 0 
        ? dbModels.map(m => ({ modelId: m.modelId, provider: m.provider }))
        : [
            { modelId: "gpt-4", provider: "openai" },
            { modelId: "gpt-3.5-turbo", provider: "openai" },
          ];
    }

    // Run comparison
    const results = await ModelComparison.compareModels(query, modelsToCompare);

    // Sort by score
    const ranked = results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Calculate aggregate stats
    const avgLatency = results.reduce((acc, r) => acc + r.latency, 0) / results.length;
    const avgScore = results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length;

    return NextResponse.json({
      query,
      results: ranked,
      stats: {
        modelCount: results.length,
        avgLatency: Math.round(avgLatency),
        avgScore: Math.round(avgScore * 10) / 10,
        bestModel: ranked[0]?.model || null
      }
    });
  } catch (error) {
    console.error("Model comparison error:", error);
    return NextResponse.json(
      { error: "Failed to compare models" },
      { status: 500 }
    );
  }
}
