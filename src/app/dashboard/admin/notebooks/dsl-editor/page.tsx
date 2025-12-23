"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Code,
  ArrowLeft,
  Play,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCode,
  Layers,
  RefreshCw,
  Trash2,
  Plus,
  Copy,
  Download,
  Upload,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

// ============ Types ============
interface RuleSet {
  id: string;
  name: string;
  version: string;
  scope: string;
  isActive: boolean;
  ruleCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CompileResult {
  success: boolean;
  errors: Array<{ message: string; line: number; column: number; severity: string }>;
  warnings: Array<{ message: string; line: number; column: number; severity: string }>;
  summary?: string;
  lint?: { score: number; issues: Array<{ severity: string; message: string; suggestion?: string }> };
}

// ============ Default DSL Template ============
const DEFAULT_DSL = `# 새 규칙 세트
rule_set "my_rules" {
  version: "1.0.0"
  scope: GLOBAL
  
  # 품질 필터 규칙
  rule "quality_filter" {
    priority: 1
    stage: CHUNK_SELECTION
    description: "최소 품질 점수 필터"
    
    when {
      chunk.qualityScore < 50
    }
    then {
      FILTER_BY_QUALITY(threshold: 50)
    }
  }
  
  # 추가 규칙을 여기에 작성하세요
}
`;

// ============ Main Component ============
export default function DSLEditorPage() {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dslCode, setDslCode] = useState(DEFAULT_DSL);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPanel, setShowPanel] = useState<"errors" | "summary" | "lint" | null>("errors");
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  // Fetch rule sets
  useEffect(() => {
    const fetchRuleSets = async () => {
      try {
        const res = await fetch("/api/dsl-rules");
        if (res.ok) {
          const data = await res.json();
          setRuleSets(data.ruleSets || []);
        }
      } catch (error) {
        console.error("Failed to fetch rule sets:", error);
      }
    };
    fetchRuleSets();
  }, []);

  // Update line numbers
  useEffect(() => {
    const lines = dslCode.split("\n").length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [dslCode]);

  // Compile DSL
  const compileDSL = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dsl-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compile", dsl: dslCode }),
      });
      const data = await res.json();
      setCompileResult(data);
      setShowPanel(data.success ? "summary" : "errors");
    } catch (error) {
      console.error("Compile failed:", error);
      setCompileResult({
        success: false,
        errors: [{ message: "컴파일 요청 실패", line: 0, column: 0, severity: "error" }],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  }, [dslCode]);

  // Save DSL
  const saveDSL = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dsl-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dsl: dslCode, id: selectedId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setCompileResult(prev => prev ? { ...prev, lint: data.lint } : null);
        // Refresh list
        const listRes = await fetch("/api/dsl-rules");
        if (listRes.ok) {
          const listData = await listRes.json();
          setRuleSets(listData.ruleSets || []);
        }
        setSelectedId(data.id);
      } else {
        setCompileResult({
          success: false,
          errors: data.errors || [{ message: data.error, line: 0, column: 0, severity: "error" }],
          warnings: data.warnings || [],
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  // Load rule set
  const loadRuleSet = async (id: string) => {
    try {
      const res = await fetch(`/api/dsl-rules?id=${id}&action=compile`);
      if (res.ok) {
        const data = await res.json();
        setDslCode(data.dsl || "");
        setSelectedId(id);
        setCompileResult({
          success: data.compiled,
          errors: data.errors || [],
          warnings: data.warnings || [],
          summary: data.summary,
          lint: data.lint,
        });
      }
    } catch (error) {
      console.error("Load failed:", error);
    }
  };

  // Delete rule set
  const deleteRuleSet = async (id: string) => {
    if (!confirm("이 규칙 세트를 삭제하시겠습니까?")) return;
    
    try {
      await fetch(`/api/dsl-rules?id=${id}`, { method: "DELETE" });
      setRuleSets(prev => prev.filter(r => r.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDslCode(DEFAULT_DSL);
        setCompileResult(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // New rule set
  const newRuleSet = () => {
    setSelectedId(null);
    setDslCode(DEFAULT_DSL);
    setCompileResult(null);
  };

  // Get line with error
  const getErrorLines = (): Set<number> => {
    const lines = new Set<number>();
    if (compileResult) {
      compileResult.errors.forEach(e => lines.add(e.line));
      compileResult.warnings.forEach(w => lines.add(w.line));
    }
    return lines;
  };

  const errorLines = getErrorLines();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ 
        padding: "16px 24px", 
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-secondary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/admin/notebooks">
            <button style={{ padding: "8px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer" }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <Code style={{ width: 20, height: 20, color: "var(--color-primary)" }} />
              RAG 규칙 DSL 에디터
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
              선언적 규칙 정의로 RAG 동작 제어
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={compileDSL}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            {loading ? (
              <RefreshCw style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
            ) : (
              <Play style={{ width: 14, height: 14 }} />
            )}
            검증
          </button>
          
          <button
            onClick={saveDSL}
            disabled={saving || !compileResult?.success}
            style={{
              padding: "8px 16px",
              background: compileResult?.success ? "var(--color-primary)" : "var(--bg-secondary)",
              color: compileResult?.success ? "white" : "var(--text-tertiary)",
              border: "none",
              borderRadius: "6px",
              cursor: compileResult?.success ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <Save style={{ width: 14, height: 14 }} />
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar - Rule Sets */}
        <div style={{ 
          width: "260px", 
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-secondary)",
        }}>
          <div style={{ padding: "12px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>규칙 세트</span>
            <button
              onClick={newRuleSet}
              style={{ padding: "4px 8px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Plus style={{ width: 12, height: 12 }} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
            {ruleSets.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px" }}>
                저장된 규칙이 없습니다
              </div>
            ) : (
              ruleSets.map(rs => (
                <div
                  key={rs.id}
                  onClick={() => loadRuleSet(rs.id)}
                  style={{
                    padding: "12px",
                    background: selectedId === rs.id ? "rgba(37, 99, 235, 0.1)" : "var(--bg-primary)",
                    border: `1px solid ${selectedId === rs.id ? "var(--color-primary)" : "var(--border-color)"}`,
                    borderRadius: "8px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{rs.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRuleSet(rs.id); }}
                      style={{ padding: "4px", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
                    >
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "var(--text-tertiary)" }}>
                    <span>v{rs.version}</span>
                    <span>•</span>
                    <span>{rs.ruleCount} 규칙</span>
                    <span>•</span>
                    <span>{rs.scope}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Editor */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Line Numbers */}
            <div style={{
              width: "50px",
              background: "var(--bg-secondary)",
              borderRight: "1px solid var(--border-color)",
              padding: "16px 8px",
              fontFamily: "monospace",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textAlign: "right",
              overflow: "hidden",
              userSelect: "none",
            }}>
              {lineNumbers.map(n => (
                <div 
                  key={n} 
                  style={{ 
                    height: "20px",
                    lineHeight: "20px",
                    color: errorLines.has(n) ? "#ef4444" : undefined,
                    fontWeight: errorLines.has(n) ? 600 : undefined,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
            
            {/* Code Area */}
            <textarea
              value={dslCode}
              onChange={(e) => { setDslCode(e.target.value); setCompileResult(null); }}
              style={{
                flex: 1,
                padding: "16px",
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: "20px",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                border: "none",
                outline: "none",
                resize: "none",
              }}
              spellCheck={false}
            />
          </div>

          {/* Bottom Panel */}
          <div style={{ height: "200px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column" }}>
            {/* Panel Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
              {["errors", "summary", "lint"].map(panel => (
                <button
                  key={panel}
                  onClick={() => setShowPanel(showPanel === panel ? null : panel as typeof showPanel)}
                  style={{
                    padding: "10px 16px",
                    background: showPanel === panel ? "var(--bg-primary)" : "transparent",
                    border: "none",
                    borderBottom: showPanel === panel ? "2px solid var(--color-primary)" : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: showPanel === panel ? "var(--text-primary)" : "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {panel === "errors" && (
                    <>
                      {compileResult?.errors.length ? (
                        <XCircle style={{ width: 12, height: 12, color: "#ef4444" }} />
                      ) : compileResult?.warnings.length ? (
                        <AlertTriangle style={{ width: 12, height: 12, color: "#f59e0b" }} />
                      ) : (
                        <CheckCircle style={{ width: 12, height: 12, color: "#22c55e" }} />
                      )}
                      문제 {(compileResult?.errors.length || 0) + (compileResult?.warnings.length || 0)}
                    </>
                  )}
                  {panel === "summary" && (
                    <>
                      <Eye style={{ width: 12, height: 12 }} />
                      요약
                    </>
                  )}
                  {panel === "lint" && (
                    <>
                      <FileCode style={{ width: 12, height: 12 }} />
                      품질 {compileResult?.lint?.score ? `${compileResult.lint.score}점` : ""}
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "12px", background: "var(--bg-primary)" }}>
              {showPanel === "errors" && compileResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {compileResult.errors.length === 0 && compileResult.warnings.length === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#22c55e", fontSize: "13px" }}>
                      <CheckCircle style={{ width: 16, height: 16 }} />
                      문제가 발견되지 않았습니다
                    </div>
                  ) : (
                    <>
                      {compileResult.errors.map((e, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#ef4444" }}>
                          <XCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: "2px" }} />
                          <span><strong>Line {e.line}:</strong> {e.message}</span>
                        </div>
                      ))}
                      {compileResult.warnings.map((w, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#f59e0b" }}>
                          <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: "2px" }} />
                          <span><strong>Line {w.line}:</strong> {w.message}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {showPanel === "summary" && compileResult?.summary && (
                <pre style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                  {compileResult.summary}
                </pre>
              )}

              {showPanel === "lint" && compileResult?.lint && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: compileResult.lint.score >= 80 ? "#22c55e" : compileResult.lint.score >= 60 ? "#f59e0b" : "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "18px",
                      fontWeight: 700,
                    }}>
                      {compileResult.lint.score}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                        품질 점수
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                        {compileResult.lint.issues.length}개의 개선 제안
                      </div>
                    </div>
                  </div>
                  
                  {compileResult.lint.issues.map((issue, i) => (
                    <div key={i} style={{ padding: "10px", background: "var(--bg-secondary)", borderRadius: "6px", fontSize: "12px" }}>
                      <div style={{ color: issue.severity === "warning" ? "#f59e0b" : "var(--text-secondary)" }}>
                        {issue.message}
                      </div>
                      {issue.suggestion && (
                        <div style={{ color: "var(--text-tertiary)", marginTop: "4px", fontStyle: "italic" }}>
                          💡 {issue.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
