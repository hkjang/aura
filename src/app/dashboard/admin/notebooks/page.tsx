"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Loader2,
  Filter,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Layers,
  Link2,
} from "lucide-react";

interface NotebookWithCounts {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  status: string;
  ownerId: string;
  isPublic: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    sources: number;
    qnaHistory: number;
    shares: number;
  };
}

interface Stats {
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
}

export default function AdminNotebooksPage() {
  const [notebooks, setNotebooks] = useState<NotebookWithCounts[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [scopeFilter, setScopeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchNotebooks = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (scopeFilter) params.set("scope", scopeFilter);
      params.set("page", page.toString());
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/notebooks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setNotebooks(data.notebooks);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch notebooks:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/notebooks/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchNotebooks(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [page, statusFilter, scopeFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchNotebooks();
  };

  const handleBulkAction = async (action: string, status?: string) => {
    if (selectedIds.length === 0) return;

    setBulkLoading(true);
    try {
      await fetch("/api/admin/notebooks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: selectedIds,
          status,
        }),
      });

      setSelectedIds([]);
      await fetchNotebooks();
      await fetchStats();
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/notebooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchNotebooks();
      await fetchStats();
    } catch (error) {
      console.error("Status change failed:", error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notebooks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notebooks.map((n) => n.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 500,
            background: "rgba(16, 185, 129, 0.1)",
            color: "#10b981"
          }}>
            <CheckCircle style={{ width: "12px", height: "12px" }} />
            활성
          </span>
        );
      case "INACTIVE":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 500,
            background: "rgba(245, 158, 11, 0.1)",
            color: "#f59e0b"
          }}>
            <AlertCircle style={{ width: "12px", height: "12px" }} />
            비활성
          </span>
        );
      case "DELETED":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 500,
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444"
          }}>
            <XCircle style={{ width: "12px", height: "12px" }} />
            삭제됨
          </span>
        );
      default:
        return null;
    }
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "PERSONAL":
        return (
          <span style={{
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            background: "rgba(37, 99, 235, 0.1)",
            color: "var(--color-primary)"
          }}>
            개인
          </span>
        );
      case "TEAM":
        return (
          <span style={{
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            background: "rgba(139, 92, 246, 0.1)",
            color: "#8b5cf6"
          }}>
            팀
          </span>
        );
      case "ORGANIZATION":
        return (
          <span style={{
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            background: "rgba(99, 102, 241, 0.1)",
            color: "#6366f1"
          }}>
            조직
          </span>
        );
      default:
        return null;
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
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
            노트북 관리
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            전체 노트북의 라이프사이클, 정책, 파이프라인을 관리합니다
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/dashboard/admin/notebooks/chunks">
            <Button variant="outline" size="sm">
              <Layers style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              청킹
            </Button>
          </Link>
          <Link href="/dashboard/admin/notebooks/rag-trace">
            <Button variant="outline" size="sm">
              <Link2 style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              RAG 추적
            </Button>
          </Link>
          <Link href="/dashboard/admin/notebooks/policies">
            <Button variant="outline" size="sm">
              <Shield style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              정책
            </Button>
          </Link>
          <Link href="/dashboard/admin/notebooks/pipeline">
            <Button variant="outline" size="sm">
              <Settings style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              파이프라인
            </Button>
          </Link>
          <Link href="/dashboard/admin/notebooks/audit">
            <Button variant="outline" size="sm">
              <Clock style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              감사 로그
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>전체 노트북</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{stats.notebooks.total}</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", fontSize: "12px" }}>
              <span style={{ color: "#10b981" }}>{stats.notebooks.active} 활성</span>
              <span style={{ color: "#f59e0b" }}>{stats.notebooks.inactive} 비활성</span>
            </div>
          </Card>
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <FileText style={{ width: "16px", height: "16px" }} />
              지식 소스
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{stats.knowledge.sources}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>
              {stats.knowledge.chunks} 청크
            </div>
          </Card>
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <MessageSquare style={{ width: "16px", height: "16px" }} />
              Q&A
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{stats.qna.total}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>
              오늘 {stats.qna.last24Hours}건
            </div>
          </Card>
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>처리 대기</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "var(--text-primary)" }}>{stats.processing.pending}</div>
            <div style={{ fontSize: "12px", color: "#f59e0b", marginTop: "8px" }}>
              {stats.processing.processing} 처리중
            </div>
          </Card>
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>처리 완료</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#10b981" }}>
              {stats.processing.completed}
            </div>
          </Card>
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>처리 실패</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#ef4444" }}>
              {stats.processing.failed}
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card style={{ padding: "16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-secondary)" }} />
            <Input
              placeholder="노트북 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ paddingLeft: "36px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter style={{ width: "16px", height: "16px", color: "var(--text-secondary)" }} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                fontSize: "14px",
                background: "var(--bg-primary)",
                color: "var(--text-primary)"
              }}
            >
              <option value="">모든 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
              <option value="DELETED">삭제됨</option>
            </select>

            <select
              value={scopeFilter}
              onChange={(e) => {
                setScopeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                fontSize: "14px",
                background: "var(--bg-primary)",
                color: "var(--text-primary)"
              }}
            >
              <option value="">모든 범위</option>
              <option value="PERSONAL">개인</option>
              <option value="TEAM">팀</option>
              <option value="ORGANIZATION">조직</option>
            </select>
          </div>

          <Button onClick={handleSearch} size="sm">
            <Search style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            검색
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              {selectedIds.length}개 선택됨
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("update_status", "INACTIVE")}
              disabled={bulkLoading}
            >
              비활성화
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("update_status", "ACTIVE")}
              disabled={bulkLoading}
            >
              활성화
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction("delete")}
              disabled={bulkLoading}
            >
              <Trash2 style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              삭제
            </Button>
            {bulkLoading && <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />}
          </div>
        )}
      </Card>

      {/* Notebooks Table */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--bg-secondary)" }}>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notebooks.length && notebooks.length > 0}
                    onChange={toggleSelectAll}
                    style={{ borderRadius: "4px" }}
                  />
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>노트북</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>상태</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>범위</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>소스</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>Q&A</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>공유</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>수정일</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {notebooks.map((notebook) => (
                <tr key={notebook.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "12px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notebook.id)}
                      onChange={() => toggleSelect(notebook.id)}
                      style={{ borderRadius: "4px" }}
                    />
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Link
                      href={`/dashboard/admin/notebooks/${notebook.id}`}
                      style={{ fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}
                    >
                      {notebook.name}
                    </Link>
                    {notebook.description && (
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                        {notebook.description}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: "12px" }}>{getStatusBadge(notebook.status)}</td>
                  <td style={{ padding: "12px" }}>{getScopeBadge(notebook.scope)}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "var(--text-primary)" }}>{notebook._count.sources}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "var(--text-primary)" }}>{notebook._count.qnaHistory}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "var(--text-primary)" }}>{notebook._count.shares}</td>
                  <td style={{ padding: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>
                    {new Date(notebook.updatedAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      {notebook.status === "DELETED" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(notebook.id, "ACTIVE")}
                          title="복구"
                        >
                          <RefreshCw style={{ width: "16px", height: "16px" }} />
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleStatusChange(
                                notebook.id,
                                notebook.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                              )
                            }
                            title={notebook.status === "ACTIVE" ? "비활성화" : "활성화"}
                          >
                            {notebook.status === "ACTIVE" ? (
                              <XCircle style={{ width: "16px", height: "16px" }} />
                            ) : (
                              <CheckCircle style={{ width: "16px", height: "16px" }} />
                            )}
                          </Button>
                          <Link href={`/dashboard/admin/notebooks/${notebook.id}`}>
                            <Button size="sm" variant="ghost" title="상세">
                              <MoreHorizontal style={{ width: "16px", height: "16px" }} />
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

        {notebooks.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
            <BookOpen style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
            <p>노트북이 없습니다</p>
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
