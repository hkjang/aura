import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/admin/governance/stats - Get governance statistics
export async function GET() {
  try {
    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get active policies count
    const activePolicies = await prisma.policy.count({
      where: { isActive: true }
    });

    const totalPolicies = await prisma.policy.count();

    // Get blocked/flagged counts from audit logs
    const [blockedToday, blockedWeek, flaggedToday, flaggedWeek] = await Promise.all([
      // Blocked today
      prisma.auditLog.count({
        where: {
          createdAt: { gte: today },
          OR: [
            { action: { contains: 'BLOCK' } },
            { details: { contains: '차단' } }
          ]
        }
      }),
      // Blocked this week
      prisma.auditLog.count({
        where: {
          createdAt: { gte: weekAgo },
          OR: [
            { action: { contains: 'BLOCK' } },
            { details: { contains: '차단' } }
          ]
        }
      }),
      // Flagged today
      prisma.auditLog.count({
        where: {
          createdAt: { gte: today },
          OR: [
            { action: { contains: 'FLAG' } },
            { details: { contains: '플래그' } }
          ]
        }
      }),
      // Flagged this week
      prisma.auditLog.count({
        where: {
          createdAt: { gte: weekAgo },
          OR: [
            { action: { contains: 'FLAG' } },
            { details: { contains: '플래그' } }
          ]
        }
      })
    ]);

    // Get usage logs for today
    const usageLogsToday = await prisma.usageLog.count({
      where: {
        createdAt: { gte: today }
      }
    });

    const usageLogsWeek = await prisma.usageLog.count({
      where: {
        createdAt: { gte: weekAgo }
      }
    });

    // Get policies by type
    const policiesByType = await prisma.policy.groupBy({
      by: ['type'],
      _count: { id: true },
      where: { isActive: true }
    });

    // Get policies by action
    const policiesByAction = await prisma.policy.groupBy({
      by: ['action'],
      _count: { id: true },
      where: { isActive: true }
    });

    return NextResponse.json({
      activePolicies,
      totalPolicies,
      blocked: {
        today: blockedToday,
        week: blockedWeek
      },
      flagged: {
        today: flaggedToday,
        week: flaggedWeek  
      },
      usage: {
        today: usageLogsToday,
        week: usageLogsWeek
      },
      policiesByType: policiesByType.map((p: { type: string; _count: { id: number } }) => ({ type: p.type, count: p._count.id })),
      policiesByAction: policiesByAction.map((p: { action: string; _count: { id: number } }) => ({ action: p.action, count: p._count.id }))
    });
  } catch (error) {
    console.error("Error fetching governance stats:", error);
    return NextResponse.json({
      activePolicies: 0,
      totalPolicies: 0,
      blocked: { today: 0, week: 0 },
      flagged: { today: 0, week: 0 },
      usage: { today: 0, week: 0 },
      policiesByType: [],
      policiesByAction: []
    });
  }
}

