"use client";

import { useState, useMemo } from "react";
import { 
  Sparkles, 
  Zap, 
  Target, 
  Activity,
  ChevronRight
} from "lucide-react";

interface ModelRecommendation {
  modelId: string;
  modelName: string;
  provider: string;
  score: number; // 0-100
  reasons: string[];
  estimatedCost?: number;
  estimatedTime?: number; // seconds
}

interface AutoModelSelectorProps {
  prompt: string;
  availableModels: Array<{
    id: string;
    name: string;
    provider: string;
    capabilities: string[];
    costPerToken: number;
    speed: number; // tokens/second
  }>;
  onSelectModel: (modelId: string) => void;
  currentModelId?: string;
}

// 프롬프트 분석 및 모델 추천
function analyzeAndRecommend(
  prompt: string,
  models: AutoModelSelectorProps["availableModels"]
): ModelRecommendation[] {
  const lowerPrompt = prompt.toLowerCase();
  const recommendations: ModelRecommendation[] = [];
  
  // 작업 유형 감지
  const taskTypes = {
    code: lowerPrompt.includes("코드") || lowerPrompt.includes("code") || lowerPrompt.includes("함수") || lowerPrompt.includes("function"),
    creative: lowerPrompt.includes("작성") || lowerPrompt.includes("글") || lowerPrompt.includes("이야기") || lowerPrompt.includes("creative"),
    analysis: lowerPrompt.includes("분석") || lowerPrompt.includes("비교") || lowerPrompt.includes("analyze"),
    simple: prompt.length < 50,
    complex: prompt.length > 500 || lowerPrompt.includes("자세히") || lowerPrompt.includes("상세")
  };
  
  models.forEach(model => {
    let score = 50;
    const reasons: string[] = [];
    
    // 코드 작업
    if (taskTypes.code) {
      if (model.capabilities.includes("code")) {
        score += 25;
        reasons.push("코드 작성에 최적화");
      }
    }
    
    // 창의적 작업
    if (taskTypes.creative) {
      if (model.capabilities.includes("creative")) {
        score += 20;
        reasons.push("창의적 글쓰기에 적합");
      }
    }
    
    // 분석 작업
    if (taskTypes.analysis) {
      if (model.capabilities.includes("reasoning")) {
        score += 20;
        reasons.push("분석/추론 능력 우수");
      }
    }
    
    // 간단한 작업 - 빠른 모델 선호
    if (taskTypes.simple) {
      if (model.speed > 50) {
        score += 15;
        reasons.push("빠른 응답 속도");
      }
      if (model.costPerToken < 0.001) {
        score += 10;
        reasons.push("비용 효율적");
      }
    }
    
    // 복잡한 작업 - 고성능 모델 선호
    if (taskTypes.complex) {
      if (model.capabilities.includes("long-context")) {
        score += 20;
        reasons.push("긴 컨텍스트 처리 가능");
      }
      if (model.capabilities.includes("reasoning")) {
        score += 15;
        reasons.push("복잡한 추론 가능");
      }
    }
    
    // 비용 고려
    if (model.costPerToken === 0) {
      score += 10;
      reasons.push("무료 로컬 모델");
    }
    
    // 예상 시간 및 비용 계산
    const estimatedTokens = Math.max(100, prompt.length * 2);
    const estimatedTime = Math.ceil(estimatedTokens / model.speed);
    const estimatedCost = estimatedTokens * model.costPerToken;
    
    if (reasons.length === 0) {
      reasons.push("범용 모델");
    }
    
    recommendations.push({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      score: Math.min(100, score),
      reasons,
      estimatedCost,
      estimatedTime
    });
  });
  
  return recommendations.sort((a, b) => b.score - a.score);
}

export function AutoModelSelector({
  prompt,
  availableModels,
  onSelectModel,
  currentModelId
}: AutoModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recommendations = useMemo(() => {
    if (!prompt || prompt.length < 5) return [];
    return analyzeAndRecommend(prompt, availableModels);
  }, [prompt, availableModels]);
  
  const topRecommendation = recommendations[0];
  const isCurrentBest = topRecommendation?.modelId === currentModelId;
  
  if (recommendations.length === 0) return null;
  
  return (
    <div className="auto-model-selector">
      <button 
        className={`selector-trigger ${isCurrentBest ? "optimal" : "suggestion"}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Sparkles className="trigger-icon" />
        <span className="trigger-text">
          {isCurrentBest 
            ? "최적 모델 사용 중" 
            : `${topRecommendation.modelName} 추천`}
        </span>
        <span className="score-badge">{topRecommendation.score}점</span>
        <ChevronRight className={`chevron ${isExpanded ? "rotated" : ""}`} />
      </button>
      
      {isExpanded && (
        <div className="recommendations-panel">
          <div className="panel-header">
            <Target size={16} />
            <span>작업에 맞는 모델 추천</span>
          </div>
          
          <div className="recommendations-list">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div 
                key={rec.modelId}
                className={`recommendation-card ${rec.modelId === currentModelId ? "current" : ""}`}
                onClick={() => {
                  onSelectModel(rec.modelId);
                  setIsExpanded(false);
                }}
              >
                <div className="card-header">
                  <div className="model-info">
                    <span className="rank">#{index + 1}</span>
                    <span className="model-name">{rec.modelName}</span>
                    <span className="provider">{rec.provider}</span>
                  </div>
                  <div className="score-meter">
                    <div 
                      className="score-fill"
                      style={{ width: `${rec.score}%` }}
                    />
                    <span className="score-text">{rec.score}</span>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="reasons">
                    {rec.reasons.map((reason, i) => (
                      <span key={i} className="reason-tag">{reason}</span>
                    ))}
                  </div>
                  
                  <div className="estimates">
                    {rec.estimatedTime !== undefined && (
                      <span>
                        <Zap size={12} />
                        ~{rec.estimatedTime}초
                      </span>
                    )}
                    {rec.estimatedCost !== undefined && (
                      <span>
                        <Activity size={12} />
                        ~${rec.estimatedCost.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
                
                {rec.modelId === currentModelId && (
                  <div className="current-badge">현재 선택</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .auto-model-selector {
          position: relative;
        }
        
        .selector-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .selector-trigger.optimal {
          border-color: #10b981;
        }
        
        .selector-trigger.suggestion {
          border-color: var(--primary, #7c3aed);
        }
        
        .selector-trigger:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .trigger-icon {
          width: 16px;
          height: 16px;
          color: var(--primary, #7c3aed);
        }
        
        .trigger-text {
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .score-badge {
          padding: 2px 8px;
          background: var(--primary, #7c3aed);
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          color: white;
        }
        
        .chevron {
          width: 14px;
          height: 14px;
          color: var(--text-muted, #6e6e7e);
          transition: transform 0.2s ease;
        }
        
        .chevron.rotated {
          transform: rotate(90deg);
        }
        
        .recommendations-panel {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          margin-bottom: 8px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 100;
        }
        
        .panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .panel-header :global(svg) {
          color: var(--primary, #7c3aed);
        }
        
        .recommendations-list {
          padding: 8px;
        }
        
        .recommendation-card {
          position: relative;
          padding: 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .recommendation-card:last-child {
          margin-bottom: 0;
        }
        
        .recommendation-card:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .recommendation-card.current {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .model-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .rank {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary, #7c3aed);
        }
        
        .model-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .provider {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
          padding: 2px 6px;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
        }
        
        .score-meter {
          position: relative;
          width: 60px;
          height: 6px;
          background: var(--bg-tertiary, #252536);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #10b981);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .score-text {
          position: absolute;
          right: -24px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .reasons {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .reason-tag {
          padding: 3px 8px;
          background: var(--bg-tertiary, #252536);
          border-radius: 10px;
          font-size: 10px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .estimates {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .estimates span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .current-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 2px 8px;
          background: #10b981;
          border-radius: 10px;
          font-size: 10px;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default AutoModelSelector;
