"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  Zap, 
  DollarSign, 
  Brain,
  Eye
} from "lucide-react";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: "fast" | "medium" | "slow";
  cost: "low" | "medium" | "high";
  capabilities: string[];
  contextWindow: number;
  recommended?: boolean;
}

const models: ModelInfo[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "가장 뛰어난 모델, 비전 및 빠른 추론 지원",
    speed: "fast",
    cost: "high",
    capabilities: ["text", "vision", "code", "reasoning"],
    contextWindow: 128000,
    recommended: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "간단한 작업에 빠르고 경제적",
    speed: "fast",
    cost: "low",
    capabilities: ["text", "vision", "code"],
    contextWindow: 128000,
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "뛰어난 추론과 긴 컨텍스트",
    speed: "medium",
    cost: "medium",
    capabilities: ["text", "vision", "code", "reasoning"],
    contextWindow: 200000,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "빠른 멀티모달 모델",
    speed: "fast",
    cost: "low",
    capabilities: ["text", "vision", "code"],
    contextWindow: 1000000,
  },
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    provider: "vLLM (로컬)",
    description: "오픈소스, 온프레미스 배포",
    speed: "medium",
    cost: "low",
    capabilities: ["text", "code"],
    contextWindow: 128000,
  },
];

const speedColors = {
  fast: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  slow: "text-red-600 bg-red-50",
};

const speedLabels: Record<string, string> = {
  fast: "빠름",
  medium: "보통",
  slow: "느림"
};

const costColors = {
  low: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
};

const costLabels: Record<string, string> = {
  low: "저렴",
  medium: "보통",
  high: "비쌈"
};

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  models?: ModelInfo[];
}

export function ModelSelector({ selectedModelId, onModelChange, models: customModels }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelInfo | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayModels = customModels && customModels.length > 0 ? customModels : models;
  const selectedModel = displayModels.find((m) => m.id === selectedModelId) || displayModels[0];

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position above the button
      setDropdownPosition({
        left: rect.left,
        top: rect.top - 8 // 8px margin above button
      });
    }
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 150ms ease'
        }}
      >
        <Brain style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
        <span style={{ fontWeight: 500 }}>{selectedModel.name}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedModel.provider}</span>
        <ChevronDown 
          style={{ 
            width: '14px', 
            height: '14px', 
            color: 'var(--text-secondary)',
            transition: 'transform 150ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9997,
              background: 'transparent'
            }}
          />
          
          {/* Dropdown Menu - Fixed position above button */}
          <div style={{
            position: 'fixed',
            left: `${dropdownPosition.left}px`,
            bottom: `calc(100vh - ${dropdownPosition.top}px)`,
            zIndex: 9998,
            display: 'flex',
            gap: '8px'
          }}>
            {/* Model List */}
            <div style={{
              width: '320px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  모델 선택
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  쿼리에 사용할 AI 모델을 선택하세요
                </p>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {displayModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHoveredModel(model)}
                    onMouseLeave={() => setHoveredModel(null)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: selectedModel.id === model.id ? 'var(--color-primary-light)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 100ms ease',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                    onMouseOver={(e) => {
                      if (selectedModel.id !== model.id) {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedModel.id !== model.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontWeight: 500, 
                            color: selectedModel.id === model.id ? 'var(--color-primary)' : 'var(--text-primary)' 
                          }}>
                            {model.name}
                          </span>
                          {model.recommended && (
                            <span style={{ 
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: 'var(--color-primary-light)', 
                              color: 'var(--color-primary)',
                              borderRadius: '4px'
                            }}>
                              추천
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {model.provider}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${speedColors[model.speed]}`}>
                          <Zap style={{ width: '10px', height: '10px', display: 'inline', marginRight: '2px' }} />
                          {speedLabels[model.speed]}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${costColors[model.cost]}`}>
                          <DollarSign style={{ width: '10px', height: '10px', display: 'inline' }} />
                          {costLabels[model.cost]}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Details Tooltip */}
            {hoveredModel && (
              <div style={{
                width: '256px',
                padding: '16px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {hoveredModel.name}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {hoveredModel.description}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                      <Zap style={{ width: '12px', height: '12px' }} /> 속도
                    </span>
                    <span className={`px-2 py-0.5 rounded ${speedColors[hoveredModel.speed]}`}>
                      {speedLabels[hoveredModel.speed]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                      <DollarSign style={{ width: '12px', height: '12px' }} /> 비용
                    </span>
                    <span className={`px-2 py-0.5 rounded ${costColors[hoveredModel.cost]}`}>
                      {costLabels[hoveredModel.cost]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                      <Eye style={{ width: '12px', height: '12px' }} /> 컨텍스트
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {(hoveredModel.contextWindow / 1000).toFixed(0)}K 토큰
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>기능</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {hoveredModel.capabilities.map((cap) => (
                      <span
                        key={cap}
                        style={{
                          padding: '2px 8px',
                          fontSize: '11px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px'
                        }}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
