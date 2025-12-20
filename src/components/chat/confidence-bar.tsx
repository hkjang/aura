"use client";

import { AlertTriangle, CheckCircle2, HelpCircle, Info } from "lucide-react";

interface ConfidenceBarProps {
  confidence: number; // 0-1
  showLabel?: boolean;
  showWarning?: boolean;
  size?: "sm" | "md" | "lg";
}

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 0.9) return { label: "Very High", color: "bg-green-500", textColor: "text-green-600" };
  if (confidence >= 0.7) return { label: "High", color: "bg-emerald-500", textColor: "text-emerald-600" };
  if (confidence >= 0.5) return { label: "Medium", color: "bg-amber-500", textColor: "text-amber-600" };
  if (confidence >= 0.3) return { label: "Low", color: "bg-orange-500", textColor: "text-orange-600" };
  return { label: "Very Low", color: "bg-red-500", textColor: "text-red-600" };
};

export function ConfidenceBar({ 
  confidence, 
  showLabel = true, 
  showWarning = true,
  size = "md" 
}: ConfidenceBarProps) {
  const level = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);
  
  const heights = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        {showLabel && (
          <div className="flex items-center gap-1.5">
            {confidence >= 0.7 ? (
              <CheckCircle2 className={`w-3 h-3 ${level.textColor}`} />
            ) : confidence >= 0.5 ? (
              <Info className={`w-3 h-3 ${level.textColor}`} />
            ) : (
              <AlertTriangle className={`w-3 h-3 ${level.textColor}`} />
            )}
            <span className={`text-xs font-medium ${level.textColor}`}>
              {level.label} Confidence
            </span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">{percentage}%</span>
      </div>
      
      <div className={`w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden ${heights[size]}`}>
        <div 
          className={`${level.color} ${heights[size]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showWarning && confidence < 0.5 && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3 h-3" />
          This response may require verification
        </p>
      )}
    </div>
  );
}

// Detailed confidence breakdown
interface ConfidenceBreakdownProps {
  overall: number;
  sources: number;
  reasoning: number;
  factuality: number;
}

export function ConfidenceBreakdown({ overall, sources, reasoning, factuality }: ConfidenceBreakdownProps) {
  const metrics = [
    { label: "Sources", value: sources, icon: HelpCircle },
    { label: "Reasoning", value: reasoning, icon: CheckCircle2 },
    { label: "Factuality", value: factuality, icon: Info },
  ];

  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Confidence Analysis</span>
        <span className={`text-sm font-bold ${getConfidenceLevel(overall).textColor}`}>
          {Math.round(overall * 100)}%
        </span>
      </div>
      
      <ConfidenceBar confidence={overall} showLabel={false} size="lg" />
      
      <div className="grid grid-cols-3 gap-2 pt-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const level = getConfidenceLevel(metric.value);
          return (
            <div key={metric.label} className="text-center">
              <div className="flex flex-col items-center">
                <Icon className={`w-4 h-4 ${level.textColor} mb-1`} />
                <span className="text-[10px] text-muted-foreground">{metric.label}</span>
                <span className={`text-xs font-medium ${level.textColor}`}>
                  {Math.round(metric.value * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
