import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prompts = await prisma.promptTemplate.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isPublic: true }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });
    return NextResponse.json({ prompts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const prompt = await prisma.promptTemplate.create({
      data: {
        title: body.title,
        content: body.content,
        description: body.description,
        isPublic: body.isPublic && session.user.role === 'ADMIN', // Only admins can make public
        userId: session.user.id,
      }
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
