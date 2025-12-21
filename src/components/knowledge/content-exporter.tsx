"use client";

import { useState, useCallback } from "react";
import { 
  Download, 
  FileText, 
  FileJson, 
  FileCode2,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportFormat = "markdown" | "json" | "html" | "txt";

interface ExportContent {
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface ContentExporterProps {
  content: ExportContent | ExportContent[];
  defaultFormat?: ExportFormat;
  filename?: string;
}

// 마크다운으로 변환
function toMarkdown(items: ExportContent[]): string {
  return items.map(item => {
    let md = `# ${item.title}\n\n`;
    md += item.content + "\n\n";
    if (item.metadata) {
      md += "---\n";
      md += "**Metadata:**\n";
      Object.entries(item.metadata).forEach(([key, value]) => {
        md += `- ${key}: ${JSON.stringify(value)}\n`;
      });
    }
    return md;
  }).join("\n---\n\n");
}

// JSON으로 변환
function toJSON(items: ExportContent[]): string {
  return JSON.stringify(items, null, 2);
}

// HTML로 변환
function toHTML(items: ExportContent[]): string {
  const body = items.map(item => `
    <article>
      <h1>${item.title}</h1>
      <div class="content">${item.content.replace(/\n/g, "<br>")}</div>
      ${item.metadata ? `
        <footer>
          <details>
            <summary>Metadata</summary>
            <pre>${JSON.stringify(item.metadata, null, 2)}</pre>
          </details>
        </footer>
      ` : ""}
    </article>
  `).join("<hr>");
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exported Content</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #333; }
    .content { line-height: 1.6; }
    footer { margin-top: 1rem; color: #666; }
    pre { background: #f5f5f5; padding: 1rem; overflow: auto; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

// 텍스트로 변환
function toText(items: ExportContent[]): string {
  return items.map(item => {
    let text = `=== ${item.title} ===\n\n`;
    text += item.content + "\n";
    return text;
  }).join("\n" + "=".repeat(50) + "\n\n");
}

const FORMAT_INFO: Record<ExportFormat, { label: string; icon: React.ReactNode; mime: string; ext: string }> = {
  markdown: { label: "Markdown", icon: <FileText size={16} />, mime: "text/markdown", ext: "md" },
  json: { label: "JSON", icon: <FileJson size={16} />, mime: "application/json", ext: "json" },
  html: { label: "HTML", icon: <FileCode2 size={16} />, mime: "text/html", ext: "html" },
  txt: { label: "Text", icon: <FileText size={16} />, mime: "text/plain", ext: "txt" }
};

export function ContentExporter({
  content,
  defaultFormat = "markdown",
  filename = "export"
}: ContentExporterProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const items = Array.isArray(content) ? content : [content];
  
  const getExportContent = useCallback((): string => {
    switch (format) {
      case "markdown":
        return toMarkdown(items);
      case "json":
        return toJSON(items);
      case "html":
        return toHTML(items);
      case "txt":
        return toText(items);
      default:
        return toMarkdown(items);
    }
  }, [format, items]);
  
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const exportContent = getExportContent();
      const info = FORMAT_INFO[format];
      
      const blob = new Blob([exportContent], { type: info.mime });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${info.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [format, getExportContent, filename]);
  
  const handleCopy = useCallback(async () => {
    const exportContent = getExportContent();
    await navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getExportContent]);
  
  return (
    <div className="content-exporter">
      <div className="exporter-header">
        <h4>
          <Download className="header-icon" />
          내보내기
        </h4>
      </div>
      
      <div className="exporter-content">
        <div className="format-selector">
          <label>형식 선택</label>
          <div className="format-options">
            {Object.entries(FORMAT_INFO).map(([key, info]) => (
              <button
                key={key}
                className={`format-option ${format === key ? "active" : ""}`}
                onClick={() => setFormat(key as ExportFormat)}
              >
                {info.icon}
                {info.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="export-info">
          <span>{items.length}개 항목</span>
          <span>·</span>
          <span>{FORMAT_INFO[format].ext.toUpperCase()} 파일</span>
        </div>
        
        <div className="preview-toggle">
          <button onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "미리보기 숨기기" : "미리보기"}
          </button>
        </div>
        
        {showPreview && (
          <div className="preview-content">
            <pre>{getExportContent().slice(0, 500)}{getExportContent().length > 500 ? "..." : ""}</pre>
          </div>
        )}
        
        <div className="export-actions">
          <Button variant="outline" onClick={handleCopy} disabled={isExporting}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "복사됨" : "클립보드에 복사"}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "내보내는 중..." : "파일로 저장"}
          </Button>
        </div>
      </div>
      
      <style jsx>{`
        .content-exporter {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .exporter-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-tertiary, #252536);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .exporter-header h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 18px;
          height: 18px;
          color: var(--primary, #7c3aed);
        }
        
        .exporter-content {
          padding: 16px;
        }
        
        .format-selector label {
          display: block;
          margin-bottom: 10px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .format-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .format-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .format-option:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .format-option.active {
          background: rgba(124, 58, 237, 0.1);
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .export-info {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .preview-toggle {
          margin-bottom: 12px;
        }
        
        .preview-toggle button {
          width: 100%;
          padding: 8px;
          background: transparent;
          border: 1px dashed var(--border-color, #3e3e5a);
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
          font-size: 12px;
          cursor: pointer;
        }
        
        .preview-toggle button:hover {
          border-color: var(--text-secondary, #a0a0b0);
          color: var(--text-secondary, #a0a0b0);
        }
        
        .preview-content {
          margin-bottom: 16px;
          padding: 12px;
          background: var(--bg-primary, #12121a);
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .preview-content pre {
          margin: 0;
          font-size: 11px;
          font-family: monospace;
          color: var(--text-secondary, #a0a0b0);
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .export-actions {
          display: flex;
          gap: 12px;
        }
        
        .export-actions :global(button) {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

export default ContentExporter;
