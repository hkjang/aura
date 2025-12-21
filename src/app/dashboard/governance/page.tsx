"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Plus, RefreshCw, X, Check, Edit2, Trash2 } from "lucide-react";

interface Policy {
  id: string;
  name: string;
  description: string | null;
  type: string;
  rules: string;
  action: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string | null;
  createdAt: string;
}

const POLICY_TYPES = [
  { value: "BLOCK_KEYWORD", label: "키워드 차단" },
  { value: "PII_FILTER", label: "개인정보 필터" },
  { value: "TOPIC_BAN", label: "주제 금지" },
  { value: "REGEX", label: "정규식 패턴" },
];

const POLICY_ACTIONS = [
  { value: "BLOCK", label: "차단", color: "#ef4444" },
  { value: "FLAG", label: "플래그", color: "#f59e0b" },
  { value: "MASK", label: "마스킹", color: "#3b82f6" },
];

export default function GovernanceDashboardPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "BLOCK_KEYWORD",
    rules: "",
    action: "BLOCK",
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policiesRes, auditRes] = await Promise.all([
        fetch("/api/admin/policies"),
        fetch("/api/admin/audit")
      ]);

      if (policiesRes.ok) {
        const data = await policiesRes.json();
        setPolicies(Array.isArray(data) ? data : []);
      }

      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(Array.isArray(data.logs) ? data.logs.slice(0, 10) : []);
      }
    } catch (error) {
      console.error("Failed to fetch governance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const res = await fetch("/api/admin/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rules: formData.rules.split(",").map(r => r.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ name: "", description: "", type: "BLOCK_KEYWORD", rules: "", action: "BLOCK", isActive: true });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create policy:", error);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;
    
    try {
      const res = await fetch(`/api/admin/policies/${editingPolicy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rules: formData.rules.split(",").map(r => r.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setEditingPolicy(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update policy:", error);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("정말 이 정책을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/policies/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete policy:", error);
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    try {
      await fetch(`/api/admin/policies/${policy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !policy.isActive }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle policy:", error);
    }
  };

  const startEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    try {
      const parsedRules = JSON.parse(policy.rules);
      setFormData({
        name: policy.name,
        description: policy.description || "",
        type: policy.type,
        rules: Array.isArray(parsedRules) ? parsedRules.join(", ") : "",
        action: policy.action,
        isActive: policy.isActive,
      });
    } catch {
      setFormData({
        name: policy.name,
        description: policy.description || "",
        type: policy.type,
        rules: "",
        action: policy.action,
        isActive: policy.isActive,
      });
    }
  };

  const getTypeLabel = (type: string) => POLICY_TYPES.find(t => t.value === type)?.label || type;
  const getActionInfo = (action: string) => POLICY_ACTIONS.find(a => a.value === action) || { label: action, color: "#666" };

  const activeCount = policies.filter(p => p.isActive).length;
  const blockedToday = auditLogs.filter(l => l.action === "BLOCKED" || l.details?.includes("차단")).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000 / 60;
    if (diff < 60) return `${Math.floor(diff)}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return `${Math.floor(diff / 1440)}일 전`;
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>AI 거버넌스 & 제어</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            사용 정책을 관리하고, 감사 로그를 확인하며, AI 안전 가드레일을 제어하세요.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw style={{ width: '14px', height: '14px', marginRight: '6px' }} /> 새로고침
          </Button>
          <Button size="sm" onClick={() => {
            setFormData({ name: "", description: "", type: "BLOCK_KEYWORD", rules: "", action: "BLOCK", isActive: true });
            setShowCreateModal(true);
          }}>
            <Plus style={{ width: '14px', height: '14px', marginRight: '6px' }} /> 정책 추가
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Policy Management Column */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            활성 정책 ({activeCount}/{policies.length})
          </h2>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              정책을 불러오는 중...
            </div>
          ) : policies.length === 0 ? (
            <Card className="p-6" style={{ textAlign: 'center' }}>
              <Shield style={{ width: '48px', height: '48px', color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>등록된 정책이 없습니다.</p>
              <Button size="sm" style={{ marginTop: '16px' }} onClick={() => setShowCreateModal(true)}>
                첫 번째 정책 추가하기
              </Button>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {policies.map(policy => {
                const actionInfo = getActionInfo(policy.action);
                return (
                  <Card key={policy.id} className="p-4" style={{ 
                    opacity: policy.isActive ? 1 : 0.6,
                    borderLeft: `4px solid ${actionInfo.color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{policy.name}</h3>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => handleToggleActive(policy)}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                          title={policy.isActive ? "비활성화" : "활성화"}
                        >
                          {policy.isActive ? 
                            <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)' }} /> :
                            <X style={{ width: '16px', height: '16px', color: 'var(--text-tertiary)' }} />
                          }
                        </button>
                        <button 
                          onClick={() => startEdit(policy)}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Edit2 style={{ width: '14px', height: '14px', color: 'var(--text-secondary)' }} />
                        </button>
                        <button 
                          onClick={() => handleDeletePolicy(policy.id)}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px', color: 'var(--color-error)' }} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{policy.description}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge">{getTypeLabel(policy.type)}</span>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: 500,
                        background: `${actionInfo.color}20`,
                        color: actionInfo.color
                      }}>
                        {actionInfo.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Security Insights */}
          <div style={{ marginTop: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>보안 인사이트</h2>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <Card className="p-4" style={{ background: '#fee2e2', borderColor: 'var(--color-error)' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-error)' }}>차단된 요청 (24시간)</p>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px' }}>{blockedToday}</h3>
              </Card>
              <Card className="p-4" style={{ background: '#fef3c7', borderColor: 'var(--color-warning)' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-warning)' }}>플래그된 사건</p>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
                  {auditLogs.filter(l => l.action.includes("FLAG")).length}
                </h3>
              </Card>
              <Card className="p-4">
                <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>활성 규칙</p>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{activeCount}</h3>
              </Card>
            </div>
          </div>
        </div>

        {/* Audit Log Column */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>최근 감사 로그</h2>
          <Card>
            {auditLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                아직 감사 로그가 없습니다
              </div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={log.id} style={{ 
                  padding: '16px', 
                  borderBottom: idx < auditLogs.length - 1 ? '1px solid var(--border-color)' : 'none' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                    <span className={`status ${
                      log.action.includes('DELETE') ? 'status-error' :
                      log.action.includes('CREATE') ? 'status-success' :
                      'status-warning'
                    }`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{formatTime(log.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    리소스: {log.resource}
                  </p>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPolicy) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <Card className="p-6" style={{ width: '480px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                {editingPolicy ? "정책 수정" : "새 정책 추가"}
              </h3>
              <button 
                onClick={() => { setShowCreateModal(false); setEditingPolicy(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>정책 이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="예: 경쟁사 차단"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="정책에 대한 설명을 입력하세요"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>유형</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {POLICY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>액션</label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {POLICY_ACTIONS.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  규칙 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="예: 경쟁사A, 경쟁사B, keyword"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" style={{ fontSize: '13px' }}>정책 활성화</label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button 
                  variant="outline" 
                  style={{ flex: 1 }}
                  onClick={() => { setShowCreateModal(false); setEditingPolicy(null); }}
                >
                  취소
                </Button>
                <Button 
                  style={{ flex: 1 }}
                  onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
                >
                  {editingPolicy ? "수정" : "추가"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
