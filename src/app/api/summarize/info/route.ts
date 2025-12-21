import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/summarize/info - Get summarization system info
export async function GET() {
  try {
    // Get active model
    let aiModel = "기본 (GPT-4o-mini)";
    const modelConfig = await prisma.modelConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    
    if (modelConfig) {
      aiModel = `${modelConfig.name} (${modelConfig.provider})`;
    }

    // Check Upstage key
    let hasUpstageKey = false;
    let pdfParser = "기본 (텍스트 PDF만)";
    
    try {
      const upstageConfig = await prisma.systemConfig.findUnique({
        where: { key: 'UPSTAGE_API_KEY' }
      });
      if (upstageConfig?.value) {
        hasUpstageKey = true;
        pdfParser = "Upstage Document AI (OCR 지원)";
      }
    } catch {
      // SystemConfig might not exist
    }

    // Check environment variable as fallback
    if (!hasUpstageKey && process.env.UPSTAGE_API_KEY) {
      hasUpstageKey = true;
      pdfParser = "Upstage Document AI (환경변수)";
    }

    return NextResponse.json({
      aiModel,
      pdfParser,
      hasUpstageKey
    });
  } catch (error) {
    console.error("Error fetching summarize info:", error);
    return NextResponse.json({
      aiModel: "알 수 없음",
      pdfParser: "기본",
      hasUpstageKey: false
    });
  }
}
