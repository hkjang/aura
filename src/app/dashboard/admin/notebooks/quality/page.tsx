"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  ArrowLeft,
  Layers,
  FileText,
  Activity,
  Target,
  Zap,
  Clock,
  Eye,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ============ Types ============
interface QualityMetrics {
  totalChunks: number;
  avgQualityScore: number;
  qualityTrend: number;
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  usageStats: {
    totalSearches: number;
    avgUsagePerChunk: number;
    unusedChunks: number;
  };
  problems: ProblemChunk[];
  recentChanges: QualityChange[];
}

interface ProblemChunk {
  id: string;
  content: string;
  sourceTitle: string;
  qualityScore: number;
  issue: string;
  lastUsed: string | null;
}

interface QualityChange {
  date: string;
  avgScore: number;
  totalChunks: number;
}

// ============ Color Constants ============
const QUALITY_COLORS = {
  excellent: { bg: "rgba(34, 197, 94, 0.15)", border: "#22c55e", fill: "#22c55e" },
  good: { bg: "rgba(59, 130, 246, 0.15)", border: "#3b82f6", fill: "#3b82f6" },
  fair: { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", fill: "#f59e0b" },
  poor: { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", fill: "#ef4444" },
};

// ============ Main Component ============
export default function ChunkQualityDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch chunks for quality analysis
      const chunksRes = await fetch("/api/chunks?includeUsage=true&limit=1000");
      if (chunksRes.ok) {
        const data = await chunksRes.json();
        const chunks = data.chunks || [];
        
        // Calculate metrics from chunks
        const totalChunks = chunks.length;
        const scores = chunks.map((c: any) => (c.metadata?.qualityScore as number) || 70);
        const avgQualityScore = scores.length > 0 
          ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
          : 0;

        // Distribution
        const distribution = {
          excellent: chunks.filter((c: any) => ((c.metadata?.qualityScore as number) || 70) >= 80).length,
          good: chunks.filter((c: any) => {
            const s = (c.metadata?.qualityScore as number) || 70;
            return s >= 60 && s < 80;
          }).length,
          fair: chunks.filter((c: any) => {
            const s = (c.metadata?.qualityScore as number) || 70;
            return s >= 40 && s < 60;
          }).length,
          poor: chunks.filter((c: any) => ((c.metadata?.qualityScore as number) || 70) < 40).length,
        };

        // Usage stats
        const usageCounts = chunks.map((c: any) => c.usageCount || 0);
        const unusedChunks = chunks.filter((c: any) => (c.usageCount || 0) === 0).length;

        // Problem chunks (low quality or unused)
        const problems: ProblemChunk[] = chunks
          .filter((c: any) => ((c.metadata?.qualityScore as number) || 70) < 50 || (c.usageCount || 0) === 0)
          .slice(0, 10)
          .map((c: any) => ({
            id: c.id,
            content: c.content.substring(0, 100) + "...",
            sourceTitle: c.source?.title || "Unknown",
            qualityScore: (c.metadata?.qualityScore as number) || 70,
            issue: ((c.metadata?.qualityScore as number) || 70) < 50 ? "저품질" : "미사용",
            lastUsed: null,
          }));

        // Mock trend data (would come from historical data in real implementation)
        const recentChanges: QualityChange[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          recentChanges.push({
            date: date.toISOString().split("T")[0],
            avgScore: avgQualityScore + Math.floor(Math.random() * 10) - 5,
            totalChunks: totalChunks - i * 2,
          });
        }

        setMetrics({
          totalChunks,
          avgQualityScore,
          qualityTrend: 2.5, // Would calculate from historical data
          distribution,
          usageStats: {
            totalSearches: usageCounts.reduce((a: number, b: number) => a + b, 0),
            avgUsagePerChunk: totalChunks > 0 
              ? Math.round(usageCounts.reduce((a: number, b: number) => a + b, 0) / totalChunks * 10) / 10
              : 0,
            unusedChunks,
          },
          problems,
          recentChanges,
        });
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading || !metrics) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw style={{ width: 32, height: 32, color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const distributionTotal = metrics.distribution.excellent + metrics.distribution.good + 
                            metrics.distribution.fair + metrics.distribution.poor;

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/admin/notebooks">
            <button style={{ padding: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer" }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, display: "flex", alignItems: "center", gap: "12px" }}>
              <BarChart3 style={{ width: 24, height: 24, color: "var(--color-primary)" }} />
              청크 품질 대시보드
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginTop: "4px" }}>
              청킹 품질 분석 및 문제 감지
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
            {(["7d", "30d", "90d"] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  padding: "8px 16px",
                  background: selectedPeriod === period ? "var(--color-primary)" : "var(--bg-primary)",
                  color: selectedPeriod === period ? "white" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {period === "7d" ? "7일" : period === "30d" ? "30일" : "90일"}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMetrics}
            style={{
              padding: "8px 16px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            새로고침
          </button>

          <Link href="/dashboard/admin/notebooks/chunks">
            <button style={{
              padding: "8px 16px",
              background: "var(--color-primary)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}>
              <Layers style={{ width: 14, height: 14 }} />
              청킹 시각화
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <Layers style={{ width: 20, height: 20, color: "var(--color-primary)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>전체 청크</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{metrics.totalChunks.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            {metrics.distribution.excellent + metrics.distribution.good} 양호
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <Target style={{ width: 20, height: 20, color: "#22c55e" }} />
            <span style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              background: metrics.qualityTrend >= 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: metrics.qualityTrend >= 0 ? "#22c55e" : "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              {metrics.qualityTrend >= 0 ? <TrendingUp style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
              {Math.abs(metrics.qualityTrend)}%
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{metrics.avgQualityScore}<span style={{ fontSize: "14px", fontWeight: 400 }}>점</span></div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            평균 품질 점수
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <Activity style={{ width: 20, height: 20, color: "#3b82f6" }} />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>검색 사용</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{metrics.usageStats.totalSearches.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            평균 {metrics.usageStats.avgUsagePerChunk}회/청크
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <AlertTriangle style={{ width: 20, height: 20, color: "#f59e0b" }} />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>문제 감지</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: metrics.usageStats.unusedChunks > 0 ? "#f59e0b" : "inherit" }}>
            {metrics.usageStats.unusedChunks + metrics.distribution.poor}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            미사용 {metrics.usageStats.unusedChunks} / 저품질 {metrics.distribution.poor}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Quality Distribution */}
          <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>품질 분포</h3>
            
            <div style={{ display: "flex", height: "24px", borderRadius: "6px", overflow: "hidden", marginBottom: "16px" }}>
              {distributionTotal > 0 && (
                <>
                  <div style={{ width: `${(metrics.distribution.excellent / distributionTotal) * 100}%`, background: QUALITY_COLORS.excellent.fill }} />
                  <div style={{ width: `${(metrics.distribution.good / distributionTotal) * 100}%`, background: QUALITY_COLORS.good.fill }} />
                  <div style={{ width: `${(metrics.distribution.fair / distributionTotal) * 100}%`, background: QUALITY_COLORS.fair.fill }} />
                  <div style={{ width: `${(metrics.distribution.poor / distributionTotal) * 100}%`, background: QUALITY_COLORS.poor.fill }} />
                </>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { label: "우수 (80+)", count: metrics.distribution.excellent, color: QUALITY_COLORS.excellent },
                { label: "양호 (60-79)", count: metrics.distribution.good, color: QUALITY_COLORS.good },
                { label: "보통 (40-59)", count: metrics.distribution.fair, color: QUALITY_COLORS.fair },
                { label: "미흡 (<40)", count: metrics.distribution.poor, color: QUALITY_COLORS.poor },
              ].map((item, i) => (
                <div key={i} style={{ padding: "12px", background: item.color.bg, borderRadius: "8px", borderLeft: `3px solid ${item.color.border}` }}>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{item.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "4px" }}>{item.count}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                    {distributionTotal > 0 ? Math.round((item.count / distributionTotal) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>품질 추이</h3>
            
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
              {metrics.recentChanges.map((change, i) => {
                const maxScore = Math.max(...metrics.recentChanges.map(c => c.avgScore));
                const height = (change.avgScore / maxScore) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{change.avgScore}</div>
                    <div style={{
                      width: "100%",
                      height: `${height}px`,
                      background: change.avgScore >= 70 ? "var(--color-primary)" : "#f59e0b",
                      borderRadius: "4px 4px 0 0",
                    }} />
                    <div style={{ fontSize: "9px", color: "var(--text-tertiary)" }}>
                      {change.date.split("-").slice(1).join("/")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Problem Chunks */}
        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle style={{ width: 16, height: 16, color: "#f59e0b" }} />
              문제 청크
            </h3>
            <Link href="/dashboard/admin/notebooks/chunks?filter=problems">
              <span style={{ fontSize: "12px", color: "var(--color-primary)", cursor: "pointer" }}>전체 보기</span>
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {metrics.problems.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
                <CheckCircle style={{ width: 32, height: 32, color: "#22c55e", margin: "0 auto 8px" }} />
                문제가 감지되지 않았습니다
              </div>
            ) : (
              metrics.problems.map((problem, i) => (
                <Link key={i} href={`/dashboard/admin/notebooks/chunks?selected=${problem.id}`}>
                  <div style={{
                    padding: "12px",
                    background: "var(--bg-primary)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "1px solid var(--border-color)",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: problem.issue === "저품질" ? QUALITY_COLORS.poor.bg : QUALITY_COLORS.fair.bg,
                        color: problem.issue === "저품질" ? QUALITY_COLORS.poor.border : QUALITY_COLORS.fair.border,
                        fontWeight: 600,
                      }}>
                        {problem.issue}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {problem.qualityScore}점
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      {problem.content}
                    </p>
                    <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "6px" }}>
                      {problem.sourceTitle}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
