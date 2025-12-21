import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/system-status - Get all system statuses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or initialize system statuses
    const existingStatuses = await prisma.systemStatus.findMany();

    // If no statuses exist, create defaults
    if (existingStatuses.length === 0) {
      const defaultServices = ["CHAT", "RAG", "EMBEDDING", "API"];
      
      for (const service of defaultServices) {
        await prisma.systemStatus.create({
          data: {
            service,
            status: "OPERATIONAL",
            message: null,
          },
        });
      }

      return NextResponse.json(await prisma.systemStatus.findMany());
    }

    return NextResponse.json(existingStatuses);
  } catch (error) {
    console.error("Failed to fetch system status:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
