import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const models = await prisma.modelConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const model = await prisma.modelConfig.create({
      data: {
        name: body.name,
        provider: body.provider,
        modelId: body.modelId,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        isActive: body.isActive ?? true,
      }
    });

    return NextResponse.json({ model });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create model" }, { status: 500 });
  }
}
