import { Card } from "@/components/ui/card";
import { DeploymentCard } from "@/components/mlops/deployment-card";

export const dynamic = 'force-dynamic';

// Mock data
const deployments = [
  { id: "1", name: "gpt-3.5-turbo", version: "2024-v2-opt", endpoint: "https://api.openai.com/v1", status: "ACTIVE", strategy: "ROLLING", trafficSplit: 100 },
  { id: "2", name: "internal-llama-3", version: "v1.0.4-rc2", endpoint: "http://gpu-cluster-1:8000/v1", status: "ACTIVE", strategy: "CANARY", trafficSplit: 10 },
  { id: "3", name: "internal-llama-3", version: "v1.0.3-stable", endpoint: "http://gpu-cluster-main:8000/v1", status: "ACTIVE", strategy: "BLUE_GREEN", trafficSplit: 90 },
];

export default function MLOpsDashboardPage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>MLOps & 배포</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          모델 라이프사이클, 버전, 트래픽 라우팅을 관리하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
         {/* Main Deployments Column */}
         <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>활성 배포</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deployments.map(d => (
                    <DeploymentCard key={d.id} deployment={d} />
                ))}
            </div>
         </div>

         {/* Sidebar Stats */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>시스템 상태</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
                <Card className="p-4" style={{ background: '#dcfce7', borderColor: 'var(--color-success)' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-success)' }}>API 가동률 (30일)</p>
                    <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>99.98%</h3>
                </Card>
                <Card className="p-4">
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>평균 지연 (p95)</p>
                    <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>420ms</h3>
                </Card>
                <Card className="p-4">
                     <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 추론 요청</p>
                     <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>1.2M</h3>
                </Card>
            </div>

            <Card className="p-4">
                <h3 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>자동화 파이프라인</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
                        v1.0.5-nightly 평가 중
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
                        벡터 DB 재인덱싱 중
                    </li>
                </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}
