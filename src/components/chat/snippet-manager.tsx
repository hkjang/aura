"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Tag, 
  Search,
  X,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Snippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

interface SnippetManagerProps {
  onInsertSnippet: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "prompt", label: "프롬프트", icon: "💬" },
  { id: "code", label: "코드", icon: "💻" },
  { id: "template", label: "템플릿", icon: "📄" },
  { id: "instruction", label: "지시사항", icon: "📋" },
  { id: "other", label: "기타", icon: "📁" },
];

export function SnippetManager({ onInsertSnippet, isOpen, onClose }: SnippetManagerProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Partial<Snippet> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // 스니펫 로드
  const loadSnippets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/snippets");
      if (response.ok) {
        const data = await response.json();
        setSnippets(data.map((s: Snippet) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        })));
      }
    } catch (error) {
      console.error("Failed to load snippets:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      loadSnippets();
    }
  }, [isOpen, loadSnippets]);
  
  // 스니펫 저장
  const saveSnippet = async () => {
    if (!editingSnippet?.title || !editingSnippet?.content) return;
    
    try {
      const method = editingSnippet.id ? "PUT" : "POST";
      const response = await fetch("/api/snippets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSnippet)
      });
      
      if (response.ok) {
        await loadSnippets();
        setIsEditing(false);
        setEditingSnippet(null);
      }
    } catch (error) {
      console.error("Failed to save snippet:", error);
    }
  };
  
  // 스니펫 삭제
  const deleteSnippet = async (id: string) => {
    if (!confirm("이 스니펫을 삭제하시겠습니까?")) return;
    
    try {
      const response = await fetch(`/api/snippets?id=${id}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setSnippets(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete snippet:", error);
    }
  };
  
  // 스니펫 복사
  const copySnippet = async (snippet: Snippet) => {
    await navigator.clipboard.writeText(snippet.content);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  // 스니펫 삽입
  const insertSnippet = (snippet: Snippet) => {
    onInsertSnippet(snippet.content);
    // 사용 횟수 업데이트
    fetch("/api/snippets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...snippet, usageCount: snippet.usageCount + 1 })
    }).catch(console.error);
    onClose();
  };
  
  // 필터링된 스니펫
  const filteredSnippets = snippets
    .filter(s => {
      if (selectedCategory && s.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query) ||
          s.tags.some(t => t.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => b.usageCount - a.usageCount);
  
  if (!isOpen) return null;
  
  return (
    <div className="snippet-manager-overlay" onClick={onClose}>
      <div className="snippet-manager" onClick={e => e.stopPropagation()}>
        <div className="manager-header">
          <h3>스니펫 관리</h3>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>
        
        <div className="manager-toolbar">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="스니펫 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setEditingSnippet({
                title: "",
                content: "",
                tags: [],
                category: "prompt"
              });
              setIsEditing(true);
            }}
            className="add-btn"
          >
            <Plus className="mr-2" />
            새 스니펫
          </Button>
        </div>
        
        <div className="category-tabs">
          <button
            className={`category-tab ${!selectedCategory ? "active" : ""}`}
            onClick={() => setSelectedCategory(null)}
          >
            전체
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
        
        <div className="snippets-list">
          {isLoading ? (
            <div className="loading">로딩 중...</div>
          ) : filteredSnippets.length === 0 ? (
            <div className="empty">
              {searchQuery ? "검색 결과가 없습니다." : "저장된 스니펫이 없습니다."}
            </div>
          ) : (
            filteredSnippets.map(snippet => (
              <div key={snippet.id} className="snippet-card">
                <div className="snippet-header">
                  <div className="snippet-title">
                    <FileText className="title-icon" />
                    <span>{snippet.title}</span>
                  </div>
                  <div className="snippet-actions">
                    <button
                      onClick={() => copySnippet(snippet)}
                      title="복사"
                    >
                      {copiedId === snippet.id ? <Check /> : <Copy />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingSnippet(snippet);
                        setIsEditing(true);
                      }}
                      title="편집"
                    >
                      <Edit3 />
                    </button>
                    <button
                      onClick={() => deleteSnippet(snippet.id)}
                      title="삭제"
                      className="delete"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
                
                <div className="snippet-preview" onClick={() => insertSnippet(snippet)}>
                  {snippet.content.slice(0, 150)}
                  {snippet.content.length > 150 && "..."}
                </div>
                
                {snippet.tags.length > 0 && (
                  <div className="snippet-tags">
                    {snippet.tags.map(tag => (
                      <span key={tag} className="tag">
                        <Tag className="tag-icon" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="snippet-meta">
                  <span>사용: {snippet.usageCount}회</span>
                  <span>{CATEGORIES.find(c => c.id === snippet.category)?.label}</span>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* 편집 모달 */}
        {isEditing && editingSnippet && (
          <div className="edit-modal">
            <div className="edit-header">
              <h4>{editingSnippet.id ? "스니펫 편집" : "새 스니펫"}</h4>
              <button onClick={() => { setIsEditing(false); setEditingSnippet(null); }}>
                <X />
              </button>
            </div>
            
            <div className="edit-form">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={editingSnippet.title || ""}
                  onChange={e => setEditingSnippet(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="스니펫 제목"
                />
              </div>
              
              <div className="form-group">
                <label>카테고리</label>
                <div className="category-select">
                  <select
                    value={editingSnippet.category || "prompt"}
                    onChange={e => setEditingSnippet(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              </div>
              
              <div className="form-group">
                <label>내용</label>
                <textarea
                  value={editingSnippet.content || ""}
                  onChange={e => setEditingSnippet(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="스니펫 내용을 입력하세요..."
                  rows={6}
                />
              </div>
              
              <div className="form-group">
                <label>태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={editingSnippet.tags?.join(", ") || ""}
                  onChange={e => setEditingSnippet(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) 
                  }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              <div className="form-actions">
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditingSnippet(null); }}>
                  취소
                </Button>
                <Button onClick={saveSnippet}>
                  저장
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <style jsx>{`
          .snippet-manager-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .snippet-manager {
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            background: var(--bg-primary, #12121a);
            border: 1px solid var(--border-color, #3e3e5a);
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
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
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary, #e0e0e0);
          }
          
          .close-btn {
            padding: 8px;
            background: transparent;
            border: none;
            border-radius: 8px;
            color: var(--text-muted, #6e6e7e);
            cursor: pointer;
          }
          
          .close-btn:hover {
            background: var(--bg-hover, #2e2e44);
            color: var(--text-primary, #e0e0e0);
          }
          
          .close-btn :global(svg) {
            width: 20px;
            height: 20px;
          }
          
          .manager-toolbar {
            display: flex;
            gap: 12px;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color, #3e3e5a);
          }
          
          .search-box {
            flex: 1;
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
          
          .manager-toolbar :global(.add-btn) {
            background: var(--primary, #7c3aed);
          }
          
          .category-tabs {
            display: flex;
            gap: 8px;
            padding: 12px 20px;
            overflow-x: auto;
            border-bottom: 1px solid var(--border-color, #3e3e5a);
          }
          
          .category-tab {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            background: transparent;
            border: 1px solid var(--border-color, #3e3e5a);
            border-radius: 20px;
            color: var(--text-secondary, #a0a0b0);
            font-size: 13px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s ease;
          }
          
          .category-tab:hover {
            background: var(--bg-hover, #2e2e44);
          }
          
          .category-tab.active {
            background: var(--primary, #7c3aed);
            border-color: var(--primary, #7c3aed);
            color: white;
          }
          
          .cat-icon {
            font-size: 14px;
          }
          
          .snippets-list {
            flex: 1;
            padding: 16px 20px;
            overflow-y: auto;
          }
          
          .loading, .empty {
            padding: 40px;
            text-align: center;
            color: var(--text-muted, #6e6e7e);
          }
          
          .snippet-card {
            background: var(--bg-secondary, #1e1e2e);
            border: 1px solid var(--border-color, #3e3e5a);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            transition: border-color 0.2s ease;
          }
          
          .snippet-card:hover {
            border-color: var(--primary, #7c3aed);
          }
          
          .snippet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          
          .snippet-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: var(--text-primary, #e0e0e0);
          }
          
          .title-icon {
            width: 16px;
            height: 16px;
            color: var(--primary, #7c3aed);
          }
          
          .snippet-actions {
            display: flex;
            gap: 4px;
          }
          
          .snippet-actions button {
            padding: 6px;
            background: transparent;
            border: none;
            border-radius: 6px;
            color: var(--text-muted, #6e6e7e);
            cursor: pointer;
          }
          
          .snippet-actions button:hover {
            background: var(--bg-hover, #2e2e44);
            color: var(--text-primary, #e0e0e0);
          }
          
          .snippet-actions button.delete:hover {
            color: #ef4444;
          }
          
          .snippet-actions button :global(svg) {
            width: 14px;
            height: 14px;
          }
          
          .snippet-preview {
            font-size: 13px;
            color: var(--text-secondary, #a0a0b0);
            line-height: 1.5;
            cursor: pointer;
            padding: 8px;
            background: var(--bg-primary, #12121a);
            border-radius: 8px;
            margin-bottom: 10px;
          }
          
          .snippet-preview:hover {
            color: var(--text-primary, #e0e0e0);
          }
          
          .snippet-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 10px;
          }
          
          .tag {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background: var(--bg-tertiary, #252536);
            border-radius: 12px;
            font-size: 11px;
            color: var(--text-muted, #6e6e7e);
          }
          
          .tag-icon {
            width: 10px;
            height: 10px;
          }
          
          .snippet-meta {
            display: flex;
            gap: 16px;
            font-size: 11px;
            color: var(--text-muted, #6e6e7e);
          }
          
          .edit-modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 500px;
            background: var(--bg-primary, #12121a);
            border: 1px solid var(--border-color, #3e3e5a);
            border-radius: 16px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          }
          
          .edit-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color, #3e3e5a);
          }
          
          .edit-header h4 {
            margin: 0;
            font-size: 16px;
            color: var(--text-primary, #e0e0e0);
          }
          
          .edit-header button {
            padding: 6px;
            background: transparent;
            border: none;
            color: var(--text-muted, #6e6e7e);
            cursor: pointer;
          }
          
          .edit-header button :global(svg) {
            width: 18px;
            height: 18px;
          }
          
          .edit-form {
            padding: 20px;
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary, #a0a0b0);
          }
          
          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 10px 14px;
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
          
          .category-select {
            position: relative;
          }
          
          .category-select select {
            width: 100%;
            padding: 10px 14px;
            padding-right: 40px;
            background: var(--bg-secondary, #1e1e2e);
            border: 1px solid var(--border-color, #3e3e5a);
            border-radius: 8px;
            color: var(--text-primary, #e0e0e0);
            font-size: 14px;
            appearance: none;
            cursor: pointer;
          }
          
          .select-icon {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            color: var(--text-muted, #6e6e7e);
            pointer-events: none;
          }
          
          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 20px;
          }
        `}</style>
      </div>
    </div>
  );
}

export default SnippetManager;
