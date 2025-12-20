
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// import { QualityEvaluator } from '@/lib/quality/evaluator';

const evalSchema = z.object({
  messageId: z.string(),
  content: z.string(),
  prompt: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messageId, content } = evalSchema.parse(body);

    // TODO: Integrate actual QualityEvaluator
    // const evaluator = new QualityEvaluator();
    // const result = await evaluator.evaluate(prompt || "", content);
    
    // Mock Result
    const mockResult = {
      scoreAccuracy: parseFloat((0.8 + Math.random() * 0.2).toFixed(2)),
      scoreRelevance: parseFloat((0.8 + Math.random() * 0.2).toFixed(2)),
      feedback: "Automated mock evaluation",
    };

    const evaluation = await prisma.responseEvaluation.create({
      data: {
        messageId,
        scoreAccuracy: mockResult.scoreAccuracy,
        scoreRelevance: mockResult.scoreRelevance,
        feedback: mockResult.feedback,
      },
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error running evaluation:', error);
    return NextResponse.json({ error: 'Failed to run evaluation' }, { status: 500 });
  }
}
