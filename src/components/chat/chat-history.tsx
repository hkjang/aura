"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, MoreVertical } from "lucide-react";

interface Thread {
  id: string;
  title: string;
  updatedAt: string;
  messages: { content: string }[];
}

interface ChatHistoryProps {
  currentThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
}

export function ChatHistory({ currentThreadId, onSelectThread, onNewThread }: ChatHistoryProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/threads");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("이 대화를 삭제하시겠습니까?")) return;

    try {
      await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
      setThreads(prev => prev.filter(t => t.id !== threadId));
      if (currentThreadId === threadId) {
        onNewThread();
      }
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
    setMenuOpen(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)'
    }}>
      {/* Header with New Chat Button */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <button
          onClick={onNewThread}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          새 대화
        </button>
      </div>

      {/* Thread List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {isLoading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            로딩 중...
          </div>
        ) : threads.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            대화 이력이 없습니다
          </div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: currentThreadId === thread.id ? 'var(--color-primary-light)' : 'transparent',
                border: currentThreadId === thread.id ? '1px solid var(--color-primary)' : '1px solid transparent',
                transition: 'all 150ms ease'
              }}
            >
              <MessageSquare style={{
                width: '16px',
                height: '16px',
                flexShrink: 0,
                color: currentThreadId === thread.id ? 'var(--color-primary)' : 'var(--text-tertiary)'
              }} />
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {thread.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {formatDate(thread.updatedAt)}
                </div>
              </div>

              {/* Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === thread.id ? null : thread.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    opacity: menuOpen === thread.id ? 1 : 0
                  }}
                  className="thread-menu-btn"
                >
                  <MoreVertical style={{ width: '14px', height: '14px' }} />
                </button>

                {menuOpen === thread.id && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '4px',
                    padding: '4px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 100
                  }}>
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'var(--color-error)',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .thread-menu-btn:hover,
        div:hover > div > .thread-menu-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

// Refresh trigger hook
export function useChatHistoryRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);
  return { refreshKey, refresh };
}
