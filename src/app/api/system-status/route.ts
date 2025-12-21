import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/system-status - Get overall system status for users
export async function GET() {
  try {
    const statuses = await prisma.systemStatus.findMany();

    if (statuses.length === 0) {
      return NextResponse.json({ overall: "OPERATIONAL", services: [] });
    }

    // Determine overall status
    let overall: "OPERATIONAL" | "DEGRADED" | "OUTAGE" = "OPERATIONAL";
    
    if (statuses.some(s => s.status === "OUTAGE")) {
      overall = "OUTAGE";
    } else if (statuses.some(s => s.status === "DEGRADED")) {
      overall = "DEGRADED";
    }

    return NextResponse.json({
      overall,
      services: statuses.map(s => ({
        service: s.service,
        status: s.status,
        message: s.message,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch system status:", error);
    return NextResponse.json({ overall: "OPERATIONAL", services: [] });
  }
}
