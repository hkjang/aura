import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all evaluations
    const evaluations = await prisma.responseEvaluation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Get all feedback
    const feedbacks = await prisma.userFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Calculate aggregate stats
    const evalCount = evaluations.length;
    const avgAccuracy = evalCount > 0 
      ? evaluations.reduce((sum, e) => sum + (e.scoreAccuracy || 0), 0) / evalCount 
      : 0;
    const avgRelevance = evalCount > 0 
      ? evaluations.reduce((sum, e) => sum + (e.scoreRelevance || 0), 0) / evalCount 
      : 0;
    const avgStyle = evalCount > 0 
      ? evaluations.reduce((sum, e) => sum + (e.scoreStyle || 0), 0) / evalCount 
      : 0;

    // Calculate feedback stats
    const totalFeedback = feedbacks.length;
    const positiveFeedback = feedbacks.filter(f => f.rating > 0).length;
    const satisfactionRate = totalFeedback > 0 
      ? (positiveFeedback / totalFeedback * 5).toFixed(1) 
      : "0";

    // Get low quality responses (accuracy < 0.7)
    const lowQualityResponses = evaluations
      .filter(e => (e.scoreAccuracy || 0) < 0.7)
      .slice(0, 5);

    // Recent feedback with reasons
    const recentFeedback = feedbacks
      .filter(f => f.reason)
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        avgAccuracy: (avgAccuracy * 100).toFixed(1),
        avgRelevance: (avgRelevance * 100).toFixed(1),
        avgStyle: (avgStyle * 100).toFixed(1),
        satisfactionRate,
        totalFeedback,
        totalEvaluations: evalCount,
        positiveFeedback,
        negativeFeedback: totalFeedback - positiveFeedback
      },
      lowQualityResponses,
      recentFeedback
    });
  } catch (error) {
    console.error("Quality stats error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
