import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIModelConfig, AIProviderId } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mammoth from "mammoth";

const DEFAULT_UPSTAGE_URL = "https://api.upstage.ai/v1/document-digitization";

// Get Upstage API key from DB or environment
async function getUpstageApiKey(): Promise<string | null> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'UPSTAGE_API_KEY' }
    });
    if (config?.value) return config.value;
  } catch (error) {
    console.warn("Failed to get UPSTAGE_API_KEY from DB:", error);
  }
  return process.env.UPSTAGE_API_KEY || null;
}

// Get Upstage API URL from DB or use default
async function getUpstageApiUrl(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'UPSTAGE_API_URL' }
    });
    if (config?.value) return config.value;
  } catch (error) {
    console.warn("Failed to get UPSTAGE_API_URL from DB:", error);
  }
  return DEFAULT_UPSTAGE_URL;
}

// Parse PDF using Upstage Document Parsing API
async function parseWithUpstage(file: File): Promise<string> {
  const upstageApiKey = await getUpstageApiKey();
  const upstageApiUrl = await getUpstageApiUrl();
  
  if (!upstageApiKey) {
    throw new Error("UPSTAGE_API_KEY가 설정되지 않았습니다. 설정 > 외부 서비스에서 설정해주세요.");
  }

  const formData = new FormData();
  formData.append("document", file);
  formData.append("output_formats", JSON.stringify(["text"]));
  formData.append("ocr", "auto");
  formData.append("model", "document-parse");

  // Upstage Document Parse API
  const response = await fetch(upstageApiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${upstageApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Upstage API error:", errorData);
    throw new Error(errorData.message || errorData.error?.message || `Upstage API 오류: ${response.status}`);
  }

  const result = await response.json();
  console.log("Upstage response keys:", Object.keys(result));
  
  // Extract text content from the response
  let extractedText = "";
  
  // Priority 1: content.markdown (most reliable for structured text)
  if (result.content?.markdown) {
    extractedText = result.content.markdown;
  }
  // Priority 2: content.text
  else if (result.content?.text && result.content.text.length > 0) {
    extractedText = result.content.text;
  }
  // Priority 3: elements array with markdown content
  else if (result.elements && Array.isArray(result.elements)) {
    const textParts = result.elements
      .filter((el: any) => el.content?.markdown || el.content?.text)
      .map((el: any) => el.content?.markdown || el.content?.text);
    if (textParts.length > 0) {
      extractedText = textParts.join("\n\n");
    }
  }
  // Priority 4: text field directly
  else if (result.text) {
    extractedText = result.text;
  }

  if (!extractedText || extractedText.trim().length < 10) {
    console.error("No text extracted from Upstage response:", JSON.stringify(result).substring(0, 1000));
    throw new Error("Upstage에서 텍스트를 추출할 수 없습니다.");
  }

  return extractedText.trim();
}

// Parse uploaded file content
async function parseFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // DOCX files - use mammoth
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // PDF files - use Upstage Document Parsing
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    // Check if Upstage API key is available
    const upstageKey = await getUpstageApiKey();
    if (upstageKey) {
      try {
        return await parseWithUpstage(file);
      } catch (error) {
        console.error("Upstage parsing failed, falling back to basic extraction:", error);
        // Fall through to basic extraction
      }
    }

    // Basic text extraction fallback for text-based PDFs
    try {
      const text = buffer.toString("latin1");
      const textMatches: string[] = [];
      const regex = /\(([^)]+)\)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const extracted = match[1];
        if (/^[\x20-\x7E가-힣ㄱ-ㅎㅏ-ㅣ\s.,!?:;'"()-]+$/.test(extracted) && extracted.length > 2) {
          textMatches.push(extracted);
        }
      }
      
      if (textMatches.length > 10) {
        return textMatches.join(" ");
      }
      
      throw new Error("simple-extraction-failed");
    } catch {
      const upstageHint = process.env.UPSTAGE_API_KEY 
        ? "" 
        : " UPSTAGE_API_KEY를 설정하면 이미지 PDF도 지원됩니다.";
      return Promise.reject(new Error(`PDF 파일에서 텍스트를 추출할 수 없습니다.${upstageHint}`));
    }
  }

  // Image files - use Upstage for OCR
  if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp|tiff?)$/i.test(file.name)) {
    if (process.env.UPSTAGE_API_KEY) {
      return await parseWithUpstage(file);
    }
    throw new Error("이미지 OCR을 위해 UPSTAGE_API_KEY 설정이 필요합니다.");
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
    let modelConfig = null;

    // Check if there's a specific summarize model configured
    try {
      const summarizeModelConfig = await prisma.systemConfig.findUnique({
        where: { key: 'SUMMARIZE_MODEL_ID' }
      });
      
      if (summarizeModelConfig?.value) {
        // Get the specific model by ID
        modelConfig = await prisma.modelConfig.findUnique({
          where: { id: summarizeModelConfig.value }
        });
      }
    } catch {
      // Fall through to default model selection
    }

    // If no specific model, get the default active model
    if (!modelConfig) {
      modelConfig = await prisma.modelConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    }

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

    // Get custom prompt from settings or use default
    let systemPrompt = `당신은 전문 문서 요약 AI입니다. 한국어로 응답하세요.
사용자가 제공한 문서를 분석하고 다음 JSON 형식으로만 응답하세요:

{
  "summary": "문서 전체 요약",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}

요약은 {LENGTH_INSTRUCTION} 하세요.
핵심 포인트는 3-5개로 제한하세요.
키워드는 문서의 주요 주제를 나타내는 5개 이내의 단어로 제한하세요.`;

    try {
      const promptConfig = await prisma.systemConfig.findUnique({
        where: { key: 'SUMMARIZE_PROMPT' }
      });
      if (promptConfig?.value) {
        systemPrompt = promptConfig.value;
      }
    } catch {
      // Use default prompt
    }

    // Replace length instruction placeholder
    systemPrompt = systemPrompt.replace('{LENGTH_INSTRUCTION}', getLengthInstruction(length));

    // Generate summary using AI
    const { text: summaryResponse } = await generateText({
      model: languageModel,
      system: systemPrompt,
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

    // Determine parsing method used
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    let parsingMethod = "텍스트 추출";
    if (isPdf || isImage) {
      const upstageKey = await getUpstageApiKey();
      parsingMethod = upstageKey ? "Upstage OCR" : "기본 PDF 파서";
    } else if (file.name.endsWith(".docx")) {
      parsingMethod = "DOCX 파서";
    }

    const modelUsedText = modelConfig ? `${modelConfig.name} (${modelConfig.provider})` : `${modelId} (${providerId})`;

    // Save to history
    try {
      const session = await getServerSession(authOptions);
      await prisma.summaryHistory.create({
        data: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "unknown",
          originalLength: content.length,
          summaryLength: parsed.summary?.length || 0,
          summary: parsed.summary || "",
          keyPoints: JSON.stringify(parsed.keyPoints || []),
          keywords: JSON.stringify(parsed.keywords || []),
          modelUsed: modelUsedText,
          parsingMethod,
          userId: session?.user?.id || null,
        }
      });
    } catch (historyError) {
      console.warn("Failed to save summary history:", historyError);
    }

    return NextResponse.json({
      summary: parsed.summary,
      keyPoints: parsed.keyPoints || [],
      keywords: parsed.keywords || [],
      wordCount,
      originalLength: content.length,
      estimatedReadTime,
      modelUsed: modelUsedText,
      parsingMethod
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
