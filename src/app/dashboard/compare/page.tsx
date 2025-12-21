"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Loader2, Clock, Zap, AlertCircle } from "lucide-react";

interface ComparisonResult {
  model: string;
  provider: string;
  response: string;
  latency: number;
  score?: number;
}

interface ComparisonStats {
  modelCount: number;
  avgLatency: number;
  avgScore: number;
  bestModel: string | null;
}

export default function ModelComparisonPage() {
  const [query, setQuery] = useState("");
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [stats, setStats] = useState<ComparisonStats | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      
      if (!response.ok) {
        throw new Error("비교 요청에 실패했습니다.");
      }
      
      const data = await response.json();
      setResults(data.results || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Scale style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          모델 비교
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          다양한 AI 모델의 응답을 나란히 비교하세요.
        </p>
      </div>

      {/* Query Input */}
      <Card className="p-6">
        <div style={{ display: 'flex', gap: '16px' }}>
          <Input
            placeholder="모델 간 비교할 질문을 입력하세요..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={handleCompare} disabled={comparing || !query.trim()}>
            {comparing ? <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px' }} className="animate-spin" /> : <Scale style={{ width: '16px', height: '16px', marginRight: '8px' }} />}
            {comparing ? "비교 중..." : "비교하기"}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>비교 결과</h2>
          
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((result, idx) => (
              <Card key={result.model} className="p-4" style={{ borderWidth: idx === 0 ? '2px' : '1px', borderColor: idx === 0 ? 'var(--color-primary)' : undefined }}>
                {idx === 0 && (
                  <span className="status status-info" style={{ marginBottom: '12px' }}>최고 매칭</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{result.model}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{result.provider}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>{result.score}</div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>점수</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '12px', height: '12px' }} />
                    {result.latency}ms
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap style={{ width: '12px', height: '12px' }} />
                    {result.response.length}자
                  </span>
                </div>

                <div style={{ 
                  padding: '12px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}>
                  {result.response}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !comparing && (
        <div className="empty-state">
          <Scale className="empty-state-icon" style={{ opacity: 0.3 }} />
          <p className="empty-state-title">비교 결과가 없습니다</p>
          <p className="empty-state-description">
            위에 질문을 입력하고 비교하기 버튼을 클릭하면 여러 모델의 결과를 볼 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
