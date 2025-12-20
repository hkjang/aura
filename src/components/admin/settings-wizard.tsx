"use client";

import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Save,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: WizardField[];
}

interface WizardField {
  id: string;
  label: string;
  type: "text" | "select" | "toggle" | "number";
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}

interface SettingsWizardProps {
  title: string;
  steps: WizardStep[];
  onComplete: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export function SettingsWizard({ title, steps, onComplete, onCancel }: SettingsWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    step.fields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (isLastStep) {
        onComplete(formData);
      } else {
        setCurrentStep((s) => s + 1);
      }
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1);
    }
  };

  const updateField = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx < currentStep
                    ? "bg-green-100 text-green-600"
                    : idx === currentStep
                    ? "bg-violet-100 text-violet-600"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                }`}
              >
                {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${
                    idx < currentStep ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <h3 className="text-lg font-medium mb-1">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{step.description}</p>

        <div className="space-y-4">
          {step.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === "text" && (
                <Input
                  placeholder={field.placeholder}
                  value={formData[field.id] || ""}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  className={errors[field.id] ? "border-red-500" : ""}
                />
              )}
              
              {field.type === "number" && (
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  value={formData[field.id] || ""}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  className={errors[field.id] ? "border-red-500" : ""}
                />
              )}
              
              {field.type === "select" && (
                <select
                  value={formData[field.id] || ""}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-transparent ${
                    errors[field.id] ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              
              {field.type === "toggle" && (
                <button
                  onClick={() => updateField(field.id, !formData[field.id])}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData[field.id] ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      formData[field.id] ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              )}
              
              {errors[field.id] && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors[field.id]}
                </p>
              )}
              
              {field.helpText && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <Button variant="outline" onClick={isFirstStep ? onCancel : handleBack}>
          {isFirstStep ? "Cancel" : (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </>
          )}
        </Button>
        
        <Button onClick={handleNext}>
          {isLastStep ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Complete Setup
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Example usage configuration
export const modelSetupSteps: WizardStep[] = [
  {
    id: "basic",
    title: "Basic Configuration",
    description: "Set up the fundamental settings for your AI model.",
    fields: [
      { id: "modelName", label: "Model Name", type: "text", required: true, placeholder: "e.g., Production GPT-4" },
      { id: "provider", label: "Provider", type: "select", required: true, options: [
        { label: "OpenAI", value: "openai" },
        { label: "Anthropic", value: "anthropic" },
        { label: "Google", value: "google" },
        { label: "vLLM (Local)", value: "vllm" },
      ]},
    ],
  },
  {
    id: "limits",
    title: "Usage Limits",
    description: "Define usage limits and quotas for this model.",
    fields: [
      { id: "maxTokens", label: "Max Tokens per Request", type: "number", placeholder: "4096" },
      { id: "rateLimit", label: "Rate Limit (req/min)", type: "number", placeholder: "60" },
      { id: "enableCaching", label: "Enable Response Caching", type: "toggle", helpText: "Cache identical requests to reduce costs" },
    ],
  },
  {
    id: "access",
    title: "Access Control",
    description: "Configure who can access this model.",
    fields: [
      { id: "accessLevel", label: "Access Level", type: "select", required: true, options: [
        { label: "All Users", value: "all" },
        { label: "Admins Only", value: "admin" },
        { label: "Specific Roles", value: "roles" },
      ]},
      { id: "requireApproval", label: "Require Approval for Access", type: "toggle" },
    ],
  },
];
