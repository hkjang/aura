"use client";

import { useState, useMemo } from "react";
import { GitCompare, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface ResponseDiffProps {
  responses: Array<{
    id: string;
    content: string;
    label: string;
    timestamp?: Date;
  }>;
}

type DiffMode = "side-by-side" | "inline";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: number;
}

// 간단한 diff 알고리즘
function computeDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");
  const diff: DiffLine[] = [];
  
  let i = 0, j = 0;
  let lineNumber = 1;
  
  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      // 남은 lines2는 추가됨
      diff.push({ type: "added", content: lines2[j], lineNumber: lineNumber++ });
      j++;
    } else if (j >= lines2.length) {
      // 남은 lines1는 삭제됨
      diff.push({ type: "removed", content: lines1[i], lineNumber: lineNumber++ });
      i++;
    } else if (lines1[i] === lines2[j]) {
      // 동일
      diff.push({ type: "unchanged", content: lines1[i], lineNumber: lineNumber++ });
      i++;
      j++;
    } else {
      // 다름 - 먼저 삭제 후 추가로 표시
      diff.push({ type: "removed", content: lines1[i], lineNumber: lineNumber++ });
      diff.push({ type: "added", content: lines2[j], lineNumber: lineNumber++ });
      i++;
      j++;
    }
  }
  
  return diff;
}

export function ResponseDiff({ responses }: ResponseDiffProps) {
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(Math.min(1, responses.length - 1));
  const [diffMode, setDiffMode] = useState<DiffMode>("side-by-side");
  const [copied, setCopied] = useState<"left" | "right" | null>(null);
  
  const leftResponse = responses[leftIndex];
  const rightResponse = responses[rightIndex];
  
  const diffLines = useMemo(() => {
    if (!leftResponse || !rightResponse) return [];
    return computeDiff(leftResponse.content, rightResponse.content);
  }, [leftResponse, rightResponse]);
  
  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === "added").length;
    const removed = diffLines.filter(l => l.type === "removed").length;
    const unchanged = diffLines.filter(l => l.type === "unchanged").length;
    return { added, removed, unchanged };
  }, [diffLines]);
  
  const handleCopy = async (side: "left" | "right") => {
    const content = side === "left" ? leftResponse?.content : rightResponse?.content;
    if (!content) return;
    
    await navigator.clipboard.writeText(content);
    setCopied(side);
    setTimeout(() => setCopied(null), 2000);
  };
  
  if (responses.length < 2) {
    return (
      <div className="response-diff-empty">
        <GitCompare className="empty-icon" />
        <p>비교하려면 최소 2개의 응답이 필요합니다.</p>
        
        <style jsx>{`
          .response-diff-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 40px;
            color: var(--text-muted, #6e6e7e);
            text-align: center;
          }
          
          .empty-icon {
            width: 48px;
            height: 48px;
            opacity: 0.5;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="response-diff">
      <div className="diff-header">
        <h4>
          <GitCompare className="header-icon" />
          응답 비교
        </h4>
        
        <div className="diff-controls">
          <div className="diff-stats">
            <span className="stat added">+{stats.added}</span>
            <span className="stat removed">-{stats.removed}</span>
            <span className="stat unchanged">{stats.unchanged} 동일</span>
          </div>
          
          <div className="mode-toggle">
            <button
              className={diffMode === "side-by-side" ? "active" : ""}
              onClick={() => setDiffMode("side-by-side")}
            >
              나란히
            </button>
            <button
              className={diffMode === "inline" ? "active" : ""}
              onClick={() => setDiffMode("inline")}
            >
              인라인
            </button>
          </div>
        </div>
      </div>
      
      <div className={`diff-content ${diffMode}`}>
        {diffMode === "side-by-side" ? (
          <>
            <div className="diff-panel left">
              <div className="panel-header">
                <div className="panel-nav">
                  <button
                    disabled={leftIndex === 0}
                    onClick={() => setLeftIndex(i => Math.max(0, i - 1))}
                  >
                    <ChevronLeft />
                  </button>
                  <span>{leftResponse?.label || `응답 ${leftIndex + 1}`}</span>
                  <button
                    disabled={leftIndex >= responses.length - 1}
                    onClick={() => setLeftIndex(i => Math.min(responses.length - 1, i + 1))}
                  >
                    <ChevronRight />
                  </button>
                </div>
                <button className="copy-btn" onClick={() => handleCopy("left")}>
                  {copied === "left" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="panel-content">
                <pre>{leftResponse?.content}</pre>
              </div>
            </div>
            
            <div className="diff-panel right">
              <div className="panel-header">
                <div className="panel-nav">
                  <button
                    disabled={rightIndex === 0}
                    onClick={() => setRightIndex(i => Math.max(0, i - 1))}
                  >
                    <ChevronLeft />
                  </button>
                  <span>{rightResponse?.label || `응답 ${rightIndex + 1}`}</span>
                  <button
                    disabled={rightIndex >= responses.length - 1}
                    onClick={() => setRightIndex(i => Math.min(responses.length - 1, i + 1))}
                  >
                    <ChevronRight />
                  </button>
                </div>
                <button className="copy-btn" onClick={() => handleCopy("right")}>
                  {copied === "right" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="panel-content">
                <pre>{rightResponse?.content}</pre>
              </div>
            </div>
          </>
        ) : (
          <div className="diff-inline">
            {diffLines.map((line, idx) => (
              <div key={idx} className={`diff-line ${line.type}`}>
                <span className="line-number">{line.lineNumber}</span>
                <span className="line-indicator">
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </span>
                <span className="line-content">{line.content || " "}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .response-diff {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .diff-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .diff-header h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 18px;
          height: 18px;
          color: var(--primary, #7c3aed);
        }
        
        .diff-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .diff-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
        }
        
        .stat.added {
          color: #10b981;
        }
        
        .stat.removed {
          color: #ef4444;
        }
        
        .stat.unchanged {
          color: var(--text-muted, #6e6e7e);
        }
        
        .mode-toggle {
          display: flex;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .mode-toggle button {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .mode-toggle button.active {
          background: var(--primary, #7c3aed);
          color: white;
        }
        
        .diff-content.side-by-side {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        
        .diff-panel {
          border-right: 1px solid var(--border-color, #3e3e5a);
        }
        
        .diff-panel.right {
          border-right: none;
        }
        
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-tertiary, #252536);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .panel-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .panel-nav button {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .panel-nav button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .panel-nav button:not(:disabled):hover {
          color: var(--primary, #7c3aed);
        }
        
        .panel-nav button :global(svg) {
          width: 16px;
          height: 16px;
        }
        
        .panel-nav span {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .copy-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .copy-btn:hover {
          color: var(--primary, #7c3aed);
        }
        
        .panel-content {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .panel-content pre {
          margin: 0;
          font-size: 13px;
          font-family: inherit;
          color: var(--text-primary, #e0e0e0);
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
        }
        
        .diff-inline {
          max-height: 500px;
          overflow-y: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        
        .diff-line {
          display: flex;
          align-items: flex-start;
          min-height: 24px;
        }
        
        .diff-line.added {
          background: rgba(16, 185, 129, 0.1);
        }
        
        .diff-line.removed {
          background: rgba(239, 68, 68, 0.1);
        }
        
        .line-number {
          width: 40px;
          padding: 4px 8px;
          text-align: right;
          color: var(--text-muted, #6e6e7e);
          user-select: none;
          flex-shrink: 0;
        }
        
        .line-indicator {
          width: 20px;
          text-align: center;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .diff-line.added .line-indicator {
          color: #10b981;
        }
        
        .diff-line.removed .line-indicator {
          color: #ef4444;
        }
        
        .line-content {
          flex: 1;
          padding: 4px 8px;
          color: var(--text-primary, #e0e0e0);
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}

export default ResponseDiff;
