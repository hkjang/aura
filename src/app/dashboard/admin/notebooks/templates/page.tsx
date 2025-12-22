"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Save,
  X,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  defaultScope: string;
  defaultTags: string;
  category: string | null;
  isApproved: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    defaultScope: "PERSONAL",
    category: "",
    sampleQuestions: "",
  });

  const fetchTemplates = async () => {
    try {
      setTemplates([]);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      defaultScope: "PERSONAL",
      category: "",
      sampleQuestions: "",
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/admin/notebooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </Button>
          </Link>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
              템플릿 관리
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              표준 노트북 템플릿을 관리합니다
            </p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus style={{ width: "16px", height: "16px", marginRight: "8px" }} />
          템플릿 추가
        </Button>
      </div>

      {/* Create Form */}
      {creating && (
        <Card style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>새 템플릿 만들기</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreating(false);
                resetForm();
              }}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>이름 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="템플릿 이름"
                style={{ marginTop: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>카테고리</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="예: 기술문서, 마케팅"
                style={{ marginTop: "4px" }}
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="템플릿 설명"
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "8px 12px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  resize: "vertical"
                }}
                rows={2}
              />
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>기본 범위</label>
              <select
                value={formData.defaultScope}
                onChange={(e) => setFormData({ ...formData, defaultScope: e.target.value })}
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "8px 12px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: "14px"
                }}
              >
                <option value="PERSONAL">개인</option>
                <option value="TEAM">팀</option>
                <option value="ORGANIZATION">조직</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>예시 질문 (줄바꿈으로 구분)</label>
              <textarea
                value={formData.sampleQuestions}
                onChange={(e) => setFormData({ ...formData, sampleQuestions: e.target.value })}
                placeholder={"이 문서의 핵심 내용은?\n주요 결론을 요약해줘"}
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "8px 12px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  resize: "vertical"
                }}
                rows={3}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button disabled={!formData.name}>
              <Save style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              저장
            </Button>
          </div>
        </Card>
      )}

      {/* Templates List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {templates.map((template) => (
          <Card key={template.id} style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
              <h3 style={{ fontWeight: 600, color: "var(--text-primary)" }}>{template.name}</h3>
              <div style={{ display: "flex", gap: "4px" }}>
                {template.isApproved ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#10b981" }}>
                    <CheckCircle style={{ width: "12px", height: "12px" }} />
                    승인됨
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#f59e0b" }}>
                    <XCircle style={{ width: "12px", height: "12px" }} />
                    대기중
                  </span>
                )}
              </div>
            </div>
            {template.description && (
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>{template.description}</p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
              <span>범위: {template.defaultScope}</span>
              {template.category && <span>분류: {template.category}</span>}
            </div>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !creating && (
        <Card style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
          <FileText style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
          <p>템플릿이 없습니다</p>
          <p style={{ fontSize: "14px", marginTop: "4px" }}>첫 템플릿을 만들어 표준화를 시작하세요</p>
          <Button style={{ marginTop: "16px" }} onClick={() => setCreating(true)}>
            <Plus style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            첫 템플릿 만들기
          </Button>
        </Card>
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
