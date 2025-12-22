"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Clock,
  ArrowLeft,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Settings,
  Trash2,
  Plus,
  RefreshCw,
  Share,
  AlertCircle,
} from "lucide-react";

interface AuditLog {
  id: string;
  notebookId: string;
  userId: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface ActionType {
  action: string;
  count: number;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  CREATE: Plus,
  UPDATE: Settings,
  DELETE: Trash2,
  STATUS_CHANGE: AlertCircle,
  ADD_SOURCE: FileText,
  REMOVE_SOURCE: Trash2,
  SHARE: Share,
  UNSHARE: Share,
  TRIGGER_REINDEX: RefreshCw,
  CREATE_TEMPLATE: FileText,
  PERMANENT_DELETE: Trash2,
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  STATUS_CHANGE: "상태 변경",
  ADD_SOURCE: "소스 추가",
  REMOVE_SOURCE: "소스 삭제",
  SHARE: "공유",
  UNSHARE: "공유 해제",
  TRIGGER_REINDEX: "재색인",
  CREATE_TEMPLATE: "템플릿 생성",
  PERMANENT_DELETE: "영구 삭제",
  CREATE_FROM_TEMPLATE: "템플릿에서 생성",
  CHANGE_EMBEDDING_MODEL: "임베딩 모델 변경",
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" },
  UPDATE: { bg: "rgba(37, 99, 235, 0.1)", color: "#2563eb" },
  DELETE: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
  STATUS_CHANGE: { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
  ADD_SOURCE: { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" },
  REMOVE_SOURCE: { bg: "rgba(249, 115, 22, 0.1)", color: "#f97316" },
  SHARE: { bg: "rgba(99, 102, 241, 0.1)", color: "#6366f1" },
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [notebookId, setNotebookId] = useState("");
  const [userId, setUserId] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (notebookId) params.set("notebookId", notebookId);
      if (userId) params.set("userId", userId);
      if (actionFilter) params.set("action", actionFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", page.toString());
      params.set("pageSize", "50");

      const res = await fetch(`/api/admin/notebooks/audit?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setActionTypes(data.actionTypes);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    const Icon = ACTION_ICONS[action] || Settings;
    const label = ACTION_LABELS[action] || action;
    const colors = ACTION_COLORS[action] || { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };

    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 500,
        background: colors.bg,
        color: colors.color
      }}>
        <Icon style={{ width: "12px", height: "12px" }} />
        {label}
      </span>
    );
  };

  const parseDetails = (details: string | null): Record<string, unknown> => {
    if (!details) return {};
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
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
              <Clock style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
              감사 로그
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              노트북 변경 이력을 조회합니다
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>노트북 ID</label>
            <Input
              value={notebookId}
              onChange={(e) => setNotebookId(e.target.value)}
              placeholder="노트북 ID"
              style={{ marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>사용자 ID</label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="사용자 ID"
              style={{ marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>액션</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                width: "100%",
                marginTop: "4px",
                padding: "8px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: "14px"
              }}
            >
              <option value="">모든 액션</option>
              {actionTypes.map((at) => (
                <option key={at.action} value={at.action}>
                  {ACTION_LABELS[at.action] || at.action} ({at.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>시작일</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>종료일</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ marginTop: "4px" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button onClick={handleSearch}>
            <Search style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            검색
          </Button>
        </div>
      </Card>

      {/* Logs Timeline */}
      <Card>
        <div>
          {logs.map((log) => {
            const details = parseDetails(log.details);
            return (
              <div key={log.id} style={{ padding: "16px", display: "flex", gap: "16px", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ flexShrink: 0, width: "64px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {new Date(log.createdAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {new Date(log.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    {getActionBadge(log.action)}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "14px", color: "var(--text-secondary)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <FileText style={{ width: "12px", height: "12px" }} />
                      {log.notebookId.slice(0, 8)}...
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <User style={{ width: "12px", height: "12px" }} />
                      {log.userId.slice(0, 8)}...
                    </span>
                  </div>
                  {Object.keys(details).length > 0 && (
                    <div style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      background: "var(--bg-secondary)",
                      padding: "8px",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      overflowX: "auto"
                    }}>
                      {JSON.stringify(details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
              <Clock style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
              <p>감사 로그가 없습니다</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "16px", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              페이지 {page} / {totalPages}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft style={{ width: "16px", height: "16px" }} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight style={{ width: "16px", height: "16px" }} />
              </Button>
            </div>
          </div>
        )}
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
