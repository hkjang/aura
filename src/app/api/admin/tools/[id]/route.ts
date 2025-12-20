import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { isEnabled, config } = body;

    const tool = await prisma.toolConfig.update({
      where: { id },
      data: { isEnabled, config: config ? JSON.stringify(config) : undefined }
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_TOOL_CONFIG",
      resource: `tool:${tool.key}`,
      details: { isEnabled }
    });

    return NextResponse.json({ tool });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
  }
}
