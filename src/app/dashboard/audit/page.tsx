"use client";

import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  user: { name: string; email: string };
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/audit");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert style={{ width: '28px', height: '28px', color: 'var(--color-error)' }} />
          보안 감사 로그
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          민감한 관리 작업을 추적합니다.
        </p>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>시간</th>
              <th>수행자</th>
              <th>작업</th>
              <th>리소스</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                  {new Date(log.createdAt).toLocaleString('ko-KR')}
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.user.name || "알 수 없음"}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{log.user.email}</div>
                </td>
                <td>
                  <span className="badge">{log.action}</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.resource}</td>
              </tr>
            ))}
            {logs.length === 0 && (
               <tr>
                 <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                   감사 로그가 없습니다.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
