"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Code, 
  Copy, 
  Download, 
  Loader2, 
  Play, 
  FileCode,
  Check,
  Sparkles,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface GeneratedCode {
  code: string;
  explanation?: string;
  language: string;
}

interface CodeGeneratorProps {
  onPromptChange?: (prompt: string) => void;
  externalPrompt?: string;
}

const languages = [
  { id: "python", name: "Python", icon: "🐍" },
  { id: "javascript", name: "JavaScript", icon: "📜" },
  { id: "typescript", name: "TypeScript", icon: "📘" },
  { id: "java", name: "Java", icon: "☕" },
  { id: "csharp", name: "C#", icon: "🔷" },
  { id: "go", name: "Go", icon: "🐹" },
  { id: "rust", name: "Rust", icon: "🦀" },
  { id: "sql", name: "SQL", icon: "🗃️" },
];

const frameworks: Record<string, { id: string; name: string }[]> = {
  python: [
    { id: "none", name: "순수 Python" },
    { id: "fastapi", name: "FastAPI" },
    { id: "django", name: "Django" },
    { id: "flask", name: "Flask" },
  ],
  javascript: [
    { id: "none", name: "순수 JavaScript" },
    { id: "react", name: "React" },
    { id: "vue", name: "Vue.js" },
    { id: "node", name: "Node.js" },
  ],
  typescript: [
    { id: "none", name: "순수 TypeScript" },
    { id: "react", name: "React + TS" },
    { id: "nextjs", name: "Next.js" },
    { id: "nestjs", name: "NestJS" },
  ],
  java: [
    { id: "none", name: "순수 Java" },
    { id: "spring", name: "Spring Boot" },
  ],
  csharp: [
    { id: "none", name: "순수 C#" },
    { id: "aspnet", name: "ASP.NET Core" },
  ],
  go: [
    { id: "none", name: "순수 Go" },
    { id: "gin", name: "Gin" },
  ],
  rust: [
    { id: "none", name: "순수 Rust" },
    { id: "actix", name: "Actix" },
  ],
  sql: [
    { id: "none", name: "표준 SQL" },
    { id: "postgresql", name: "PostgreSQL" },
    { id: "mysql", name: "MySQL" },
  ],
};

// Basic syntax highlighting using regex
function highlightCode(code: string, language: string): string {
  // Common keywords by language
  const keywords: Record<string, string[]> = {
    python: ["def", "class", "if", "elif", "else", "for", "while", "return", "import", "from", "as", "try", "except", "finally", "with", "lambda", "yield", "async", "await", "True", "False", "None", "and", "or", "not", "in", "is", "pass", "break", "continue", "raise", "assert"],
    javascript: ["function", "const", "let", "var", "if", "else", "for", "while", "return", "import", "export", "from", "default", "class", "extends", "new", "this", "try", "catch", "finally", "async", "await", "true", "false", "null", "undefined", "throw", "typeof", "instanceof"],
    typescript: ["function", "const", "let", "var", "if", "else", "for", "while", "return", "import", "export", "from", "default", "class", "extends", "new", "this", "try", "catch", "finally", "async", "await", "true", "false", "null", "undefined", "throw", "typeof", "instanceof", "interface", "type", "enum", "implements", "private", "public", "protected", "readonly"],
    java: ["public", "private", "protected", "class", "interface", "extends", "implements", "static", "final", "void", "int", "String", "boolean", "if", "else", "for", "while", "return", "new", "this", "try", "catch", "finally", "throw", "throws", "import", "package", "true", "false", "null"],
    csharp: ["public", "private", "protected", "class", "interface", "static", "void", "int", "string", "bool", "if", "else", "for", "foreach", "while", "return", "new", "this", "try", "catch", "finally", "throw", "using", "namespace", "async", "await", "true", "false", "null", "var"],
    go: ["func", "package", "import", "if", "else", "for", "range", "return", "var", "const", "type", "struct", "interface", "defer", "go", "chan", "select", "case", "default", "break", "continue", "true", "false", "nil", "map", "make", "new"],
    rust: ["fn", "let", "mut", "const", "if", "else", "for", "while", "loop", "return", "struct", "enum", "impl", "trait", "pub", "use", "mod", "self", "Self", "match", "Some", "None", "Ok", "Err", "async", "await", "true", "false", "move"],
    sql: ["SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "AND", "OR", "NOT", "IN", "IS", "NULL", "ORDER", "BY", "GROUP", "HAVING", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "AS", "DISTINCT", "LIMIT", "OFFSET"],
  };

  const langKeywords = keywords[language] || keywords.javascript;
  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight strings (both single and double quotes)
  highlighted = highlighted.replace(
    /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
    '<span style="color: #ce9178;">$&</span>'
  );

  // Highlight comments (single line)
  highlighted = highlighted.replace(
    /(\/\/.*|#.*)/g,
    '<span style="color: #6a9955;">$&</span>'
  );

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color: #b5cea8;">$1</span>'
  );

  // Highlight keywords
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    highlighted = highlighted.replace(
      regex,
      '<span style="color: #569cd6;">$1</span>'
    );
  });

  // Highlight function calls
  highlighted = highlighted.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    '<span style="color: #dcdcaa;">$1</span>('
  );

  return highlighted;
}

export function CodeGenerator({ onPromptChange, externalPrompt }: CodeGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("python");
  const [framework, setFramework] = useState("none");
  const [includeComments, setIncludeComments] = useState(true);
  const [includeTests, setIncludeTests] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  // Handle external prompt changes (from quick templates)
  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt]);

  const handlePromptChange = useCallback((value: string) => {
    setPrompt(value);
    onPromptChange?.(value);
  }, [onPromptChange]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          language,
          framework: framework === "none" ? null : framework,
          includeComments,
          includeTests,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "코드 생성에 실패했습니다.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    if (!result) return;

    const extensions: Record<string, string> = {
      python: "py",
      javascript: "js",
      typescript: "ts",
      java: "java",
      csharp: "cs",
      go: "go",
      rust: "rs",
      sql: "sql",
    };

    const blob = new Blob([result.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated_code.${extensions[language] || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentFrameworks = frameworks[language] || [{ id: "none", name: "기본" }];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            코드 생성 요청
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="예: 사용자 인증 API 엔드포인트를 만들어 주세요. JWT 토큰을 사용하고 로그인, 로그아웃, 회원가입 기능이 필요합니다."
            style={{ minHeight: "120px", resize: "vertical" }}
          />
        </CardContent>
      </Card>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-500" />
              프로그래밍 언어
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setLanguage(lang.id);
                    setFramework("none");
                  }}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "8px",
                    border: `2px solid ${language === lang.id ? "var(--color-primary)" : "var(--border-color)"}`,
                    background: language === lang.id ? "rgba(124, 58, 237, 0.1)" : "transparent",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 150ms ease",
                  }}
                >
                  <div style={{ fontSize: "20px" }}>{lang.icon}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {lang.name}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Framework Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCode className="w-4 h-4 text-green-500" />
              프레임워크
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {currentFrameworks.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setFramework(fw.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: `2px solid ${framework === fw.id ? "var(--color-primary)" : "var(--border-color)"}`,
                    background: framework === fw.id ? "rgba(124, 58, 237, 0.1)" : "transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    transition: "all 150ms ease",
                  }}
                >
                  {fw.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-500" />
            추가 옵션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", gap: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
                style={{ width: "18px", height: "18px" }}
              />
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>주석 포함</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeTests}
                onChange={(e) => setIncludeTests(e.target.checked)}
                style={{ width: "18px", height: "18px" }}
              />
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>테스트 코드 포함</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || loading}
        style={{ width: "100%", height: "48px" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            코드 생성 중...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            AI 코드 생성
          </>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: "16px",
          background: "rgba(239, 68, 68, 0.1)",
          borderRadius: "10px",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-green-500" />
                생성된 코드
                <span style={{ 
                  fontSize: "12px", 
                  padding: "2px 8px", 
                  background: "var(--bg-tertiary)", 
                  borderRadius: "4px",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}>
                  {languages.find(l => l.id === language)?.name || language}
                </span>
              </CardTitle>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCode}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Code Block with Syntax Highlighting */}
            <pre style={{
              background: "#1e1e1e",
              color: "#d4d4d4",
              padding: "20px",
              borderRadius: "10px",
              overflow: "auto",
              fontSize: "13px",
              lineHeight: 1.6,
              maxHeight: "500px",
              fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
            }}>
              <code 
                dangerouslySetInnerHTML={{ 
                  __html: highlightCode(result.code, language) 
                }} 
              />
            </pre>

            {/* Explanation Toggle */}
            {result.explanation && (
              <div>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  {showExplanation ? "설명 숨기기" : "코드 설명 보기"}
                </button>
                {showExplanation && (
                  <div style={{
                    marginTop: "16px",
                    padding: "16px",
                    background: "var(--bg-secondary)",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    fontSize: "14px",
                    whiteSpace: "pre-wrap",
                  }}>
                    {result.explanation}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
