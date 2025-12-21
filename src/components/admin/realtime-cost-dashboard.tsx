"use client";

import { useState, useCallback, useMemo } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

interface CostData {
  modelId: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  requestCount: number;
  avgLatency: number; // ms
}

interface RealtimeCostDashboardProps {
  currentSessionCost: number;
  dailyBudget?: number;
  monthlyBudget?: number;
  modelCosts: CostData[];
  onRefresh?: () => void;
  refreshInterval?: number; // ms
}

export function RealtimeCostDashboard({
  currentSessionCost,
  dailyBudget = 10,
  monthlyBudget = 100,
  modelCosts,
  onRefresh,
  refreshInterval = 30000
}: RealtimeCostDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // 통계 계산
  const stats = useMemo(() => {
    const totalCost = modelCosts.reduce((sum, m) => sum + m.totalCost, 0);
    const totalTokens = modelCosts.reduce((sum, m) => sum + m.inputTokens + m.outputTokens, 0);
    const totalRequests = modelCosts.reduce((sum, m) => sum + m.requestCount, 0);
    const avgLatency = modelCosts.length > 0
      ? modelCosts.reduce((sum, m) => sum + m.avgLatency * m.requestCount, 0) / totalRequests
      : 0;
    
    // 가장 비용이 많은 모델
    const topModel = modelCosts.length > 0
      ? modelCosts.reduce((a, b) => a.totalCost > b.totalCost ? a : b)
      : null;
    
    return {
      totalCost,
      totalTokens,
      totalRequests,
      avgLatency,
      topModel,
      dailyUsagePercent: (totalCost / dailyBudget) * 100,
      monthlyUsagePercent: (totalCost / monthlyBudget) * 100
    };
  }, [modelCosts, dailyBudget, monthlyBudget]);
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, [onRefresh]);
  
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };
  
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };
  
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "#ef4444";
    if (percent >= 70) return "#f59e0b";
    return "#10b981";
  };
  
  return (
    <div className="cost-dashboard">
      <div className="dashboard-header">
        <h3>
          <DollarSign className="header-icon" />
          실시간 비용 현황
        </h3>
        <button 
          className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
          onClick={handleRefresh}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="stats-grid">
        {/* 현재 세션 비용 */}
        <div className="stat-card primary">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCost(currentSessionCost)}</span>
            <span className="stat-label">현재 세션</span>
          </div>
        </div>
        
        {/* 총 비용 */}
        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCost(stats.totalCost)}</span>
            <span className="stat-label">오늘 총 비용</span>
          </div>
        </div>
        
        {/* 토큰 사용량 */}
        <div className="stat-card">
          <div className="stat-icon">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatTokens(stats.totalTokens)}</span>
            <span className="stat-label">총 토큰</span>
          </div>
        </div>
        
        {/* 평균 지연시간 */}
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgLatency.toFixed(0)}ms</span>
            <span className="stat-label">평균 지연</span>
          </div>
        </div>
      </div>
      
      {/* 예산 게이지 */}
      <div className="budget-section">
        <div className="budget-item">
          <div className="budget-header">
            <span>일일 예산</span>
            <span>{formatCost(stats.totalCost)} / {formatCost(dailyBudget)}</span>
          </div>
          <div className="budget-bar">
            <div 
              className="budget-fill"
              style={{ 
                width: `${Math.min(stats.dailyUsagePercent, 100)}%`,
                background: getUsageColor(stats.dailyUsagePercent)
              }}
            />
          </div>
          {stats.dailyUsagePercent >= 80 && (
            <div className="budget-warning">
              <AlertTriangle size={12} />
              <span>일일 예산의 {stats.dailyUsagePercent.toFixed(0)}% 사용</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 모델별 비용 */}
      <div className="models-section">
        <h4>모델별 비용</h4>
        <div className="models-list">
          {modelCosts.length === 0 ? (
            <div className="empty-state">아직 데이터가 없습니다</div>
          ) : (
            modelCosts
              .sort((a, b) => b.totalCost - a.totalCost)
              .map(model => (
                <div key={model.modelId} className="model-item">
                  <div className="model-info">
                    <span className="model-name">{model.modelName}</span>
                    <span className="model-stats">
                      {model.requestCount}회 · {formatTokens(model.inputTokens + model.outputTokens)} 토큰
                    </span>
                  </div>
                  <div className="model-cost">
                    {formatCost(model.totalCost)}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      
      <div className="dashboard-footer">
        <span>마지막 업데이트: {lastUpdate.toLocaleTimeString()}</span>
      </div>
      
      <style jsx>{`
        .cost-dashboard {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .dashboard-header h3 {
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
        
        .refresh-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          border-radius: 6px;
        }
        
        .refresh-btn:hover {
          background: var(--bg-tertiary, #252536);
          color: var(--text-primary, #e0e0e0);
        }
        
        .refresh-btn.spinning :global(svg) {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 16px;
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
        }
        
        .stat-card.primary {
          background: rgba(124, 58, 237, 0.1);
          border-color: var(--primary, #7c3aed);
        }
        
        .stat-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary, #252536);
          border-radius: 10px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .stat-card.primary .stat-icon {
          background: var(--primary, #7c3aed);
          color: white;
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .stat-label {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .budget-section {
          padding: 0 16px 16px;
        }
        
        .budget-item {
          padding: 12px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 10px;
        }
        
        .budget-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .budget-bar {
          height: 6px;
          background: var(--bg-tertiary, #252536);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .budget-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .budget-warning {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 11px;
          color: #f59e0b;
        }
        
        .models-section {
          padding: 0 16px 16px;
        }
        
        .models-section h4 {
          margin: 0 0 12px;
          font-size: 13px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .models-list {
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .model-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .model-item:last-child {
          border-bottom: none;
        }
        
        .model-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .model-stats {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .model-cost {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary, #7c3aed);
        }
        
        .empty-state {
          padding: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .dashboard-footer {
          padding: 10px 16px;
          border-top: 1px solid var(--border-color, #3e3e5a);
          font-size: 10px;
          color: var(--text-muted, #6e6e7e);
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default RealtimeCostDashboard;
