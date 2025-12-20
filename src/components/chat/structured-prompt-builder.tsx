"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  User, 
  Target, 
  FileOutput,
  Sparkles,
  Info,
  X,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PromptStructure {
  role: string;
  conditions: string[];
  outputFormat: string;
  additionalContext: string;
}

interface StructuredPromptBuilderProps {
  onPromptGenerated: (prompt: string) => void;
  onClose: () => void;
}

const rolePresets = [
  { label: "분석가", value: "You are an expert data analyst." },
  { label: "개발자", value: "You are a senior software developer." },
  { label: "작가", value: "You are a professional content writer." },
  { label: "컨설턴트", value: "You are a business consultant." },
  { label: "연구원", value: "You are a research scientist." },
  { label: "번역가", value: "You are a professional translator." },
];

const conditionPresets = [
  "Be concise and to the point",
  "Provide step-by-step explanations",
  "Include relevant examples",
  "Cite sources when possible",
  "Use professional language",
  "Format with markdown",
  "Korean language only",
  "Include pros and cons",
];

const outputPresets = [
  { label: "마크다운", value: "Format your response in markdown with proper headings." },
  { label: "JSON", value: "Return your response as valid JSON." },
  { label: "표", value: "Present the information in a table format." },
  { label: "목록", value: "Present as a numbered or bulleted list." },
  { label: "요약", value: "Provide a brief summary of 2-3 sentences." },
  { label: "상세", value: "Provide a comprehensive, detailed explanation." },
];

export function StructuredPromptBuilder({ onPromptGenerated, onClose }: StructuredPromptBuilderProps) {
  const [structure, setStructure] = useState<PromptStructure>({
    role: "",
    conditions: [],
    outputFormat: "",
    additionalContext: "",
  });
  const [expandedSection, setExpandedSection] = useState<string | null>("role");

  const generatePrompt = () => {
    const parts: string[] = [];
    
    if (structure.role) {
      parts.push(structure.role);
    }
    
    if (structure.conditions.length > 0) {
      parts.push(`\n\nPlease follow these guidelines:\n${structure.conditions.map(c => `- ${c}`).join("\n")}`);
    }
    
    if (structure.outputFormat) {
      parts.push(`\n\n${structure.outputFormat}`);
    }
    
    if (structure.additionalContext) {
      parts.push(`\n\nAdditional context: ${structure.additionalContext}`);
    }

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

  const SectionHeader = ({ 
    id, 
    icon: Icon, 
    title, 
    subtitle 
  }: { 
    id: string; 
    icon: React.ElementType; 
    title: string; 
    subtitle: string;
  }) => (
    <button
      type="button"
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className="w-full flex items-center justify-between py-3 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <Icon className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {expandedSection === id ? (
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold">Structured Prompt Builder</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
        {/* Role Section */}
        <div className="border-b border-zinc-100 dark:border-zinc-800">
          <SectionHeader
            id="role"
            icon={User}
            title="역할 (Role)"
            subtitle="AI가 취할 역할을 정의합니다"
          />
          {expandedSection === "role" && (
            <div className="pb-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                {rolePresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setStructure({ ...structure, role: preset.value })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      structure.role === preset.value
                        ? "bg-violet-100 border-violet-500 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-violet-400"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or enter custom role..."
                value={structure.role}
                onChange={(e) => setStructure({ ...structure, role: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Conditions Section */}
        <div className="border-b border-zinc-100 dark:border-zinc-800">
          <SectionHeader
            id="conditions"
            icon={Target}
            title="조건 (Conditions)"
            subtitle="응답 시 따를 지침을 선택합니다"
          />
          {expandedSection === "conditions" && (
            <div className="pb-4">
              <div className="flex flex-wrap gap-2">
                {conditionPresets.map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleCondition(condition)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      structure.conditions.includes(condition)
                        ? "bg-violet-100 border-violet-500 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-violet-400"
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
              {structure.conditions.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {structure.conditions.length} conditions selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Output Format Section */}
        <div className="border-b border-zinc-100 dark:border-zinc-800">
          <SectionHeader
            id="output"
            icon={FileOutput}
            title="출력 형식 (Output)"
            subtitle="원하는 응답 형식을 선택합니다"
          />
          {expandedSection === "output" && (
            <div className="pb-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                {outputPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setStructure({ ...structure, outputFormat: preset.value })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      structure.outputFormat === preset.value
                        ? "bg-violet-100 border-violet-500 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-violet-400"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Context */}
        <div>
          <SectionHeader
            id="context"
            icon={Info}
            title="추가 맥락 (Context)"
            subtitle="추가 정보나 배경을 입력합니다"
          />
          {expandedSection === "context" && (
            <div className="pb-4">
              <textarea
                value={structure.additionalContext}
                onChange={(e) => setStructure({ ...structure, additionalContext: e.target.value })}
                placeholder="Enter any additional context or background information..."
                className="w-full h-24 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-zinc-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview & Actions */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* Preview */}
        {(structure.role || structure.conditions.length > 0 || structure.outputFormat) && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm">
            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
            <p className="text-xs line-clamp-3 whitespace-pre-wrap">{generatePrompt()}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleApply}
            className="flex-1 gap-2"
          >
            <Save className="w-4 h-4" />
            Apply to Chat
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
