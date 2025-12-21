"use client";

import { useState, useCallback } from "react";
import { Clock, ChevronUp, RotateCcw, Pin, Trash2, Search } from "lucide-react";

interface HistoryItem {
  id: string;
  text: string;
  timestamp: Date;
  isPinned: boolean;
}

interface InputHistoryProps {
  onSelectHistory: (text: string) => void;
  maxItems?: number;
}

// 로컬 스토리지 키
const STORAGE_KEY = "aura-input-history";

// 히스토리 로드
const loadHistory = (): HistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const items = JSON.parse(stored);
    return items.map((item: HistoryItem) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch {
    return [];
  }
};

// 히스토리 저장
const saveHistory = (items: HistoryItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.error("Failed to save history");
  }
};

export function useInputHistory(maxItems: number = 50) {
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  
  const addToHistory = useCallback((text: string) => {
    if (!text.trim()) return;
    
    setHistory(prev => {
      // 중복 제거
      const filtered = prev.filter(item => item.text !== text);
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        text: text.trim(),
        timestamp: new Date(),
        isPinned: false
      };
      
      const updated = [newItem, ...filtered].slice(0, maxItems);
      saveHistory(updated);
      return updated;
    });
  }, [maxItems]);
  
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);
  
  const togglePin = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );
      // 고정된 항목을 상단으로
      updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
      saveHistory(updated);
      return updated;
    });
  }, []);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);
  
  return { history, addToHistory, removeFromHistory, togglePin, clearHistory };
}

export function InputHistory({ onSelectHistory, maxItems = 10 }: InputHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { history, removeFromHistory, togglePin, clearHistory } = useInputHistory();
  
  const filteredHistory = history
    .filter(item => 
      searchQuery ? item.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .slice(0, maxItems);
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };
  
  if (history.length === 0) return null;
  
  return (
    <div className="input-history">
      <button
        className="history-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="입력 히스토리"
      >
        <Clock className="toggle-icon" />
        <ChevronUp className={`chevron ${isOpen ? "open" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="history-panel">
          <div className="history-header">
            <h4>이전 질문</h4>
            <div className="header-actions">
              <button onClick={clearHistory} className="clear-btn" title="전체 삭제">
                <Trash2 />
              </button>
            </div>
          </div>
          
          <div className="history-search">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="히스토리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <ul className="history-list">
            {filteredHistory.map(item => (
              <li key={item.id} className={`history-item ${item.isPinned ? "pinned" : ""}`}>
                <button
                  className="item-content"
                  onClick={() => {
                    onSelectHistory(item.text);
                    setIsOpen(false);
                  }}
                >
                  <span className="item-text">{item.text}</span>
                  <span className="item-time">{formatTime(item.timestamp)}</span>
                </button>
                <div className="item-actions">
                  <button
                    className={`action-btn pin ${item.isPinned ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.id);
                    }}
                    title={item.isPinned ? "고정 해제" : "고정"}
                  >
                    <Pin />
                  </button>
                  <button
                    className="action-btn reuse"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHistory(item.text);
                      setIsOpen(false);
                    }}
                    title="재사용"
                  >
                    <RotateCcw />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                    title="삭제"
                  >
                    <Trash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          {filteredHistory.length === 0 && searchQuery && (
            <div className="no-results">검색 결과가 없습니다.</div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .input-history {
          position: relative;
        }
        
        .history-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .history-toggle:hover {
          background: var(--bg-hover, #2e2e44);
          color: var(--text-primary, #e0e0e0);
        }
        
        .toggle-icon {
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
        
        .history-panel {
          position: absolute;
          bottom: 100%;
          right: 0;
          width: 400px;
          max-height: 400px;
          margin-bottom: 8px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          z-index: 100;
        }
        
        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .history-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
        
        .clear-btn {
          padding: 4px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .clear-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .clear-btn :global(svg) {
          width: 16px;
          height: 16px;
        }
        
        .history-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .search-icon {
          width: 16px;
          height: 16px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .history-search input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary, #e0e0e0);
          font-size: 13px;
          outline: none;
        }
        
        .history-search input::placeholder {
          color: var(--text-muted, #6e6e7e);
        }
        
        .history-list {
          list-style: none;
          margin: 0;
          padding: 8px;
          max-height: 280px;
          overflow-y: auto;
        }
        
        .history-item {
          display: flex;
          align-items: center;
          border-radius: 8px;
          margin-bottom: 4px;
          transition: background 0.15s ease;
        }
        
        .history-item:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .history-item.pinned {
          background: rgba(124, 58, 237, 0.1);
        }
        
        .item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
        }
        
        .item-text {
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .item-time {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .item-actions {
          display: flex;
          gap: 4px;
          padding-right: 8px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        
        .history-item:hover .item-actions {
          opacity: 1;
        }
        
        .action-btn {
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .action-btn :global(svg) {
          width: 14px;
          height: 14px;
        }
        
        .action-btn.pin:hover,
        .action-btn.pin.active {
          color: var(--primary, #7c3aed);
        }
        
        .action-btn.reuse:hover {
          color: #10b981;
        }
        
        .action-btn.delete:hover {
          color: #ef4444;
        }
        
        .no-results {
          padding: 24px;
          text-align: center;
          color: var(--text-muted, #6e6e7e);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

export default InputHistory;
