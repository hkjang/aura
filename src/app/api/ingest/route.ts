import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const DEFAULT_UPSTAGE_URL = "https://api.upstage.ai/v1/document-digitization";

// Get Upstage API key from DB or environment
async function getUpstageApiKey(): Promise<string | null> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'UPSTAGE_API_KEY' }
    });
    if (config?.value) return config.value;
  } catch (error) {
    console.warn("Failed to get Upstage API key from DB:", error);
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
    console.warn("Failed to get Upstage API URL from DB:", error);
  }
  return DEFAULT_UPSTAGE_URL;
}

// Parse file using Upstage Document AI
async function parseWithUpstage(file: File, apiKey: string, apiUrl: string): Promise<string> {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("output_formats", JSON.stringify(["text"]));
  formData.append("ocr", "auto");
  formData.append("model", "document-parse");

  // Upstage Document Parse API
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`
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

// Simple text file parser (fallback)
async function parseTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    let content: string;
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || 
                    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);

    // PDF and images - use Upstage if available
    if (isPdf || isImage) {
      const upstageKey = await getUpstageApiKey();
      const upstageUrl = await getUpstageApiUrl();
      
      if (upstageKey) {
        try {
          content = await parseWithUpstage(file, upstageKey, upstageUrl);
        } catch (error) {
          console.error("Upstage parsing failed:", error);
          return NextResponse.json({ 
            error: `Upstage 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({ 
          error: "PDF/이미지 처리를 위해 Upstage API 키가 필요합니다. 설정에서 API 키를 등록해주세요." 
        }, { status: 400 });
      }
    } else {
      // Text files - direct parsing
      content = await parseTextFile(file);
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ 
        error: "파일에서 충분한 텍스트를 추출할 수 없습니다." 
      }, { status: 400 });
    }

    // Setup metadata
    const metadata = {
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      parsedWith: (isPdf || isImage) ? "upstage" : "text",
    };

    // Store in DB
    const doc = await prisma.document.create({
      data: {
        title: file.name,
        content: content,
        metadata: JSON.stringify(metadata),
      }
    });

    return NextResponse.json({ 
      success: true, 
      doc,
      message: `${file.name} 업로드 완료 (${(content.length / 1024).toFixed(1)} KB 추출)`
    });
  } catch (error) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "문서 처리에 실패했습니다." 
    }, { status: 500 });
  }
}
