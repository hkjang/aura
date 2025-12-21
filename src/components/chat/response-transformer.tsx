"use client";

import { useState, useMemo } from "react";
import { FileText, Table, Code, Copy, Check, ChevronDown } from "lucide-react";

interface ResponseTransformerProps {
  content: string;
  onTransform?: (transformedContent: string, formatType: string) => void;
}

type TransformType = "summary" | "table" | "json" | "bullets" | "code";

interface TransformOption {
  id: TransformType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TRANSFORM_OPTIONS: TransformOption[] = [
  {
    id: "summary",
    label: "요약",
    icon: <FileText size={16} />,
    description: "핵심 내용 요약"
  },
  {
    id: "table",
    label: "표",
    icon: <Table size={16} />,
    description: "표 형식으로 변환"
  },
  {
    id: "json",
    label: "JSON",
    icon: <Code size={16} />,
    description: "JSON 구조로 변환"
  },
  {
    id: "bullets",
    label: "목록",
    icon: <FileText size={16} />,
    description: "글머리 기호 목록"
  },
  {
    id: "code",
    label: "코드",
    icon: <Code size={16} />,
    description: "코드 블록 추출"
  }
];

// 간단한 변환 함수들 (실제로는 AI API 호출로 대체 가능)
const transformContent = (content: string, type: TransformType): string => {
  switch (type) {
    case "summary": {
      // 단순 요약: 첫 3문장 추출
      const sentences = content.split(/[.!?]\s+/).filter(Boolean);
      const summary = sentences.slice(0, 3).join(". ");
      return `## 요약\n\n${summary}${summary.endsWith(".") ? "" : "."}`;
    }
    
    case "table": {
      // 마크다운 테이블로 변환 시도
      const lines = content.split("\n").filter(line => line.trim());
      if (lines.length < 2) return content;
      
      const tableRows = lines.slice(0, 10).map(line => 
        `| ${line.replace(/[|]/g, "\\|")} |`
      );
      const header = "| 내용 |";
      const divider = "|---|";
      
      return `${header}\n${divider}\n${tableRows.join("\n")}`;
    }
    
    case "json": {
      // 간단한 JSON 구조 생성
      const lines = content.split("\n").filter(line => line.trim());
      const jsonContent = {
        type: "response",
        content: content.slice(0, 500),
        paragraphs: lines.slice(0, 5),
        wordCount: content.split(/\s+/).length,
        charCount: content.length
      };
      return "```json\n" + JSON.stringify(jsonContent, null, 2) + "\n```";
    }
    
    case "bullets": {
      // 글머리 기호 목록으로 변환
      const sentences = content.split(/[.!?]\s+/).filter(Boolean);
      const bullets = sentences.map(s => `- ${s.trim()}`).join("\n");
      return bullets;
    }
    
    case "code": {
      // 코드 블록 추출
      const codeBlockRegex = /```[\s\S]*?```/g;
      const codeBlocks = content.match(codeBlockRegex);
      
      if (codeBlocks && codeBlocks.length > 0) {
        return codeBlocks.join("\n\n");
      }
      return "코드 블록을 찾을 수 없습니다.";
    }
    
    default:
      return content;
  }
};

export function ResponseTransformer({ content, onTransform }: ResponseTransformerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TransformType | null>(null);
  const [transformedContent, setTransformedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const handleTransform = (type: TransformType) => {
    const result = transformContent(content, type);
    setTransformedContent(result);
    setSelectedType(type);
    setIsOpen(false);
    onTransform?.(result, type);
  };
  
  const handleCopy = async () => {
    if (!transformedContent) return;
    await navigator.clipboard.writeText(transformedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const selectedOption = useMemo(() => 
    TRANSFORM_OPTIONS.find(o => o.id === selectedType),
    [selectedType]
  );
  
  return (
    <div className="response-transformer">
      <div className="transformer-trigger">
        <button
          className="transform-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FileText className="button-icon" />
          <span>변환</span>
          <ChevronDown className={`chevron ${isOpen ? "open" : ""}`} />
        </button>
        
        {isOpen && (
          <div className="transform-dropdown">
            {TRANSFORM_OPTIONS.map(option => (
              <button
                key={option.id}
                className={`transform-option ${selectedType === option.id ? "active" : ""}`}
                onClick={() => handleTransform(option.id)}
              >
                {option.icon}
                <div className="option-text">
                  <span className="option-label">{option.label}</span>
                  <span className="option-desc">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {transformedContent && (
        <div className="transformed-result">
          <div className="result-header">
            {selectedOption && (
              <>
                {selectedOption.icon}
                <span>{selectedOption.label} 결과</span>
              </>
            )}
            <button className="copy-button" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <div className="result-content">
            <pre>{transformedContent}</pre>
          </div>
          <button
            className="close-result"
            onClick={() => setTransformedContent(null)}
          >
            닫기
          </button>
        </div>
      )}
      
      <style jsx>{`
        .response-transformer {
          position: relative;
        }
        
        .transformer-trigger {
          position: relative;
          display: inline-block;
        }
        
        .transform-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .transform-button:hover {
          background: var(--bg-hover, #2e2e44);
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .button-icon {
          width: 16px;
          height: 16px;
        }
        
        .chevron {
          width: 14px;
          height: 14px;
          transition: transform 0.2s ease;
        }
        
        .chevron.open {
          transform: rotate(180deg);
        }
        
        .transform-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          min-width: 200px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          z-index: 100;
        }
        
        .transform-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .transform-option:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .transform-option.active {
          background: rgba(124, 58, 237, 0.1);
        }
        
        .transform-option :global(svg) {
          color: var(--primary, #7c3aed);
          flex-shrink: 0;
        }
        
        .option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .option-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .option-desc {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .transformed-result {
          margin-top: 16px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-tertiary, #252536);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .result-header :global(svg) {
          color: var(--primary, #7c3aed);
        }
        
        .copy-button {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
          padding: 6px 10px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
          font-size: 12px;
          cursor: pointer;
        }
        
        .copy-button:hover {
          color: var(--primary, #7c3aed);
          border-color: var(--primary, #7c3aed);
        }
        
        .result-content {
          padding: 16px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .result-content pre {
          margin: 0;
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--text-primary, #e0e0e0);
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .close-result {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: none;
          border-top: 1px solid var(--border-color, #3e3e5a);
          color: var(--text-muted, #6e6e7e);
          font-size: 13px;
          cursor: pointer;
        }
        
        .close-result:hover {
          background: var(--bg-hover, #2e2e44);
          color: var(--text-primary, #e0e0e0);
        }
      `}</style>
    </div>
  );
}

export default ResponseTransformer;
