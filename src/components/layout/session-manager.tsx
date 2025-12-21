"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { FolderOpen, Save, Clock, Trash2, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkSession {
  id: string;
  name: string;
  description?: string;
  messages: Array<{ role: string; content: string; timestamp: Date }>;
  notes: string[];
  selectedModel?: string;
  createdAt: Date;
  updatedAt: Date;
  isAutoSaved: boolean;
}

interface SessionContextType {
  currentSession: WorkSession | null;
  sessions: WorkSession[];
  createSession: (name: string, description?: string) => WorkSession;
  loadSession: (sessionId: string) => void;
  saveSession: () => void;
  deleteSession: (sessionId: string) => void;
  updateSessionData: (updates: Partial<WorkSession>) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const STORAGE_KEY = "aura-work-sessions";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  
  // 초기 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSessions(parsed.map((s: WorkSession) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })));
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }, []);
  
  // 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions:", error);
    }
  }, [sessions]);
  
  // 자동 저장 (30초마다)
  useEffect(() => {
    if (!currentSession) return;
    
    const interval = setInterval(() => {
      setSessions(prev => prev.map(s => 
        s.id === currentSession.id 
          ? { ...currentSession, updatedAt: new Date(), isAutoSaved: true }
          : s
      ));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentSession]);
  
  const createSession = useCallback((name: string, description?: string) => {
    const newSession: WorkSession = {
      id: `session-${Date.now()}`,
      name,
      description,
      messages: [],
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isAutoSaved: false
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    return newSession;
  }, []);
  
  const loadSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  }, [sessions]);
  
  const saveSession = useCallback(() => {
    if (!currentSession) return;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id 
        ? { ...currentSession, updatedAt: new Date(), isAutoSaved: false }
        : s
    ));
  }, [currentSession]);
  
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  }, [currentSession]);
  
  const updateSessionData = useCallback((updates: Partial<WorkSession>) => {
    if (!currentSession) return;
    
    const updated = { ...currentSession, ...updates, updatedAt: new Date() };
    setCurrentSession(updated);
    setSessions(prev => prev.map(s => s.id === currentSession.id ? updated : s));
  }, [currentSession]);
  
  return (
    <SessionContext.Provider value={{
      currentSession,
      sessions,
      createSession,
      loadSession,
      saveSession,
      deleteSession,
      updateSessionData
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}

// 세션 관리 UI 컴포넌트
export function SessionManager() {
  const { sessions, currentSession, createSession, loadSession, deleteSession, saveSession } = useSession();
  const [showList, setShowList] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };
  
  const handleCreate = () => {
    if (!newSessionName.trim()) return;
    createSession(newSessionName);
    setNewSessionName("");
    setIsCreating(false);
    setShowList(false);
  };
  
  return (
    <div className="session-manager">
      <button className="session-trigger" onClick={() => setShowList(!showList)}>
        <FolderOpen size={18} />
        <span className="trigger-text">
          {currentSession ? currentSession.name : "세션 없음"}
        </span>
        {currentSession?.isAutoSaved && (
          <span className="auto-saved">자동저장됨</span>
        )}
        <ChevronDown className={`chevron ${showList ? "open" : ""}`} />
      </button>
      
      {showList && (
        <div className="session-list-panel">
          <div className="panel-header">
            <span>작업 세션</span>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus size={14} />
            </Button>
          </div>
          
          {isCreating && (
            <div className="create-form">
              <input
                type="text"
                value={newSessionName}
                onChange={e => setNewSessionName(e.target.value)}
                placeholder="세션 이름..."
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
              <Button size="sm" onClick={handleCreate}>만들기</Button>
            </div>
          )}
          
          <div className="sessions-list">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`session-item ${currentSession?.id === session.id ? "active" : ""}`}
                onClick={() => {
                  loadSession(session.id);
                  setShowList(false);
                }}
              >
                <div className="session-info">
                  <span className="session-name">{session.name}</span>
                  <span className="session-meta">
                    <Clock size={10} />
                    {formatDate(session.updatedAt)}
                    · {session.messages.length}개 메시지
                  </span>
                </div>
                <button
                  className="delete-btn"
                  onClick={e => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="empty-state">
                <p>저장된 세션이 없습니다.</p>
              </div>
            )}
          </div>
          
          {currentSession && (
            <div className="panel-footer">
              <Button variant="outline" size="sm" onClick={saveSession}>
                <Save size={14} />
                지금 저장
              </Button>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .session-manager {
          position: relative;
        }
        
        .session-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .session-trigger:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .trigger-text {
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .auto-saved {
          padding: 2px 6px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          font-size: 10px;
          color: #10b981;
        }
        
        .chevron {
          width: 14px;
          height: 14px;
          transition: transform 0.2s ease;
        }
        
        .chevron.open {
          transform: rotate(180deg);
        }
        
        .session-list-panel {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          width: 300px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 100;
        }
        
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .create-form {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .create-form input {
          flex: 1;
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 6px;
          color: var(--text-primary, #e0e0e0);
          font-size: 13px;
          outline: none;
        }
        
        .sessions-list {
          max-height: 250px;
          overflow-y: auto;
        }
        
        .session-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .session-item:last-child {
          border-bottom: none;
        }
        
        .session-item:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .session-item.active {
          background: rgba(124, 58, 237, 0.1);
          border-left: 2px solid var(--primary, #7c3aed);
        }
        
        .session-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        
        .session-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .session-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .delete-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        
        .session-item:hover .delete-btn {
          opacity: 1;
        }
        
        .delete-btn:hover {
          color: #ef4444;
        }
        
        .empty-state {
          padding: 24px;
          text-align: center;
          color: var(--text-muted, #6e6e7e);
          font-size: 13px;
        }
        
        .panel-footer {
          padding: 12px;
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
        
        .panel-footer :global(button) {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default SessionManager;
