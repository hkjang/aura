"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  Camera, 
  Clock, 
  RotateCcw, 
  Trash2, 
  Download,
  ChevronDown,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StateSnapshot {
  id: string;
  name: string;
  timestamp: Date;
  data: {
    messages: Array<{ role: string; content: string }>;
    selectedModel?: string;
    inputValue?: string;
    settings?: Record<string, unknown>;
  };
  size: number; // bytes
}

interface StateSnapshotManagerProps {
  currentState: StateSnapshot["data"];
  onRestore: (snapshot: StateSnapshot) => void;
}

const STORAGE_KEY = "aura-state-snapshots";
const MAX_SNAPSHOTS = 10;

export function StateSnapshotManager({
  currentState,
  onRestore
}: StateSnapshotManagerProps) {
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>([]);
  const [showList, setShowList] = useState(false);
  const [savingName, setSavingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // 스냅샷 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSnapshots(parsed.map((s: StateSnapshot) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })));
      }
    } catch {
      // 무시
    }
  }, []);
  
  // 스냅샷 저장
  useEffect(() => {
    if (typeof window === "undefined" || snapshots.length === 0) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    } catch {
      // 용량 초과 등
    }
  }, [snapshots]);
  
  // 현재 상태 저장
  const saveSnapshot = useCallback(() => {
    if (!savingName.trim() && !isSaving) {
      setIsSaving(true);
      return;
    }
    
    const name = savingName.trim() || `스냅샷 ${new Date().toLocaleTimeString()}`;
    const dataStr = JSON.stringify(currentState);
    
    const newSnapshot: StateSnapshot = {
      id: `snapshot-${Date.now()}`,
      name,
      timestamp: new Date(),
      data: currentState,
      size: new Blob([dataStr]).size
    };
    
    setSnapshots(prev => {
      const updated = [newSnapshot, ...prev];
      // 최대 개수 제한
      return updated.slice(0, MAX_SNAPSHOTS);
    });
    
    setLastSaved(new Date());
    setSavingName("");
    setIsSaving(false);
  }, [savingName, currentState, isSaving]);
  
  // 스냅샷 복원
  const restoreSnapshot = useCallback((snapshot: StateSnapshot) => {
    onRestore(snapshot);
    setShowList(false);
  }, [onRestore]);
  
  // 스냅샷 삭제
  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  }, []);
  
  // 스냅샷 내보내기
  const exportSnapshot = useCallback((snapshot: StateSnapshot) => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snapshot.name.replace(/\s+/g, "_")}_${snapshot.timestamp.getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(1)}KB`;
  };
  
  return (
    <div className="snapshot-manager">
      <div className="snapshot-trigger">
        {isSaving ? (
          <div className="save-form">
            <input
              type="text"
              value={savingName}
              onChange={e => setSavingName(e.target.value)}
              placeholder="스냅샷 이름..."
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") saveSnapshot();
                if (e.key === "Escape") { setSavingName(""); setIsSaving(false); }
              }}
            />
            <button onClick={saveSnapshot}>
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button className="main-btn" onClick={() => setIsSaving(true)}>
            <Camera size={16} />
            <span>스냅샷 저장</span>
          </button>
        )}
        
        <button 
          className="list-btn"
          onClick={() => setShowList(!showList)}
        >
          <Clock size={14} />
          <span>{snapshots.length}</span>
          <ChevronDown className={showList ? "open" : ""} size={14} />
        </button>
      </div>
      
      {lastSaved && (
        <div className="last-saved">
          마지막 저장: {formatTime(lastSaved)}
        </div>
      )}
      
      {showList && (
        <div className="snapshots-list">
          {snapshots.length === 0 ? (
            <div className="empty-state">
              <Camera className="empty-icon" />
              <p>저장된 스냅샷이 없습니다</p>
            </div>
          ) : (
            snapshots.map(snapshot => (
              <div key={snapshot.id} className="snapshot-item">
                <div className="snapshot-info" onClick={() => restoreSnapshot(snapshot)}>
                  <span className="snapshot-name">{snapshot.name}</span>
                  <div className="snapshot-meta">
                    <span>{formatTime(snapshot.timestamp)}</span>
                    <span className="separator">·</span>
                    <span>{snapshot.data.messages?.length || 0}개 메시지</span>
                    <span className="separator">·</span>
                    <span>{formatSize(snapshot.size)}</span>
                  </div>
                </div>
                
                <div className="snapshot-actions">
                  <button onClick={() => restoreSnapshot(snapshot)} title="복원">
                    <RotateCcw size={14} />
                  </button>
                  <button onClick={() => exportSnapshot(snapshot)} title="내보내기">
                    <Download size={14} />
                  </button>
                  <button onClick={() => deleteSnapshot(snapshot.id)} title="삭제">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      <style jsx>{`
        .snapshot-manager {
          position: relative;
        }
        
        .snapshot-trigger {
          display: flex;
          gap: 8px;
        }
        
        .main-btn, .list-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .main-btn:hover, .list-btn:hover {
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .list-btn :global(.open) {
          transform: rotate(180deg);
        }
        
        .save-form {
          display: flex;
          gap: 6px;
        }
        
        .save-form input {
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--primary, #7c3aed);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-size: 12px;
          outline: none;
          width: 150px;
        }
        
        .save-form button {
          padding: 8px;
          background: var(--primary, #7c3aed);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }
        
        .last-saved {
          margin-top: 6px;
          font-size: 10px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .snapshots-list {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 320px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 100;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .empty-icon {
          width: 32px;
          height: 32px;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        
        .snapshot-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .snapshot-item:last-child {
          border-bottom: none;
        }
        
        .snapshot-item:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .snapshot-info {
          flex: 1;
          min-width: 0;
        }
        
        .snapshot-name {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .snapshot-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .separator {
          opacity: 0.5;
        }
        
        .snapshot-actions {
          display: flex;
          gap: 4px;
        }
        
        .snapshot-actions button {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          border-radius: 6px;
        }
        
        .snapshot-actions button:hover {
          background: var(--bg-tertiary, #252536);
          color: var(--text-primary, #e0e0e0);
        }
      `}</style>
    </div>
  );
}

export default StateSnapshotManager;
