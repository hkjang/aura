"use client";

import { useState, useCallback } from "react";
import { 
  FlaskConical, 
  Play, 
  Pause, 
  Check, 
  X,
  AlertTriangle,
  Settings,
  Eye,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DryRunResult {
  id: string;
  settingName: string;
  currentValue: unknown;
  newValue: unknown;
  impact: "none" | "low" | "medium" | "high" | "critical";
  affectedCount: number;
  description: string;
  warnings?: string[];
}

interface DryRunConfig {
  id: string;
  name: string;
  category: string;
  currentValue: unknown;
  newValue: unknown;
}

interface DryRunModeProps {
  configs: DryRunConfig[];
  onRunDryRun: (configs: DryRunConfig[]) => Promise<DryRunResult[]>;
  onApply: (configIds: string[]) => Promise<void>;
  onCancel: () => void;
}

const IMPACT_COLORS = {
  none: "#6b7280",
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626"
};

const IMPACT_LABELS = {
  none: "영향 없음",
  low: "낮음",
  medium: "중간",
  high: "높음",
  critical: "매우 높음"
};

export function DryRunMode({
  configs,
  onRunDryRun,
  onApply,
  onCancel
}: DryRunModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DryRunResult[] | null>(null);
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set(configs.map(c => c.id)));
  const [isApplying, setIsApplying] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  
  // 드라이런 실행
  const handleRunDryRun = useCallback(async () => {
    setIsRunning(true);
    try {
      const selectedArray = configs.filter(c => selectedConfigs.has(c.id));
      const dryRunResults = await onRunDryRun(selectedArray);
      setResults(dryRunResults);
    } finally {
      setIsRunning(false);
    }
  }, [configs, selectedConfigs, onRunDryRun]);
  
  // 실제 적용
  const handleApply = useCallback(async () => {
    setIsApplying(true);
    try {
      await onApply(Array.from(selectedConfigs));
    } finally {
      setIsApplying(false);
    }
  }, [selectedConfigs, onApply]);
  
  // 설정 토글
  const toggleConfig = useCallback((id: string) => {
    setSelectedConfigs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setResults(null);
  }, []);
  
  const toggleExpand = useCallback((id: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // 영향도 요약
  const impactSummary = results ? {
    critical: results.filter(r => r.impact === "critical").length,
    high: results.filter(r => r.impact === "high").length,
    medium: results.filter(r => r.impact === "medium").length,
    low: results.filter(r => r.impact === "low").length,
    totalAffected: results.reduce((sum, r) => sum + r.affectedCount, 0)
  } : null;
  
  const hasHighImpact = impactSummary && (impactSummary.critical > 0 || impactSummary.high > 0);
  
  return (
    <div className="dry-run-mode">
      <div className="mode-header">
        <div className="header-title">
          <FlaskConical className="header-icon" />
          <h3>드라이런 모드</h3>
          <span className="mode-badge">안전 적용</span>
        </div>
        <button className="close-btn" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>
      
      <div className="mode-content">
        {/* 변경 설정 목록 */}
        <div className="configs-section">
          <h4>
            <Settings size={16} />
            변경할 설정 ({selectedConfigs.size}/{configs.length})
          </h4>
          <div className="configs-list">
            {configs.map(config => (
              <label key={config.id} className="config-item">
                <input
                  type="checkbox"
                  checked={selectedConfigs.has(config.id)}
                  onChange={() => toggleConfig(config.id)}
                />
                <div className="config-info">
                  <span className="config-name">{config.name}</span>
                  <span className="config-category">{config.category}</span>
                </div>
                <div className="config-change">
                  <span className="old-value">{JSON.stringify(config.currentValue)}</span>
                  <span className="arrow">→</span>
                  <span className="new-value">{JSON.stringify(config.newValue)}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        {/* 드라이런 실행 */}
        {!results && (
          <div className="run-section">
            <Button
              onClick={handleRunDryRun}
              disabled={isRunning || selectedConfigs.size === 0}
            >
              {isRunning ? (
                <Pause size={16} className="mr-2" />
              ) : (
                <Play size={16} className="mr-2" />
              )}
              {isRunning ? "분석 중..." : "영향도 분석 실행"}
            </Button>
            <p className="hint">
              실제 적용 전에 변경 사항의 영향을 미리 확인합니다.
            </p>
          </div>
        )}
        
        {/* 결과 표시 */}
        {results && (
          <div className="results-section">
            <h4>
              <Eye size={16} />
              영향도 분석 결과
            </h4>
            
            {/* 영향도 요약 */}
            {impactSummary && (
              <div className="impact-summary">
                {impactSummary.critical > 0 && (
                  <span className="impact-badge critical">
                    치명적 {impactSummary.critical}
                  </span>
                )}
                {impactSummary.high > 0 && (
                  <span className="impact-badge high">
                    높음 {impactSummary.high}
                  </span>
                )}
                {impactSummary.medium > 0 && (
                  <span className="impact-badge medium">
                    중간 {impactSummary.medium}
                  </span>
                )}
                {impactSummary.low > 0 && (
                  <span className="impact-badge low">
                    낮음 {impactSummary.low}
                  </span>
                )}
                <span className="affected-total">
                  총 {impactSummary.totalAffected}개 항목 영향
                </span>
              </div>
            )}
            
            {/* 결과 목록 */}
            <div className="results-list">
              {results.map(result => (
                <div 
                  key={result.id} 
                  className={`result-item ${result.impact}`}
                >
                  <div 
                    className="result-header"
                    onClick={() => toggleExpand(result.id)}
                  >
                    <div 
                      className="impact-indicator"
                      style={{ background: IMPACT_COLORS[result.impact] }}
                    />
                    <div className="result-info">
                      <span className="result-name">{result.settingName}</span>
                      <span className="result-impact">
                        영향도: {IMPACT_LABELS[result.impact]} · {result.affectedCount}개 영향
                      </span>
                    </div>
                    <ChevronDown className={expandedResults.has(result.id) ? "expanded" : ""} />
                  </div>
                  
                  {expandedResults.has(result.id) && (
                    <div className="result-details">
                      <p>{result.description}</p>
                      {result.warnings && result.warnings.length > 0 && (
                        <div className="warnings">
                          {result.warnings.map((warning, i) => (
                            <div key={i} className="warning-item">
                              <AlertTriangle size={12} />
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* 적용 버튼 */}
            <div className="apply-section">
              {hasHighImpact && (
                <div className="apply-warning">
                  <AlertTriangle size={16} />
                  <span>높은 영향도의 변경이 포함되어 있습니다. 신중히 검토해주세요.</span>
                </div>
              )}
              
              <div className="apply-actions">
                <Button variant="outline" onClick={() => setResults(null)}>
                  다시 분석
                </Button>
                <Button 
                  onClick={handleApply}
                  disabled={isApplying}
                  className={hasHighImpact ? "danger" : ""}
                >
                  {isApplying ? "적용 중..." : "실제 적용"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .dry-run-mode {
          background: var(--bg-primary, #12121a);
          border: 2px solid var(--primary, #7c3aed);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .mode-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(124, 58, 237, 0.1);
          border-bottom: 1px solid var(--primary, #7c3aed);
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .header-title h3 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 20px;
          height: 20px;
          color: var(--primary, #7c3aed);
        }
        
        .mode-badge {
          padding: 4px 10px;
          background: var(--primary, #7c3aed);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          color: white;
        }
        
        .close-btn {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .mode-content {
          padding: 16px;
        }
        
        .configs-section h4,
        .results-section h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .configs-list {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 16px;
        }
        
        .config-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
        }
        
        .config-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .config-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .config-category {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .config-change {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-family: monospace;
        }
        
        .old-value {
          color: #ef4444;
        }
        
        .arrow {
          color: var(--text-muted, #6e6e7e);
        }
        
        .new-value {
          color: #10b981;
        }
        
        .run-section {
          text-align: center;
          padding: 20px;
        }
        
        .hint {
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .impact-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .impact-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .impact-badge.critical { background: rgba(220, 38, 38, 0.2); color: #dc2626; }
        .impact-badge.high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .impact-badge.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .impact-badge.low { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        
        .affected-total {
          margin-left: auto;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .results-list {
          margin-bottom: 16px;
        }
        
        .result-item {
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 8px;
          margin-bottom: 8px;
          overflow: hidden;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
        }
        
        .impact-indicator {
          width: 4px;
          height: 32px;
          border-radius: 2px;
        }
        
        .result-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .result-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .result-impact {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .result-header :global(svg) {
          color: var(--text-muted, #6e6e7e);
          transition: transform 0.2s ease;
        }
        
        .result-header :global(.expanded) {
          transform: rotate(180deg);
        }
        
        .result-details {
          padding: 0 12px 12px 28px;
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .warnings {
          margin-top: 8px;
        }
        
        .warning-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 0;
          color: #f59e0b;
        }
        
        .apply-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #ef4444;
        }
        
        .apply-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}

export default DryRunMode;
