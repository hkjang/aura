"use client";

import { useState, useMemo } from "react";
import { 
  Lightbulb, 
  FileText, 
  BarChart3, 
  Code2, 
  Share2, 
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface RecommendedAction {
  id: string;
  type: "generate" | "analyze" | "code" | "share" | "document" | "learn";
  title: string;
  description: string;
  prompt?: string;
  confidence: number; // 0-1
}

interface ActionRecommenderProps {
  responseContent: string;
  onActionSelect: (action: RecommendedAction) => void;
  maxRecommendations?: number;
}

// 응답 내용 분석 후 다음 행동 추천 생성
function analyzeAndRecommend(content: string): RecommendedAction[] {
  const recommendations: RecommendedAction[] = [];
  const lowerContent = content.toLowerCase();
  
  // 코드 관련 응답 감지
  if (content.includes("```") || lowerContent.includes("function") || lowerContent.includes("const ")) {
    recommendations.push({
      id: "code-test",
      type: "code",
      title: "테스트 코드 작성",
      description: "이 코드에 대한 유닛 테스트를 생성합니다",
      prompt: "위 코드에 대한 Jest 테스트 코드를 작성해주세요.",
      confidence: 0.9
    });
    recommendations.push({
      id: "code-optimize",
      type: "code",
      title: "코드 최적화",
      description: "성능과 가독성을 개선합니다",
      prompt: "위 코드의 성능과 가독성을 개선해주세요.",
      confidence: 0.85
    });
    recommendations.push({
      id: "code-docs",
      type: "document",
      title: "코드 문서화",
      description: "JSDoc 주석과 README를 생성합니다",
      prompt: "위 코드에 대한 JSDoc 주석과 README 문서를 작성해주세요.",
      confidence: 0.8
    });
  }
  
  // 분석/비교 관련 응답 감지
  if (lowerContent.includes("비교") || lowerContent.includes("차이") || lowerContent.includes("vs")) {
    recommendations.push({
      id: "analyze-deeper",
      type: "analyze",
      title: "상세 분석",
      description: "더 깊은 비교 분석을 수행합니다",
      prompt: "위 내용에 대해 더 상세한 비교 분석을 해주세요. 장단점을 표로 정리해주세요.",
      confidence: 0.88
    });
    recommendations.push({
      id: "analyze-chart",
      type: "analyze",
      title: "시각화 추천",
      description: "데이터 시각화 방법을 제안합니다",
      prompt: "위 비교 내용을 시각화하기 좋은 차트 종류와 구현 방법을 알려주세요.",
      confidence: 0.75
    });
  }
  
  // 개념 설명 감지
  if (lowerContent.includes("정의") || lowerContent.includes("개념") || lowerContent.includes("무엇")) {
    recommendations.push({
      id: "learn-example",
      type: "learn",
      title: "실습 예제",
      description: "개념을 실습할 수 있는 예제를 제공합니다",
      prompt: "위 개념을 실습해볼 수 있는 단계별 예제를 만들어주세요.",
      confidence: 0.9
    });
    recommendations.push({
      id: "learn-related",
      type: "learn",
      title: "관련 개념",
      description: "연관된 다른 개념들을 탐색합니다",
      prompt: "위 개념과 관련된 다른 중요한 개념들을 설명해주세요.",
      confidence: 0.82
    });
  }
  
  // 목록/단계 감지
  if (content.includes("1.") || content.includes("-") || content.includes("•")) {
    recommendations.push({
      id: "generate-detailed",
      type: "generate",
      title: "세부 내용 확장",
      description: "각 항목에 대한 상세 설명을 추가합니다",
      prompt: "위 각 항목에 대해 더 자세한 설명과 예시를 추가해주세요.",
      confidence: 0.87
    });
  }
  
  // 기본 추천 (항상 포함)
  recommendations.push({
    id: "share-summary",
    type: "share",
    title: "요약 공유",
    description: "팀과 공유할 수 있는 요약본을 생성합니다",
    prompt: "위 내용을 팀과 공유하기 좋게 핵심만 요약해주세요.",
    confidence: 0.7
  });
  
  recommendations.push({
    id: "document-save",
    type: "document",
    title: "문서로 저장",
    description: "이 응답을 마크다운 문서로 정리합니다",
    prompt: "위 내용을 체계적인 마크다운 문서로 정리해주세요.",
    confidence: 0.65
  });
  
  // 신뢰도 순으로 정렬
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

const getActionIcon = (type: RecommendedAction["type"]) => {
  switch (type) {
    case "generate":
      return <Sparkles />;
    case "analyze":
      return <BarChart3 />;
    case "code":
      return <Code2 />;
    case "share":
      return <Share2 />;
    case "document":
      return <FileText />;
    case "learn":
      return <BookOpen />;
    default:
      return <Lightbulb />;
  }
};

export function ActionRecommender({
  responseContent,
  onActionSelect,
  maxRecommendations = 3
}: ActionRecommenderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recommendations = useMemo(
    () => analyzeAndRecommend(responseContent),
    [responseContent]
  );
  
  const visibleRecommendations = isExpanded 
    ? recommendations 
    : recommendations.slice(0, maxRecommendations);
  
  const hasMore = recommendations.length > maxRecommendations;
  
  if (recommendations.length === 0) return null;
  
  return (
    <div className="action-recommender">
      <div className="recommender-header">
        <Lightbulb className="header-icon" />
        <span>다음 행동 추천</span>
      </div>
      
      <div className="recommendations">
        {visibleRecommendations.map(action => (
          <button
            key={action.id}
            className="recommendation-card"
            onClick={() => onActionSelect(action)}
          >
            <div className="card-icon">
              {getActionIcon(action.type)}
            </div>
            <div className="card-content">
              <span className="card-title">{action.title}</span>
              <span className="card-description">{action.description}</span>
            </div>
            <div className="card-action">
              <span className="confidence">{Math.round(action.confidence * 100)}%</span>
              <ArrowRight className="arrow" />
            </div>
          </button>
        ))}
      </div>
      
      {hasMore && (
        <button
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
          {isExpanded ? "접기" : `${recommendations.length - maxRecommendations}개 더 보기`}
        </button>
      )}
      
      <style jsx>{`
        .action-recommender {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .recommender-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-tertiary, #252536);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 16px;
          height: 16px;
          color: #fbbf24;
        }
        
        .recommendations {
          padding: 8px;
        }
        
        .recommendation-card {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease;
        }
        
        .recommendation-card:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .card-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary, #252536);
          border-radius: 10px;
          flex-shrink: 0;
        }
        
        .card-icon :global(svg) {
          width: 18px;
          height: 18px;
          color: var(--primary, #7c3aed);
        }
        
        .card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        
        .card-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .card-description {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .card-action {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .confidence {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
          padding: 2px 6px;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
        }
        
        .arrow {
          width: 16px;
          height: 16px;
          color: var(--text-muted, #6e6e7e);
          transition: transform 0.2s ease;
        }
        
        .recommendation-card:hover .arrow {
          transform: translateX(4px);
          color: var(--primary, #7c3aed);
        }
        
        .expand-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: none;
          border-top: 1px solid var(--border-color, #3e3e5a);
          color: var(--text-muted, #6e6e7e);
          font-size: 12px;
          cursor: pointer;
        }
        
        .expand-btn:hover {
          background: var(--bg-hover, #2e2e44);
          color: var(--text-primary, #e0e0e0);
        }
        
        .expand-btn :global(svg) {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}

export default ActionRecommender;
