"use client";

import { useState, useCallback } from "react";
import { Plus, X, Maximize2, Minimize2, Send, Loader2,Copy, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParallelSession {
  id: string;
  input: string;
  response: string;
  isLoading: boolean;
  modelId?: string;
  error?: string;
}

interface ParallelChatProps {
  defaultModelId?: string;
  onSendMessage?: (message: string, modelId?: string) => Promise<string>;
  maxSessions?: number;
}

export function ParallelChat({
  defaultModelId,
  onSendMessage,
  maxSessions = 4
}: ParallelChatProps) {
  const [sessions, setSessions] = useState<ParallelSession[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [layout, setLayout] = useState<"grid" | "horizontal">("grid");
  
  const addSession = useCallback(() => {
    if (sessions.length >= maxSessions) return;
    
    const newSession: ParallelSession = {
      id: Date.now().toString(),
      input: "",
      response: "",
      isLoading: false,
      modelId: defaultModelId
    };
    
    setSessions(prev => [...prev, newSession]);
  }, [sessions.length, maxSessions, defaultModelId]);
  
  const removeSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);
  
  const updateSessionInput = useCallback((id: string, input: string) => {
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, input } : s
    ));
  }, []);
  
  const sendMessage = useCallback(async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session || !session.input.trim() || !onSendMessage) return;
    
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, isLoading: true, error: undefined } : s
    ));
    
    try {
      const response = await onSendMessage(session.input, session.modelId);
      setSessions(prev => prev.map(s =>
        s.id === id ? { ...s, response, isLoading: false } : s
      ));
    } catch (error) {
      setSessions(prev => prev.map(s =>
        s.id === id ? { 
          ...s, 
          isLoading: false, 
          error: error instanceof Error ? error.message : "오류가 발생했습니다" 
        } : s
      ));
    }
  }, [sessions, onSendMessage]);
  
  const sendAllMessages = useCallback(async () => {
    const activeSessions = sessions.filter(s => s.input.trim() && !s.isLoading);
    await Promise.all(activeSessions.map(s => sendMessage(s.id)));
  }, [sessions, sendMessage]);
  
  const copyResponse = useCallback((response: string) => {
    navigator.clipboard.writeText(response);
  }, []);
  
  if (sessions.length === 0) {
    return (
      <div className="parallel-chat-empty">
        <button className="add-parallel-btn" onClick={addSession}>
          <LayoutGrid className="icon" />
          <span>병렬 질문 모드</span>
        </button>
        
        <style jsx>{`
          .parallel-chat-empty {
            display: inline-block;
          }
          
          .add-parallel-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: var(--bg-secondary, #1e1e2e);
            border: 1px solid var(--border-color, #3e3e5a);
            border-radius: 8px;
            color: var(--text-secondary, #a0a0b0);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .add-parallel-btn:hover {
            background: var(--bg-hover, #2e2e44);
            border-color: var(--primary, #7c3aed);
            color: var(--primary, #7c3aed);
          }
          
          .icon {
            width: 16px;
            height: 16px;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className={`parallel-chat ${isExpanded ? "expanded" : ""} layout-${layout}`}>
      <div className="parallel-header">
        <h4>병렬 질문 ({sessions.length}/{maxSessions})</h4>
        <div className="header-actions">
          <button
            className="layout-toggle"
            onClick={() => setLayout(layout === "grid" ? "horizontal" : "grid")}
            title="레이아웃 변경"
          >
            <LayoutGrid />
          </button>
          {sessions.length < maxSessions && (
            <button className="add-btn" onClick={addSession} title="세션 추가">
              <Plus />
            </button>
          )}
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "축소" : "확장"}
          >
            {isExpanded ? <Minimize2 /> : <Maximize2 />}
          </button>
          <button
            className="close-all-btn"
            onClick={() => setSessions([])}
            title="전체 닫기"
          >
            <X />
          </button>
        </div>
      </div>
      
      <div className="sessions-container">
        {sessions.map((session, index) => (
          <div key={session.id} className="session-card">
            <div className="session-header">
              <span className="session-number">질문 {index + 1}</span>
              <button
                className="remove-session"
                onClick={() => removeSession(session.id)}
              >
                <X />
              </button>
            </div>
            
            <div className="session-input">
              <textarea
                placeholder="질문을 입력하세요..."
                value={session.input}
                onChange={(e) => updateSessionInput(session.id, e.target.value)}
                disabled={session.isLoading}
              />
              <button
                className="send-btn"
                onClick={() => sendMessage(session.id)}
                disabled={session.isLoading || !session.input.trim()}
              >
                {session.isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              </button>
            </div>
            
            {session.error && (
              <div className="session-error">{session.error}</div>
            )}
            
            {session.response && (
              <div className="session-response">
                <div className="response-header">
                  <span>응답</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyResponse(session.response)}
                  >
                    <Copy />
                  </button>
                </div>
                <div className="response-content">{session.response}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {sessions.length > 1 && (
        <div className="parallel-footer">
          <Button onClick={sendAllMessages} className="send-all-btn">
            <Send className="mr-2" />
            전체 전송
          </Button>
        </div>
      )}
      
      <style jsx>{`
        .parallel-chat {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .parallel-chat.expanded {
          position: fixed;
          top: 80px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          z-index: 1000;
        }
        
        .parallel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .parallel-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
        
        .header-actions button {
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .header-actions button:hover {
          background: var(--bg-hover, #2e2e44);
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-actions button :global(svg) {
          width: 16px;
          height: 16px;
        }
        
        .sessions-container {
          display: grid;
          gap: 16px;
          padding: 16px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .layout-grid .sessions-container {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        
        .layout-horizontal .sessions-container {
          grid-template-columns: repeat(4, 1fr);
        }
        
        .parallel-chat.expanded .sessions-container {
          max-height: none;
          height: calc(100% - 120px);
        }
        
        .session-card {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .session-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--bg-tertiary, #252536);
        }
        
        .session-number {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary, #7c3aed);
        }
        
        .remove-session {
          padding: 4px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .remove-session:hover {
          color: #ef4444;
        }
        
        .remove-session :global(svg) {
          width: 14px;
          height: 14px;
        }
        
        .session-input {
          display: flex;
          gap: 8px;
          padding: 12px;
        }
        
        .session-input textarea {
          flex: 1;
          min-height: 60px;
          padding: 10px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-size: 13px;
          resize: vertical;
          outline: none;
        }
        
        .session-input textarea:focus {
          border-color: var(--primary, #7c3aed);
        }
        
        .send-btn {
          padding: 10px;
          background: var(--primary, #7c3aed);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .send-btn :global(svg) {
          width: 18px;
          height: 18px;
        }
        
        .session-error {
          margin: 0 12px 12px;
          padding: 10px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          color: #ef4444;
          font-size: 13px;
        }
        
        .session-response {
          margin: 0 12px 12px;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .response-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-tertiary, #252536);
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .copy-btn {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .copy-btn:hover {
          color: var(--primary, #7c3aed);
        }
        
        .copy-btn :global(svg) {
          width: 14px;
          height: 14px;
        }
        
        .response-content {
          padding: 12px;
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
          line-height: 1.6;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .parallel-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-color, #3e3e5a);
          display: flex;
          justify-content: flex-end;
        }
        
        .parallel-footer :global(.send-all-btn) {
          background: var(--primary, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export default ParallelChat;
