"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  Play, 
  Search,
  FileText,
  Mail,
  Code2,
  BarChart3,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Copy,
  Info,
  Sparkles,
  ArrowRight,
  Clock
} from "lucide-react";

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  placeholder: string;
  systemPrompt: string;
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "researcher",
    name: "리서처",
    description: "주제에 대해 깊이있게 조사하고 정리된 보고서를 작성합니다",
    icon: Search,
    color: "#8b5cf6",
    placeholder: "조사할 주제를 입력하세요 (예: '2024년 AI 트렌드')",
    systemPrompt: `당신은 전문 리서처입니다. 사용자가 요청한 주제에 대해:
1. 핵심 개념과 정의
2. 현재 동향과 트렌드
3. 주요 사례나 예시
4. 결론 및 인사이트
형식으로 체계적으로 조사 결과를 정리해주세요. 한국어로 답변하세요.`
  },
  {
    id: "summarizer",
    name: "요약기",
    description: "긴 텍스트를 핵심만 추출하여 간결하게 요약합니다",
    icon: FileText,
    color: "#3b82f6",
    placeholder: "요약할 텍스트를 붙여넣으세요",
    systemPrompt: `당신은 전문 요약 전문가입니다. 주어진 텍스트를 분석하여:
1. 핵심 요약 (2-3문장)
2. 주요 포인트 (3-5개 불릿 포인트)
3. 핵심 키워드 (5개)
형식으로 정리해주세요. 원문의 의미를 보존하면서 간결하게 요약하세요. 한국어로 답변하세요.`
  },
  {
    id: "writer",
    name: "작성기",
    description: "이메일, 보고서, 문서 등 다양한 글을 작성합니다",
    icon: Mail,
    color: "#22c55e",
    placeholder: "작성할 내용을 설명하세요 (예: '프로젝트 완료 보고 이메일')",
    systemPrompt: `당신은 전문 비즈니스 작성가입니다. 사용자의 요청에 따라 적절한 형식과 톤으로 글을 작성합니다.
- 이메일: 적절한 인사말과 맺음말 포함
- 보고서: 체계적인 구조와 명확한 내용
- 문서: 전문적이고 읽기 쉬운 형식
한국어로 작성하고, 필요시 영문 병기도 가능합니다.`
  },
  {
    id: "coder",
    name: "코더",
    description: "코드 작성, 리뷰, 최적화를 도와드립니다",
    icon: Code2,
    color: "#f59e0b",
    placeholder: "필요한 기능이나 코드를 설명하세요",
    systemPrompt: `당신은 시니어 소프트웨어 개발자입니다. 
- 깔끔하고 효율적인 코드 작성
- 코드에 대한 설명 주석 포함
- 베스트 프랙티스 적용
- 잠재적 문제점과 개선 사항 제안
필요시 여러 프로그래밍 언어로 예시를 제공합니다.`
  },
  {
    id: "analyzer",
    name: "분석기",
    description: "데이터나 상황을 분석하고 인사이트를 제공합니다",
    icon: BarChart3,
    color: "#ec4899",
    placeholder: "분석할 데이터나 상황을 설명하세요",
    systemPrompt: `당신은 데이터 분석 전문가입니다. 주어진 정보를 분석하여:
1. 현황 분석 (As-Is)
2. 문제점/기회 도출
3. 데이터 기반 인사이트
4. 액션 아이템 제안
형식으로 체계적인 분석 결과를 제공합니다. 가능하면 수치화하고 근거를 명시하세요.`
  },
  {
    id: "translator",
    name: "번역기",
    description: "다국어 번역과 문화적 맥락 설명을 제공합니다",
    icon: MessageSquare,
    color: "#06b6d4",
    placeholder: "번역할 텍스트와 대상 언어를 입력하세요",
    systemPrompt: `당신은 전문 번역가입니다. 다음을 제공합니다:
1. 정확한 번역
2. 문화적 맥락이나 뉘앙스 설명 (필요시)
3. 대안 표현 제안 (중요한 경우)
자연스럽고 원문의 의도를 잘 전달하는 번역을 제공하세요.`
  }
];

interface ExecutionResult {
  agentId: string;
  input: string;
  output: string;
  duration: number;
  timestamp: string;
}

export default function AgentDashboardPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentTemplate | null>(null);
  const [input, setInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<ExecutionResult[]>([]);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    if (!selectedAgent || !input.trim()) return;

    setExecuting(true);
    setResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: selectedAgent.systemPrompt },
            { role: "user", content: input }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "에이전트 실행에 실패했습니다.");
      }

      // Handle streaming response or direct response
      let outputText = "";
      if (data.choices && data.choices[0]) {
        outputText = data.choices[0].message?.content || data.choices[0].text || "";
      } else if (data.content) {
        outputText = data.content;
      } else if (typeof data === "string") {
        outputText = data;
      } else {
        outputText = JSON.stringify(data);
      }

      const execution: ExecutionResult = {
        agentId: selectedAgent.id,
        input: input,
        output: outputText,
        duration: Date.now() - startTime,
        timestamp: new Date().toLocaleString("ko-KR")
      };

      setResult(execution);
      setRecentExecutions(prev => [execution, ...prev.slice(0, 4)]);
    } catch (error) {
      setResult({
        agentId: selectedAgent.id,
        input: input,
        output: `오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toLocaleString("ko-KR")
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopy = async () => {
    if (result?.output) {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bot style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          AI 에이전트
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          특정 작업에 최적화된 AI 에이전트를 선택하고 실행하세요.
        </p>
      </div>

      {/* How it works */}
      <Card className="p-5" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Info style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            AI 에이전트란?
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
          AI 에이전트는 <strong>특정 작업에 특화된 AI 어시스턴트</strong>입니다. 
          일반 채팅과 달리, 각 에이전트는 해당 분야에 최적화된 프롬프트와 지식을 갖추고 있어 
          더 정확하고 전문적인 결과를 제공합니다.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>1</span>
            에이전트 선택
          </span>
          <ArrowRight style={{ width: '16px', height: '16px' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>2</span>
            작업 입력
          </span>
          <ArrowRight style={{ width: '16px', height: '16px' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>3</span>
            결과 확인
          </span>
        </div>
      </Card>

      {/* Agent Selection */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
          에이전트 선택
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {AGENT_TEMPLATES.map(agent => {
            const Icon = agent.icon;
            const isSelected = selectedAgent?.id === agent.id;
            return (
              <Card 
                key={agent.id}
                className="p-4"
                style={{ 
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${agent.color}` : '1px solid var(--border-color)',
                  background: isSelected ? `${agent.color}08` : 'var(--bg-primary)',
                  transition: 'all 200ms ease'
                }}
                onClick={() => { setSelectedAgent(agent); setInput(""); setResult(null); }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '14px' }}>
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '12px', 
                    background: `${agent.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon style={{ width: '22px', height: '22px', color: agent.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{agent.name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                      {agent.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Input & Execution */}
      {selectedAgent && (
        <Card className="p-6" style={{ border: `1px solid ${selectedAgent.color}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {(() => {
              const Icon = selectedAgent.icon;
              return <Icon style={{ width: '20px', height: '20px', color: selectedAgent.color }} />;
            })()}
            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedAgent.name} 에이전트 실행
            </h3>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedAgent.placeholder}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              resize: 'vertical',
              lineHeight: 1.6
            }}
          />

          <Button 
            onClick={handleExecute}
            disabled={executing || !input.trim()}
            style={{ marginTop: '16px', width: '100%' }}
            size="lg"
          >
            {executing ? (
              <>
                <Loader2 style={{ width: '18px', height: '18px', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                실행 중...
              </>
            ) : (
              <>
                <Play style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                실행하기
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 style={{ width: '20px', height: '20px', color: 'var(--color-success)' }} />
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>실행 결과</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock style={{ width: '12px', height: '12px' }} />
                {(result.duration / 1000).toFixed(1)}초
              </span>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <CheckCircle2 style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
              </Button>
            </div>
          </div>

          <div style={{ 
            padding: '20px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '10px',
            fontSize: '14px',
            color: 'var(--text-primary)',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            maxHeight: '500px',
            overflow: 'auto'
          }}>
            {result.output}
          </div>
        </Card>
      )}

      {/* Recent Executions */}
      {recentExecutions.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            최근 실행 기록
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentExecutions.map((exec, idx) => {
              const agent = AGENT_TEMPLATES.find(a => a.id === exec.agentId);
              return (
                <Card key={idx} className="p-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    background: agent ? `${agent.color}20` : 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {agent && <agent.icon style={{ width: '16px', height: '16px', color: agent.color }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exec.input.substring(0, 50)}{exec.input.length > 50 ? '...' : ''}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {agent?.name} · {exec.timestamp}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {(exec.duration / 1000).toFixed(1)}초
                  </span>
                </Card>
              );
            })}
          </div>
        </div>
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
