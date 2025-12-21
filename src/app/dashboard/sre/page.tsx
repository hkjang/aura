"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Bell, Server, Database, Cpu, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";

interface SystemStatus {
  id: string;
  service: string;
  status: string;
  message: string | null;
  updatedAt: string;
}

const serviceIcons: Record<string, typeof Server> = {
  API: Server,
  CHAT: Cpu,
  RAG: Database,
  EMBEDDING: Database,
  DEFAULT: Server,
};

export default function SREDashboardPage() {
  const [statuses, setStatuses] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system-status");
      if (res.ok) {
        const data = await res.json();
        setStatuses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("System status fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simulated latency based on service type
  const getLatency = (service: string) => {
    const latencies: Record<string, number> = {
      API: 23,
      CHAT: 320,
      RAG: 156,
      EMBEDDING: 45,
    };
    return latencies[service] || 50;
  };

  const getServiceName = (service: string) => {
    const names: Record<string, string> = {
      API: "API 게이트웨이",
      CHAT: "AI 모델 (Chat)",
      RAG: "벡터 데이터베이스",
      EMBEDDING: "임베딩 서비스",
    };
    return names[service] || service;
  };

  const alerts = [
    { id: "1", name: "높은 지연 시간 알림", condition: "latency > 500ms", channels: ["slack"], isEnabled: true },
    { id: "2", name: "서비스 다운 알림", condition: "status == DEGRADED", channels: ["slack", "email"], isEnabled: true },
    { id: "3", name: "데이터베이스 경고", condition: "db_connections > 80%", channels: ["email"], isEnabled: false },
  ];

  const recentIncidents = [
    { id: "i1", title: "벡터 DB 높은 지연", time: "2시간 전", status: "해결됨" },
    { id: "i2", title: "API 타임아웃 급증", time: "1일 전", status: "해결됨" },
  ];

  const operationalCount = statuses.filter(s => s.status === "OPERATIONAL").length;
  const uptimePercent = statuses.length > 0 ? ((operationalCount / statuses.length) * 100).toFixed(1) : "99.9";

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>운영 & 신뢰성</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            시스템 상태를 모니터링하고, 알림을 관리하며, 가동 시간을 보장하세요.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchStatus}>
          <RefreshCw style={{ width: '14px', height: '14px', marginRight: '6px', animation: loading ? 'spin 1s linear infinite' : 'none' }} /> 
          새로고침
        </Button>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Health Checks */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>시스템 상태</h2>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              상태 확인 중...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {statuses.map(status => {
                const Icon = serviceIcons[status.service] || serviceIcons.DEFAULT;
                const isHealthy = status.status === "OPERATIONAL";
                const latency = getLatency(status.service);
                
                return (
                  <Card key={status.id} className="p-4" style={{ 
                    borderLeft: `4px solid ${isHealthy ? 'var(--color-success)' : 'var(--color-warning)'}` 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        padding: '10px', 
                        borderRadius: 'var(--radius-md)', 
                        background: isHealthy ? '#dcfce7' : '#fef3c7' 
                      }}>
                        <Icon style={{ 
                          width: '20px', 
                          height: '20px', 
                          color: isHealthy ? 'var(--color-success)' : 'var(--color-warning)' 
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {getServiceName(status.service)}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          지연: {latency}ms
                        </p>
                      </div>
                      <span className={`status ${isHealthy ? 'status-success' : 'status-warning'}`}>
                        {isHealthy ? "정상" : "저하"}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Alerts */}
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px' }}>알림 규칙</h2>
          <Card>
            {alerts.map((alert, idx) => (
              <div key={alert.id} style={{ 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: idx < alerts.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bell style={{ width: '16px', height: '16px', color: alert.isEnabled ? 'var(--color-primary)' : 'var(--text-tertiary)' }} />
                  <div>
                    <h4 style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{alert.name}</h4>
                    <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{alert.condition}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {alert.channels.map(ch => (
                    <span key={ch} className="badge">{ch}</span>
                  ))}
                  <span className={`status ${alert.isEnabled ? 'status-success' : ''}`}>
                    {alert.isEnabled ? "활성" : "비활성"}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>최근 인시던트</h2>
          <Card>
            {recentIncidents.map((inc, idx) => (
              <div key={inc.id} style={{ 
                padding: '16px',
                borderBottom: idx < recentIncidents.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--color-warning)', marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{inc.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{inc.time}</p>
                  </div>
                </div>
                <span className="status status-success" style={{ marginTop: '8px', display: 'inline-block' }}>{inc.status}</span>
              </div>
            ))}
          </Card>

          <Card className="p-4">
            <h3 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>가동률 (30일)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--color-success)' }} />
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-success)' }}>{uptimePercent}%</div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>목표: 99.9%</p>
          </Card>
        </div>
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
