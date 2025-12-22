"use client";

import { useState, useEffect, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  FileText,
  MessageSquare,
  Users,
  Clock,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
} from "lucide-react";

interface NotebookDetail {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  status: string;
  ownerId: string;
  isPublic: boolean;
  tags: string;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sources: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    fileSize: number | null;
    createdAt: string;
    chunks: Array<{ id: string; chunkIndex: number }>;
  }>;
  shares: Array<{
    id: string;
    userId: string;
    permission: string;
  }>;
  _count: {
    sources: number;
    qnaHistory: number;
    comments: number;
  };
}

interface PipelineStatus {
  totalSources: number;
  processedSources: number;
  pendingSources: number;
  failedSources: number;
  totalChunks: number;
  lastProcessedAt: string | null;
}

export default function AdminNotebookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [notebook, setNotebook] = useState<NotebookDetail | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchNotebook = async () => {
    try {
      const res = await fetch(`/api/admin/notebooks/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotebook(data);
      setEditName(data.name);
      setEditDescription(data.description || "");
    } catch (error) {
      console.error("Failed to fetch notebook:", error);
    }
  };

  const fetchPipelineStatus = async () => {
    try {
      const res = await fetch(`/api/admin/notebooks/pipeline?type=status&notebookId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPipelineStatus(data);
    } catch (error) {
      console.error("Failed to fetch pipeline status:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchNotebook(), fetchPipelineStatus()]);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/admin/notebooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchNotebook();
    } catch (error) {
      console.error("Status change failed:", error);
    }
  };

  const handleReindex = async () => {
    try {
      await fetch("/api/admin/notebooks/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reindex", notebookId: id }),
      });
      await fetchPipelineStatus();
    } catch (error) {
      console.error("Reindex failed:", error);
    }
  };

  const handleDuplicateAsTemplate = async () => {
    const templateName = prompt("템플릿 이름을 입력하세요:", `${notebook?.name} 템플릿`);
    if (!templateName) return;

    try {
      await fetch(`/api/admin/notebooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate_template", templateName }),
      });
      alert("템플릿이 생성되었습니다.");
    } catch (error) {
      console.error("Template creation failed:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      ACTIVE: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" },
      INACTIVE: { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
      DELETED: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
    };
    const icons: Record<string, React.ElementType> = {
      ACTIVE: CheckCircle,
      INACTIVE: AlertCircle,
      DELETED: XCircle,
    };
    const labels: Record<string, string> = {
      ACTIVE: "활성",
      INACTIVE: "비활성",
      DELETED: "삭제됨",
    };

    const style = styles[status] || { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };
    const Icon = icons[status] || Settings;

    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 12px", borderRadius: "9999px", fontSize: "14px", fontWeight: 500, background: style.bg, color: style.color }}>
        <Icon style={{ width: "16px", height: "16px" }} />
        {labels[status] || status}
      </span>
    );
  };

  const getSourceStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      COMPLETED: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" },
      ERROR: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
    };
    const style = styles[status] || { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" };

    return (
      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", background: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ textAlign: "center", padding: "48px" }}>
          <BookOpen style={{ width: "48px", height: "48px", margin: "0 auto 16px", color: "var(--text-secondary)" }} />
          <p style={{ color: "var(--text-secondary)" }}>노트북을 찾을 수 없습니다</p>
          <Link href="/dashboard/admin/notebooks">
            <Button style={{ marginTop: "16px" }}>목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

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
              <BookOpen style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
              {notebook.name}
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>{notebook.id}</p>
          </div>
          {getStatusBadge(notebook.status)}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {notebook.status === "DELETED" ? (
            <Button onClick={() => handleStatusChange("ACTIVE")}>
              <RefreshCw style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              복구
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleStatusChange(notebook.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>
                {notebook.status === "ACTIVE" ? "비활성화" : "활성화"}
              </Button>
              <Button variant="outline" onClick={handleDuplicateAsTemplate}>
                템플릿으로 저장
              </Button>
              <Button variant="destructive" onClick={() => handleStatusChange("DELETED")}>
                <Trash2 style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { icon: FileText, label: "소스", value: notebook._count.sources },
          { icon: MessageSquare, label: "Q&A", value: notebook._count.qnaHistory },
          { icon: Users, label: "공유", value: notebook.shares.length },
          { icon: Clock, label: "생성일", value: new Date(notebook.createdAt).toLocaleDateString("ko-KR"), isDate: true },
        ].map((stat) => (
          <Card key={stat.label} style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
              <stat.icon style={{ width: "16px", height: "16px" }} />
              {stat.label}
            </div>
            <div style={{ fontSize: stat.isDate ? "14px" : "24px", fontWeight: stat.isDate ? 500 : 700, marginTop: "4px", color: "var(--text-primary)" }}>
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Notebook Info */}
        <Card style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <Settings style={{ width: "20px", height: "20px" }} />
            노트북 정보
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>이름</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginTop: "4px" }} />
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>설명</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "14px" }} rows={3} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>범위</label>
                <p style={{ marginTop: "4px", color: "var(--text-primary)" }}>{notebook.scope}</p>
              </div>
              <div>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>공개</label>
                <p style={{ marginTop: "4px", color: "var(--text-primary)" }}>{notebook.isPublic ? "예" : "아니오"}</p>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>소유자 ID</label>
              <p style={{ marginTop: "4px", fontFamily: "monospace", fontSize: "14px", color: "var(--text-primary)" }}>{notebook.ownerId}</p>
            </div>
            {notebook.templateId && (
              <div>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>템플릿 ID</label>
                <p style={{ marginTop: "4px", fontFamily: "monospace", fontSize: "14px", color: "var(--text-primary)" }}>{notebook.templateId}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Pipeline Status */}
        <Card style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
              <RefreshCw style={{ width: "20px", height: "20px" }} />
              파이프라인 상태
            </h2>
            <Button size="sm" variant="outline" onClick={handleReindex}>재색인</Button>
          </div>
          {pipelineStatus && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { label: "전체 소스", value: pipelineStatus.totalSources },
                  { label: "처리 완료", value: pipelineStatus.processedSources, color: "#10b981" },
                  { label: "대기중", value: pipelineStatus.pendingSources, color: "#f59e0b" },
                  { label: "실패", value: pipelineStatus.failedSources, color: "#ef4444" },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{item.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: item.color || "var(--text-primary)" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>총 청크 수</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>{pipelineStatus.totalChunks}</div>
              </div>
              {pipelineStatus.lastProcessedAt && (
                <div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>마지막 처리</div>
                  <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>{new Date(pipelineStatus.lastProcessedAt).toLocaleString("ko-KR")}</div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Sources List */}
      <Card style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
          <FileText style={{ width: "20px", height: "20px" }} />
          지식 소스 ({notebook.sources.length})
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--bg-secondary)" }}>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>제목</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>유형</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>상태</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>청크</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>생성일</th>
              </tr>
            </thead>
            <tbody>
              {notebook.sources.map((source) => (
                <tr key={source.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "12px", color: "var(--text-primary)" }}>{source.title}</td>
                  <td style={{ padding: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>{source.type}</td>
                  <td style={{ padding: "12px" }}>{getSourceStatusBadge(source.status)}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "var(--text-primary)" }}>{source.chunks.length}</td>
                  <td style={{ padding: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>{new Date(source.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
              {notebook.sources.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                    소스가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Shares List */}
      {notebook.shares.length > 0 && (
        <Card style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <Users style={{ width: "20px", height: "20px" }} />
            공유 ({notebook.shares.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notebook.shares.map((share) => (
              <div key={share.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "8px", background: "var(--bg-secondary)" }}>
                <span style={{ fontFamily: "monospace", fontSize: "14px", color: "var(--text-primary)" }}>{share.userId}</span>
                <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", background: "rgba(37, 99, 235, 0.1)", color: "var(--color-primary)" }}>
                  {share.permission}
                </span>
              </div>
            ))}
          </div>
        </Card>
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
