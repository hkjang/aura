"use client";

import { useState, useCallback } from "react";
import { 
  Blocks, 
  User, 
  Target, 
  FileOutput,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InputBlock {
  id: string;
  type: "role" | "context" | "task" | "constraints" | "output" | "examples";
  label: string;
  content: string;
  isOptional: boolean;
  isExpanded: boolean;
}

interface StructuredInputBuilderProps {
  blocks: InputBlock[];
  onChange: (blocks: InputBlock[]) => void;
  onGenerate: (prompt: string) => void;
}

const BLOCK_TYPES: Record<InputBlock["type"], { icon: React.ElementType; label: string; placeholder: string; color: string }> = {
  role: { icon: User, label: "역할", placeholder: "AI에게 부여할 역할을 정의하세요 (예: 당신은 시니어 개발자입니다)", color: "#3b82f6" },
  context: { icon: Sparkles, label: "배경/맥락", placeholder: "작업에 필요한 배경 정보를 제공하세요", color: "#8b5cf6" },
  task: { icon: Target, label: "작업 내용", placeholder: "수행해야 할 구체적인 작업을 설명하세요", color: "#10b981" },
  constraints: { icon: Blocks, label: "제약 조건", placeholder: "지켜야 할 제약사항이나 규칙을 명시하세요", color: "#f59e0b" },
  output: { icon: FileOutput, label: "출력 형식", placeholder: "원하는 출력 형식을 지정하세요 (예: JSON, 마크다운)", color: "#ec4899" },
  examples: { icon: Sparkles, label: "예시", placeholder: "입출력 예시를 제공하세요", color: "#6366f1" }
};

const DEFAULT_BLOCKS: InputBlock[] = [
  { id: "role", type: "role", label: "역할 정의", content: "", isOptional: true, isExpanded: true },
  { id: "task", type: "task", label: "작업 내용", content: "", isOptional: false, isExpanded: true },
  { id: "output", type: "output", label: "출력 형식", content: "", isOptional: true, isExpanded: false }
];

// 블록을 프롬프트 텍스트로 변환
function blocksToPrompt(blocks: InputBlock[]): string {
  const parts: string[] = [];
  
  blocks.forEach(block => {
    if (!block.content.trim()) return;
    
    const config = BLOCK_TYPES[block.type];
    parts.push(`## ${config.label}\n${block.content}`);
  });
  
  return parts.join("\n\n");
}

export function StructuredInputBuilder({
  blocks = DEFAULT_BLOCKS,
  onChange,
  onGenerate
}: StructuredInputBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const updateBlock = useCallback((id: string, updates: Partial<InputBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [blocks, onChange]);
  
  const removeBlock = useCallback((id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  }, [blocks, onChange]);
  
  const addBlock = useCallback((type: InputBlock["type"]) => {
    const config = BLOCK_TYPES[type];
    const newBlock: InputBlock = {
      id: `${type}-${Date.now()}`,
      type,
      label: config.label,
      content: "",
      isOptional: true,
      isExpanded: true
    };
    onChange([...blocks, newBlock]);
    setShowAddMenu(false);
  }, [blocks, onChange]);
  
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);
  
  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    const newBlocks = [...blocks];
    const [dragged] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, dragged);
    onChange(newBlocks);
    setDraggedIndex(null);
  }, [draggedIndex, blocks, onChange]);
  
  const handleGenerate = useCallback(() => {
    const prompt = blocksToPrompt(blocks);
    onGenerate(prompt);
  }, [blocks, onGenerate]);
  
  // 유효한 블록이 있는지 확인
  const hasContent = blocks.some(b => b.content.trim());
  const requiredFilled = blocks
    .filter(b => !b.isOptional)
    .every(b => b.content.trim());
  
  return (
    <div className="structured-input-builder">
      <div className="builder-header">
        <h3>
          <Blocks className="header-icon" />
          구조화된 프롬프트
        </h3>
        <div className="header-actions">
          <div className="add-block-wrapper">
            <Button variant="outline" size="sm" onClick={() => setShowAddMenu(!showAddMenu)}>
              <Plus size={14} />
              블록 추가
            </Button>
            
            {showAddMenu && (
              <div className="add-menu">
                {Object.entries(BLOCK_TYPES).map(([type, config]) => {
                  const Icon = config.icon;
                  const exists = blocks.some(b => b.type === type);
                  return (
                    <button
                      key={type}
                      className={`add-menu-item ${exists ? "exists" : ""}`}
                      onClick={() => addBlock(type as InputBlock["type"])}
                      disabled={exists}
                    >
                      <Icon size={14} style={{ color: config.color }} />
                      <span>{config.label}</span>
                      {exists && <span className="exists-badge">추가됨</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="blocks-container">
        {blocks.map((block, index) => {
          const config = BLOCK_TYPES[block.type];
          const Icon = config.icon;
          
          return (
            <div
              key={block.id}
              className={`block-item ${block.isExpanded ? "expanded" : ""} ${draggedIndex === index ? "dragging" : ""}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(index)}
            >
              <div className="block-header">
                <GripVertical className="drag-handle" />
                <Icon size={16} style={{ color: config.color }} />
                <span className="block-label">{block.label}</span>
                {block.isOptional && <span className="optional-badge">선택</span>}
                {!block.isOptional && <span className="required-badge">필수</span>}
                
                <div className="block-actions">
                  {block.isOptional && (
                    <button className="action-btn" onClick={() => removeBlock(block.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button 
                    className="action-btn"
                    onClick={() => updateBlock(block.id, { isExpanded: !block.isExpanded })}
                  >
                    {block.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
              
              {block.isExpanded && (
                <div className="block-content">
                  <textarea
                    value={block.content}
                    onChange={e => updateBlock(block.id, { content: e.target.value })}
                    placeholder={config.placeholder}
                    rows={3}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="builder-footer">
        <div className="preview-info">
          {hasContent ? (
            <span>{blocks.filter(b => b.content.trim()).length}개 블록 활성</span>
          ) : (
            <span className="hint">블록에 내용을 입력하세요</span>
          )}
        </div>
        
        <Button 
          onClick={handleGenerate}
          disabled={!hasContent || !requiredFilled}
        >
          <Sparkles size={16} className="mr-2" />
          프롬프트 생성
        </Button>
      </div>
      
      <style jsx>{`
        .structured-input-builder {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .builder-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .builder-header h3 {
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
        
        .add-block-wrapper {
          position: relative;
        }
        
        .add-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 200px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 100;
        }
        
        .add-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          cursor: pointer;
          text-align: left;
        }
        
        .add-menu-item:hover:not(:disabled) {
          background: var(--bg-hover, #2e2e44);
        }
        
        .add-menu-item.exists {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .exists-badge {
          margin-left: auto;
          font-size: 10px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .blocks-container {
          padding: 12px;
        }
        
        .block-item {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          margin-bottom: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .block-item.dragging {
          opacity: 0.5;
        }
        
        .block-item:last-child {
          margin-bottom: 0;
        }
        
        .block-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
        }
        
        .drag-handle {
          width: 16px;
          height: 16px;
          color: var(--text-muted, #6e6e7e);
          cursor: grab;
        }
        
        .block-label {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .optional-badge {
          padding: 2px 8px;
          background: var(--bg-tertiary, #252536);
          border-radius: 10px;
          font-size: 10px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .required-badge {
          padding: 2px 8px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 10px;
          font-size: 10px;
          color: #ef4444;
        }
        
        .block-actions {
          display: flex;
          gap: 4px;
        }
        
        .action-btn {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          border-radius: 4px;
        }
        
        .action-btn:hover {
          background: var(--bg-tertiary, #252536);
          color: var(--text-primary, #e0e0e0);
        }
        
        .block-content {
          padding: 0 12px 12px;
        }
        
        .block-content textarea {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          outline: none;
        }
        
        .block-content textarea:focus {
          border-color: var(--primary, #7c3aed);
        }
        
        .builder-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
        
        .preview-info {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .hint {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

export default StructuredInputBuilder;
