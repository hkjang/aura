"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  Zap, 
  Clock, 
  DollarSign, 
  Brain,
  Sparkles,
  Eye,
  Info
} from "lucide-react";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: "fast" | "medium" | "slow";
  cost: "low" | "medium" | "high";
  capabilities: string[];
  contextWindow: number;
  recommended?: boolean;
}

const models: ModelInfo[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Most capable model with vision and fast inference",
    speed: "fast",
    cost: "high",
    capabilities: ["text", "vision", "code", "reasoning"],
    contextWindow: 128000,
    recommended: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective for simple tasks",
    speed: "fast",
    cost: "low",
    capabilities: ["text", "vision", "code"],
    contextWindow: 128000,
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Excellent reasoning and long context",
    speed: "medium",
    cost: "medium",
    capabilities: ["text", "vision", "code", "reasoning"],
    contextWindow: 200000,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast multimodal model",
    speed: "fast",
    cost: "low",
    capabilities: ["text", "vision", "code"],
    contextWindow: 1000000,
  },
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    provider: "vLLM (Local)",
    description: "Open source, on-premise deployment",
    speed: "medium",
    cost: "low",
    capabilities: ["text", "code"],
    contextWindow: 128000,
  },
];

const speedColors = {
  fast: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  slow: "text-red-600 bg-red-50",
};

const costColors = {
  low: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
};

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModelId, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelInfo | null>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <Brain className="w-4 h-4 text-violet-500" />
        <span className="font-medium">{selectedModel.name}</span>
        <span className="text-xs text-muted-foreground">{selectedModel.provider}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 flex gap-2">
            {/* Model List */}
            <div className="w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold">Select Model</h3>
                <p className="text-xs text-muted-foreground">Choose the AI model for your query</p>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHoveredModel(model)}
                    onMouseLeave={() => setHoveredModel(null)}
                    className={`w-full px-3 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                      selectedModel.id === model.id ? "bg-violet-50 dark:bg-violet-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {model.recommended && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{model.provider}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${speedColors[model.speed]}`}>
                          <Zap className="w-3 h-3 inline mr-0.5" />
                          {model.speed}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${costColors[model.cost]}`}>
                          <DollarSign className="w-3 h-3 inline" />
                          {model.cost}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Details Tooltip */}
            {hoveredModel && (
              <div className="w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-in slide-in-from-left-2 duration-150">
                <h4 className="font-semibold mb-2">{hoveredModel.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{hoveredModel.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Speed
                    </span>
                    <span className={`px-2 py-0.5 rounded ${speedColors[hoveredModel.speed]}`}>
                      {hoveredModel.speed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Cost
                    </span>
                    <span className={`px-2 py-0.5 rounded ${costColors[hoveredModel.cost]}`}>
                      {hoveredModel.cost}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Context
                    </span>
                    <span>{(hoveredModel.contextWindow / 1000).toFixed(0)}K tokens</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs text-muted-foreground">Capabilities</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hoveredModel.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
