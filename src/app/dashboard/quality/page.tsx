"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp } from "lucide-react";

interface QualityStats {
  avgAccuracy: string;
  avgRelevance: string;
  avgStyle: string;
  satisfactionRate: string;
  totalFeedback: number;
  totalEvaluations: number;
  positiveFeedback: number;
  negativeFeedback: number;
}

interface LowQualityResponse {
  id: string;
  messageId: string;
  scoreAccuracy: number | null;
  scoreRelevance: number | null;
  feedback: string | null;
  createdAt: string;
}

interface RecentFeedback {
  id: string;
  messageId: string;
  userId: string;
  rating: number;
  reason: string | null;
  createdAt: string;
}

export default function QualityDashboardPage() {
  const [stats, setStats] = useState<QualityStats | null>(null);
  const [lowQuality, setLowQuality] = useState<LowQualityResponse[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quality/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setLowQuality(data.lowQualityResponses || []);
        setRecentFeedback(data.recentFeedback || []);
      }
    } catch (error) {
      console.error("Failed to fetch quality data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000 / 60;
    if (diff < 60) return `${Math.floor(diff)}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return `${Math.floor(diff / 1440)}일 전`;
  };

  const statsCards = stats ? [
    { label: "평균 정확도", value: `${stats.avgAccuracy}%`, icon: TrendingUp, color: "#22c55e" },
    { label: "평균 관련성", value: `${stats.avgRelevance}%`, icon: TrendingUp, color: "#3b82f6" },
    { label: "만족도 점수", value: `${stats.satisfactionRate}/5.0`, icon: ThumbsUp, color: "#f59e0b" },
    { label: "총 피드백", value: stats.totalFeedback.toString(), icon: ThumbsUp, color: "#8b5cf6" },
  ] : [];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>AI 품질 & 신뢰성</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            AI 모델의 성능과 사용자 만족도를 모니터링하세요.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw style={{ width: '14px', height: '14px', marginRight: '6px', animation: loading ? 'spin 1s linear infinite' : 'none' }} /> 
          새로고침
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          데이터를 불러오는 중...
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {statsCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="p-6">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ 
                      padding: '8px', 
                      borderRadius: '8px', 
                      background: `${stat.color}20` 
                    }}>
                      <Icon style={{ width: '20px', height: '20px', color: stat.color }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Feedback Summary */}
          {stats && (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <Card className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ThumbsUp style={{ width: '24px', height: '24px', color: 'var(--color-success)' }} />
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>
                    {stats.positiveFeedback}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>긍정적 피드백</div>
                </div>
              </Card>
              <Card className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ThumbsDown style={{ width: '24px', height: '24px', color: 'var(--color-error)' }} />
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>
                    {stats.negativeFeedback}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>부정적 피드백</div>
                </div>
              </Card>
              <Card className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--color-warning)' }} />
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-warning)' }}>
                    {lowQuality.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>저품질 응답</div>
                </div>
              </Card>
              <Card className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stats.totalEvaluations}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>총 평가</div>
                </div>
              </Card>
            </div>
          )}

          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {/* Low Quality Responses */}
            <Card className="p-6">
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                최근 저품질 응답
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {lowQuality.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    저품질 응답이 없습니다 ✨
                  </div>
                ) : (
                  lowQuality.map((item) => (
                    <div key={item.id} style={{ 
                      padding: '16px', 
                      borderRadius: 'var(--radius-md)', 
                      background: '#fee2e2', 
                      border: '1px solid #fecaca' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <span className="status status-error">
                          정확도: {((item.scoreAccuracy || 0) * 100).toFixed(0)}%
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {item.feedback || "품질 기준 미달"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Feedback */}
            <Card className="p-6">
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                최근 사용자 피드백
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentFeedback.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    아직 피드백이 없습니다
                  </div>
                ) : (
                  recentFeedback.map((fb) => (
                    <div key={fb.id} style={{ 
                      padding: '16px', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-color)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {fb.rating > 0 ? (
                          <ThumbsUp style={{ width: '18px', height: '18px', color: 'var(--color-success)' }} />
                        ) : (
                          <ThumbsDown style={{ width: '18px', height: '18px', color: 'var(--color-error)' }} />
                        )}
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {fb.rating > 0 ? "좋아요" : "싫어요"}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {formatTime(fb.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {fb.reason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
