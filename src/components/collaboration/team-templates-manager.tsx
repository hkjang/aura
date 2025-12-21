"use client";

import { useState, useMemo } from "react";
import { 
  Users, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy,
  Star,
  Search,
  ChevronDown,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  createdBy: string;
  createdByName?: string;
  isShared: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamTemplatesManagerProps {
  templates: TeamTemplate[];
  currentUserId: string;
  teamMembers?: Array<{ id: string; name: string }>;
  onCreateTemplate: (template: Omit<TeamTemplate, "id" | "createdAt" | "updatedAt" | "usageCount">) => void;
  onUpdateTemplate: (id: string, updates: Partial<TeamTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (template: TeamTemplate) => void;
}

const CATEGORIES = [
  { value: "general", label: "일반" },
  { value: "code", label: "코드 작성" },
  { value: "analysis", label: "분석" },
  { value: "writing", label: "글쓰기" },
  { value: "translation", label: "번역" },
  { value: "review", label: "리뷰" }
];

export function TeamTemplatesManager({
  templates,
  currentUserId,
  teamMembers = [],
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate
}: TeamTemplatesManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    category: "general",
    isShared: true
  });
  
  // 필터링
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(query) && 
            !t.content.toLowerCase().includes(query) &&
            !(t.description?.toLowerCase().includes(query))) {
          return false;
        }
      }
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (showOnlyMine && t.createdBy !== currentUserId) return false;
      if (showOnlyFavorites && !t.isFavorite) return false;
      return true;
    });
  }, [templates, searchQuery, selectedCategory, showOnlyMine, showOnlyFavorites, currentUserId]);
  
  // 카테고리별 그룹화
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, TeamTemplate[]> = {};
    filteredTemplates.forEach(t => {
      if (!groups[t.category]) {
        groups[t.category] = [];
      }
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);
  
  const handleSave = () => {
    if (!formData.name || !formData.content) return;
    
    if (editingId) {
      onUpdateTemplate(editingId, formData);
    } else {
      onCreateTemplate({
        ...formData,
        createdBy: currentUserId,
        isFavorite: false
      });
    }
    
    setFormData({ name: "", description: "", content: "", category: "general", isShared: true });
    setIsCreating(false);
    setEditingId(null);
  };
  
  const startEdit = (template: TeamTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.content,
      category: template.category,
      isShared: template.isShared
    });
    setEditingId(template.id);
    setIsCreating(true);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric"
    }).format(date);
  };
  
  return (
    <div className="team-templates">
      <div className="templates-header">
        <h3>
          <Users className="header-icon" />
          팀 템플릿
        </h3>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus size={16} className="mr-2" />
          새 템플릿
        </Button>
      </div>
      
      <div className="templates-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="템플릿 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select
            value={selectedCategory || ""}
            onChange={e => setSelectedCategory(e.target.value || null)}
          >
            <option value="">모든 카테고리</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          
          <button
            className={`filter-btn ${showOnlyMine ? "active" : ""}`}
            onClick={() => setShowOnlyMine(!showOnlyMine)}
          >
            내 템플릿
          </button>
          
          <button
            className={`filter-btn ${showOnlyFavorites ? "active" : ""}`}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <Star size={14} />
          </button>
        </div>
      </div>
      
      <div className="templates-list">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
          const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;
          
          return (
            <div key={category} className="category-group">
              <div className="category-header">
                <span>{categoryLabel}</span>
                <span className="count">{categoryTemplates.length}</span>
              </div>
              
              {categoryTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-main" onClick={() => onUseTemplate(template)}>
                    <div className="template-info">
                      <div className="template-title">
                        <FileText size={14} />
                        <span>{template.name}</span>
                        {template.isFavorite && <Star className="favorite-icon" size={12} />}
                      </div>
                      {template.description && (
                        <p className="template-desc">{template.description}</p>
                      )}
                      <div className="template-meta">
                        <span>{template.createdByName || "Unknown"}</span>
                        <span className="separator">·</span>
                        <span>{formatDate(template.updatedAt)}</span>
                        <span className="separator">·</span>
                        <span>{template.usageCount}회 사용</span>
                      </div>
                    </div>
                    
                    <div className="template-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="action-btn"
                        onClick={() => onUpdateTemplate(template.id, { isFavorite: !template.isFavorite })}
                      >
                        <Star className={template.isFavorite ? "filled" : ""} size={14} />
                      </button>
                      <button className="action-btn" onClick={() => onUseTemplate(template)}>
                        <Copy size={14} />
                      </button>
                      {template.createdBy === currentUserId && (
                        <>
                          <button className="action-btn" onClick={() => startEdit(template)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="action-btn delete" onClick={() => onDeleteTemplate(template.id)}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="template-preview">
                    <pre>{template.content.slice(0, 100)}{template.content.length > 100 ? "..." : ""}</pre>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        
        {filteredTemplates.length === 0 && (
          <div className="empty-state">
            <FileText className="empty-icon" />
            <p>템플릿이 없습니다</p>
          </div>
        )}
      </div>
      
      {/* 생성/편집 모달 */}
      {isCreating && (
        <div className="modal-overlay" onClick={() => { setIsCreating(false); setEditingId(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editingId ? "템플릿 수정" : "새 템플릿"}</h4>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="템플릿 이름"
                />
              </div>
              
              <div className="form-group">
                <label>설명 (선택)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="간단한 설명"
                />
              </div>
              
              <div className="form-group">
                <label>카테고리</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>템플릿 내용</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  placeholder="프롬프트 템플릿 내용을 입력하세요..."
                  rows={6}
                />
              </div>
              
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isShared}
                    onChange={e => setFormData(p => ({ ...p, isShared: e.target.checked }))}
                  />
                  팀과 공유
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <Button variant="outline" onClick={() => { setIsCreating(false); setEditingId(null); }}>
                취소
              </Button>
              <Button onClick={handleSave}>
                <Check size={16} className="mr-2" />
                {editingId ? "수정" : "생성"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .team-templates {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .templates-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .templates-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 15px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 18px;
          height: 18px;
          color: var(--primary, #7c3aed);
        }
        
        .templates-toolbar {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary, #e0e0e0);
          font-size: 13px;
          outline: none;
        }
        
        .filters {
          display: flex;
          gap: 8px;
        }
        
        .filters select {
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-muted, #6e6e7e);
          font-size: 12px;
          cursor: pointer;
        }
        
        .filter-btn.active {
          background: rgba(124, 58, 237, 0.1);
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .templates-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 12px;
        }
        
        .category-group {
          margin-bottom: 16px;
        }
        
        .category-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted, #6e6e7e);
        }
        
        .category-header .count {
          padding: 2px 8px;
          background: var(--bg-tertiary, #252536);
          border-radius: 10px;
          font-size: 11px;
        }
        
        .template-card {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          margin-bottom: 8px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        
        .template-card:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .template-main {
          display: flex;
          padding: 12px;
          cursor: pointer;
        }
        
        .template-info {
          flex: 1;
        }
        
        .template-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .favorite-icon {
          color: #f59e0b;
          fill: #f59e0b;
        }
        
        .template-desc {
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .template-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .separator {
          opacity: 0.5;
        }
        
        .template-actions {
          display: flex;
          gap: 4px;
        }
        
        .action-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        
        .action-btn:hover {
          background: var(--bg-tertiary, #252536);
          color: var(--text-primary, #e0e0e0);
        }
        
        .action-btn.delete:hover {
          color: #ef4444;
        }
        
        .action-btn :global(.filled) {
          color: #f59e0b;
          fill: #f59e0b;
        }
        
        .template-preview {
          padding: 8px 12px;
          background: var(--bg-tertiary, #252536);
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
        
        .template-preview pre {
          margin: 0;
          font-size: 11px;
          font-family: monospace;
          color: var(--text-muted, #6e6e7e);
          white-space: pre-wrap;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .empty-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal {
          width: 90%;
          max-width: 500px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .modal-header {
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .modal-header h4 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          outline: none;
        }
        
        .form-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .form-group.checkbox input {
          width: auto;
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

export default TeamTemplatesManager;
