
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assumes alias setup, adjust if needed
import { z } from 'zod';

const feedbackSchema = z.object({
  messageId: z.string(),
  rating: z.number().int().min(-1).max(1), // 1 = Like, -1 = Dislike
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messageId, rating, reason } = feedbackSchema.parse(body);

    const feedback = await prisma.userFeedback.create({
      data: {
        messageId,
        userId: 'temp-user-id', // TODO: Get actual user ID from session
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
