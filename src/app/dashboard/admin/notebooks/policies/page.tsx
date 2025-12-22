"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  X,
  Edit2,
} from "lucide-react";

interface Policy {
  id: string;
  name: string;
  description: string | null;
  policyType: string;
  rules: string;
  scope: string;
  scopeId: string | null;
  blockExternalKnowledge: boolean;
  requireCitation: boolean;
  allowedQuestionTypes: string;
  maxContextTokens: number;
  systemPrompt: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const POLICY_TYPES = [
  { value: "CREATION", label: "생성 정책", description: "노트북 생성 제한" },
  { value: "MODIFICATION", label: "수정 정책", description: "노트북 수정 규칙" },
  { value: "DELETION", label: "삭제 정책", description: "삭제 정책" },
  { value: "QA_CONTROL", label: "Q&A 정책", description: "질문답변 제어" },
  { value: "UPLOAD", label: "업로드 정책", description: "파일 업로드 제한" },
];

const POLICY_COLORS: Record<string, { bg: string; color: string }> = {
  CREATION: { bg: "rgba(37, 99, 235, 0.1)", color: "#2563eb" },
  MODIFICATION: { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" },
  DELETION: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
  QA_CONTROL: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" },
  UPLOAD: { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
};

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    policyType: "CREATION",
    rules: "{}",
    scope: "GLOBAL",
    priority: 0,
    blockExternalKnowledge: false,
    requireCitation: true,
    maxContextTokens: 4000,
    systemPrompt: "",
  });

  const fetchPolicies = async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("policyType", filter);

      const res = await fetch(`/api/admin/notebooks/policies?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [filter]);

  const handleCreate = async () => {
    try {
      let rules = {};
      try {
        rules = JSON.parse(formData.rules);
      } catch {
        alert("규칙 JSON 형식이 올바르지 않습니다");
        return;
      }

      await fetch("/api/admin/notebooks/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rules }),
      });

      setCreating(false);
      resetForm();
      await fetchPolicies();
    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  const handleEdit = (policy: Policy) => {
    setEditingId(policy.id);
    setCreating(true);
    setFormData({
      name: policy.name,
      description: policy.description || "",
      policyType: policy.policyType,
      rules: policy.rules,
      scope: policy.scope,
      priority: policy.priority,
      blockExternalKnowledge: policy.blockExternalKnowledge,
      requireCitation: policy.requireCitation,
      maxContextTokens: policy.maxContextTokens,
      systemPrompt: policy.systemPrompt || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    
    try {
      let rules = {};
      try {
        rules = JSON.parse(formData.rules);
      } catch {
        alert("규칙 JSON 형식이 올바르지 않습니다");
        return;
      }

      await fetch("/api/admin/notebooks/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...formData, rules }),
      });

      setCreating(false);
      setEditingId(null);
      resetForm();
      await fetchPolicies();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await fetch("/api/admin/notebooks/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle" }),
      });
      await fetchPolicies();
    } catch (error) {
      console.error("Toggle failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await fetch(`/api/admin/notebooks/policies?id=${id}`, { method: "DELETE" });
      await fetchPolicies();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      policyType: "CREATION",
      rules: "{}",
      scope: "GLOBAL",
      priority: 0,
      blockExternalKnowledge: false,
      requireCitation: true,
      maxContextTokens: 4000,
      systemPrompt: "",
    });
    setEditingId(null);
  };

  const getPolicyTypeBadge = (type: string) => {
    const typeInfo = POLICY_TYPES.find((t) => t.value === type);
    const colors = POLICY_COLORS[type] || { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };

    return (
      <span style={{
        padding: "4px 8px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 500,
        background: colors.bg,
        color: colors.color
      }}>
        {typeInfo?.label || type}
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
              <Shield style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
              정책 관리
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              노트북 생성, 수정, Q&A 정책을 관리합니다
            </p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus style={{ width: "16px", height: "16px", marginRight: "8px" }} />
          정책 추가
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            size="sm"
            variant={filter === "" ? undefined : "outline"}
            onClick={() => setFilter("")}
          >
            전체
          </Button>
          {POLICY_TYPES.map((type) => (
            <Button
              key={type.value}
              size="sm"
              variant={filter === type.value ? undefined : "outline"}
              onClick={() => setFilter(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Create Form */}
      {creating && (
        <Card style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>{editingId ? "정책 수정" : "새 정책 만들기"}</h2>
            <Button variant="ghost" size="sm" onClick={() => { setCreating(false); resetForm(); }}>
              <X style={{ width: "16px", height: "16px" }} />
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>이름 *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="정책 이름" style={{ marginTop: "4px" }} />
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>유형 *</label>
              <select value={formData.policyType} onChange={(e) => setFormData({ ...formData, policyType: e.target.value })} style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "14px" }}>
                {POLICY_TYPES.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>설명</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="정책 설명" style={{ marginTop: "4px" }} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>규칙 (JSON)</label>
              <textarea value={formData.rules} onChange={(e) => setFormData({ ...formData, rules: e.target.value })} placeholder='{"maxNotebooksPerUser": 10}' style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "monospace", fontSize: "14px" }} rows={3} />
              <div style={{ marginTop: "8px", padding: "12px", background: "rgba(37, 99, 235, 0.05)", borderRadius: "6px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-primary)", marginBottom: "8px" }}>
                  💡 {POLICY_TYPES.find(t => t.value === formData.policyType)?.label} 규칙 속성:
                </p>
                <pre style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
{formData.policyType === "CREATION" ? `{
  "maxNotebooksPerUser": 10,      // 사용자당 최대 노트북 수
  "allowedScopes": ["PERSONAL"],  // 허용된 범위
  "requireDescription": true      // 설명 필수 여부
}` : formData.policyType === "UPLOAD" ? `{
  "maxFileSize": 52428800,        // 최대 파일 크기 (바이트, 50MB)
  "allowedFileTypes": ["pdf","docx","txt","md"],  // 허용 파일 형식
  "maxSourcesPerNotebook": 20     // 노트북당 최대 소스 수
}` : formData.policyType === "DELETION" ? `{
  "softDeleteOnly": true,         // 소프트 삭제만 허용
  "retentionDays": 30,            // 보존 기간 (일)
  "requireConfirmation": true     // 삭제 확인 필수
}` : formData.policyType === "MODIFICATION" ? `{
  "allowedFields": ["name","description"],  // 수정 가능 필드
  "requireApproval": false        // 수정 승인 필요 여부
}` : `{
  "maxQuestionsPerDay": 100,      // 일일 최대 질문 수
  "filterPatterns": ["주민번호"]   // 필터링 패턴
  // (Q&A 정책은 아래 별도 설정 사용)
}`}
                </pre>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>범위</label>
              <select value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value })} style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "14px" }}>
                <option value="GLOBAL">전역</option>
                <option value="ORGANIZATION">조직</option>
                <option value="USER">사용자</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>우선순위</label>
              <Input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} style={{ marginTop: "4px" }} />
            </div>

            {formData.policyType === "QA_CONTROL" && (
              <>
                <div style={{ gridColumn: "span 2", borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "8px" }}>
                  <h3 style={{ fontWeight: 500, marginBottom: "12px", color: "var(--text-primary)" }}>Q&A 정책 설정</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="checkbox" checked={formData.blockExternalKnowledge} onChange={(e) => setFormData({ ...formData, blockExternalKnowledge: e.target.checked })} style={{ borderRadius: "4px" }} />
                      <label style={{ fontSize: "14px", color: "var(--text-primary)" }}>외부 지식 차단</label>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="checkbox" checked={formData.requireCitation} onChange={(e) => setFormData({ ...formData, requireCitation: e.target.checked })} style={{ borderRadius: "4px" }} />
                      <label style={{ fontSize: "14px", color: "var(--text-primary)" }}>인용 필수</label>
                    </div>
                    <div>
                      <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>최대 컨텍스트 토큰</label>
                      <Input type="number" value={formData.maxContextTokens} onChange={(e) => setFormData({ ...formData, maxContextTokens: parseInt(e.target.value) || 4000 })} style={{ marginTop: "4px" }} />
                    </div>
                  </div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>시스템 프롬프트</label>
                  <textarea value={formData.systemPrompt} onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })} placeholder="고정 시스템 프롬프트" style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "14px" }} rows={3} />
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
            <Button variant="outline" onClick={() => { setCreating(false); resetForm(); }}>취소</Button>
            <Button onClick={editingId ? handleUpdate : handleCreate} disabled={!formData.name}>
              <Save style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              {editingId ? "수정" : "저장"}
            </Button>
          </div>
        </Card>
      )}

      {/* Policies List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {policies.map((policy) => (
          <Card key={policy.id} style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h3 style={{ fontWeight: 600, color: "var(--text-primary)" }}>{policy.name}</h3>
                  {getPolicyTypeBadge(policy.policyType)}
                  {policy.isActive ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#10b981" }}>
                      <CheckCircle style={{ width: "12px", height: "12px" }} />활성
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      <XCircle style={{ width: "12px", height: "12px" }} />비활성
                    </span>
                  )}
                </div>
                {policy.description && (
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>{policy.description}</p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <span>범위: {policy.scope}</span>
                  <span>우선순위: {policy.priority}</span>
                  {policy.policyType === "QA_CONTROL" && (
                    <>
                      <span>외부지식: {policy.blockExternalKnowledge ? "차단" : "허용"}</span>
                      <span>인용필수: {policy.requireCitation ? "예" : "아니오"}</span>
                      <span>컨텍스트: {policy.maxContextTokens}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(policy)} title="수정">
                  <Edit2 style={{ width: "16px", height: "16px" }} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleToggle(policy.id)} title={policy.isActive ? "비활성화" : "활성화"}>
                  {policy.isActive ? <XCircle style={{ width: "16px", height: "16px" }} /> : <CheckCircle style={{ width: "16px", height: "16px" }} />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(policy.id)} style={{ color: "#ef4444" }}>
                  <Trash2 style={{ width: "16px", height: "16px" }} />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {policies.length === 0 && (
          <Card style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
            <Shield style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
            <p>정책이 없습니다</p>
            <Button style={{ marginTop: "16px" }} onClick={() => setCreating(true)}>
              <Plus style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              첫 정책 만들기
            </Button>
          </Card>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
