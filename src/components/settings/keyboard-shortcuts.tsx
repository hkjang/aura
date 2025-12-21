"use client";

import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from "react";
import { Keyboard, Plus, Trash2, Edit3, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Shortcut {
  id: string;
  name: string;
  keys: string[];
  action: string;
  category: string;
  isCustom: boolean;
  isActive: boolean;
}

interface KeyboardShortcutsContextType {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Omit<Shortcut, "id" | "isCustom">) => string;
  removeShortcut: (id: string) => void;
  executeAction: (action: string) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

// 기본 단축키 정의
const DEFAULT_SHORTCUTS: Omit<Shortcut, "id" | "isCustom">[] = [
  { name: "새 대화", keys: ["Ctrl", "N"], action: "newChat", category: "chat", isActive: true },
  { name: "메시지 전송", keys: ["Ctrl", "Enter"], action: "sendMessage", category: "chat", isActive: true },
  { name: "이전 대화", keys: ["Ctrl", "ArrowUp"], action: "prevHistory", category: "navigation", isActive: true },
  { name: "다음 대화", keys: ["Ctrl", "ArrowDown"], action: "nextHistory", category: "navigation", isActive: true },
  { name: "집중 모드", keys: ["F11"], action: "focusMode", category: "view", isActive: true },
  { name: "사이드바 토글", keys: ["Ctrl", "B"], action: "toggleSidebar", category: "view", isActive: true },
  { name: "검색", keys: ["Ctrl", "K"], action: "openSearch", category: "navigation", isActive: true },
  { name: "설정", keys: ["Ctrl", ","], action: "openSettings", category: "navigation", isActive: true },
];

export function KeyboardShortcutsProvider({ 
  children,
  onAction
}: { 
  children: ReactNode;
  onAction?: (action: string) => void;
}) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    if (typeof window === "undefined") return [];
    
    const saved = localStorage.getItem("aura-keyboard-shortcuts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SHORTCUTS.map((s, i) => ({ ...s, id: `shortcut-${i}`, isCustom: false }));
      }
    }
    return DEFAULT_SHORTCUTS.map((s, i) => ({ ...s, id: `shortcut-${i}`, isCustom: false }));
  });
  
  // 단축키 저장
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aura-keyboard-shortcuts", JSON.stringify(shortcuts));
    }
  }, [shortcuts]);
  
  // 키 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pressedKeys: string[] = [];
      if (e.ctrlKey) pressedKeys.push("Ctrl");
      if (e.altKey) pressedKeys.push("Alt");
      if (e.shiftKey) pressedKeys.push("Shift");
      if (e.metaKey) pressedKeys.push("Meta");
      
      if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
        pressedKeys.push(e.key);
      }
      
      const activeShortcuts = shortcuts.filter(s => s.isActive);
      const matchedShortcut = activeShortcuts.find(s => {
        if (s.keys.length !== pressedKeys.length) return false;
        return s.keys.every((key, i) => 
          key.toLowerCase() === pressedKeys[i].toLowerCase()
        );
      });
      
      if (matchedShortcut) {
        e.preventDefault();
        onAction?.(matchedShortcut.action);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, onAction]);
  
  const registerShortcut = useCallback((shortcut: Omit<Shortcut, "id" | "isCustom">) => {
    const id = `custom-${Date.now()}`;
    setShortcuts(prev => [...prev, { ...shortcut, id, isCustom: true }]);
    return id;
  }, []);
  
  const removeShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);
  
  const executeAction = useCallback((action: string) => {
    onAction?.(action);
  }, [onAction]);
  
  return (
    <KeyboardShortcutsContext.Provider value={{ shortcuts, registerShortcut, removeShortcut, executeAction }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  }
  return context;
}

// 단축키 설정 UI 컴포넌트
interface ShortcutsManagerProps {
  shortcuts: Shortcut[];
  onToggle: (id: string, isActive: boolean) => void;
  onAdd: (shortcut: Omit<Shortcut, "id" | "isCustom">) => void;
  onRemove: (id: string) => void;
}

export function ShortcutsManager({ shortcuts, onToggle, onAdd, onRemove }: ShortcutsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newShortcut, setNewShortcut] = useState({
    name: "",
    keys: [] as string[],
    action: "",
    category: "custom"
  });
  const [isRecording, setIsRecording] = useState(false);
  
  // 카테고리별 그룹화
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, Shortcut[]> = {};
    shortcuts.forEach(s => {
      if (!groups[s.category]) {
        groups[s.category] = [];
      }
      groups[s.category].push(s);
    });
    return groups;
  }, [shortcuts]);
  
  // 키 입력 녹화
  const handleKeyRecord = useCallback((e: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey) keys.push("Ctrl");
    if (e.altKey) keys.push("Alt");
    if (e.shiftKey) keys.push("Shift");
    
    if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      keys.push(e.key === " " ? "Space" : e.key);
    }
    
    if (keys.length > 0) {
      setNewShortcut(prev => ({ ...prev, keys }));
      setIsRecording(false);
    }
  }, [isRecording]);
  
  // 충돌 감지
  const hasConflict = useMemo(() => {
    if (newShortcut.keys.length === 0) return false;
    return shortcuts.some(s => 
      s.keys.length === newShortcut.keys.length &&
      s.keys.every((k, i) => k.toLowerCase() === newShortcut.keys[i]?.toLowerCase())
    );
  }, [shortcuts, newShortcut.keys]);
  
  const handleAddShortcut = () => {
    if (!newShortcut.name || newShortcut.keys.length === 0 || !newShortcut.action) return;
    if (hasConflict) return;
    
    onAdd({ ...newShortcut, isActive: true });
    setNewShortcut({ name: "", keys: [], action: "", category: "custom" });
    setIsAdding(false);
  };
  
  const CATEGORY_LABELS: Record<string, string> = {
    chat: "채팅",
    navigation: "탐색",
    view: "화면",
    custom: "사용자 정의"
  };
  
  return (
    <div className="shortcuts-manager">
      <div className="manager-header">
        <h3>
          <Keyboard className="header-icon" />
          키보드 단축키
        </h3>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus size={16} className="mr-2" />
          추가
        </Button>
      </div>
      
      <div className="shortcuts-list">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category} className="shortcut-group">
            <h4>{CATEGORY_LABELS[category] || category}</h4>
            {categoryShortcuts.map(shortcut => (
              <div key={shortcut.id} className={`shortcut-item ${!shortcut.isActive ? "inactive" : ""}`}>
                <div className="shortcut-info">
                  <span className="shortcut-name">{shortcut.name}</span>
                  <div className="shortcut-keys">
                    {shortcut.keys.map((key, i) => (
                      <span key={i}>
                        <kbd>{key}</kbd>
                        {i < shortcut.keys.length - 1 && <span className="key-separator">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shortcut-actions">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={shortcut.isActive}
                      onChange={e => onToggle(shortcut.id, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  {shortcut.isCustom && (
                    <button className="delete-btn" onClick={() => onRemove(shortcut.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* 추가 모달 */}
      {isAdding && (
        <div className="add-modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="add-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>새 단축키 추가</h4>
              <button onClick={() => setIsAdding(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={newShortcut.name}
                  onChange={e => setNewShortcut(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="단축키 이름"
                />
              </div>
              
              <div className="form-group">
                <label>키 조합</label>
                <div
                  className={`key-recorder ${isRecording ? "recording" : ""} ${hasConflict ? "conflict" : ""}`}
                  tabIndex={0}
                  onClick={() => setIsRecording(true)}
                  onKeyDown={handleKeyRecord}
                >
                  {newShortcut.keys.length > 0 ? (
                    newShortcut.keys.map((key, i) => (
                      <span key={i}>
                        <kbd>{key}</kbd>
                        {i < newShortcut.keys.length - 1 && "+"}
                      </span>
                    ))
                  ) : (
                    <span className="placeholder">{isRecording ? "키를 누르세요..." : "클릭하여 단축키 입력"}</span>
                  )}
                </div>
                {hasConflict && (
                  <span className="conflict-warning">
                    <AlertTriangle size={12} />
                    이미 사용 중인 단축키입니다
                  </span>
                )}
              </div>
              
              <div className="form-group">
                <label>액션 ID</label>
                <input
                  type="text"
                  value={newShortcut.action}
                  onChange={e => setNewShortcut(prev => ({ ...prev, action: e.target.value }))}
                  placeholder="실행할 액션 ID (예: openSettings)"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <Button variant="outline" onClick={() => setIsAdding(false)}>취소</Button>
              <Button onClick={handleAddShortcut} disabled={hasConflict}>
                <Check size={16} className="mr-2" />
                추가
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .shortcuts-manager {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .manager-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .manager-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 16px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 20px;
          height: 20px;
          color: var(--primary, #7c3aed);
        }
        
        .shortcuts-list {
          padding: 16px 20px;
        }
        
        .shortcut-group {
          margin-bottom: 20px;
        }
        
        .shortcut-group:last-child {
          margin-bottom: 0;
        }
        
        .shortcut-group h4 {
          margin: 0 0 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted, #6e6e7e);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .shortcut-item.inactive {
          opacity: 0.5;
        }
        
        .shortcut-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .shortcut-name {
          font-size: 14px;
          color: var(--text-primary, #e0e0e0);
          min-width: 120px;
        }
        
        .shortcut-keys {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .shortcut-keys kbd {
          padding: 4px 8px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .key-separator {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .shortcut-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .toggle {
          position: relative;
          width: 40px;
          height: 22px;
        }
        
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: var(--bg-tertiary, #252536);
          border-radius: 22px;
          transition: background 0.3s ease;
        }
        
        .toggle-slider:before {
          content: "";
          position: absolute;
          width: 18px;
          height: 18px;
          left: 2px;
          bottom: 2px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }
        
        .toggle input:checked + .toggle-slider {
          background: var(--primary, #7c3aed);
        }
        
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(18px);
        }
        
        .delete-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .delete-btn:hover {
          color: #ef4444;
        }
        
        .add-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .add-modal {
          width: 90%;
          max-width: 400px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .modal-header h4 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .modal-header button {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .modal-content {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          outline: none;
        }
        
        .key-recorder {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 16px;
          background: var(--bg-secondary, #1e1e2e);
          border: 2px dashed var(--border-color, #3e3e5a);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 52px;
        }
        
        .key-recorder.recording {
          border-color: var(--primary, #7c3aed);
          animation: pulse 1s infinite;
        }
        
        .key-recorder.conflict {
          border-color: #ef4444;
        }
        
        .key-recorder kbd {
          padding: 6px 12px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .key-recorder .placeholder {
          color: var(--text-muted, #6e6e7e);
          font-size: 13px;
        }
        
        .conflict-warning {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 12px;
          color: #ef4444;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
      `}</style>
    </div>
  );
}

export default ShortcutsManager;
