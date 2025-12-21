"use client";

import { useState, useCallback } from "react";
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Tag, 
  Calendar,
  Search,
  Sparkles,
  Save,
  X,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sourceMessageId?: string;
  sourceContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AINotesProps {
  notes: Note[];
  onCreateNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (id: string, note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onGenerateFromResponse?: (content: string) => void;
}

// AI 기반 노트 자동 생성 (시뮬레이션)
function generateNoteFromContent(content: string): Omit<Note, "id" | "createdAt" | "updatedAt"> {
  // 제목 추출: 첫 문장 또는 첫 20자
  const firstLine = content.split("\n")[0] || content;
  const title = firstLine.length > 50 
    ? firstLine.slice(0, 50) + "..." 
    : firstLine;
  
  // 요약 생성: 핵심 문장 추출
  const sentences = content.split(/[.!?]\s+/).filter(Boolean);
  const summary = sentences.slice(0, 3).join(". ");
  
  // 태그 추출: 키워드 기반
  const tags: string[] = [];
  const keywords = ["코드", "API", "함수", "설명", "예시", "비교", "분석"];
  keywords.forEach(kw => {
    if (content.includes(kw)) tags.push(kw);
  });
  
  // 영어 키워드
  const engKeywords = ["code", "function", "example", "compare", "analysis"];
  engKeywords.forEach(kw => {
    if (content.toLowerCase().includes(kw)) tags.push(kw);
  });
  
  return {
    title,
    content: summary + (summary.endsWith(".") ? "" : "."),
    tags: tags.slice(0, 5),
    sourceContent: content.slice(0, 500)
  };
}

export function AINotes({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onGenerateFromResponse
}: AINotesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  
  // 모든 태그 수집
  const allTags = Array.from(
    new Set(notes.flatMap(n => n.tags))
  );
  
  // 필터링된 노트
  const filteredNotes = notes.filter(note => {
    if (selectedTag && !note.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });
  
  const handleSaveNote = useCallback(() => {
    if (!editingNote?.title || !editingNote?.content) return;
    
    if (editingNote.id) {
      onUpdateNote(editingNote.id, editingNote);
    } else {
      onCreateNote({
        title: editingNote.title,
        content: editingNote.content,
        tags: editingNote.tags || []
      });
    }
    
    setIsEditing(false);
    setEditingNote(null);
  }, [editingNote, onCreateNote, onUpdateNote]);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };
  
  return (
    <div className="ai-notes">
      <div className="notes-header">
        <h3>
          <FileText className="header-icon" />
          AI 노트
        </h3>
        <Button
          onClick={() => {
            setEditingNote({ title: "", content: "", tags: [] });
            setIsEditing(true);
          }}
          size="sm"
        >
          <Plus className="mr-2" size={16} />
          새 노트
        </Button>
      </div>
      
      <div className="notes-toolbar">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="노트 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {allTags.length > 0 && (
        <div className="tag-filter">
          <button
            className={`tag-btn ${!selectedTag ? "active" : ""}`}
            onClick={() => setSelectedTag(null)}
          >
            전체
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-btn ${selectedTag === tag ? "active" : ""}`}
              onClick={() => setSelectedTag(tag)}
            >
              <Tag size={12} />
              {tag}
            </button>
          ))}
        </div>
      )}
      
      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <Sparkles className="empty-icon" />
            <p>저장된 노트가 없습니다.</p>
            <p className="empty-hint">AI 응답에서 노트를 자동 생성하세요.</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`note-card ${expandedNoteId === note.id ? "expanded" : ""}`}
            >
              <div
                className="note-header"
                onClick={() => setExpandedNoteId(
                  expandedNoteId === note.id ? null : note.id
                )}
              >
                <h4>{note.title}</h4>
                <ChevronDown className={`expand-icon ${expandedNoteId === note.id ? "rotated" : ""}`} />
              </div>
              
              <div className="note-meta">
                <Calendar size={12} />
                <span>{formatDate(note.updatedAt)}</span>
              </div>
              
              {note.tags.length > 0 && (
                <div className="note-tags">
                  {note.tags.map(tag => (
                    <span key={tag} className="tag">
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {expandedNoteId === note.id && (
                <div className="note-content">
                  <p>{note.content}</p>
                  
                  {note.sourceContent && (
                    <div className="source-preview">
                      <span className="source-label">원본 응답</span>
                      <p>{note.sourceContent}</p>
                    </div>
                  )}
                  
                  <div className="note-actions">
                    <button
                      onClick={() => {
                        setEditingNote(note);
                        setIsEditing(true);
                      }}
                    >
                      <Edit3 size={14} />
                      편집
                    </button>
                    <button
                      className="delete"
                      onClick={() => onDeleteNote(note.id)}
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* 편집 모달 */}
      {isEditing && editingNote && (
        <div className="edit-overlay" onClick={() => setIsEditing(false)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editingNote.id ? "노트 편집" : "새 노트"}</h4>
              <button onClick={() => setIsEditing(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={editingNote.title || ""}
                  onChange={e => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="노트 제목"
                />
              </div>
              
              <div className="form-group">
                <label>내용</label>
                <textarea
                  value={editingNote.content || ""}
                  onChange={e => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="노트 내용..."
                  rows={6}
                />
              </div>
              
              <div className="form-group">
                <label>태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={editingNote.tags?.join(", ") || ""}
                  onChange={e => setEditingNote(prev => ({
                    ...prev,
                    tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                  }))}
                  placeholder="tag1, tag2"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button onClick={handleSaveNote}>
                <Save size={16} className="mr-2" />
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .ai-notes {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .notes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .notes-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 20px;
          height: 20px;
          color: var(--primary, #7c3aed);
        }
        
        .notes-toolbar {
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
        }
        
        .search-icon {
          width: 18px;
          height: 18px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          outline: none;
        }
        
        .tag-filter {
          display: flex;
          gap: 8px;
          padding: 12px 20px;
          overflow-x: auto;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .tag-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .tag-btn:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .tag-btn.active {
          background: var(--primary, #7c3aed);
          border-color: var(--primary, #7c3aed);
          color: white;
        }
        
        .notes-list {
          flex: 1;
          padding: 16px 20px;
          overflow-y: auto;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          text-align: center;
          color: var(--text-muted, #6e6e7e);
        }
        
        .empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-hint {
          font-size: 13px;
          margin-top: 8px;
        }
        
        .note-card {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          transition: border-color 0.2s ease;
        }
        
        .note-card:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .note-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        
        .note-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .expand-icon {
          width: 18px;
          height: 18px;
          color: var(--text-muted, #6e6e7e);
          transition: transform 0.2s ease;
        }
        
        .expand-icon.rotated {
          transform: rotate(180deg);
        }
        
        .note-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .note-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        
        .note-tags .tag {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: var(--bg-tertiary, #252536);
          border-radius: 10px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .note-content {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
        
        .note-content p {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary, #a0a0b0);
          line-height: 1.6;
        }
        
        .source-preview {
          margin-top: 16px;
          padding: 12px;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
        }
        
        .source-label {
          display: block;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
          margin-bottom: 8px;
        }
        
        .source-preview p {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .note-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        
        .note-actions button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
        }
        
        .note-actions button:hover {
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .note-actions button.delete:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        
        .edit-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .edit-modal {
          width: 90%;
          max-width: 500px;
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
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          outline: none;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          border-color: var(--primary, #7c3aed);
        }
        
        .form-group textarea {
          resize: vertical;
          font-family: inherit;
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

// AI 노트 자동 생성 유틸리티 함수 export
export { generateNoteFromContent };
export default AINotes;
