"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  BookOpen,
  FileText,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface DashboardStats {
  notebooks: {
    total: number;
    active: number;
    inactive: number;
    deleted: number;
  };
  knowledge: {
    sources: number;
    chunks: number;
  };
  qna: {
    total: number;
    last24Hours: number;
  };
  processing: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  topOwners: Array<{
    ownerId: string;
    count: number;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/notebooks/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
        <AlertCircle style={{ width: "48px", height: "48px", margin: "0 auto 16px" }} />
        <p>통계를 불러올 수 없습니다</p>
      </div>
    );
  }

  const processingTotal =
    stats.processing.pending +
    stats.processing.processing +
    stats.processing.completed +
    stats.processing.failed;
  const failureRate =
    processingTotal > 0
      ? ((stats.processing.failed / processingTotal) * 100).toFixed(1)
      : "0";

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/admin/notebooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </Button>
          </Link>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
              운영 모니터링 대시보드
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              실시간 노트북 시스템 현황
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchStats}>
          <RefreshCw style={{ width: "16px", height: "16px", marginRight: "8px" }} />
          새로고침
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <Card style={{ padding: "24px", background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05))", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>전체 노트북</p>
              <p style={{ fontSize: "30px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{stats.notebooks.total}</p>
            </div>
            <BookOpen style={{ width: "40px", height: "40px", color: "#2563eb", opacity: 0.8 }} />
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px", fontSize: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981" }}>
              <CheckCircle style={{ width: "12px", height: "12px" }} />
              {stats.notebooks.active} 활성
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b" }}>
              <AlertCircle style={{ width: "12px", height: "12px" }} />
              {stats.notebooks.inactive} 비활성
            </span>
          </div>
        </Card>

        <Card style={{ padding: "24px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>지식 소스</p>
              <p style={{ fontSize: "30px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{stats.knowledge.sources}</p>
            </div>
            <FileText style={{ width: "40px", height: "40px", color: "#8b5cf6", opacity: 0.8 }} />
          </div>
          <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
            {stats.knowledge.chunks.toLocaleString()} 청크 색인됨
          </div>
        </Card>

        <Card style={{ padding: "24px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>총 Q&A</p>
              <p style={{ fontSize: "30px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{stats.qna.total}</p>
            </div>
            <MessageSquare style={{ width: "40px", height: "40px", color: "#10b981", opacity: 0.8 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "16px", fontSize: "12px" }}>
            <TrendingUp style={{ width: "12px", height: "12px", color: "#10b981" }} />
            <span style={{ color: "#10b981" }}>오늘 {stats.qna.last24Hours}건</span>
          </div>
        </Card>

        <Card style={{ padding: "24px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>실패율</p>
              <p style={{ fontSize: "30px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{failureRate}%</p>
            </div>
            <Activity style={{ width: "40px", height: "40px", color: "#f59e0b", opacity: 0.8 }} />
          </div>
          <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
            {stats.processing.failed} / {processingTotal} 작업 실패
          </div>
        </Card>
      </div>

      {/* Processing Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Card style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <RefreshCw style={{ width: "20px", height: "20px" }} />
            파이프라인 처리 현황
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { label: "대기중", value: stats.processing.pending, color: "#f59e0b" },
              { label: "처리중", value: stats.processing.processing, color: "#2563eb" },
              { label: "완료", value: stats.processing.completed, color: "#10b981" },
              { label: "실패", value: stats.processing.failed, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-primary)" }}>{item.label}</span>
                  <span style={{ fontWeight: 500, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      background: item.color,
                      borderRadius: "4px",
                      width: `${processingTotal > 0 ? (item.value / processingTotal) * 100 : 0}%`,
                      transition: "width 0.3s"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <Users style={{ width: "20px", height: "20px" }} />
            상위 노트북 소유자
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats.topOwners.map((owner, index) => (
              <div key={owner.ownerId} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    background: index === 0 ? "rgba(245, 158, 11, 0.2)" : index === 1 ? "rgba(156, 163, 175, 0.2)" : index === 2 ? "rgba(249, 115, 22, 0.2)" : "var(--bg-secondary)",
                    color: index === 0 ? "#f59e0b" : index === 1 ? "#6b7280" : index === 2 ? "#f97316" : "var(--text-secondary)"
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>{owner.ownerId}</p>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{owner.count} 노트북</div>
              </div>
            ))}
            {stats.topOwners.length === 0 && (
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center", padding: "16px" }}>
                데이터 없음
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <Card style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>빠른 링크</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { href: "/dashboard/admin/notebooks", icon: BookOpen, title: "노트북 관리", desc: "전체 노트북 조회" },
            { href: "/dashboard/admin/notebooks/policies", icon: Activity, title: "정책 관리", desc: "Q&A, 업로드 정책" },
            { href: "/dashboard/admin/notebooks/pipeline", icon: RefreshCw, title: "파이프라인", desc: "처리 설정 및 작업" },
            { href: "/dashboard/admin/notebooks/audit", icon: FileText, title: "감사 로그", desc: "변경 이력 조회" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div style={{
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "background 0.2s"
              }}>
                <link.icon style={{ width: "24px", height: "24px", marginBottom: "8px", color: "var(--color-primary)" }} />
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>{link.title}</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
