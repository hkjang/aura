import { Card } from "@/components/ui/card";
import { BudgetCard } from "@/components/cost/budget-card";

export const dynamic = 'force-dynamic';

// Mock data for MVP visualization
const usageData = [
  { model: "GPT-4", tokens: 15400, cost: 644, requests: 120 },
  { model: "GPT-3.5-Turbo", tokens: 45000, cost: 126, requests: 340 },
  { model: "Llama 3 70B", tokens: 2000, cost: 3, requests: 15 },
];

export default function CostDashboardPage() {
  const totalCost = usageData.reduce((acc, curr) => acc + curr.cost, 0);
  const totalRequests = usageData.reduce((acc, curr) => acc + curr.requests, 0);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>비용 & 리소스 관리</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          AI 지출을 추적하고, 예산을 관리하며, 리소스 사용량을 분석하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <Card className="p-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 지출 (월)</p>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            ₩{totalCost.toLocaleString()}
            </h2>
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            지난 달 대비 +12%
          </div>
        </Card>

        <Card className="p-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 요청</p>
                <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>{totalRequests}</h2>
            </div>
             <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                GPT-3.5가 가장 활발
            </div>
        </Card>

        {/* Budget Management Component */}
        <BudgetCard currentSpend={totalCost} limit={14000} />
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <Card className="p-6">
            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>모델별 비용</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {usageData.map((item) => (
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
                             <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>₩{item.cost.toLocaleString()}</p>
                             <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.requests}건</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <Card className="p-6">
             <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>최근 사용 로그</h3>
             <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>모델</th>
                            <th>유형</th>
                            <th>토큰</th>
                            <th>비용</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ fontWeight: 500 }}>GPT-4</td>
                            <td>채팅</td>
                            <td>1,204</td>
                            <td style={{ color: 'var(--color-success)' }}>₩50</td>
                        </tr>
                         <tr>
                            <td style={{ fontWeight: 500 }}>GPT-3.5-Turbo</td>
                            <td>채팅</td>
                            <td>450</td>
                            <td style={{ color: 'var(--color-success)' }}>₩1</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 500 }}>Llama 3</td>
                            <td>채팅</td>
                            <td>800</td>
                            <td style={{ color: 'var(--color-success)' }}>₩0</td>
                        </tr>
                    </tbody>
                </table>
             </div>
        </Card>
      </div>
    </div>
  );
}
