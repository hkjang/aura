"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BudgetCard } from "@/components/cost/budget-card";
import { RefreshCw } from "lucide-react";

interface ModelCost {
  model: string;
  cost: number;
  tokens: number;
  requests: number;
}

interface CostReport {
  period: string;
  summary: {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
  };
  breakdown: {
    topModels: ModelCost[];
  };
  budgets: Array<{
    limit: number;
    spent: number;
  }>;
}

export default function CostDashboardPage() {
  const [data, setData] = useState<CostReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostReport();
  }, []);

  const fetchCostReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cost-report");
      if (res.ok) {
        const report = await res.json();
        setData(report);
      }
    } catch (error) {
      console.error("Failed to fetch cost report:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatKRW = (usd: number) => {
    const krw = Math.round(usd * 1400);
    return `₩${krw.toLocaleString()}`;
  };

  const totalCost = data?.summary?.totalCost || 0;
  const totalRequests = data?.summary?.totalRequests || 0;
  const usageData = data?.breakdown?.topModels || [];
  const budgetLimit = data?.budgets?.[0]?.limit || 10;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>비용 & 리소스 관리</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            AI 지출을 추적하고, 예산을 관리하며, 리소스 사용량을 분석하세요.
          </p>
        </div>
        <button 
          onClick={fetchCostReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '13px'
          }}
        >
          <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          새로고침
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          데이터를 불러오는 중...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <Card className="p-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 지출 (월)</p>
                <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
                  {formatKRW(totalCost)}
                </h2>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {data?.period || '이번 달'} 기준
              </div>
            </Card>

            <Card className="p-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 요청</p>
                <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>{totalRequests}</h2>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {usageData.length > 0 ? `${usageData[0]?.model}이(가) 가장 활발` : '데이터 없음'}
              </div>
            </Card>

            <BudgetCard currentSpend={totalCost * 1400} limit={budgetLimit * 1400} />
          </div>

          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            <Card className="p-6">
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>모델별 비용</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {usageData.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    아직 사용 데이터가 없습니다
                  </div>
                ) : (
                  usageData.map((item) => (
                    <div key={item.model} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '12px 16px', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{item.model}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.tokens.toLocaleString()} 토큰</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{formatKRW(item.cost)}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.requests}건</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>최근 사용 통계</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>평균 요청당 비용</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatKRW(totalRequests > 0 ? totalCost / totalRequests : 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>총 토큰 사용량</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {(data?.summary?.totalTokens || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>사용 모델 수</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {usageData.length}개
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
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
