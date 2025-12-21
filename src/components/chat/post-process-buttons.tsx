"use client";

import { useState, useCallback } from "react";
import { 
  FileText, 
  Share2, 
  Download, 
  Copy, 
  Mail,
  MessageSquare,
  FileCode,
  Printer,
  Link2,
  Check,
  Loader2
} from "lucide-react";

interface PostProcessAction {
  id: string;
  label: string;
  icon: React.ElementType;
  handler: () => Promise<void>;
  isAsync?: boolean;
}

interface PostProcessButtonsProps {
  content: string;
  title?: string;
  onShare?: (platform: string, content: string) => Promise<void>;
  onExport?: (format: string, content: string) => Promise<void>;
  onDocument?: (content: string) => Promise<void>;
}

export function PostProcessButtons({
  content,
  title = "AI 응답",
  onShare,
  onExport,
  onDocument
}: PostProcessButtonsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const executeAction = useCallback(async (actionId: string, handler: () => Promise<void>) => {
    setActiveAction(actionId);
    try {
      await handler();
      setCompletedActions(prev => new Set(prev).add(actionId));
      setTimeout(() => {
        setCompletedActions(prev => {
          const next = new Set(prev);
          next.delete(actionId);
          return next;
        });
      }, 2000);
    } finally {
      setActiveAction(null);
    }
  }, []);
  
  // 클립보드 복사
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
  }, [content]);
  
  // 문서화
  const handleDocument = useCallback(async () => {
    if (onDocument) {
      await onDocument(content);
    } else {
      // 기본 동작: 마크다운 포맷으로 클립보드에 복사
      const docContent = `# ${title}\n\n${content}\n\n---\n_Generated: ${new Date().toLocaleString()}_`;
      await navigator.clipboard.writeText(docContent);
    }
  }, [content, title, onDocument]);
  
  // 인쇄
  const handlePrint = useCallback(async () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
              pre { background: #f5f5f5; padding: 1rem; overflow: auto; }
              code { background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div>${content.replace(/\n/g, "<br>")}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [content, title]);
  
  // 링크 생성 (placeholder)
  const handleCreateLink = useCallback(async () => {
    // 실제로는 서버 API 호출하여 공유 링크 생성
    const mockLink = `${window.location.origin}/share/${Date.now().toString(36)}`;
    await navigator.clipboard.writeText(mockLink);
  }, []);
  
  const getButtonState = (actionId: string) => {
    if (activeAction === actionId) return "loading";
    if (completedActions.has(actionId)) return "completed";
    return "idle";
  };
  
  const renderButtonContent = (actionId: string, Icon: React.ElementType, label: string) => {
    const state = getButtonState(actionId);
    return (
      <>
        {state === "loading" ? (
          <Loader2 className="icon spinning" />
        ) : state === "completed" ? (
          <Check className="icon success" />
        ) : (
          <Icon className="icon" />
        )}
        <span>{label}</span>
      </>
    );
  };
  
  return (
    <div className="post-process-buttons">
      {/* 기본 버튼들 */}
      <button
        className="action-btn"
        onClick={() => executeAction("copy", handleCopy)}
        disabled={activeAction !== null}
      >
        {renderButtonContent("copy", Copy, "복사")}
      </button>
      
      <button
        className="action-btn"
        onClick={() => executeAction("document", handleDocument)}
        disabled={activeAction !== null}
      >
        {renderButtonContent("document", FileText, "문서화")}
      </button>
      
      {/* 공유 드롭다운 */}
      <div className="dropdown">
        <button
          className="action-btn"
          onClick={() => setShowShareMenu(!showShareMenu)}
          disabled={activeAction !== null}
        >
          <Share2 className="icon" />
          <span>공유</span>
        </button>
        
        {showShareMenu && (
          <div className="dropdown-menu">
            <button onClick={() => {
              executeAction("link", handleCreateLink);
              setShowShareMenu(false);
            }}>
              <Link2 size={14} />
              <span>링크 생성</span>
            </button>
            <button onClick={() => {
              onShare?.("email", content);
              setShowShareMenu(false);
            }}>
              <Mail size={14} />
              <span>이메일</span>
            </button>
            <button onClick={() => {
              onShare?.("slack", content);
              setShowShareMenu(false);
            }}>
              <MessageSquare size={14} />
              <span>Slack</span>
            </button>
          </div>
        )}
      </div>
      
      {/* 내보내기 드롭다운 */}
      <div className="dropdown">
        <button
          className="action-btn"
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={activeAction !== null}
        >
          <Download className="icon" />
          <span>내보내기</span>
        </button>
        
        {showExportMenu && (
          <div className="dropdown-menu">
            <button onClick={() => {
              onExport?.("markdown", content);
              setShowExportMenu(false);
            }}>
              <FileText size={14} />
              <span>Markdown</span>
            </button>
            <button onClick={() => {
              onExport?.("json", content);
              setShowExportMenu(false);
            }}>
              <FileCode size={14} />
              <span>JSON</span>
            </button>
            <button onClick={() => {
              executeAction("print", handlePrint);
              setShowExportMenu(false);
            }}>
              <Printer size={14} />
              <span>인쇄</span>
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .post-process-buttons {
          display: flex;
          gap: 8px;
          padding: 10px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover:not(:disabled) {
          background: var(--bg-hover, #2e2e44);
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .action-btn :global(.icon) {
          width: 14px;
          height: 14px;
        }
        
        .action-btn :global(.spinning) {
          animation: spin 1s linear infinite;
        }
        
        .action-btn :global(.success) {
          color: #10b981;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .dropdown {
          position: relative;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          min-width: 140px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 100;
        }
        
        .dropdown-menu button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
          text-align: left;
        }
        
        .dropdown-menu button:hover {
          background: var(--bg-hover, #2e2e44);
          color: var(--text-primary, #e0e0e0);
        }
      `}</style>
    </div>
  );
}

export default PostProcessButtons;
