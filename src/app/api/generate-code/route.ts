import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";

// Language-specific system prompts
function getSystemPrompt(
  language: string,
  framework: string | null,
  includeComments: boolean,
  includeTests: boolean
): string {
  const frameworkText = framework ? ` ${framework} 프레임워크를 사용하여` : "";
  const commentText = includeComments ? "상세한 주석을 포함하고" : "주석 없이";
  const testText = includeTests ? "테스트 코드도 함께 작성하세요." : "";

  return `당신은 전문 소프트웨어 개발자입니다. ${language} 언어로${frameworkText} 코드를 작성합니다.
${commentText} 클린 코드 원칙을 따라 작성하세요. ${testText}

다음 JSON 형식으로만 응답하세요:
{
  "code": "생성된 코드 (이스케이프된 문자열)",
  "explanation": "코드에 대한 간략한 설명 (무엇을 하는지, 주요 부분 설명)"
}

코드 품질 기준:
- 명확한 변수/함수 이름 사용
- 에러 처리 포함
- 모범 사례(best practices) 적용
- 필요시 타입 힌트 사용`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, language, framework, includeComments, includeTests } = body;

    if (!prompt || !language) {
      return NextResponse.json(
        { error: "프롬프트와 언어 선택은 필수입니다." },
        { status: 400 }
      );
    }

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
    const systemPrompt = getSystemPrompt(language, framework, includeComments, includeTests);

    // Generate code using AI
    const { text: codeResponse } = await generateText({
      model: languageModel,
      system: systemPrompt,
      prompt: `다음 요청에 맞는 ${language} 코드를 작성해주세요:\n\n${prompt}`,
    });

    // Parse the JSON response
    let parsed;
    try {
      const jsonMatch = codeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON not found");
      }
    } catch {
      // If JSON parsing fails, treat the entire response as code
      parsed = {
        code: codeResponse,
        explanation: null,
      };
    }

    return NextResponse.json({
      code: parsed.code || codeResponse,
      explanation: parsed.explanation || null,
      language,
    });
  } catch (error) {
    console.error("Code generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "코드 생성 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
