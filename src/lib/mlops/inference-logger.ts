import { prisma } from "@/lib/prisma";

interface InferenceLog {
  id: string;
  timestamp: Date;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * InferenceLogger - Log and analyze AI model inference calls
 */
export class InferenceLogger {
  private static logs: InferenceLog[] = [];
  private static MAX_LOGS = 10000;

  /**
   * Log an inference call
   */
  static log(entry: Omit<InferenceLog, 'id' | 'timestamp'>): InferenceLog {
    const log: InferenceLog = {
      ...entry,
      id: `inf_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    this.logs.push(log);

    // Limit memory usage
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS / 2);
    }

    return log;
  }

  /**
   * Get inference statistics
   */
  static getStats(hours: number = 24): {
    totalCalls: number;
    successRate: number;
    avgLatency: number;
    totalTokens: number;
    byModel: Record<string, { calls: number; avgLatency: number }>;
  } {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const recentLogs = this.logs.filter(l => l.timestamp.getTime() > cutoff);

    const totalCalls = recentLogs.length;
    const successfulCalls = recentLogs.filter(l => l.success).length;
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100;
    const avgLatency = totalCalls > 0 
      ? recentLogs.reduce((acc, l) => acc + l.latencyMs, 0) / totalCalls 
      : 0;
    const totalTokens = recentLogs.reduce((acc, l) => acc + l.inputTokens + l.outputTokens, 0);

    // Group by model
    const byModel: Record<string, { calls: number; totalLatency: number }> = {};
    for (const log of recentLogs) {
      if (!byModel[log.model]) {
        byModel[log.model] = { calls: 0, totalLatency: 0 };
      }
      byModel[log.model].calls++;
      byModel[log.model].totalLatency += log.latencyMs;
    }

    const byModelStats = Object.fromEntries(
      Object.entries(byModel).map(([model, data]) => [
        model,
        { calls: data.calls, avgLatency: data.totalLatency / data.calls }
      ])
    );

    return { totalCalls, successRate, avgLatency, totalTokens, byModel: byModelStats };
  }

  /**
   * Get error analysis
   */
  static getErrors(limit: number = 50): InferenceLog[] {
    return this.logs
      .filter(l => !l.success)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get latency distribution
   */
  static getLatencyDistribution(): { bucket: string; count: number }[] {
    const buckets = [
      { max: 500, label: '< 500ms' },
      { max: 1000, label: '500ms - 1s' },
      { max: 2000, label: '1s - 2s' },
      { max: 5000, label: '2s - 5s' },
      { max: Infinity, label: '> 5s' },
    ];

    const distribution = buckets.map(b => ({ bucket: b.label, count: 0, max: b.max }));

    for (const log of this.logs) {
      for (const bucket of distribution) {
        if (log.latencyMs < bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    return distribution.map(({ bucket, count }) => ({ bucket, count }));
  }

  /**
   * Export logs for external analysis
   */
  static export(hours: number = 24): InferenceLog[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.logs.filter(l => l.timestamp.getTime() > cutoff);
  }
}
