import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/admin/system-status/[service] - Update system status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { service } = await params;
    const body = await request.json();
    const { status, message } = body;

    const systemStatus = await prisma.systemStatus.update({
      where: { service },
      data: {
        status,
        message: message || null,
      },
    });

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error("Failed to update system status:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
