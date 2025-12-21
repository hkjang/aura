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
  Loader2,
  FileJson,
  File
} from "lucide-react";

interface PostProcessButtonsProps {
  content: string;
  messageId?: string;
  title?: string;
}

export function PostProcessButtons({
  content,
  messageId,
  title = "AI 응답"
}: PostProcessButtonsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  
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
  
  // 문서화 - Document 테이블에 저장
  const handleDocument = useCallback(async () => {
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${title} - ${new Date().toLocaleDateString('ko-KR')}`,
          content: content,
          metadata: JSON.stringify({
            source: 'chat',
            messageId,
            createdAt: new Date().toISOString()
          })
        })
      });
      
      if (!response.ok) throw new Error('Failed to save document');
      
      // 성공 시 알림
      alert('문서가 지식 베이스에 저장되었습니다.');
    } catch (error) {
      console.error('Document save error:', error);
      // Fallback: 클립보드에 마크다운으로 복사
      const docContent = `# ${title}\n\n${content}\n\n---\n_Generated: ${new Date().toLocaleString('ko-KR')}_`;
      await navigator.clipboard.writeText(docContent);
      alert('문서를 클립보드에 복사했습니다.');
    }
  }, [content, title, messageId]);
  
  // 파일 다운로드 유틸리티
  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Markdown 내보내기
  const handleExportMarkdown = useCallback(async () => {
    const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.md`;
    const mdContent = `# ${title}\n\n${content}\n\n---\n\n*Exported from Aura AI on ${new Date().toLocaleString('ko-KR')}*`;
    downloadFile(filename, mdContent, 'text/markdown');
  }, [content, title]);
  
  // JSON 내보내기
  const handleExportJSON = useCallback(async () => {
    const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.json`;
    const jsonContent = JSON.stringify({
      title,
      content,
      messageId,
      exportedAt: new Date().toISOString(),
      source: 'Aura AI'
    }, null, 2);
    downloadFile(filename, jsonContent, 'application/json');
  }, [content, title, messageId]);
  
  // TXT 내보내기
  const handleExportTXT = useCallback(async () => {
    const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.txt`;
    downloadFile(filename, content, 'text/plain');
  }, [content, title]);
  
  // 인쇄
  const handlePrint = useCallback(async () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Malgun Gothic', system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
              h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
              pre { background: #f5f5f5; padding: 1rem; overflow: auto; border-radius: 4px; }
              code { background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; }
              .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div>${content.replace(/\n/g, "<br>")}</div>
            <div class="footer">
              Aura AI · ${new Date().toLocaleString('ko-KR')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [content, title]);
  
  // 공유 링크 생성
  const handleCreateLink = useCallback(async () => {
    try {
      // Save content to snippets for sharing
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          isPublic: true
        })
      });
      
      if (response.ok) {
        const snippet = await response.json();
        const link = `${window.location.origin}/share/${snippet.id}`;
        setShareLink(link);
        await navigator.clipboard.writeText(link);
        alert(`공유 링크가 생성되어 클립보드에 복사되었습니다!`);
      } else {
        throw new Error('Failed to create share link');
      }
    } catch (error) {
      console.error('Share link error:', error);
      // Fallback: just copy content
      await navigator.clipboard.writeText(content);
      alert('공유 링크 생성에 실패했습니다. 내용이 클립보드에 복사되었습니다.');
    }
  }, [content, title]);
  
  // 이메일로 공유
  const handleShareEmail = useCallback(async () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${content}\n\n---\nShared from Aura AI`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [content, title]);
  
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
      {/* 복사 버튼 */}
      <button
        className="action-btn"
        onClick={() => executeAction("copy", handleCopy)}
        disabled={activeAction !== null}
        title="응답을 클립보드에 복사"
      >
        {renderButtonContent("copy", Copy, "복사")}
      </button>
      
      {/* 문서화 버튼 */}
      <button
        className="action-btn"
        onClick={() => executeAction("document", handleDocument)}
        disabled={activeAction !== null}
        title="지식 베이스에 문서로 저장"
      >
        {renderButtonContent("document", FileText, "문서화")}
      </button>
      
      {/* 공유 드롭다운 */}
      <div className="dropdown">
        <button
          className="action-btn"
          onClick={() => { setShowShareMenu(!showShareMenu); setShowExportMenu(false); }}
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
              <span>링크 복사</span>
            </button>
            <button onClick={() => {
              handleShareEmail();
              setShowShareMenu(false);
            }}>
              <Mail size={14} />
              <span>이메일</span>
            </button>
          </div>
        )}
      </div>
      
      {/* 내보내기 드롭다운 */}
      <div className="dropdown">
        <button
          className="action-btn"
          onClick={() => { setShowExportMenu(!showExportMenu); setShowShareMenu(false); }}
          disabled={activeAction !== null}
        >
          <Download className="icon" />
          <span>내보내기</span>
        </button>
        
        {showExportMenu && (
          <div className="dropdown-menu">
            <button onClick={() => {
              executeAction("md", handleExportMarkdown);
              setShowExportMenu(false);
            }}>
              <FileText size={14} />
              <span>Markdown (.md)</span>
            </button>
            <button onClick={() => {
              executeAction("json", handleExportJSON);
              setShowExportMenu(false);
            }}>
              <FileJson size={14} />
              <span>JSON (.json)</span>
            </button>
            <button onClick={() => {
              executeAction("txt", handleExportTXT);
              setShowExportMenu(false);
            }}>
              <File size={14} />
              <span>텍스트 (.txt)</span>
            </button>
            <div className="dropdown-divider" />
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
          min-width: 160px;
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
        
        .dropdown-divider {
          height: 1px;
          background: var(--border-color, #3e3e5a);
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}

export default PostProcessButtons;
