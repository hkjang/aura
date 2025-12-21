"use client";

import { DocumentSummarizer } from "@/components/documents/document-summarizer";
import { FileText, History, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SummarizePage() {
  return (
    <div style={{ padding: "24px" }}>
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
          <FileText className="w-7 h-7 text-violet-500" />
          문서 요약
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
          PDF, DOCX, TXT 문서를 업로드하면 AI가 핵심 내용을 요약해 드립니다.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" }}>
        {/* Main Content */}
        <DocumentSummarizer />

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                사용 팁
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul style={{ 
                listStyle: "disc", 
                paddingLeft: "16px", 
                fontSize: "13px", 
                color: "var(--text-secondary)",
                lineHeight: 1.8,
              }}>
                <li>긴 문서는 &apos;상세&apos; 옵션을 권장합니다</li>
                <li>이미지가 많은 PDF는 텍스트만 추출됩니다</li>
                <li>요약 결과는 저장하거나 공유할 수 있습니다</li>
              </ul>
            </CardContent>
          </Card>

          {/* Recent History Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" />
                최근 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ 
                fontSize: "13px", 
                color: "var(--text-tertiary)", 
                textAlign: "center",
                padding: "20px 0"
              }}>
                요약 히스토리가 없습니다
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
