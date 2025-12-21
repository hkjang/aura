"use client";

import { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Loader2, 
  Copy, 
  Download, 
  Sparkles,
  Check,
  Info,
  Settings,
  Cpu,
  FileSearch,
  X,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  keywords: string[];
  wordCount: number;
  originalLength: number;
  estimatedReadTime: number;
  modelUsed?: string;
  parsingMethod?: string;
}

type SummaryLength = "short" | "medium" | "detailed";

interface SystemInfo {
  aiModel: string;
  pdfParser: string;
  hasUpstageKey: boolean;
}

export default function SummarizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch system info
    fetch("/api/summarize/info")
      .then(res => res.json())
      .then(data => setSystemInfo(data))
      .catch(() => setSystemInfo({ aiModel: "알 수 없음", pdfParser: "기본", hasUpstageKey: false }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleSummarize = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("length", summaryLength);

      const response = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "요약 생성에 실패했습니다.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    const text = `${result.summary}\n\n핵심 포인트:\n${result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n키워드: ${result.keywords.join(", ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSummary = () => {
    if (!result) return;
    const text = `문서 요약\n${"=".repeat(50)}\n\n${result.summary}\n\n핵심 포인트:\n${result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n키워드: ${result.keywords.join(", ")}\n\n---\n원본 단어 수: ${result.wordCount}\n예상 읽기 시간: ${result.estimatedReadTime}분`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.[^.]+$/, "")}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ 
          fontSize: "28px", 
          fontWeight: 700, 
          color: "var(--text-primary)",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <FileText style={{ width: "28px", height: "28px", color: "#8b5cf6" }} />
          문서 요약
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
          PDF, DOCX, TXT, 이미지 파일을 업로드하면 AI가 핵심 내용을 요약해 드립니다.
        </p>
      </div>

      {/* System Info Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* AI Model Info */}
        <div style={{ 
          padding: "16px", 
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)",
          borderRadius: "12px",
          border: "1px solid rgba(139, 92, 246, 0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Cpu style={{ width: "18px", height: "18px", color: "#8b5cf6" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>요약 AI 모델</span>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            {systemInfo?.aiModel || "로딩 중..."}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            설정 → AI 모델에서 변경 가능
          </p>
        </div>

        {/* PDF Parser Info */}
        <div style={{ 
          padding: "16px", 
          background: systemInfo?.hasUpstageKey 
            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)"
            : "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 179, 8, 0.08) 100%)",
          borderRadius: "12px",
          border: systemInfo?.hasUpstageKey 
            ? "1px solid rgba(34, 197, 94, 0.2)"
            : "1px solid rgba(245, 158, 11, 0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <FileSearch style={{ width: "18px", height: "18px", color: systemInfo?.hasUpstageKey ? "#22c55e" : "#f59e0b" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>PDF/이미지 파싱</span>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            {systemInfo?.pdfParser || "로딩 중..."}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            {systemInfo?.hasUpstageKey ? "✓ Upstage OCR 활성화됨" : "설정 → 외부 서비스에서 Upstage 설정"}
          </p>
        </div>

        {/* How it works */}
        <div style={{ 
          padding: "16px", 
          background: "var(--bg-secondary)",
          borderRadius: "12px",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Info style={{ width: "18px", height: "18px", color: "#3b82f6" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>작동 방식</span>
          </div>
          <ol style={{ fontSize: "12px", color: "var(--text-secondary)", paddingLeft: "16px", margin: 0, lineHeight: 1.6 }}>
            <li>문서 업로드 → 텍스트 추출</li>
            <li>AI 모델이 내용 분석</li>
            <li>요약, 핵심 포인트, 키워드 생성</li>
          </ol>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Upload Area */}
          <div style={{ 
            padding: "24px", 
            background: "var(--bg-primary)",
            borderRadius: "16px",
            border: "1px solid var(--border-color)"
          }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload style={{ width: "18px", height: "18px", color: "#8b5cf6" }} />
              문서 업로드
            </h2>
            
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "12px",
                padding: "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: file ? "rgba(139, 92, 246, 0.05)" : "var(--bg-secondary)",
                transition: "all 0.2s ease"
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif,.bmp"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              
              {file ? (
                <div>
                  <FileText style={{ width: "48px", height: "48px", color: "#8b5cf6", margin: "0 auto 12px" }} />
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "15px" }}>{file.name}</p>
                  <p style={{ color: "var(--text-tertiary)", fontSize: "13px", marginTop: "4px" }}>{formatFileSize(file.size)}</p>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }} style={{ marginTop: "12px" }}>
                    <X style={{ width: "14px", height: "14px", marginRight: "4px" }} /> 파일 제거
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload style={{ width: "48px", height: "48px", color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
                  <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "15px" }}>클릭하거나 파일을 드래그하세요</p>
                  <p style={{ color: "var(--text-tertiary)", fontSize: "13px", marginTop: "4px" }}>PDF, DOCX, TXT, 이미지 (JPG, PNG)</p>
                </div>
              )}
            </div>

            {/* Length Options */}
            <div style={{ marginTop: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "10px" }}>
                요약 길이
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: "short", label: "간단", desc: "1-2문장" },
                  { value: "medium", label: "중간", desc: "3-5문장" },
                  { value: "detailed", label: "상세", desc: "전체 요약" }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSummaryLength(opt.value as SummaryLength)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      border: summaryLength === opt.value ? "2px solid #8b5cf6" : "1px solid var(--border-color)",
                      borderRadius: "10px",
                      background: summaryLength === opt.value ? "rgba(139, 92, 246, 0.1)" : "var(--bg-secondary)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>{opt.label}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSummarize} 
              disabled={!file || loading}
              style={{ width: "100%", marginTop: "20px", height: "48px", fontSize: "15px" }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: "18px", height: "18px", marginRight: "8px", animation: "spin 1s linear infinite" }} />
                  요약 생성 중...
                </>
              ) : (
                <>
                  <Sparkles style={{ width: "18px", height: "18px", marginRight: "8px" }} />
                  요약 생성
                </>
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ 
              padding: "16px", 
              background: "rgba(239, 68, 68, 0.1)", 
              borderRadius: "12px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444", flexShrink: 0 }} />
              <p style={{ color: "#ef4444", fontSize: "14px" }}>{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ 
              padding: "24px", 
              background: "var(--bg-primary)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles style={{ width: "18px", height: "18px", color: "#8b5cf6" }} />
                  요약 결과
                </h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check style={{ width: "14px", height: "14px" }} /> : <Copy style={{ width: "14px", height: "14px" }} />}
                    <span style={{ marginLeft: "6px" }}>{copied ? "복사됨" : "복사"}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadSummary}>
                    <Download style={{ width: "14px", height: "14px" }} />
                    <span style={{ marginLeft: "6px" }}>저장</span>
                  </Button>
                </div>
              </div>

              {/* Processing Info */}
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap",
                gap: "12px", 
                padding: "12px 16px", 
                background: "var(--bg-secondary)", 
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "12px",
                color: "var(--text-tertiary)"
              }}>
                {result.modelUsed && <span>🤖 모델: {result.modelUsed}</span>}
                {result.parsingMethod && <span>📄 파싱: {result.parsingMethod}</span>}
                <span>📖 원문: {result.originalLength?.toLocaleString() || result.wordCount?.toLocaleString()}자</span>
                <span>📝 요약: {result.summary?.length?.toLocaleString()}자</span>
                <span>⏱️ 읽기 {result.estimatedReadTime}분</span>
              </div>

              {/* Summary - Markdown */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>요약</h3>
                <div style={{ 
                  fontSize: "15px", 
                  lineHeight: 1.8, 
                  color: "var(--text-primary)",
                  padding: "16px",
                  background: "var(--bg-secondary)",
                  borderRadius: "10px"
                }} className="markdown-content">
                  <ReactMarkdown>{result.summary}</ReactMarkdown>
                </div>
              </div>

              {/* Key Points */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>핵심 포인트</h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {result.keyPoints.map((point, i) => (
                    <li key={i} style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "12px",
                      padding: "12px 16px",
                      background: "var(--bg-secondary)",
                      borderRadius: "10px"
                    }}>
                      <span style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "50%", 
                        background: "#8b5cf6",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        flexShrink: 0
                      }}>{i + 1}</span>
                      <span style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Keywords */}
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>키워드</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {result.keywords.map((keyword, i) => (
                    <span key={i} style={{ 
                      padding: "6px 14px", 
                      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#8b5cf6"
                    }}>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Settings Link */}
          <div style={{ 
            padding: "16px", 
            background: "var(--bg-primary)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings style={{ width: "16px", height: "16px" }} />
              설정 안내
            </h3>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <p style={{ marginBottom: "8px" }}><strong>AI 모델</strong>: 설정 → AI 모델 탭에서 요약에 사용할 모델을 선택하세요.</p>
              <p style={{ marginBottom: "8px" }}><strong>PDF 파싱</strong>: 설정 → 외부 서비스에서 Upstage API를 설정하면 이미지 PDF도 처리 가능합니다.</p>
              <a href="/dashboard/settings" style={{ color: "#8b5cf6", textDecoration: "none", fontWeight: 500 }}>
                설정으로 이동 →
              </a>
            </div>
          </div>

          {/* Supported Files */}
          <div style={{ 
            padding: "16px", 
            background: "var(--bg-primary)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>지원 파일 형식</h3>
            <ul style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <li><strong>📄 PDF</strong> - Upstage OCR (이미지 PDF 포함)</li>
              <li><strong>📝 DOCX</strong> - Microsoft Word</li>
              <li><strong>📃 TXT</strong> - 텍스트 파일</li>
              <li><strong>🖼️ 이미지</strong> - JPG, PNG (Upstage OCR)</li>
            </ul>
          </div>

          {/* Tips */}
          <div style={{ 
            padding: "16px", 
            background: "var(--bg-primary)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>💡 사용 팁</h3>
            <ul style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "16px" }}>
              <li>긴 문서는 &apos;상세&apos; 옵션을 권장합니다</li>
              <li>Upstage 설정 시 스캔 PDF도 지원됩니다</li>
              <li>요약 결과는 저장하거나 공유할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
