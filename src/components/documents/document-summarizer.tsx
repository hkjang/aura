"use client";

import { useState, useRef } from "react";
import { 
  FileText, 
  Upload, 
  Loader2, 
  Copy, 
  Download, 
  Sparkles,
  FileType,
  ListTree,
  Hash,
  Clock,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  keywords: string[];
  wordCount: number;
  estimatedReadTime: number;
}

type SummaryLength = "short" | "medium" | "detailed";

const summaryLengthOptions: { value: SummaryLength; label: string; description: string }[] = [
  { value: "short", label: "간단", description: "1-2 문장" },
  { value: "medium", label: "중간", description: "3-5 문장" },
  { value: "detailed", label: "상세", description: "전체 요약" },
];

export function DocumentSummarizer() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
      ];
      if (validTypes.includes(droppedFile.type) || droppedFile.name.endsWith('.txt') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(droppedFile.name)) {
        setFile(droppedFile);
        setResult(null);
        setError(null);
      } else {
        setError("PDF, DOCX, TXT 파일만 지원됩니다.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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

      if (!response.ok) {
        throw new Error(data.error || "요약 생성에 실패했습니다.");
      }

      setResult(data);
    } catch (err) {
      console.error("Summarize error:", err);
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

  const getFileIcon = () => {
    if (!file) return <FileText className="w-12 h-12 text-slate-400" />;
    if (file.type === "application/pdf") return <FileType className="w-12 h-12 text-red-500" />;
    if (file.type.includes("word")) return <FileType className="w-12 h-12 text-blue-500" />;
    return <FileText className="w-12 h-12 text-slate-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-violet-500" />
            문서 업로드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--border-color)",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 200ms ease",
              background: file ? "var(--bg-secondary)" : "transparent",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif,.bmp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {getFileIcon()}
            {file ? (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{file.name}</p>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  PDF, DOCX, TXT 지원
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Length Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="w-5 h-5 text-blue-500" />
            요약 길이
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", gap: "12px" }}>
            {summaryLengthOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSummaryLength(option.value)}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: "10px",
                  border: `2px solid ${summaryLength === option.value ? "var(--color-primary)" : "var(--border-color)"}`,
                  background: summaryLength === option.value ? "rgba(124, 58, 237, 0.1)" : "transparent",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 150ms ease",
                }}
              >
                <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{option.label}</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{option.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button
        onClick={handleSummarize}
        disabled={!file || loading}
        style={{ width: "100%", height: "48px" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            요약 생성 중...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            AI 요약 생성
          </>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: "16px",
          background: "rgba(239, 68, 68, 0.1)",
          borderRadius: "10px",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                요약 결과
              </CardTitle>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSummary}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>요약</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{result.summary}</p>
            </div>

            {/* Key Points */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>핵심 포인트</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {result.keyPoints.map((point, index) => (
                  <li 
                    key={index} 
                    style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "8px",
                      marginBottom: "8px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span style={{
                      background: "var(--color-primary)",
                      color: "white",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keywords */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Hash className="w-4 h-4" />
                키워드
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {result.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    style={{
                      padding: "4px 12px",
                      background: "var(--bg-tertiary)",
                      borderRadius: "16px",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ 
              display: "flex", 
              gap: "24px", 
              paddingTop: "16px", 
              borderTop: "1px solid var(--border-color)",
              color: "var(--text-tertiary)",
              fontSize: "13px",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText className="w-4 h-4" />
                원본 {result.wordCount.toLocaleString()} 단어
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock className="w-4 h-4" />
                읽기 시간 약 {result.estimatedReadTime}분
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
