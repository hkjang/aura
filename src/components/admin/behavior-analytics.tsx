"use client";

import { useState, useMemo } from "react";
import { 
  Activity, 
  Clock, 
  MousePointer, 
  MessageSquare,
  TrendingUp,
  Search,
  Filter,
  ChevronDown
} from "lucide-react";

interface UserBehavior {
  userId: string;
  userName: string;
  totalSessions: number;
  avgSessionDuration: number; // minutes
  totalMessages: number;
  avgResponseTime: number; // seconds
  topActions: Array<{ action: string; count: number }>;
  peakHours: number[];
  deviceType: "desktop" | "mobile" | "tablet";
  lastActive: Date;
}

interface BehaviorAnalyticsProps {
  data: UserBehavior[];
  dateRange?: { start: Date; end: Date };
}

export function BehaviorAnalytics({ data, dateRange }: BehaviorAnalyticsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"sessions" | "messages" | "duration">("sessions");
  const [showFilters, setShowFilters] = useState(false);
  
  // 전체 통계 계산
  const overallStats = useMemo(() => {
    const totalUsers = data.length;
    const totalSessions = data.reduce((sum, u) => sum + u.totalSessions, 0);
    const totalMessages = data.reduce((sum, u) => sum + u.totalMessages, 0);
    const avgDuration = data.reduce((sum, u) => sum + u.avgSessionDuration, 0) / totalUsers;
    const avgResponseTime = data.reduce((sum, u) => sum + u.avgResponseTime, 0) / totalUsers;
    
    return { totalUsers, totalSessions, totalMessages, avgDuration, avgResponseTime };
  }, [data]);
  
  // 피크 시간대 계산
  const peakHourDistribution = useMemo(() => {
    const distribution = new Array(24).fill(0);
    data.forEach(user => {
      user.peakHours.forEach(hour => {
        distribution[hour]++;
      });
    });
    return distribution;
  }, [data]);
  
  // 최고 피크 시간
  const topPeakHour = useMemo(() => {
    const maxIndex = peakHourDistribution.indexOf(Math.max(...peakHourDistribution));
    return maxIndex;
  }, [peakHourDistribution]);
  
  // 필터링 및 정렬된 사용자 목록
  const filteredUsers = useMemo(() => {
    let filtered = data;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.userName.toLowerCase().includes(query) ||
        u.userId.toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "sessions":
          return b.totalSessions - a.totalSessions;
        case "messages":
          return b.totalMessages - a.totalMessages;
        case "duration":
          return b.avgSessionDuration - a.avgSessionDuration;
        default:
          return 0;
      }
    });
  }, [data, searchQuery, sortBy]);
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(0)}분`;
    return `${(minutes / 60).toFixed(1)}시간`;
  };
  
  return (
    <div className="behavior-analytics">
      <div className="analytics-header">
        <h3>
          <Activity className="header-icon" />
          사용자 행동 분석
        </h3>
        {dateRange && (
          <span className="date-range">
            {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
          </span>
        )}
      </div>
      
      {/* 전체 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <MousePointer />
          </div>
          <div className="stat-info">
            <span className="stat-value">{overallStats.totalUsers}</span>
            <span className="stat-label">활성 사용자</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <MessageSquare />
          </div>
          <div className="stat-info">
            <span className="stat-value">{overallStats.totalMessages.toLocaleString()}</span>
            <span className="stat-label">총 메시지</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <Clock />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatDuration(overallStats.avgDuration)}</span>
            <span className="stat-label">평균 세션 시간</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <TrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-value">{topPeakHour}:00</span>
            <span className="stat-label">피크 시간대</span>
          </div>
        </div>
      </div>
      
      {/* 시간대별 활동 차트 */}
      <div className="activity-chart">
        <h4>시간대별 활동</h4>
        <div className="chart-container">
          {peakHourDistribution.map((count, hour) => {
            const maxCount = Math.max(...peakHourDistribution);
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={hour} className="chart-bar-wrapper">
                <div
                  className="chart-bar"
                  style={{ height: `${height}%` }}
                  title={`${hour}시: ${count}명`}
                />
                <span className="chart-label">{hour}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 사용자 목록 */}
      <div className="users-section">
        <div className="section-header">
          <h4>사용자별 상세</h4>
          <div className="controls">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="사용자 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} />
              정렬: {sortBy === "sessions" ? "세션" : sortBy === "messages" ? "메시지" : "시간"}
              <ChevronDown />
            </button>
            {showFilters && (
              <div className="filter-dropdown">
                <button onClick={() => { setSortBy("sessions"); setShowFilters(false); }}>세션 수</button>
                <button onClick={() => { setSortBy("messages"); setShowFilters(false); }}>메시지 수</button>
                <button onClick={() => { setSortBy("duration"); setShowFilters(false); }}>세션 시간</button>
              </div>
            )}
          </div>
        </div>
        
        <div className="users-list">
          {filteredUsers.slice(0, 10).map(user => (
            <div key={user.userId} className="user-row">
              <div className="user-info">
                <span className="user-name">{user.userName}</span>
                <span className="user-device">{user.deviceType}</span>
              </div>
              <div className="user-stats">
                <span className="user-stat">
                  <strong>{user.totalSessions}</strong> 세션
                </span>
                <span className="user-stat">
                  <strong>{user.totalMessages}</strong> 메시지
                </span>
                <span className="user-stat">
                  <strong>{formatDuration(user.avgSessionDuration)}</strong> 평균
                </span>
              </div>
              <div className="user-actions">
                {user.topActions.slice(0, 2).map((action, idx) => (
                  <span key={idx} className="action-tag">{action.action}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .behavior-analytics {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .analytics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .analytics-header h3 {
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
        
        .date-range {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 20px;
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 12px;
        }
        
        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        
        .stat-icon-wrapper.blue {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .stat-icon-wrapper.purple {
          background: rgba(124, 58, 237, 0.1);
          color: #7c3aed;
        }
        
        .stat-icon-wrapper.green {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .stat-icon-wrapper.orange {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .stat-icon-wrapper :global(svg) {
          width: 22px;
          height: 22px;
        }
        
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .stat-label {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .activity-chart {
          padding: 20px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .activity-chart h4 {
          margin: 0 0 16px;
          font-size: 14px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 100px;
          gap: 4px;
        }
        
        .chart-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        
        .chart-bar {
          width: 100%;
          max-width: 20px;
          background: linear-gradient(180deg, var(--primary, #7c3aed), rgba(124, 58, 237, 0.3));
          border-radius: 4px 4px 0 0;
          margin-top: auto;
          transition: height 0.3s ease;
        }
        
        .chart-label {
          font-size: 10px;
          color: var(--text-muted, #6e6e7e);
          margin-top: 4px;
        }
        
        .users-section {
          padding: 20px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .section-header h4 {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .controls {
          display: flex;
          gap: 12px;
          position: relative;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
        }
        
        .search-box :global(svg) {
          color: var(--text-muted, #6e6e7e);
        }
        
        .search-box input {
          background: transparent;
          border: none;
          color: var(--text-primary, #e0e0e0);
          font-size: 13px;
          outline: none;
          width: 150px;
        }
        
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          cursor: pointer;
        }
        
        .filter-btn :global(svg) {
          width: 16px;
          height: 16px;
        }
        
        .filter-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          overflow: hidden;
          z-index: 10;
        }
        
        .filter-dropdown button {
          display: block;
          width: 100%;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          text-align: left;
          cursor: pointer;
        }
        
        .filter-dropdown button:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .users-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .user-row {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 10px;
        }
        
        .user-info {
          flex: 1;
          min-width: 150px;
        }
        
        .user-name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .user-device {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .user-stats {
          display: flex;
          gap: 24px;
        }
        
        .user-stat {
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .user-stat strong {
          color: var(--text-primary, #e0e0e0);
        }
        
        .user-actions {
          display: flex;
          gap: 6px;
        }
        
        .action-tag {
          padding: 4px 10px;
          background: var(--bg-tertiary, #252536);
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
      `}</style>
    </div>
  );
}

export default BehaviorAnalytics;
