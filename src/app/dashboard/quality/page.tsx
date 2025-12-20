import { Card } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

// Mock Data
const stats = [
  { label: "평균 정확도", value: "94.2%", trend: "+1.2%" },
  { label: "평균 관련성", value: "96.5%", trend: "+0.5%" },
  { label: "만족도 점수", value: "4.8/5.0", trend: "+0.1" },
  { label: "총 피드백", value: "1,240", trend: "+120" },
];

export default function QualityDashboardPage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>AI 품질 & 신뢰성</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          AI 모델의 성능과 사용자 만족도를 모니터링하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{stat.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</span>
              <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-success)' }}>{stat.trend}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        <Card className="p-6">
          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>최근 저품질 응답</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((_, i) => (
              <div key={i} style={{ 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                background: '#fee2e2', 
                border: '1px solid #fecaca' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <span className="status status-error">정확도: 0.45</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>10분 전</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Q: 경쟁사의 가격은 얼마인가요?
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  경쟁사의 실시간 가격 정보를 직접 제공할 수 없습니다...
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>최근 사용자 피드백</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {[1, 2, 3].map((_, i) => (
              <div key={i} style={{ 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-tertiary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}>U</div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>사용자 123</span>
                  <span className="status status-warning" style={{ marginLeft: 'auto' }}>지연</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>응답 생성에 너무 오랜 시간이 걸렸습니다.</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
