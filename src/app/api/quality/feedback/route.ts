import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const feedbackSchema = z.object({
  messageId: z.string(),
  rating: z.number().int().min(-1).max(1), // 1 = Like, -1 = Dislike
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get user ID from session or fallback to finding an admin
    let userId = session?.user?.id;
    if (!userId) {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      userId = adminUser?.id || 'anonymous';
    }

    const body = await req.json();
    const { messageId, rating, reason } = feedbackSchema.parse(body);

    const feedback = await prisma.userFeedback.create({
      data: {
        messageId,
        userId,
        rating,
        reason,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
