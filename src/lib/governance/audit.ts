
import { prisma } from "@/lib/prisma";

export class AuditService {
  /**
   * Log an action to the audit log.
   * This is fire-and-forget to avoid blocking the main request flow.
   */
  static async log(userId: string, action: string, resource: string, details?: any) {
    // If no userId, we can't log to user-relation. Just log to console or system user?
    if (!userId) {
        console.warn(`[Audit] No userId provided for action ${action}`);
        return;
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          details: details ? JSON.stringify(details) : undefined,
          ipAddress: "127.0.0.1" // Mock IP
        }
      });
    } catch (error) {
      console.error("[Audit] Failed to log action:", error);
    }
  }
}
