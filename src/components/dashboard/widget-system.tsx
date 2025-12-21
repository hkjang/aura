"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  Layout, 
  Plus, 
  Trash2, 
  GripVertical, 
  Maximize2, 
  Settings,
  BarChart3,
  MessageSquare,
  Clock,
  Zap,
  TrendingUp,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Widget {
  id: string;
  type: string;
  title: string;
  size: "small" | "medium" | "large";
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

interface WidgetSystemProps {
  widgets: Widget[];
  onAddWidget: (widget: Omit<Widget, "id" | "position">) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateWidget: (id: string, updates: Partial<Widget>) => void;
  onReorderWidgets?: (widgets: Widget[]) => void;
}

const WIDGET_TYPES = [
  { type: "usage-stats", title: "사용 통계", icon: BarChart3, defaultSize: "medium" as const },
  { type: "recent-chats", title: "최근 대화", icon: MessageSquare, defaultSize: "large" as const },
  { type: "model-status", title: "모델 상태", icon: Zap, defaultSize: "small" as const },
  { type: "quick-actions", title: "빠른 작업", icon: Clock, defaultSize: "small" as const },
  { type: "trends", title: "트렌드", icon: TrendingUp, defaultSize: "medium" as const },
];

// 위젯 컨텐츠 렌더링
function WidgetContent({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "usage-stats":
      return (
        <div className="widget-usage">
          <div className="usage-item">
            <span className="usage-value">1,234</span>
            <span className="usage-label">이번 주 메시지</span>
          </div>
          <div className="usage-item">
            <span className="usage-value">45분</span>
            <span className="usage-label">평균 세션</span>
          </div>
        </div>
      );
    case "recent-chats":
      return (
        <div className="widget-chats">
          {[1, 2, 3].map(i => (
            <div key={i} className="chat-item">
              <MessageSquare size={14} />
              <span>대화 {i}</span>
              <span className="chat-time">2시간 전</span>
            </div>
          ))}
        </div>
      );
    case "model-status":
      return (
        <div className="widget-status">
          <div className="status-indicator online" />
          <span>모든 모델 정상</span>
        </div>
      );
    case "quick-actions":
      return (
        <div className="widget-actions">
          <button>새 대화</button>
          <button>히스토리</button>
        </div>
      );
    case "trends":
      return (
        <div className="widget-trends">
          <div className="trend-bar" style={{ height: "60%" }} />
          <div className="trend-bar" style={{ height: "80%" }} />
          <div className="trend-bar" style={{ height: "45%" }} />
          <div className="trend-bar" style={{ height: "90%" }} />
          <div className="trend-bar" style={{ height: "70%" }} />
        </div>
      );
    default:
      return <p>Unknown widget type</p>;
  }
}

export function WidgetSystem({
  widgets,
  onAddWidget,
  onRemoveWidget,
  onUpdateWidget,
  onReorderWidgets
}: WidgetSystemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const handleDragStart = useCallback((id: string) => {
    if (!isEditing) return;
    setDraggedId(id);
  }, [isEditing]);
  
  const handleDrop = useCallback((targetId: string) => {
    if (!draggedId || draggedId === targetId || !onReorderWidgets) return;
    
    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedId);
    const targetIndex = newWidgets.findIndex(w => w.id === targetId);
    
    const [dragged] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, dragged);
    
    onReorderWidgets(newWidgets);
    setDraggedId(null);
  }, [draggedId, widgets, onReorderWidgets]);
  
  const handleAddWidget = useCallback((type: string) => {
    const widgetType = WIDGET_TYPES.find(w => w.type === type);
    if (!widgetType) return;
    
    onAddWidget({
      type,
      title: widgetType.title,
      size: widgetType.defaultSize
    });
    setShowAddModal(false);
  }, [onAddWidget]);
  
  const getSizeClass = (size: Widget["size"]) => {
    switch (size) {
      case "small": return "widget-small";
      case "large": return "widget-large";
      default: return "widget-medium";
    }
  };
  
  return (
    <div className="widget-system">
      <div className="system-header">
        <h3>
          <Layout className="header-icon" />
          대시보드 위젯
        </h3>
        <div className="header-actions">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings size={16} className="mr-2" />
            {isEditing ? "완료" : "편집"}
          </Button>
          {isEditing && (
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              추가
            </Button>
          )}
        </div>
      </div>
      
      <div className="widgets-grid">
        {widgets.map(widget => (
          <div
            key={widget.id}
            className={`widget-card ${getSizeClass(widget.size)} ${isEditing ? "editing" : ""} ${draggedId === widget.id ? "dragging" : ""}`}
            draggable={isEditing}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(widget.id)}
          >
            {isEditing && (
              <div className="widget-drag-handle">
                <GripVertical size={16} />
              </div>
            )}
            
            <div className="widget-header">
              <h4>{widget.title}</h4>
              {isEditing && (
                <div className="widget-controls">
                  <button
                    onClick={() => {
                      const sizes: Widget["size"][] = ["small", "medium", "large"];
                      const currentIndex = sizes.indexOf(widget.size);
                      const nextSize = sizes[(currentIndex + 1) % sizes.length];
                      onUpdateWidget(widget.id, { size: nextSize });
                    }}
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button onClick={() => onRemoveWidget(widget.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="widget-content">
              <WidgetContent widget={widget} />
            </div>
          </div>
        ))}
        
        {widgets.length === 0 && (
          <div className="empty-state">
            <Layout className="empty-icon" />
            <p>위젯이 없습니다</p>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              위젯 추가
            </Button>
          </div>
        )}
      </div>
      
      {/* 위젯 추가 모달 */}
      {showAddModal && (
        <div className="add-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>위젯 추가</h4>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="widget-options">
              {WIDGET_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    className="widget-option"
                    onClick={() => handleAddWidget(type.type)}
                  >
                    <Icon size={24} />
                    <span>{type.title}</span>
                    <span className="widget-size">{type.defaultSize}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .widget-system {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .system-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .system-header h3 {
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
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
        
        .widgets-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 20px;
        }
        
        .widget-card {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
        }
        
        .widget-small {
          grid-column: span 1;
        }
        
        .widget-medium {
          grid-column: span 2;
        }
        
        .widget-large {
          grid-column: span 4;
        }
        
        .widget-card.editing {
          border-style: dashed;
          cursor: grab;
        }
        
        .widget-card.editing:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .widget-card.dragging {
          opacity: 0.5;
        }
        
        .widget-drag-handle {
          display: flex;
          justify-content: center;
          color: var(--text-muted, #6e6e7e);
          margin-bottom: 8px;
        }
        
        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .widget-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .widget-controls {
          display: flex;
          gap: 4px;
        }
        
        .widget-controls button {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .widget-controls button:hover {
          color: var(--text-primary, #e0e0e0);
        }
        
        .widget-content {
          min-height: 60px;
        }
        
        /* Widget Content Styles */
        .widget-usage {
          display: flex;
          gap: 20px;
        }
        
        .usage-item {
          display: flex;
          flex-direction: column;
        }
        
        .usage-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .usage-label {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .widget-chats .chat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .chat-time {
          margin-left: auto;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .widget-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-indicator.online {
          background: #10b981;
        }
        
        .widget-actions {
          display: flex;
          gap: 8px;
        }
        
        .widget-actions button {
          flex: 1;
          padding: 8px;
          background: var(--bg-tertiary, #252536);
          border: none;
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          cursor: pointer;
        }
        
        .widget-trends {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 50px;
        }
        
        .trend-bar {
          flex: 1;
          background: linear-gradient(180deg, var(--primary, #7c3aed), rgba(124, 58, 237, 0.3));
          border-radius: 4px 4px 0 0;
        }
        
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
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
        
        .widget-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 20px;
        }
        
        .widget-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .widget-option:hover {
          border-color: var(--primary, #7c3aed);
          background: rgba(124, 58, 237, 0.1);
        }
        
        .widget-option :global(svg) {
          color: var(--primary, #7c3aed);
        }
        
        .widget-option span {
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .widget-size {
          font-size: 11px !important;
          color: var(--text-muted, #6e6e7e) !important;
        }
      `}</style>
    </div>
  );
}

export default WidgetSystem;
