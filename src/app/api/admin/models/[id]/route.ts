import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/lib/governance/audit"; // Use the correct service
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.modelConfig.delete({
      where: { id }
    });
    
    await AuditService.log(session.user.id, "DELETE_MODEL_CONFIG", `model:${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    
    const model = await prisma.modelConfig.update({
      where: { id },
      data: {
        name: body.name,
        provider: body.provider,
        modelId: body.modelId,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        isActive: body.isActive ?? true,
      }
    });

    await AuditService.log(session.user.id, "UPDATE_MODEL_CONFIG", `model:${id}`);

    return NextResponse.json({ model });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}
