"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Loader2,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ServiceStatus {
  id: string;
  service: string;
  status: "OPERATIONAL" | "DEGRADED" | "OUTAGE";
  message: string | null;
  updatedAt: string;
}

const serviceLabels: Record<string, string> = {
  CHAT: "AI 채팅",
  RAG: "지식 검색 (RAG)",
  EMBEDDING: "임베딩 서비스",
  API: "API 게이트웨이",
};

const statusConfig = {
  OPERATIONAL: { 
    label: "정상", 
    color: "#22c55e", 
    bgColor: "rgba(34, 197, 94, 0.1)",
    icon: CheckCircle2 
  },
  DEGRADED: { 
    label: "성능 저하", 
    color: "#f59e0b", 
    bgColor: "rgba(245, 158, 11, 0.1)",
    icon: AlertTriangle 
  },
  OUTAGE: { 
    label: "장애", 
    color: "#ef4444", 
    bgColor: "rgba(239, 68, 68, 0.1)",
    icon: XCircle 
  },
};

export function SystemStatus() {
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: "", message: "" });

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/admin/system-status");
      if (res.ok) {
        const data = await res.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error("Failed to fetch system status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (status: ServiceStatus) => {
    setEditingService(status.service);
    setEditForm({ status: status.status, message: status.message || "" });
  };

  const handleSave = async (service: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/system-status/${service}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditingService(null);
        fetchStatuses();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingService(null);
    setEditForm({ status: "", message: "" });
  };

  const getOverallStatus = () => {
    if (statuses.some(s => s.status === "OUTAGE")) return "OUTAGE";
    if (statuses.some(s => s.status === "DEGRADED")) return "DEGRADED";
    return "OPERATIONAL";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const overall = getOverallStatus();
  const overallConfig = statusConfig[overall];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
          시스템 상태
        </h2>
        <Button variant="outline" onClick={fetchStatuses}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Overall Status Card */}
      <Card style={{ background: overallConfig.bgColor, border: `1px solid ${overallConfig.color}` }}>
        <CardContent style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <OverallIcon style={{ width: "48px", height: "48px", color: overallConfig.color }} />
            <div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>전체 시스템 상태</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: overallConfig.color }}>
                {overallConfig.label}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status List */}
      <div className="space-y-3">
        {statuses.map((service) => {
          const config = statusConfig[service.status];
          const Icon = config.icon;
          const isEditing = editingService === service.service;

          return (
            <Card key={service.service}>
              <CardContent style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <Icon style={{ width: "24px", height: "24px", color: config.color }} />
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {serviceLabels[service.service] || service.service}
                      </p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.message}
                          onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                          placeholder="상태 메시지 (선택사항)"
                          style={{
                            marginTop: "4px",
                            padding: "4px 8px",
                            fontSize: "13px",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            width: "300px",
                          }}
                        />
                      ) : (
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {service.message || "정상 운영 중"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {isEditing ? (
                      <>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-primary)",
                          }}
                        >
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => handleSave(service.service)} disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          취소
                        </Button>
                      </>
                    ) : (
                      <>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "16px",
                          background: config.bgColor,
                          color: config.color,
                          fontSize: "13px",
                          fontWeight: 600,
                        }}>
                          {config.label}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(service)}>
                          변경
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p style={{ 
                  fontSize: "11px", 
                  color: "var(--text-tertiary)", 
                  marginTop: "8px",
                  marginLeft: "36px" 
                }}>
                  마지막 업데이트: {new Date(service.updatedAt).toLocaleString("ko-KR")}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {statuses.length === 0 && (
          <Card>
            <CardContent style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>시스템 상태 정보가 없습니다.</p>
              <p style={{ fontSize: "13px", marginTop: "8px" }}>
                데이터베이스를 시드하거나 상태를 추가해주세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
