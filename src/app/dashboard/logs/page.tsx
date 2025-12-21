"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface Log {
  id: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({ totalCost: 0, totalTokens: 0 });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/logs");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
          
          const totalCost = data.logs.reduce((acc: number, log: Log) => acc + log.cost, 0);
          const totalTokens = data.logs.reduce((acc: number, log: Log) => acc + log.tokensIn + log.tokensOut, 0);
          setStats({ totalCost, totalTokens });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Activity style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
        시스템 로그
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <Card className="p-6">
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 비용 (추정)</p>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            ₩{Math.round(stats.totalCost * 1400).toLocaleString()}
          </div>
        </Card>
        <Card className="p-6">
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 처리 토큰</p>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {stats.totalTokens.toLocaleString()}
          </div>
        </Card>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>시간</th>
              <th>모델</th>
              <th style={{ textAlign: 'right' }}>토큰 (입력/출력)</th>
              <th style={{ textAlign: 'right' }}>비용</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString('ko-KR')}</td>
                <td style={{ fontFamily: 'monospace' }}>{log.model}</td>
                <td style={{ textAlign: 'right' }}>{log.tokensIn} / {log.tokensOut}</td>
                <td style={{ textAlign: 'right' }}>₩{Math.round(log.cost * 1400).toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 && (
               <tr>
                 <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                   로그가 없습니다
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
