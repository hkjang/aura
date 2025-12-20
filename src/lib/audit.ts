import { prisma } from "@/lib/prisma";

export async function logAudit({
  userId,
  action,
  resource,
  details,
  ipAddress
}: {
  userId: string;
  action: string;
  resource: string;
  details?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ipAddress
      }
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw, we don't want to break the main flow if logging fails
  }
}
