
import { prisma } from "@/lib/prisma";
import { ModelDeployment } from "@prisma/client";

export class DeploymentService {
  /**
   * Get the active deployment for a given model name (or service name)
   * Handles Canaries and Blue/Green splits.
   */
  static async getActiveDeployment(serviceName: string): Promise<ModelDeployment | null> {
    // 1. Fetch all active deployments for this service
    const deployments = await prisma.modelDeployment.findMany({
      where: { 
        name: serviceName,
        status: { in: ["ACTIVE", "DEPLOYING"] } 
      },
      orderBy: { createdAt: 'desc' }
    });

    if (deployments.length === 0) return null;

    // Simple routing logic:
    // If there's a canary (trafficSplit < 100), roll dice
    
    // Check for canary/partial rollout
    const canary = deployments.find(d => d.trafficSplit < 100 && d.trafficSplit > 0);
    if (canary) {
      const roll = Math.random() * 100;
      if (roll < canary.trafficSplit) {
        return canary;
      }
    }

    // Fallback to the main active one (trafficSplit 100 or just highest version)
    // Assuming the first one found that isn't the specialized canary, or the "main" one.
    // Ideally we flag one as "PRIMARY" vs "CANARY", but for now we assume 100% split is primary.
    const primary = deployments.find(d => d.trafficSplit === 100) || deployments[0];
    return primary;
  }

  /**
   * Deploy a new version.
   */
  static async deployModel(name: string, version: string, endpoint: string, strategy: string = "ROLLING") {
    return prisma.modelDeployment.create({
      data: {
        name,
        version,
        endpoint,
        strategy,
        status: "DEPLOYING",
        trafficSplit: 0 // Start with 0 traffic
      }
    });
  }

  /**
   * Promote a deployment to 100% traffic.
   */
  static async promoteDeployment(id: string) {
    // Transaction: Set this one to 100, set others to 0 or ARCHIVED
    return prisma.$transaction(async (tx) => {
        const target = await tx.modelDeployment.findUnique({ where: { id } });
        if (!target) throw new Error("Deployment not found");

        // Archive others
        await tx.modelDeployment.updateMany({
            where: { name: target.name, id: { not: id }, status: "ACTIVE" },
            data: { status: "ARCHIVED", trafficSplit: 0 }
        });

        // Activate target
        return tx.modelDeployment.update({
            where: { id },
            data: { status: "ACTIVE", trafficSplit: 100 }
        });
    });
  }

  /**
   * Rollback to specific deployment.
   */
  static async rollback(id: string) {
    return this.promoteDeployment(id); // Re-promoting is essentially a rollback in this simple model
  }
}
