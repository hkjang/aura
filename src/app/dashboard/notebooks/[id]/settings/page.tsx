"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  ChevronLeft,
  Share2,
  Users,
  History,
  Trash,
  Loader2,
  Plus,
  X,
  Check,
  AlertTriangle,
  Shield,
  Eye,
  Edit,
  UserPlus,
  Clock,
  FileText,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface Share {
  id: string;
  userId: string;
  permission: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  sourceId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface Notebook {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  isPublic: boolean;
  tags: string;
}

export default function NotebookSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<"settings" | "shares" | "comments" | "audit">("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    scope: "PERSONAL",
    isPublic: false,
  });

  const [newShareEmail, setNewShareEmail] = useState("");
  const [newSharePermission, setNewSharePermission] = useState("READ");
  const [addingShare, setAddingShare] = useState(false);
  const [newComment, setNewComment] = useState("");

  const fetchNotebook = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}`);
      if (res.ok) {
        const data = await res.json();
        setNotebook(data.notebook);
        setEditForm({
          name: data.notebook.name,
          description: data.notebook.description || "",
          scope: data.notebook.scope,
          isPublic: data.notebook.isPublic,
        });
      } else {
        router.push("/dashboard/notebooks");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchShares = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/share`);
      if (res.ok) {
        const data = await res.json();
        setShares(data.shares || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/audit?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (notebookId) {
      fetchNotebook();
      fetchShares();
      fetchAuditLogs();
      fetchComments();
    }
  }, [notebookId]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const data = await res.json();
        setNotebook(data.notebook);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddShare = async () => {
    if (!newShareEmail.trim()) return;

    setAddingShare(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newShareEmail.trim(),
          permission: newSharePermission,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShares((prev) => [data.share, ...prev]);
        setNewShareEmail("");
      } else {
        const error = await res.json();
        alert(error.error || "공유 추가 실패");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingShare(false);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    if (!confirm("이 공유를 제거하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/share?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShares((prev) => prev.filter((s) => s.userId !== userId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotebook = async () => {
    if (!confirm("정말 이 노트북을 삭제하시겠습니까? 모든 지식 소스와 Q&A 히스토리가 삭제됩니다.")) return;

    try {
      const res = await fetch(`/api/notebooks/${notebookId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/notebooks");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: "노트북 생성",
      UPDATE: "노트북 수정",
      ADD_SOURCE: "소스 추가",
      REMOVE_SOURCE: "소스 삭제",
      SHARE: "공유 추가",
      UNSHARE: "공유 제거",
    };
    return labels[action] || action;
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "ADMIN":
        return <Shield style={{ width: "14px", height: "14px", color: "var(--color-error)" }} />;
      case "EDIT":
        return <Edit style={{ width: "14px", height: "14px", color: "var(--color-warning)" }} />;
      default:
        return <Eye style={{ width: "14px", height: "14px", color: "var(--text-tertiary)" }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <Loader2 style={{ width: "32px", height: "32px", margin: "0 auto", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>불러오는 중...</p>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>노트북을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link
          href={`/dashboard/notebooks/${notebookId}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          <ChevronLeft style={{ width: "18px", height: "18px" }} />
        </Link>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "12px" }}>
            <Settings style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
            {notebook.name} 설정
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            노트북 설정 및 공유 관리
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border-color)", paddingBottom: "0" }}>
        {[
          { id: "settings", label: "설정", icon: Settings },
          { id: "shares", label: "공유", icon: Share2 },
          { id: "comments", label: "코멘트", icon: MessageSquare },
          { id: "audit", label: "변경 이력", icon: History },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === id ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === id ? "var(--color-primary)" : "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Icon style={{ width: "16px", height: "16px" }} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "settings" && (
        <div style={{ maxWidth: "600px" }}>
          <Card className="p-6">
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "20px" }}>
              기본 설정
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                  이름
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                  설명
                </label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                  범위
                </label>
                <select
                  value={editForm.scope}
                  onChange={(e) => setEditForm({ ...editForm, scope: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                >
                  <option value="PERSONAL">개인</option>
                  <option value="TEAM">팀</option>
                  <option value="ORGANIZATION">조직</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="isPublic" style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                  공개 노트북으로 설정
                </label>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} style={{ marginTop: "8px" }}>
                {saving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : "저장"}
              </Button>
            </div>
          </Card>

          <Card className="p-6" style={{ marginTop: "24px", border: "1px solid var(--color-error)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-error)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle style={{ width: "18px", height: "18px" }} />
              위험 영역
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              노트북을 삭제하면 모든 지식 소스, 청크, Q&A 히스토리가 영구적으로 삭제됩니다.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteNotebook}
            >
              <Trash style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              노트북 삭제
            </Button>
          </Card>
        </div>
      )}

      {activeTab === "shares" && (
        <div style={{ maxWidth: "600px" }}>
          <Card className="p-6">
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "20px" }}>
              공유 추가
            </h3>

            <div style={{ display: "flex", gap: "8px" }}>
              <Input
                placeholder="이메일 주소"
                value={newShareEmail}
                onChange={(e) => setNewShareEmail(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                value={newSharePermission}
                onChange={(e) => setNewSharePermission(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                }}
              >
                <option value="READ">읽기</option>
                <option value="EDIT">편집</option>
                <option value="ADMIN">관리</option>
              </select>
              <Button onClick={handleAddShare} disabled={addingShare || !newShareEmail.trim()}>
                {addingShare ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <UserPlus style={{ width: "16px", height: "16px" }} />}
              </Button>
            </div>
          </Card>

          <div style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
              공유 목록 ({shares.length})
            </h3>

            {shares.length === 0 ? (
              <Card className="p-6" style={{ textAlign: "center" }}>
                <Users style={{ width: "40px", height: "40px", color: "var(--text-tertiary)", margin: "0 auto" }} />
                <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                  아직 공유된 사용자가 없습니다
                </p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {shares.map((share) => (
                  <Card key={share.id} className="p-4">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "var(--color-primary-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-primary)",
                            fontWeight: 600,
                            fontSize: "14px",
                          }}
                        >
                          {(share.user.name || share.user.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "14px" }}>
                            {share.user.name || share.user.email || "Unknown"}
                          </p>
                          {share.user.email && (
                            <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{share.user.email}</p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            background: "var(--bg-secondary)",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {getPermissionIcon(share.permission)}
                          {share.permission}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveShare(share.userId)}>
                          <X style={{ width: "14px", height: "14px", color: "var(--color-error)" }} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "comments" && (
        <div style={{ maxWidth: "600px" }}>
          <Card className="p-6">
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
              코멘트 추가
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input
                placeholder="코멘트 내용..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Plus style={{ width: "16px", height: "16px" }} />
              </Button>
            </div>
          </Card>

          <div style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
              코멘트 ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <Card className="p-6" style={{ textAlign: "center" }}>
                <MessageSquare style={{ width: "40px", height: "40px", color: "var(--text-tertiary)", margin: "0 auto" }} />
                <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                  아직 코멘트가 없습니다
                </p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {comments.map((comment) => (
                  <Card key={comment.id} className="p-4">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 500, fontSize: "13px", color: "var(--text-primary)" }}>
                        {comment.user.name || comment.user.email || "Unknown"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          {new Date(comment.createdAt).toLocaleString("ko-KR")}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteComment(comment.id)}>
                          <Trash style={{ width: "12px", height: "12px", color: "var(--text-tertiary)" }} />
                        </Button>
                      </div>
                    </div>
                    <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {comment.content}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div style={{ maxWidth: "600px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            변경 이력
          </h3>

          {auditLogs.length === 0 ? (
            <Card className="p-6" style={{ textAlign: "center" }}>
              <History style={{ width: "40px", height: "40px", color: "var(--text-tertiary)", margin: "0 auto" }} />
              <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                아직 변경 이력이 없습니다
              </p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {auditLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "var(--bg-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Clock style={{ width: "16px", height: "16px", color: "var(--text-tertiary)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500, fontSize: "13px", color: "var(--text-primary)" }}>
                        {getActionLabel(log.action)}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                        {log.user.name || log.user.email} • {new Date(log.createdAt).toLocaleString("ko-KR")}
                      </p>
                      {log.details && (
                        <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
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
