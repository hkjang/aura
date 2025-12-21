import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET /api/admin/policies - Get all policies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Failed to fetch policies:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/admin/policies - Create a new policy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, rules, action, isActive } = body;

    if (!name || !type || !action) {
      return NextResponse.json({ error: "Name, type, and action are required" }, { status: 400 });
    }

    const policy = await prisma.policy.create({
      data: {
        name,
        description: description || null,
        type,
        rules: JSON.stringify(rules || []),
        action,
        isActive: isActive ?? true,
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_POLICY",
        resource: policy.id,
        details: JSON.stringify({ name, type, action }),
      }
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Failed to create policy:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
