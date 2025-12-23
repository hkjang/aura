"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ArrowLeft,
  RefreshCw,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Layers,
  Target,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Eye,
  TestTube,
  Gauge,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Link from "next/link";

// ============ Types ============
interface AccuracyConfig {
  id: string;
  name: string;
  scope: string;
  isDefault: boolean;
  isActive: boolean;
  minQualityScore: number;
  minSimilarity: number;
  maxReferenceChunks: number;
  keywordMatchBoost: number;
  vectorWeight: number;
  updatedAt: string;
}

interface TuningRecommendation {
  ruleId: string;
  currentValue: number;
  recommendedValue: number;
  reason: string;
  expectedImpact: number;
}

interface FeedbackStats {
  avgRating: number | null;
  totalFeedback: number;
  helpfulRate: number | null;
}

interface FailurePattern {
  type: string;
  count: number;
  percentage: number;
}

// ============ Main Component ============
export default function RAGAccuracyDashboardPage() {
  const [configs, setConfigs] = useState<AccuracyConfig[]>([]);
  const [recommendations, setRecommendations] = useState<TuningRecommendation[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [failurePatterns, setFailurePatterns] = useState<FailurePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(false);

  // Demo data for visualization
  const demoMetrics = {
    precision: 0.82,
    recall: 0.75,
    f1Score: 0.78,
    avgConfidence: 0.71,
    queriesProcessed: 1247,
    avgResponseTime: 1.2,
  };

  const demoTrends = [
    { date: "12/17", precision: 0.78, recall: 0.72 },
    { date: "12/18", precision: 0.79, recall: 0.73 },
    { date: "12/19", precision: 0.80, recall: 0.74 },
    { date: "12/20", precision: 0.81, recall: 0.74 },
    { date: "12/21", precision: 0.82, recall: 0.75 },
    { date: "12/22", precision: 0.82, recall: 0.76 },
    { date: "12/23", precision: 0.82, recall: 0.75 },
  ];

  const demoRecommendations: TuningRecommendation[] = [
    {
      ruleId: "minSimilarity",
      currentValue: 0.3,
      recommendedValue: 0.25,
      reason: "Recall failures 22%에서 감지됨",
      expectedImpact: 0.15,
    },
    {
      ruleId: "diversityWeight",
      currentValue: 0.2,
      recommendedValue: 0.35,
      reason: "단일 문서 편중 피드백 15% 발생",
      expectedImpact: 0.12,
    },
  ];

  const demoFailures: FailurePattern[] = [
    { type: "recall_failure", count: 45, percentage: 22 },
    { type: "precision_failure", count: 28, percentage: 14 },
    { type: "confidence_failure", count: 18, percentage: 9 },
    { type: "conflict_failure", count: 12, percentage: 6 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch configs
        const configRes = await fetch("/api/rag-accuracy-config");
        if (configRes.ok) {
          const data = await configRes.json();
          setConfigs(data.configs || []);
          if (data.configs?.length > 0) {
            setSelectedConfig(data.configs.find((c: AccuracyConfig) => c.isDefault)?.id || data.configs[0].id);
          }
        }

        // Fetch feedback stats
        const feedbackRes = await fetch("/api/rag-feedback");
        if (feedbackRes.ok) {
          const data = await feedbackRes.json();
          setFeedbackStats(data.stats);
        }

        // Use demo data for recommendations and failures
        setRecommendations(demoRecommendations);
        setFailurePatterns(demoFailures);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getImpactColor = (impact: number) => {
    if (impact >= 0.15) return "#22c55e";
    if (impact >= 0.1) return "#3b82f6";
    if (impact >= 0.05) return "#f59e0b";
    return "#6b7280";
  };

  const getFailureIcon = (type: string) => {
    switch (type) {
      case "recall_failure": return <Target style={{ width: 16, height: 16 }} />;
      case "precision_failure": return <XCircle style={{ width: 16, height: 16 }} />;
      case "confidence_failure": return <AlertTriangle style={{ width: 16, height: 16 }} />;
      case "conflict_failure": return <Layers style={{ width: 16, height: 16 }} />;
      default: return <AlertTriangle style={{ width: 16, height: 16 }} />;
    }
  };

  const getFailureLabel = (type: string) => {
    switch (type) {
      case "recall_failure": return "Recall 실패";
      case "precision_failure": return "Precision 실패";
      case "confidence_failure": return "신뢰도 부족";
      case "conflict_failure": return "정보 충돌";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw style={{ width: 32, height: 32, color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/admin/notebooks">
            <button style={{ padding: "8px", background: "var(--bg-secondary)", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <Gauge style={{ width: 24, height: 24, color: "var(--color-primary)" }} />
              RAG 정확도 자율 최적화 대시보드
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              검색 정확도 모니터링, 자동 튜닝, 규칙 관리
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Auto-Tune Toggle */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: autoTuneEnabled ? "rgba(34, 197, 94, 0.1)" : "var(--bg-secondary)",
            border: `1px solid ${autoTuneEnabled ? "#22c55e" : "var(--border-color)"}`,
            borderRadius: "8px",
          }}>
            <Zap style={{ width: 16, height: 16, color: autoTuneEnabled ? "#22c55e" : "var(--text-tertiary)" }} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: autoTuneEnabled ? "#22c55e" : "var(--text-secondary)" }}>
              자동 튜닝
            </span>
            <button
              onClick={() => setAutoTuneEnabled(!autoTuneEnabled)}
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "11px",
                border: "none",
                background: autoTuneEnabled ? "#22c55e" : "var(--border-color)",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s",
              }}
            >
              <div style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: "2px",
                left: autoTuneEnabled ? "20px" : "2px",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          <Link href="/dashboard/admin/notebooks/rag-trace">
            <button style={{ padding: "8px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <Eye style={{ width: 14, height: 14 }} />
              RAG 추적
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Target style={{ width: 18, height: 18, color: "#22c55e" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Precision</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#22c55e" }}>
            {(demoMetrics.precision * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Layers style={{ width: 18, height: 18, color: "#3b82f6" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Recall</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#3b82f6" }}>
            {(demoMetrics.recall * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <BarChart3 style={{ width: 18, height: 18, color: "#8b5cf6" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>F1 Score</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#8b5cf6" }}>
            {(demoMetrics.f1Score * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Shield style={{ width: 18, height: 18, color: "#f59e0b" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>평균 신뢰도</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#f59e0b" }}>
            {(demoMetrics.avgConfidence * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <MessageSquare style={{ width: 18, height: 18, color: "#06b6d4" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>처리 쿼리</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#06b6d4" }}>
            {demoMetrics.queriesProcessed.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Zap style={{ width: 18, height: 18, color: "#ec4899" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>응답 시간</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#ec4899" }}>
            {demoMetrics.avgResponseTime}s
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Trend Chart */}
          <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp style={{ width: 18, height: 18, color: "var(--color-primary)" }} />
              정확도 추세 (7일)
            </h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "200px", paddingBottom: "30px", position: "relative" }}>
              {demoTrends.map((point, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "140px" }}>
                    <div style={{
                      width: "20px",
                      height: `${point.precision * 140}px`,
                      background: "linear-gradient(180deg, #22c55e 0%, rgba(34, 197, 94, 0.3) 100%)",
                      borderRadius: "4px 4px 0 0",
                    }} />
                    <div style={{
                      width: "20px",
                      height: `${point.recall * 140}px`,
                      background: "linear-gradient(180deg, #3b82f6 0%, rgba(59, 130, 246, 0.3) 100%)",
                      borderRadius: "4px 4px 0 0",
                    }} />
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{point.date}</span>
                </div>
              ))}
              <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", display: "flex", justifyContent: "center", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "12px", height: "12px", background: "#22c55e", borderRadius: "2px" }} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Precision</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "2px" }} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Recall</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tuning Recommendations */}
          <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain style={{ width: 18, height: 18, color: "#8b5cf6" }} />
                자동 튜닝 추천
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 400 }}>
                피드백 기반 분석
              </span>
            </h2>
            
            {recommendations.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)" }}>
                <CheckCircle style={{ width: 32, height: 32, margin: "0 auto 12px", opacity: 0.5 }} />
                <p>현재 튜닝 추천 사항이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{
                    padding: "16px",
                    background: "var(--bg-primary)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <code style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "4px" }}>
                            {rec.ruleId}
                          </code>
                          <span style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: `${getImpactColor(rec.expectedImpact)}20`,
                            color: getImpactColor(rec.expectedImpact),
                          }}>
                            +{(rec.expectedImpact * 100).toFixed(0)}% 예상
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{rec.reason}</p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{
                          padding: "6px 12px",
                          background: "var(--color-primary)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                          <TestTube style={{ width: 12, height: 12 }} />
                          Shadow Test
                        </button>
                        <button style={{
                          padding: "6px 12px",
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}>
                          적용
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>현재:</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                          {rec.currentValue}
                        </span>
                      </div>
                      <span style={{ color: "var(--text-tertiary)" }}>→</span>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>추천:</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: getImpactColor(rec.expectedImpact) }}>
                          {rec.recommendedValue}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* User Feedback Stats */}
          <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ThumbsUp style={{ width: 18, height: 18, color: "#22c55e" }} />
              사용자 피드백
            </h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div style={{ padding: "16px", background: "var(--bg-primary)", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-primary)" }}>
                  {feedbackStats?.avgRating?.toFixed(1) || "4.2"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>평균 평점</div>
              </div>
              <div style={{ padding: "16px", background: "var(--bg-primary)", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#22c55e" }}>
                  {feedbackStats?.helpfulRate ? (feedbackStats.helpfulRate * 100).toFixed(0) : "78"}%
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>도움됨 비율</div>
              </div>
            </div>

            <div style={{ padding: "12px", background: "var(--bg-primary)", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px" }}>
                총 피드백: {feedbackStats?.totalFeedback || 156}건 (최근 30일)
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} style={{ flex: 1, height: "8px", background: star >= 4 ? "#22c55e" : star === 3 ? "#f59e0b" : "#ef4444", borderRadius: "2px", opacity: 0.7 + (star * 0.06) }} />
                ))}
              </div>
            </div>
          </div>

          {/* Failure Patterns */}
          <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle style={{ width: 18, height: 18, color: "#f59e0b" }} />
              실패 유형 분석
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {failurePatterns.map((pattern, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: pattern.type === "recall_failure" ? "rgba(239, 68, 68, 0.1)" :
                               pattern.type === "precision_failure" ? "rgba(245, 158, 11, 0.1)" :
                               "rgba(107, 114, 128, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: pattern.type === "recall_failure" ? "#ef4444" :
                           pattern.type === "precision_failure" ? "#f59e0b" : "#6b7280",
                  }}>
                    {getFailureIcon(pattern.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {getFailureLabel(pattern.type)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {pattern.count}건 발생
                    </div>
                  </div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: pattern.percentage > 15 ? "#ef4444" : pattern.percentage > 10 ? "#f59e0b" : "var(--text-secondary)",
                  }}>
                    {pattern.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Config */}
          <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings style={{ width: 18, height: 18, color: "var(--color-primary)" }} />
              활성 규칙 설정
            </h2>
            
            {configs.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                <p style={{ marginBottom: "12px" }}>설정이 없습니다</p>
                <button style={{
                  padding: "8px 16px",
                  background: "var(--color-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}>
                  기본 설정 생성
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {configs.slice(0, 3).map(config => (
                  <div key={config.id} style={{
                    padding: "12px",
                    background: config.isDefault ? "rgba(37, 99, 235, 0.05)" : "var(--bg-primary)",
                    borderRadius: "8px",
                    border: `1px solid ${config.isDefault ? "var(--color-primary)" : "var(--border-color)"}`,
                    cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                          {config.name}
                        </span>
                        {config.isDefault && (
                          <span style={{ fontSize: "10px", padding: "2px 6px", background: "var(--color-primary)", color: "white", borderRadius: "4px" }}>
                            기본
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {config.scope}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
