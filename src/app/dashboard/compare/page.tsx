"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Scale, 
  Loader2, 
  Clock, 
  Zap, 
  Trophy,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
  BarChart3
} from "lucide-react";

interface ScoreBreakdown {
  length: { score: number; reason: string };
  speed: { score: number; reason: string };
  relevance: { score: number; reason: string };
  format: { score: number; reason: string };
  base: { score: number; reason: string };
}

interface ComparisonResult {
  model: string;
  provider: string;
  response: string;
  latency: number;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  error?: string;
}

interface ComparisonStats {
  modelCount: number;
  avgLatency: number;
  avgScore: number;
  bestModel: string | null;
}

const EXAMPLE_PROMPTS = [
  { text: "한국의 수도와 주요 관광지를 알려주세요", category: "사실 기반" },
  { text: "마케팅 전략을 위한 SWOT 분석을 해주세요", category: "분석/추론" },
  { text: "행복에 대한 짧은 시를 써주세요", category: "창의적 글쓰기" },
  { text: "React와 Vue의 차이점을 설명해주세요", category: "기술 설명" },
];

export default function ModelComparisonPage() {
  const [query, setQuery] = useState("");
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [stats, setStats] = useState<ComparisonStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available models
    fetch("/api/admin/models")
      .then(res => res.json())
      .then(data => {
        if (data.models) {
          setAvailableModels(data.models.map((m: any) => m.name));
        }
      })
      .catch(console.error);
  }, []);

  const handleCompare = async () => {
    if (!query.trim()) return;
    
    setComparing(true);
    setError(null);
    setResults([]);
    setStats(null);
    
    try {
      const response = await fetch("/api/quality/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "비교 요청에 실패했습니다.");
      }
      
      setResults(data.results || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setComparing(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setQuery(prompt);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 0) return { icon: Trophy, color: '#fbbf24', label: '1위' };
    if (rank === 1) return { icon: CheckCircle2, color: '#94a3b8', label: '2위' };
    if (rank === 2) return { icon: CheckCircle2, color: '#cd7f32', label: '3위' };
    return { icon: null, color: '', label: '' };
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Scale style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          AI 모델 비교
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          동일한 질문에 대해 여러 AI 모델의 응답을 비교하고 최적의 모델을 선택하세요.
        </p>
      </div>

      {/* How It Works - Only show when no results */}
      {results.length === 0 && !comparing && (
        <Card className="p-6" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
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
              모델 비교란?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'rgba(124, 58, 237, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>1</span>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>질문 입력</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  테스트하고 싶은 질문이나 프롬프트를 입력합니다
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>2</span>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>동시 요청</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  설정된 모든 AI 모델에 동시에 요청을 보냅니다
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontWeight: 700, color: '#22c55e' }}>3</span>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>결과 비교</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  응답 품질, 속도, 길이를 비교하여 최적의 모델 선택
                </p>
              </div>
            </div>
          </div>

          {/* Available Models */}
          {availableModels.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>비교 가능한 모델:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableModels.map(model => (
                  <span key={model} style={{ 
                    padding: '4px 10px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scoring Criteria */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>📊 점수 산정 기준 (100점 만점)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>📝 응답 길이</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>최대 25점</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>상세하고 풍부한 응답 선호</p>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>⚡ 응답 속도</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>최대 25점</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>빠른 응답 (1초 미만 = 25점)</p>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>🎯 관련성</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>최대 25점</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>질문 키워드 포함 비율</p>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>📋 형식</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>최대 15점</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>구조화 (리스트, 번호 등)</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Query Input */}
      <Card className="p-6">
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
            비교할 질문
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Input
            placeholder="예: 'Python과 JavaScript의 장단점을 비교해주세요'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            style={{ flex: 1, fontSize: '15px' }}
          />
          <Button onClick={handleCompare} disabled={comparing || !query.trim()} size="lg">
            {comparing ? (
              <>
                <Loader2 style={{ width: '18px', height: '18px', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                비교 중...
              </>
            ) : (
              <>
                <Scale style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                비교 시작
              </>
            )}
          </Button>
        </div>

        {/* Example Prompts */}
        {results.length === 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb style={{ width: '12px', height: '12px' }} />
              예시 질문을 클릭하세요:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EXAMPLE_PROMPTS.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example.text)}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ 
                    padding: '2px 6px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)'
                  }}>
                    {example.category}
                  </span>
                  {example.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
            <XCircle style={{ width: '20px', height: '20px' }} />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Results Summary */}
      {stats && results.length > 0 && (
        <Card className="p-4" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>비교 요약</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>모델 수: <strong>{stats.modelCount}</strong></span>
              <span>평균 응답시간: <strong>{stats.avgLatency.toFixed(0)}ms</strong></span>
              {stats.bestModel && (
                <span style={{ color: 'var(--color-success)' }}>
                  🏆 최적 모델: <strong>{stats.bestModel}</strong>
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--color-success)' }} />
            비교 결과
          </h2>
          
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((result, idx) => {
              const badge = getRankBadge(idx);
              return (
                <Card 
                  key={result.model} 
                  className="p-5" 
                  style={{ 
                    borderWidth: idx === 0 ? '2px' : '1px', 
                    borderColor: idx === 0 ? 'var(--color-primary)' : undefined,
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  {/* Rank Badge */}
                  {idx < 3 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '-8px', 
                      right: '16px',
                      padding: '4px 10px',
                      background: idx === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'var(--bg-tertiary)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: idx === 0 ? '#000' : 'var(--text-secondary)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {badge.label}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>{result.model}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{result.provider}</p>
                    </div>
                    <div style={{ 
                      padding: '8px 16px', 
                      background: idx === 0 ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-secondary)', 
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: idx === 0 ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                        {result.score ?? '-'}
                      </div>
                      <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>점수</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock style={{ width: '14px', height: '14px' }} />
                      <strong>{result.latency}ms</strong> 응답시간
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap style={{ width: '14px', height: '14px' }} />
                      <strong>{result.response.length}</strong>자
                    </span>
                  </div>

                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {result.response}
                  </div>

                  {/* Score Breakdown */}
                  {result.scoreBreakdown && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        📊 점수 상세
                      </p>
                      <div style={{ display: 'grid', gap: '6px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>📝 응답 길이</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>+{result.scoreBreakdown.length.score}</strong>
                            <span style={{ marginLeft: '6px' }}>{result.scoreBreakdown.length.reason}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>⚡ 응답 속도</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>+{result.scoreBreakdown.speed.score}</strong>
                            <span style={{ marginLeft: '6px' }}>{result.scoreBreakdown.speed.reason}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>🎯 관련성</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>+{result.scoreBreakdown.relevance.score}</strong>
                            <span style={{ marginLeft: '6px' }}>{result.scoreBreakdown.relevance.reason}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>📋 형식</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>+{result.scoreBreakdown.format.score}</strong>
                            <span style={{ marginLeft: '6px' }}>{result.scoreBreakdown.format.reason}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>⚙️ 기본 점수</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>+{result.scoreBreakdown.base.score}</strong>
                            <span style={{ marginLeft: '6px' }}>{result.scoreBreakdown.base.reason}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !comparing && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--border-color)'
        }}>
          <Scale style={{ width: '48px', height: '48px', color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            비교 결과가 여기에 표시됩니다
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            위에서 질문을 입력하고 <strong>비교 시작</strong> 버튼을 클릭하면
            <br />여러 AI 모델의 응답을 나란히 비교할 수 있습니다.
          </p>
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
