"use client";

import { useState, useMemo } from "react";
import { 
  History, 
  User, 
  Clock, 
  Edit3, 
  Eye, 
  RefreshCw,
  ChevronDown,
  Filter
} from "lucide-react";

interface ChangeRecord {
  id: string;
  entityType: "chat" | "note" | "template" | "setting";
  entityId: string;
  entityName: string;
  action: "create" | "update" | "delete" | "view";
  userId: string;
  userName: string;
  timestamp: Date;
  changes?: Array<{
    field: string;
    oldValue?: string;
    newValue?: string;
  }>;
}

interface ChangeTrackerProps {
  changes: ChangeRecord[];
  onRevert?: (changeId: string) => void;
  onViewDetail?: (changeId: string) => void;
}

const ACTION_CONFIG = {
  create: { label: "생성", icon: Edit3, color: "#10b981" },
  update: { label: "수정", icon: RefreshCw, color: "#f59e0b" },
  delete: { label: "삭제", icon: History, color: "#ef4444" },
  view: { label: "조회", icon: Eye, color: "#6b7280" }
};

const ENTITY_LABELS = {
  chat: "대화",
  note: "노트",
  template: "템플릿",
  setting: "설정"
};

export function ChangeTracker({ changes, onRevert, onViewDetail }: ChangeTrackerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<ChangeRecord["action"] | "all">("all");
  const [filterEntity, setFilterEntity] = useState<ChangeRecord["entityType"] | "all">("all");
  
  const filteredChanges = useMemo(() => {
    return changes.filter(change => {
      if (filterAction !== "all" && change.action !== filterAction) return false;
      if (filterEntity !== "all" && change.entityType !== filterEntity) return false;
      return true;
    });
  }, [changes, filterAction, filterEntity]);
  
  // 날짜별 그룹화
  const groupedChanges = useMemo(() => {
    const groups: Record<string, ChangeRecord[]> = {};
    
    filteredChanges.forEach(change => {
      const dateKey = change.timestamp.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(change);
    });
    
    return groups;
  }, [filteredChanges]);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  const formatRelative = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };
  
  return (
    <div className="change-tracker">
      <div className="tracker-header">
        <h3>
          <History className="header-icon" />
          변경 이력
        </h3>
        <span className="change-count">{filteredChanges.length}개</span>
      </div>
      
      <div className="tracker-filters">
        <div className="filter-group">
          <Filter size={14} />
          <select 
            value={filterAction}
            onChange={e => setFilterAction(e.target.value as ChangeRecord["action"] | "all")}
          >
            <option value="all">모든 액션</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
            <option value="view">조회</option>
          </select>
        </div>
        <div className="filter-group">
          <select 
            value={filterEntity}
            onChange={e => setFilterEntity(e.target.value as ChangeRecord["entityType"] | "all")}
          >
            <option value="all">모든 유형</option>
            <option value="chat">대화</option>
            <option value="note">노트</option>
            <option value="template">템플릿</option>
            <option value="setting">설정</option>
          </select>
        </div>
      </div>
      
      <div className="changes-list">
        {Object.entries(groupedChanges).map(([date, dateChanges]) => (
          <div key={date} className="date-group">
            <div className="date-header">{date}</div>
            {dateChanges.map(change => {
              const config = ACTION_CONFIG[change.action];
              const ActionIcon = config.icon;
              const isExpanded = expandedId === change.id;
              
              return (
                <div key={change.id} className="change-item">
                  <div 
                    className="change-main"
                    onClick={() => setExpandedId(isExpanded ? null : change.id)}
                  >
                    <div 
                      className="action-icon" 
                      style={{ background: `${config.color}20`, color: config.color }}
                    >
                      <ActionIcon size={14} />
                    </div>
                    
                    <div className="change-info">
                      <div className="change-title">
                        <span className="entity-name">{change.entityName}</span>
                        <span className="action-label" style={{ color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                      <div className="change-meta">
                        <span className="entity-type">{ENTITY_LABELS[change.entityType]}</span>
                        <span className="separator">·</span>
                        <User size={12} />
                        <span>{change.userName}</span>
                        <span className="separator">·</span>
                        <Clock size={12} />
                        <span title={formatTime(change.timestamp)}>
                          {formatRelative(change.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {change.changes && change.changes.length > 0 && (
                      <ChevronDown 
                        className={`expand-icon ${isExpanded ? "rotated" : ""}`}
                        size={16}
                      />
                    )}
                  </div>
                  
                  {isExpanded && change.changes && change.changes.length > 0 && (
                    <div className="change-details">
                      {change.changes.map((c, i) => (
                        <div key={i} className="detail-row">
                          <span className="field-name">{c.field}</span>
                          {c.oldValue && (
                            <span className="old-value">{c.oldValue}</span>
                          )}
                          {c.oldValue && c.newValue && (
                            <span className="arrow">→</span>
                          )}
                          {c.newValue && (
                            <span className="new-value">{c.newValue}</span>
                          )}
                        </div>
                      ))}
                      
                      <div className="detail-actions">
                        {onViewDetail && (
                          <button onClick={() => onViewDetail(change.id)}>
                            <Eye size={14} />
                            상세보기
                          </button>
                        )}
                        {onRevert && change.action !== "view" && (
                          <button className="revert" onClick={() => onRevert(change.id)}>
                            <RefreshCw size={14} />
                            되돌리기
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {filteredChanges.length === 0 && (
          <div className="empty-state">
            <History className="empty-icon" />
            <p>변경 이력이 없습니다.</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .change-tracker {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .tracker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .tracker-header h3 {
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
        
        .change-count {
          font-size: 12px;
          padding: 4px 10px;
          background: var(--bg-tertiary, #252536);
          border-radius: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .tracker-filters {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .filter-group select {
          padding: 6px 10px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 6px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        
        .changes-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .date-group {
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .date-header {
          padding: 10px 16px;
          background: var(--bg-tertiary, #252536);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted, #6e6e7e);
        }
        
        .change-item {
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .change-item:last-child {
          border-bottom: none;
        }
        
        .change-main {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .change-main:hover {
          background: var(--bg-hover, #252536);
        }
        
        .action-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }
        
        .change-info {
          flex: 1;
          min-width: 0;
        }
        
        .change-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .entity-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .action-label {
          font-size: 11px;
          font-weight: 500;
        }
        
        .change-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .separator {
          opacity: 0.5;
        }
        
        .expand-icon {
          color: var(--text-muted, #6e6e7e);
          transition: transform 0.2s ease;
        }
        
        .expand-icon.rotated {
          transform: rotate(180deg);
        }
        
        .change-details {
          padding: 12px 16px 12px 60px;
          background: var(--bg-tertiary, #252536);
        }
        
        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 12px;
        }
        
        .field-name {
          font-weight: 500;
          color: var(--text-secondary, #a0a0b0);
          min-width: 80px;
        }
        
        .old-value {
          padding: 2px 8px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
          color: #ef4444;
          text-decoration: line-through;
        }
        
        .arrow {
          color: var(--text-muted, #6e6e7e);
        }
        
        .new-value {
          padding: 2px 8px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 4px;
          color: #10b981;
        }
        
        .detail-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .detail-actions button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 6px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
        }
        
        .detail-actions button:hover {
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .detail-actions button.revert:hover {
          border-color: #f59e0b;
          color: #f59e0b;
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
      `}</style>
    </div>
  );
}

export default ChangeTracker;
