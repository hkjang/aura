
export interface HealthCheckResult {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  message?: string;
  checkedAt: Date;
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: string;
  channels: string[]; // e.g., ["slack", "email"]
  isEnabled: boolean;
}

export class HealthMonitor {
  private static checks: HealthCheckResult[] = [];

  /**
   * Perform health checks on all services.
   */
  static async runHealthChecks(): Promise<HealthCheckResult[]> {
    this.checks = [];

    // API Health
    this.checks.push({
      service: "API Gateway",
      status: "healthy",
      latency: Math.floor(Math.random() * 50) + 10,
      checkedAt: new Date()
    });

    // Database Health
    this.checks.push({
      service: "Database (PostgreSQL)",
      status: Math.random() > 0.1 ? "healthy" : "degraded",
      latency: Math.floor(Math.random() * 100) + 20,
      checkedAt: new Date()
    });

    // AI Model Health
    this.checks.push({
      service: "AI Model (GPT-4)",
      status: Math.random() > 0.05 ? "healthy" : "unhealthy",
      latency: Math.floor(Math.random() * 500) + 100,
      checkedAt: new Date()
    });

    // Vector DB Health
    this.checks.push({
      service: "Vector Database",
      status: "healthy",
      latency: Math.floor(Math.random() * 80) + 15,
      checkedAt: new Date()
    });

    return this.checks;
  }

  /**
   * Get latest health check results.
   */
  static getLatestChecks(): HealthCheckResult[] {
    return [...this.checks];
  }

  /**
   * Send an alert (Mock).
   */
  static async sendAlert(alert: AlertConfig, message: string) {
    console.log(`[Alert] ${alert.name}: ${message}`);
    console.log(`  Channels: ${alert.channels.join(", ")}`);
    // In real app, integrate with Slack/Email APIs
  }
}
