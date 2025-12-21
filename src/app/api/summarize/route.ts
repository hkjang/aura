import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";

// Parse uploaded file content
async function parseFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // DOCX files
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // PDF files - currently not fully supported in edge runtime
  // For PDF support, recommend using a separate service or uploading text/docx
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    // Try to extract text from PDF using simple heuristics
    // This is a basic fallback for simple PDFs
    try {
      const text = buffer.toString("latin1");
      
      // Try to find text between parentheses (PDF text objects)
      const textMatches: string[] = [];
      const regex = /\(([^)]+)\)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const extracted = match[1];
        // Filter out binary/control characters, keep readable text
        if (/^[\x20-\x7E가-힣ㄱ-ㅎㅏ-ㅣ\s.,!?:;'"()-]+$/.test(extracted) && extracted.length > 2) {
          textMatches.push(extracted);
        }
      }
      
      if (textMatches.length > 10) {
        return textMatches.join(" ");
      }
      
      throw new Error("simple-extraction-failed");
    } catch {
      return Promise.reject(new Error("PDF 파일에서 텍스트를 추출할 수 없습니다. TXT 또는 DOCX 파일을 사용해주세요."));
    }
  }

  // Plain text
  return buffer.toString("utf-8");
}

// Get summary length instruction
function getLengthInstruction(length: string): string {
  switch (length) {
    case "short":
      return "1-2문장으로 매우 간략하게";
    case "detailed":
      return "주요 섹션별로 상세하게 (최대 500단어)";
    default:
      return "3-5문장으로 핵심만";
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const length = (formData.get("length") as string) || "medium";

    if (!file) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    // Parse file content
    let content: string;
    try {
      content = await parseFile(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "파일을 읽을 수 없습니다.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    if (!content || content.trim().length < 50) {
      return NextResponse.json({ error: "문서에서 충분한 텍스트를 추출할 수 없습니다." }, { status: 400 });
    }

    // Calculate word count (rough estimate)
    const wordCount = content.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200);

    // Get model configuration from database or use defaults
    let providerId: AIProviderId = "openai";
    let modelId = "gpt-4o-mini";
    let baseUrl: string | undefined = process.env.OPENAI_BASE_URL;
    let apiKey: string | undefined = process.env.OPENAI_API_KEY;

    // Try to get active model from DB
    const modelConfig = await prisma.modelConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (modelConfig) {
      providerId = (modelConfig.provider as AIProviderId) || providerId;
      modelId = modelConfig.modelId || modelId;
      baseUrl = modelConfig.baseUrl || baseUrl;
      apiKey = modelConfig.apiKey || apiKey;
    }

    // Fallback for local providers
    if (!baseUrl) {
      if (providerId === "ollama") {
        baseUrl = "http://localhost:11434/v1";
      } else if (providerId === "vllm") {
        baseUrl = "http://localhost:8000/v1";
      }
    }

    const config: AIModelConfig = {
      id: "temp",
      providerId,
      modelId,
      baseUrl,
      apiKey,
    };

    const languageModel = AIProviderFactory.createModel(config);

    // Generate summary using AI
    const { text: summaryResponse } = await generateText({
      model: languageModel,
      system: `당신은 전문 문서 요약 AI입니다. 한국어로 응답하세요.
사용자가 제공한 문서를 분석하고 다음 JSON 형식으로만 응답하세요:

{
  "summary": "문서 전체 요약",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}

요약 길이: ${getLengthInstruction(length)}
핵심 포인트: 3-5개
키워드: 5-7개`,
      prompt: `다음 문서를 요약해주세요:\n\n${content.substring(0, 15000)}`,
    });

    // Parse the JSON response
    let parsed;
    try {
      const jsonMatch = summaryResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON not found in response");
      }
    } catch {
      parsed = {
        summary: summaryResponse,
        keyPoints: ["요약에서 핵심 포인트를 추출할 수 없습니다."],
        keywords: ["문서", "요약"],
      };
    }

    return NextResponse.json({
      summary: parsed.summary,
      keyPoints: parsed.keyPoints || [],
      keywords: parsed.keywords || [],
      wordCount,
      estimatedReadTime,
    });
  } catch (error) {
    console.error("Summarization error:", error);
    const errorMessage = error instanceof Error ? error.message : "요약 생성 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
