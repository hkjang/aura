import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, Users } from "lucide-react";

export const dynamic = 'force-dynamic';

// Mock data
const workflows = [
  { id: "1", name: "주간 보고서 생성", agents: ["리서처", "요약기"], schedule: "0 9 * * MON", status: "active", lastRun: "2일 전" },
  { id: "2", name: "고객 티켓 분류", agents: ["분류기", "라우터"], schedule: null, status: "manual", lastRun: "5분 전" },
  { id: "3", name: "데이터 품질 검사", agents: ["검증기", "리포터"], schedule: "0 0 * * *", status: "active", lastRun: "1일 전" },
];

const recentExecutions = [
  { id: "e1", workflow: "고객 티켓 분류", result: "성공", duration: "12초", time: "16:42" },
  { id: "e2", workflow: "주간 보고서 생성", result: "성공", duration: "2분 34초", time: "09:00" },
  { id: "e3", workflow: "데이터 품질 검사", result: "실패", duration: "45초", time: "00:00" },
];

export default function AgentDashboardPage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>AI 에이전트 자동화</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          자동화 워크플로우와 멀티 에이전트 작업을 관리하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Workflows */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>워크플로우</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workflows.map(wf => (
              <Card key={wf.id} className="p-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                  <div style={{ padding: '10px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
                    <Users style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wf.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{wf.agents.join(" → ")}</span>
                      {wf.schedule && (
                        <span className="badge">
                          <Clock style={{ width: '12px', height: '12px' }} /> {wf.schedule}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>마지막 실행: {wf.lastRun}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Play style={{ width: '14px', height: '14px', marginRight: '6px' }} /> 실행
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats & Recent Runs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>통계</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <Card className="p-4">
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 워크플로우</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{workflows.length}</h3>
            </Card>
            <Card className="p-4" style={{ background: '#dcfce7', borderColor: 'var(--color-success)' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-success)' }}>성공률 (7일)</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>94.5%</h3>
            </Card>
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>최근 실행</h2>
          <Card>
            {recentExecutions.map((ex, idx) => (
              <div key={ex.id} style={{ 
                padding: '14px 16px', 
                borderBottom: idx < recentExecutions.length - 1 ? '1px solid var(--border-color)' : 'none' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`status ${ex.result === "성공" ? "status-success" : "status-error"}`}>
                    {ex.result}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{ex.time}</span>
                </div>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '6px', fontSize: '14px' }}>{ex.workflow}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>소요 시간: {ex.duration}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
