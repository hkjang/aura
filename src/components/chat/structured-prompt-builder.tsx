"use client";

import { useState } from "react";
import { 
  User, 
  Target, 
  FileOutput,
  Sparkles,
  X,
  Check,
  ChevronRight
} from "lucide-react";

interface PromptStructure {
  role: string;
  conditions: string[];
  outputFormat: string;
}

interface StructuredPromptBuilderProps {
  onPromptGenerated: (prompt: string) => void;
  onClose: () => void;
}

const rolePresets = [
  { label: "분석가", value: "You are an expert data analyst.", icon: "📊" },
  { label: "개발자", value: "You are a senior software developer.", icon: "💻" },
  { label: "작가", value: "You are a professional content writer.", icon: "✍️" },
  { label: "컨설턴트", value: "You are a business consultant.", icon: "💼" },
  { label: "연구원", value: "You are a research scientist.", icon: "🔬" },
  { label: "번역가", value: "You are a professional translator.", icon: "🌐" },
];

const conditionPresets = [
  { label: "간결하게", value: "Be concise and to the point" },
  { label: "단계별 설명", value: "Provide step-by-step explanations" },
  { label: "예시 포함", value: "Include relevant examples" },
  { label: "전문적 언어", value: "Use professional language" },
  { label: "마크다운 형식", value: "Format with markdown" },
  { label: "한국어만", value: "Korean language only" },
  { label: "장단점 포함", value: "Include pros and cons" },
  { label: "출처 인용", value: "Cite sources when possible" },
];

const outputPresets = [
  { label: "마크다운", value: "Format your response in markdown with proper headings.", icon: "📝" },
  { label: "JSON", value: "Return your response as valid JSON.", icon: "📋" },
  { label: "표", value: "Present the information in a table format.", icon: "📊" },
  { label: "목록", value: "Present as a numbered or bulleted list.", icon: "📃" },
  { label: "요약", value: "Provide a brief summary of 2-3 sentences.", icon: "📌" },
  { label: "상세", value: "Provide a comprehensive, detailed explanation.", icon: "📖" },
];

export function StructuredPromptBuilder({ onPromptGenerated, onClose }: StructuredPromptBuilderProps) {
  const [structure, setStructure] = useState<PromptStructure>({
    role: "",
    conditions: [],
    outputFormat: "",
  });

  const generatePrompt = () => {
    const parts: string[] = [];
    if (structure.role) parts.push(structure.role);
    if (structure.conditions.length > 0) {
      parts.push(`\n\nFollow these guidelines:\n${structure.conditions.map(c => `- ${c}`).join("\n")}`);
    }
    if (structure.outputFormat) parts.push(`\n\n${structure.outputFormat}`);
    return parts.join("");
  };

  const handleApply = () => {
    const prompt = generatePrompt();
    onPromptGenerated(prompt);
    onClose();
  };

  const toggleCondition = (condition: string) => {
    setStructure((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const hasSelection = structure.role || structure.conditions.length > 0 || structure.outputFormat;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998
        }}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '85vh',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                프롬프트 빌더
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                AI 응답 커스터마이즈
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Role Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <User style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                역할 선택
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {rolePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setStructure({ ...structure, role: structure.role === preset.value ? "" : preset.value })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px 8px',
                    background: structure.role === preset.value ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                    border: `1px solid ${structure.role === preset.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>{preset.icon}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 500,
                    color: structure.role === preset.value ? 'var(--color-primary)' : 'var(--text-primary)'
                  }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditions Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Target style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                조건 선택
              </span>
              {structure.conditions.length > 0 && (
                <span style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  borderRadius: '10px'
                }}>
                  {structure.conditions.length}개 선택
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {conditionPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => toggleCondition(preset.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: structure.conditions.includes(preset.value) ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                    color: structure.conditions.includes(preset.value) ? 'var(--color-primary)' : 'var(--text-primary)',
                    border: `1px solid ${structure.conditions.includes(preset.value) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  {structure.conditions.includes(preset.value) && <Check style={{ width: '12px', height: '12px' }} />}
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output Format Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileOutput style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                출력 형식
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {outputPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setStructure({ ...structure, outputFormat: structure.outputFormat === preset.value ? "" : preset.value })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px 8px',
                    background: structure.outputFormat === preset.value ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                    border: `1px solid ${structure.outputFormat === preset.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>{preset.icon}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 500,
                    color: structure.outputFormat === preset.value ? 'var(--color-primary)' : 'var(--text-primary)'
                  }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Preview */}
          {hasSelection && (
            <div style={{ 
              flex: 1,
              padding: '8px 12px',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {generatePrompt().slice(0, 50)}...
            </div>
          )}
          
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              onClick={handleApply}
              disabled={!hasSelection}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                background: hasSelection ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '8px',
                color: hasSelection ? 'white' : 'var(--text-tertiary)',
                cursor: hasSelection ? 'pointer' : 'not-allowed'
              }}
            >
              적용
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
