"use client";

import { useState, useEffect, useCallback } from "react";
import { Maximize2, Minimize2, Eye, EyeOff, Moon, Sun } from "lucide-react";

interface FocusModeProps {
  children: React.ReactNode;
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

interface FocusModeContextType {
  isFocused: boolean;
  isZenMode: boolean;
  toggleFocus: () => void;
  toggleZenMode: () => void;
}

export function FocusMode({ children, isEnabled: initialEnabled = false, onToggle }: FocusModeProps) {
  const [isFocused, setIsFocused] = useState(initialEnabled);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 또는 Ctrl+Shift+F: 전체 화면 토글
      if (e.key === "F11" || (e.ctrlKey && e.shiftKey && e.key === "F")) {
        e.preventDefault();
        setIsFocused(prev => !prev);
      }
      // Ctrl+Shift+Z: 젠 모드 토글
      if (e.ctrlKey && e.shiftKey && e.key === "Z") {
        e.preventDefault();
        setIsZenMode(prev => !prev);
      }
      // Esc: 집중 모드 해제
      if (e.key === "Escape" && isFocused) {
        setIsFocused(false);
        setIsZenMode(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);
  
  // 외부 콜백 호출
  useEffect(() => {
    onToggle?.(isFocused);
  }, [isFocused, onToggle]);
  
  // 마우스 움직임으로 컨트롤 표시
  useEffect(() => {
    if (!isFocused) return;
    
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFocused]);
  
  const toggleFocus = useCallback(() => {
    setIsFocused(prev => !prev);
  }, []);
  
  const toggleZenMode = useCallback(() => {
    setIsZenMode(prev => !prev);
  }, []);
  
  return (
    <div className={`focus-mode-wrapper ${isFocused ? "focused" : ""} ${isZenMode ? "zen" : ""}`}>
      {/* 집중 모드 컨트롤 */}
      <div className={`focus-controls ${showControls || !isFocused ? "visible" : ""}`}>
        <button
          className="control-btn"
          onClick={toggleFocus}
          title={isFocused ? "일반 모드 (Esc)" : "집중 모드 (F11)"}
        >
          {isFocused ? <Minimize2 /> : <Maximize2 />}
          <span>{isFocused ? "나가기" : "집중 모드"}</span>
        </button>
        
        {isFocused && (
          <button
            className="control-btn"
            onClick={toggleZenMode}
            title={isZenMode ? "일반 테마" : "젠 모드 (Ctrl+Shift+Z)"}
          >
            {isZenMode ? <Sun /> : <Moon />}
            <span>{isZenMode ? "일반" : "젠"}</span>
          </button>
        )}
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="focus-content">
        {children}
      </div>
      
      {/* 집중 모드 상태바 (숨김 가능) */}
      {isFocused && (
        <div className={`focus-status ${showControls ? "visible" : ""}`}>
          <button
            className="hide-status"
            onClick={() => setShowControls(!showControls)}
            title={showControls ? "상태바 숨기기" : "상태바 표시"}
          >
            {showControls ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <span>집중 모드 {isZenMode && "· 젠"}</span>
          <span className="hint">ESC로 나가기</span>
        </div>
      )}
      
      <style jsx>{`
        .focus-mode-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          transition: all 0.3s ease;
        }
        
        .focus-mode-wrapper.focused {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: var(--bg-primary, #12121a);
        }
        
        .focus-mode-wrapper.focused.zen {
          background: #0a0a0f;
        }
        
        .focus-content {
          width: 100%;
          height: 100%;
          overflow: auto;
        }
        
        .focus-mode-wrapper.focused .focus-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .focus-mode-wrapper.focused.zen .focus-content {
          max-width: 700px;
        }
        
        .focus-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
          z-index: 10000;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          pointer-events: none;
        }
        
        .focus-controls.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        
        .focus-mode-wrapper:not(.focused) .focus-controls {
          position: absolute;
        }
        
        .control-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .control-btn:hover {
          background: var(--bg-hover, #2e2e44);
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .control-btn :global(svg) {
          width: 18px;
          height: 18px;
        }
        
        .focus-status {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 30px;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
          opacity: 0;
          transition: all 0.3s ease;
          z-index: 10000;
        }
        
        .focus-status.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        
        .hide-status {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .hide-status:hover {
          color: var(--primary, #7c3aed);
        }
        
        .hint {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
          padding: 4px 8px;
          background: var(--bg-tertiary, #252536);
          border-radius: 12px;
        }
        
        /* 젠 모드 스타일 오버라이드 */
        .focus-mode-wrapper.zen :global(*) {
          --bg-primary: #0a0a0f;
          --bg-secondary: #101018;
          --bg-tertiary: #16161e;
          --border-color: #1e1e28;
        }
      `}</style>
    </div>
  );
}

export default FocusMode;
