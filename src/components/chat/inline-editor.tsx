"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Edit3, Check, X, RotateCcw, Type } from "lucide-react";

interface InlineEditorProps {
  content: string;
  onSave: (newContent: string) => void;
  isEditable?: boolean;
  className?: string;
}

export function InlineEditor({
  content,
  onSave,
  isEditable = true,
  className = ""
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setEditedContent(content);
    setHistory([content]);
    setHistoryIndex(0);
  }, [content]);
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, [isEditing]);
  
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);
  
  const handleStartEdit = () => {
    if (!isEditable) return;
    setIsEditing(true);
    setEditedContent(content);
  };
  
  const handleSave = () => {
    if (editedContent !== content) {
      onSave(editedContent);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), editedContent]);
      setHistoryIndex(prev => prev + 1);
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedContent(history[newIndex]);
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditedContent(history[newIndex]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }
  };
  
  const wordCount = editedContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = editedContent.length;
  
  if (!isEditing) {
    return (
      <div className={`inline-editor-view ${className}`}>
        <div className="content-display" onClick={handleStartEdit}>
          {content}
        </div>
        {isEditable && (
          <button className="edit-trigger" onClick={handleStartEdit} title="편집">
            <Edit3 />
          </button>
        )}
        
        <style jsx>{`
          .inline-editor-view {
            position: relative;
            cursor: text;
          }
          
          .content-display {
            padding: 4px;
            border-radius: 6px;
            transition: background 0.2s ease;
          }
          
          .inline-editor-view:hover .content-display {
            background: var(--bg-hover, rgba(124, 58, 237, 0.1));
          }
          
          .edit-trigger {
            position: absolute;
            top: 4px;
            right: 4px;
            padding: 6px;
            background: var(--bg-secondary, #1e1e2e);
            border: 1px solid var(--border-color, #3e3e5a);
            border-radius: 6px;
            color: var(--text-muted, #6e6e7e);
            opacity: 0;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .inline-editor-view:hover .edit-trigger {
            opacity: 1;
          }
          
          .edit-trigger:hover {
            color: var(--primary, #7c3aed);
            border-color: var(--primary, #7c3aed);
          }
          
          .edit-trigger :global(svg) {
            width: 14px;
            height: 14px;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className={`inline-editor-edit ${className}`}>
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <Type className="editor-icon" />
          <span>편집 중</span>
        </div>
        <div className="toolbar-right">
          <span className="stats">
            {wordCount} 단어 · {charCount} 자
          </span>
          <button
            className="toolbar-btn"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="실행 취소 (Ctrl+Z)"
          >
            <RotateCcw />
          </button>
          <button
            className="toolbar-btn cancel"
            onClick={handleCancel}
            title="취소 (Esc)"
          >
            <X />
          </button>
          <button
            className="toolbar-btn save"
            onClick={handleSave}
            title="저장 (Ctrl+Enter)"
          >
            <Check />
          </button>
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        value={editedContent}
        onChange={(e) => {
          setEditedContent(e.target.value);
          adjustTextareaHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder="내용을 편집하세요..."
      />
      
      <div className="editor-hint">
        <span>Ctrl+Enter</span> 저장 · <span>Esc</span> 취소 · <span>Ctrl+Z</span> 실행 취소
      </div>
      
      <style jsx>{`
        .inline-editor-edit {
          background: var(--bg-secondary, #1e1e2e);
          border: 2px solid var(--primary, #7c3aed);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .editor-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-tertiary, #252536);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--primary, #7c3aed);
          font-weight: 500;
        }
        
        .editor-icon {
          width: 16px;
          height: 16px;
        }
        
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stats {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
          margin-right: 8px;
        }
        
        .toolbar-btn {
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .toolbar-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .toolbar-btn:not(:disabled):hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .toolbar-btn.cancel:hover {
          color: #ef4444;
        }
        
        .toolbar-btn.save {
          background: var(--primary, #7c3aed);
          color: white;
        }
        
        .toolbar-btn.save:hover {
          background: var(--primary-dark, #6d28d9);
        }
        
        .toolbar-btn :global(svg) {
          width: 16px;
          height: 16px;
        }
        
        textarea {
          width: 100%;
          min-height: 120px;
          padding: 16px;
          background: transparent;
          border: none;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          font-family: inherit;
          line-height: 1.6;
          resize: none;
          outline: none;
        }
        
        textarea::placeholder {
          color: var(--text-muted, #6e6e7e);
        }
        
        .editor-hint {
          padding: 8px 12px;
          background: var(--bg-tertiary, #252536);
          border-top: 1px solid var(--border-color, #3e3e5a);
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .editor-hint span {
          display: inline-block;
          padding: 2px 6px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 4px;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

export default InlineEditor;
