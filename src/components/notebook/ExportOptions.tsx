"use client";

import { useState } from "react";
import { Download, FileJson, FileText, FileType } from "lucide-react";

interface ExportOptionsProps {
  messages: Array<{ role: string; content: string; timestamp?: Date }>;
  title?: string;
}

export function ExportOptions({ messages, title = "대화" }: ExportOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportAsJSON = () => {
    const data = {
      title,
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    };
    downloadFile(JSON.stringify(data, null, 2), `${title}.json`, "application/json");
  };

  const exportAsMarkdown = () => {
    let md = `# ${title}\n\n`;
    md += `> 내보낸 날짜: ${new Date().toLocaleString("ko-KR")}\n\n---\n\n`;
    messages.forEach((m) => {
      md += `### ${m.role === "user" ? "👤 사용자" : "🤖 AI"}\n\n`;
      md += `${m.content}\n\n---\n\n`;
    });
    downloadFile(md, `${title}.md`, "text/markdown");
  };

  const exportAsText = () => {
    let txt = `${title}\n${"=".repeat(title.length)}\n\n`;
    txt += `내보낸 날짜: ${new Date().toLocaleString("ko-KR")}\n\n`;
    messages.forEach((m) => {
      txt += `[${m.role === "user" ? "사용자" : "AI"}]\n`;
      txt += `${m.content}\n\n`;
    });
    downloadFile(txt, `${title}.txt`, "text/plain");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const options = [
    { label: "JSON", icon: FileJson, action: exportAsJSON, description: "구조화된 데이터" },
    { label: "Markdown", icon: FileType, action: exportAsMarkdown, description: "문서 형식" },
    { label: "텍스트", icon: FileText, action: exportAsText, description: "일반 텍스트" },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          cursor: "pointer",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        <Download style={{ width: "14px", height: "14px" }} />
        내보내기
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: "4px",
            padding: "8px",
            borderRadius: "12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            minWidth: "180px",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 12px",
                border: "none",
                borderRadius: "8px",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <opt.icon style={{ width: "16px", height: "16px", color: "var(--color-primary)" }} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>{opt.label}</div>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
