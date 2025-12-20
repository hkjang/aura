import { prisma } from "@/lib/prisma";

export interface CostEstimate {
  estimatedCost: number;
  currency: string;
}

export class CostCalculator {
  /**
   * Calculate the cost based on token counts and model rates.
   */
  static async calculate(model: string, inputTokens: number, outputTokens: number): Promise<CostEstimate> {
    // 1. Fetch rate for the model
    const rate = await prisma.costRate.findUnique({
      where: { modelId: model },
    });

    const inputRate = rate?.inputPrice ?? 0.0015;  // Default fallback if no rate found
    const outputRate = rate?.outputPrice ?? 0.002; // Default fallback

    const cost = (inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate;

    return {
      estimatedCost: cost,
      currency: rate?.currency ?? "USD",
    };
  }

  /**
   * Check if a user has enough budget remaining.
   */
  static async checkBudget(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

    const budget = await prisma.budget.findFirst({
      where: {
        entityType: "USER",
        entityId: userId,
        period: period,
      },
    });

    if (!budget) {
      return { allowed: true, remaining: Infinity };
    }

    const remaining = budget.limit - budget.spent;
    return { allowed: remaining > 0, remaining };
  }

  /**
   * Update the spent amount for a user.
   */
  static async trackCost(userId: string, cost: number) {
    if (cost <= 0) return;

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`Tracking cost: ${cost} for user ${userId} in period ${period}`);

    // Update usage log regardless (usually already done in route, but let's be safe or just use this for budget)
    // Here we focus on BUDGET tracking.

    const budget = await prisma.budget.findFirst({
        where: { entityType: "USER", entityId: userId, period }
    });

    if (budget) {
        await prisma.budget.update({
            where: { id: budget.id },
            data: { spent: { increment: cost } }
        });
    }
  }
}
