import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/threads/[id]/messages - Save message to thread
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, content } = await request.json();

    const message = await prisma.chatMessage.create({
      data: {
        chatId: id,
        role,
        content
      }
    });

    // Update thread's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Auto-update title if it's the first user message
    const thread = await prisma.chatSession.findUnique({
      where: { id },
      include: { messages: true }
    });
    
    if (thread && thread.title === "새 대화" && role === "user") {
      const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await prisma.chatSession.update({
        where: { id },
        data: { title: newTitle }
      });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Failed to save message:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
