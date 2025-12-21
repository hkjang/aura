import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface CostSummary {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  byModel: Record<string, { cost: number; tokens: number; requests: number }>;
  byDay: Record<string, number>;
  byType: Record<string, number>;
}

/**
 * GET /api/admin/cost-report
 * Query params:
 *   - period: YYYY-MM (e.g., 2024-12)
 *   - userId: optional user filter
 *   - department: optional department filter (future use)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || getCurrentPeriod();
    const userId = searchParams.get("userId");

    // Parse period to get date range
    const [year, month] = period.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Build query filter
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (userId) {
      whereClause.userId = userId;
    }

    // Fetch usage logs for the period
    const logs = await prisma.usageLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" }
    });

    // Aggregate data
    const summary: CostSummary = {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: logs.length,
      byModel: {},
      byDay: {},
      byType: {}
    };

    for (const log of logs) {
      summary.totalCost += log.cost;
      summary.totalTokens += log.tokensIn + log.tokensOut;

      // By model
      if (!summary.byModel[log.model]) {
        summary.byModel[log.model] = { cost: 0, tokens: 0, requests: 0 };
      }
      summary.byModel[log.model].cost += log.cost;
      summary.byModel[log.model].tokens += log.tokensIn + log.tokensOut;
      summary.byModel[log.model].requests += 1;

      // By day
      const dayKey = log.createdAt.toISOString().split("T")[0];
      summary.byDay[dayKey] = (summary.byDay[dayKey] || 0) + log.cost;

      // By type
      summary.byType[log.type] = (summary.byType[log.type] || 0) + log.cost;
    }

    // Fetch budget info
    const budgets = await prisma.budget.findMany({
      where: { period }
    });

    // Calculate daily trend
    const dailyTrend = Object.entries(summary.byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost }));

    // Top models by cost
    const topModels = Object.entries(summary.byModel)
      .sort(([, a], [, b]) => b.cost - a.cost)
      .slice(0, 5)
      .map(([model, data]) => ({ model, ...data }));

    return NextResponse.json({
      period,
      summary: {
        totalCost: Math.round(summary.totalCost * 10000) / 10000,
        totalTokens: summary.totalTokens,
        totalRequests: summary.totalRequests,
        averageCostPerRequest: summary.totalRequests > 0 
          ? Math.round((summary.totalCost / summary.totalRequests) * 10000) / 10000 
          : 0
      },
      breakdown: {
        byType: summary.byType,
        topModels
      },
      trends: {
        daily: dailyTrend
      },
      budgets: budgets.map(b => ({
        entityType: b.entityType,
        entityId: b.entityId,
        limit: b.limit,
        spent: b.spent,
        remaining: b.limit - b.spent,
        utilizationPercent: Math.round((b.spent / b.limit) * 100)
      }))
    });
  } catch (error) {
    console.error("Cost report error:", error);
    return NextResponse.json(
      { error: "Failed to generate cost report" },
      { status: 500 }
    );
  }
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
