import { Card } from "@/components/ui/card";
import { PolicyCard } from "@/components/governance/policy-card";

export const dynamic = 'force-dynamic';

// Mock data for MVP
const policies = [
  { id: "1", name: "경쟁사 차단", type: "BLOCK_KEYWORD", action: "BLOCK", isActive: true, description: "프롬프트에서 특정 경쟁사 이름 언급을 차단합니다." },
  { id: "2", name: "개인정보 탐지", type: "PII_FILTER", action: "MASK", isActive: true, description: "출력에서 이메일, 전화번호, 주민번호를 감지하고 마스킹합니다." },
  { id: "3", name: "금융 조언 필터", type: "TOPIC_BAN", action: "FLAG", isActive: false, description: "특정 투자 조언이나 주식 팁을 요청하는 내용을 플래그합니다." },
  { id: "4", name: "시스템 프롬프트 인젝션", type: "REGEX", action: "BLOCK", isActive: true, description: "'이전 지시 무시' 등을 통한 시스템 지시 우회 시도를 차단합니다." },
];

const auditLogs = [
  { id: "1", user: "user-123", action: "채팅 요청", resource: "model-inference", status: "차단됨", details: "경쟁사 언급", time: "2분 전" },
  { id: "2", user: "user-456", action: "채팅 요청", resource: "model-inference", status: "허용됨", details: "-", time: "5분 전" },
  { id: "3", user: "admin-1", action: "정책 수정", resource: "policy-2", status: "성공", details: "액션을 MASK로 변경", time: "1시간 전" },
  { id: "4", user: "user-789", action: "채팅 요청", resource: "model-inference", status: "플래그됨", details: "PII 가능성", time: "3시간 전" },
];

export default function GovernanceDashboardPage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>AI 거버넌스 & 제어</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          사용 정책을 관리하고, 감사 로그를 확인하며, AI 안전 가드레일을 제어하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Policy Management Column */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>활성 정책</h2>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {policies.map(p => (
                    <PolicyCard key={p.id} policy={p} />
                ))}
            </div>

            <div style={{ marginTop: '16px' }}>
                 <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>보안 인사이트</h2>
                 <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <Card className="p-4" style={{ background: '#fee2e2', borderColor: 'var(--color-error)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-error)' }}>차단된 요청 (24시간)</p>
                        <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px' }}>12</h3>
                    </Card>
                    <Card className="p-4" style={{ background: '#fef3c7', borderColor: 'var(--color-warning)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-warning)' }}>플래그된 사건</p>
                        <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>45</h3>
                    </Card>
                     <Card className="p-4">
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>활성 규칙</p>
                        <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>104</h3>
                    </Card>
                 </div>
            </div>
        </div>

        {/* Audit Log Column */}
        <div>
             <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>최근 감사 로그</h2>
             <Card>
                {auditLogs.map((log, idx) => (
                    <div key={log.id} style={{ 
                      padding: '16px', 
                      borderBottom: idx < auditLogs.length - 1 ? '1px solid var(--border-color)' : 'none' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                            <span className={`status ${
                                log.status === '차단됨' ? 'status-error' :
                                log.status === '플래그됨' ? 'status-warning' :
                                'status-success'
                            }`}>{log.status}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{log.time}</span>
                        </div>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px' }}>{log.action}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            사용자: {log.user} • {log.details}
                        </p>
                    </div>
                ))}
                <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                    <button style={{ 
                      fontSize: '13px', 
                      color: 'var(--color-primary)', 
                      fontWeight: 500, 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer' 
                    }}>
                      전체 로그 보기
                    </button>
                </div>
             </Card>
        </div>
      </div>
    </div>
  );
}
