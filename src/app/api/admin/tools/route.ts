import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tools = await prisma.toolConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ tools });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
