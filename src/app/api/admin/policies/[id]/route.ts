import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET /api/admin/policies/[id] - Get single policy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const policy = await prisma.policy.findUnique({
      where: { id }
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Failed to fetch policy:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PUT /api/admin/policies/[id] - Update policy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, type, rules, action, isActive } = body;

    const policy = await prisma.policy.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(rules && { rules: JSON.stringify(rules) }),
        ...(action && { action }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_POLICY",
        resource: policy.id,
        details: JSON.stringify({ changes: body }),
      }
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Failed to update policy:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/admin/policies/[id] - Delete policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.policy.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_POLICY",
        resource: id,
        details: null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete policy:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
