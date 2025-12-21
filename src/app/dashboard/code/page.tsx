"use client";

import { useState, useCallback } from "react";
import { CodeGenerator } from "@/components/code/code-generator";
import { Code, Zap, BookOpen, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const quickTemplates = [
  { name: "REST API 엔드포인트", prompt: "RESTful API 엔드포인트를 만들어 주세요. GET, POST, PUT, DELETE 메서드를 지원하고, 적절한 HTTP 상태 코드와 에러 핸들링을 포함해주세요." },
  { name: "데이터베이스 CRUD", prompt: "데이터베이스 CRUD(Create, Read, Update, Delete) 작업을 위한 코드를 작성해주세요. 연결 풀링과 트랜잭션 처리를 포함해주세요." },
  { name: "인증/인가 로직", prompt: "JWT 기반 인증/인가 시스템을 구현해주세요. 로그인, 로그아웃, 토큰 갱신, 미들웨어 보호 기능을 포함해주세요." },
  { name: "파일 업로드 핸들러", prompt: "파일 업로드를 처리하는 핸들러를 만들어 주세요. 파일 크기 제한, 확장자 검증, 안전한 파일명 생성을 포함해주세요." },
  { name: "WebSocket 서버", prompt: "실시간 통신을 위한 WebSocket 서버를 구현해주세요. 연결 관리, 브로드캐스트, 개인 메시지 기능을 포함해주세요." },
];

export default function CodePage() {
  const [selectedPrompt, setSelectedPrompt] = useState("");

  const handleTemplateClick = useCallback((prompt: string) => {
    setSelectedPrompt(prompt);
    // Reset after setting to allow re-clicking same template
    setTimeout(() => setSelectedPrompt(""), 100);
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ 
          fontSize: "28px", 
          fontWeight: 700, 
          color: "var(--text-primary)",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <Code className="w-7 h-7 text-green-500" />
          코드 생성
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
          자연어로 설명하면 AI가 원하는 언어와 프레임워크로 코드를 생성합니다.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
        {/* Main Content */}
        <CodeGenerator externalPrompt={selectedPrompt} />

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                효과적인 프롬프트 팁
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul style={{ 
                listStyle: "disc", 
                paddingLeft: "16px", 
                fontSize: "13px", 
                color: "var(--text-secondary)",
                lineHeight: 1.8,
              }}>
                <li>구체적인 요구사항을 명시</li>
                <li>입출력 예제를 포함</li>
                <li>에러 처리 조건 설명</li>
                <li>성능 요구사항 언급</li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                빠른 시작 템플릿
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateClick(template.prompt)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    textAlign: "left",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-secondary)";
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  {template.name}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                학습 리소스
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ 
                fontSize: "13px", 
                color: "var(--text-tertiary)",
                lineHeight: 1.6,
              }}>
                생성된 코드는 학습 및 참고용입니다. 프로덕션 환경에서는 반드시 검토 후 사용하세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
