"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  Users,
  Lock,
  Globe,
  FileText,
  MessageSquare,
  ChevronRight,
  FolderOpen,
  RefreshCw,
  Layers,
  History,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface Notebook {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  isPublic: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    sources: number;
    qnaHistory: number;
  };
  permission?: string;
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<{ owned: Notebook[]; shared: Notebook[] }>({
    owned: [],
    shared: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newNotebook, setNewNotebook] = useState({
    name: "",
    description: "",
    scope: "PERSONAL",
    isPublic: false,
  });

  const fetchNotebooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notebooks");
      if (res.ok) {
        const data = await res.json();
        setNotebooks({ owned: data.owned || [], shared: data.shared || [] });
      }
    } catch (e) {
      console.error("Error fetching notebooks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleCreate = async () => {
    if (!newNotebook.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotebook),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewNotebook({ name: "", description: "", scope: "PERSONAL", isPublic: false });
        fetchNotebooks();
      }
    } catch (e) {
      console.error("Error creating notebook:", e);
    } finally {
      setCreating(false);
    }
  };

  const allNotebooks = [...notebooks.owned, ...notebooks.shared];
  const filteredNotebooks = searchQuery
    ? allNotebooks.filter(
        (n) =>
          n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allNotebooks;

  const getScopeIcon = (scope: string, isPublic: boolean) => {
    if (isPublic) return <Globe style={{ width: "14px", height: "14px", color: "#10b981" }} />;
    if (scope === "TEAM") return <Users style={{ width: "14px", height: "14px", color: "#8b5cf6" }} />;
    return <Lock style={{ width: "14px", height: "14px", color: "#94a3b8" }} />;
  };

  const getScopeBadge = (scope: string, isPublic: boolean) => {
    if (isPublic) return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", text: "공개" };
    if (scope === "TEAM") return { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", text: "팀" };
    if (scope === "ORGANIZATION") return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", text: "조직" };
    return { bg: "rgba(148, 163, 184, 0.1)", color: "#94a3b8", text: "개인" };
  };

  const gradientColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  ];

  return (
    <div style={{ 
      padding: "32px", 
      display: "flex", 
      flexDirection: "column", 
      gap: "28px",
      minHeight: "100%",
      background: "linear-gradient(180deg, rgba(124, 58, 237, 0.02) 0%, transparent 100%)"
    }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "flex-start", 
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)"
            }}>
              <BookOpen style={{ width: "24px", height: "24px", color: "var(--bg-primary)" }} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: "28px", 
                fontWeight: 700, 
                color: "var(--text-primary)",
                letterSpacing: "-0.02em"
              }}>
                노트북
              </h1>
              <p style={{ 
                color: "var(--text-secondary)", 
                marginTop: "2px", 
                fontSize: "15px" 
              }}>
                지식을 체계적으로 관리하고 AI 질의응답에 활용하세요
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/dashboard/notebooks/multi" style={{ textDecoration: "none" }}>
            <Button variant="outline" style={{ 
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid var(--border-color)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)"
            }}>
              <Layers style={{ width: "16px", height: "16px", marginRight: "8px", color: "#8b5cf6" }} />
              다중 질의
            </Button>
          </Link>
          <Link href="/dashboard/notebooks/history" style={{ textDecoration: "none" }}>
            <Button variant="outline" style={{ 
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid var(--border-color)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)"
            }}>
              <History style={{ width: "16px", height: "16px", marginRight: "8px", color: "#f59e0b" }} />
              Q&A 히스토리
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchNotebooks} disabled={loading} style={{ 
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)"
          }}>
            <RefreshCw style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            새로고침
          </Button>
          <Button onClick={() => setShowCreateModal(true)} style={{ 
            borderRadius: "10px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            border: "none",
            boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)"
          }}>
            <Plus style={{ width: "18px", height: "18px", marginRight: "8px" }} />
            새 노트북
          </Button>
        </div>
      </div>

      {/* Search & Stats Row */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto",
        gap: "20px",
        alignItems: "start"
      }}>
        {/* Search */}
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "18px",
              height: "18px",
              color: "#94a3b8",
            }}
          />
          <input
            placeholder="노트북 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%",
              paddingLeft: "44px",
              paddingRight: "16px",
              height: "44px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-primary)",
              fontSize: "14px",
              color: "var(--text-primary)",
              outline: "none",
              transition: "all 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{
            padding: "12px 20px",
            borderRadius: "12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(124, 58, 237, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <BookOpen style={{ width: "18px", height: "18px", color: "#7c3aed" }} />
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>내 노트북</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{notebooks.owned.length}</p>
            </div>
          </div>
          <div style={{
            padding: "12px 20px",
            borderRadius: "12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(139, 92, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Users style={{ width: "18px", height: "18px", color: "#8b5cf6" }} />
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>공유 받음</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{notebooks.shared.length}</p>
            </div>
          </div>
          <div style={{
            padding: "12px 20px",
            borderRadius: "12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <FileText style={{ width: "18px", height: "18px", color: "#10b981" }} />
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>총 소스</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{allNotebooks.reduce((sum, n) => sum + n._count.sources, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notebook Grid */}
      {loading ? (
        <div style={{ 
          padding: "80px", 
          textAlign: "center",
          background: "var(--bg-primary)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)"
        }}>
          <Loader2 style={{ 
            width: "40px", 
            height: "40px", 
            margin: "0 auto", 
            color: "#7c3aed", 
            animation: "spin 1s linear infinite" 
          }} />
          <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontSize: "15px" }}>노트북 불러오는 중...</p>
        </div>
      ) : filteredNotebooks.length === 0 ? (
        <div style={{ 
          padding: "80px 40px", 
          textAlign: "center",
          background: "var(--bg-primary)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "rgba(124, 58, 237, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto"
          }}>
            <FolderOpen style={{ width: "36px", height: "36px", color: "#7c3aed" }} />
          </div>
          <h3 style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "20px", fontSize: "18px" }}>
            {searchQuery ? "검색 결과가 없습니다" : "노트북이 없습니다"}
          </h3>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "8px" }}>
            {searchQuery ? "다른 검색어를 시도해보세요" : "새 노트북을 만들어 지식을 관리하세요"}
          </p>
          {!searchQuery && (
            <Button 
              style={{ 
                marginTop: "24px",
                borderRadius: "10px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                border: "none",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)"
              }} 
              onClick={() => setShowCreateModal(true)}
            >
              <Plus style={{ width: "18px", height: "18px", marginRight: "8px" }} />
              첫 노트북 만들기
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {filteredNotebooks.map((notebook, index) => {
            const badge = getScopeBadge(notebook.scope, notebook.isPublic);
            const gradient = gradientColors[index % gradientColors.length];
            return (
              <Link key={notebook.id} href={`/dashboard/notebooks/${notebook.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    background: "var(--bg-primary)",
                    borderRadius: "16px",
                    border: "1px solid var(--border-color)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* Gradient Top Bar */}
                  <div style={{ 
                    height: "6px", 
                    background: gradient
                  }} />
                  
                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "start", gap: "14px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          background: gradient,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }}
                      >
                        <BookOpen style={{ width: "24px", height: "24px", color: "var(--bg-primary)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <h3 style={{ 
                            fontWeight: 600, 
                            color: "var(--text-primary)", 
                            fontSize: "16px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {notebook.name}
                          </h3>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                            whiteSpace: "nowrap"
                          }}>
                            {badge.text}
                          </span>
                        </div>
                        {notebook.description && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.4
                            }}
                          >
                            {notebook.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center",
                      gap: "16px", 
                      marginTop: "18px",
                      paddingTop: "16px",
                      borderTop: "1px solid #f1f5f9"
                    }}>
                      <span style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "6px",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontWeight: 500
                      }}>
                        <FileText style={{ width: "14px", height: "14px", color: "#94a3b8" }} />
                        {notebook._count.sources} 소스
                      </span>
                      <span style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "6px",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontWeight: 500
                      }}>
                        <MessageSquare style={{ width: "14px", height: "14px", color: "#94a3b8" }} />
                        {notebook._count.qnaHistory} Q&A
                      </span>
                      <div style={{ marginLeft: "auto" }}>
                        <ChevronRight style={{ width: "18px", height: "18px", color: "#cbd5e1" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{ 
              width: "100%", 
              maxWidth: "480px", 
              margin: "16px",
              background: "var(--bg-primary)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.15)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Sparkles style={{ width: "22px", height: "22px", color: "var(--bg-primary)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>
                  새 노트북 만들기
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  지식을 모아 AI에게 질문하세요
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: "13px", 
                  fontWeight: 600, 
                  color: "#374151", 
                  marginBottom: "8px" 
                }}>
                  이름 *
                </label>
                <input
                  placeholder="예: 프로젝트 문서"
                  value={newNotebook.name}
                  onChange={(e) => setNewNotebook({ ...newNotebook, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: "13px", 
                  fontWeight: 600, 
                  color: "#374151", 
                  marginBottom: "8px" 
                }}>
                  설명
                </label>
                <input
                  placeholder="노트북에 대한 간단한 설명"
                  value={newNotebook.description}
                  onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: "13px", 
                  fontWeight: 600, 
                  color: "#374151", 
                  marginBottom: "8px" 
                }}>
                  범위
                </label>
                <select
                  value={newNotebook.scope}
                  onChange={(e) => setNewNotebook({ ...newNotebook, scope: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  <option value="PERSONAL">🔒 개인</option>
                  <option value="TEAM">👥 팀</option>
                  <option value="ORGANIZATION">🏢 조직</option>
                </select>
              </div>

              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px",
                padding: "12px",
                borderRadius: "10px",
                background: "#f8fafc"
              }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newNotebook.isPublic}
                  onChange={(e) => setNewNotebook({ ...newNotebook, isPublic: e.target.checked })}
                  style={{ 
                    width: "18px", 
                    height: "18px",
                    accentColor: "#7c3aed"
                  }}
                />
                <label htmlFor="isPublic" style={{ fontSize: "14px", color: "#374151", cursor: "pointer" }}>
                  공개 노트북으로 설정 (누구나 열람 가능)
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "28px" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!newNotebook.name.trim() || creating}
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: !newNotebook.name.trim() ? "var(--border-color)" : "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                  color: !newNotebook.name.trim() ? "#94a3b8" : "var(--bg-primary)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: !newNotebook.name.trim() ? "not-allowed" : "pointer",
                  boxShadow: newNotebook.name.trim() ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {creating ? (
                  <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                ) : (
                  <>
                    <Plus style={{ width: "16px", height: "16px" }} />
                    만들기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
