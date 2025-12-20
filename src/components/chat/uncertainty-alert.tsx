"use client";

import { AlertTriangle, AlertCircle, Info, X, Lightbulb } from "lucide-react";

type AlertType = "warning" | "error" | "info" | "suggestion";

interface UncertaintyAlertProps {
  type: AlertType;
  title: string;
  message: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const alertStyles: Record<AlertType, { 
  bg: string; 
  border: string; 
  icon: React.ElementType; 
  iconColor: string;
  titleColor: string;
}> = {
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    titleColor: "text-amber-700 dark:text-amber-300",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    icon: AlertCircle,
    iconColor: "text-red-500",
    titleColor: "text-red-700 dark:text-red-300",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    icon: Info,
    iconColor: "text-blue-500",
    titleColor: "text-blue-700 dark:text-blue-300",
  },
  suggestion: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-800",
    icon: Lightbulb,
    iconColor: "text-violet-500",
    titleColor: "text-violet-700 dark:text-violet-300",
  },
};

export function UncertaintyAlert({ 
  type, 
  title, 
  message, 
  onDismiss,
  action 
}: UncertaintyAlertProps) {
  const styles = alertStyles[type];
  const Icon = styles.icon;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-3 mb-3`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${styles.titleColor}`}>{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-2 text-xs font-medium ${styles.titleColor} hover:underline`}
            >
              {action.label} →
            </button>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-black/5 rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

// Common alert presets
export function LowConfidenceAlert({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <UncertaintyAlert
      type="warning"
      title="Low Confidence Response"
      message="This response is based on limited information. Please verify important details before using."
      onDismiss={onDismiss}
    />
  );
}

export function NoSourcesAlert({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <UncertaintyAlert
      type="info"
      title="No Sources Found"
      message="This response is generated without reference documents. Consider uploading relevant files for more accurate results."
      onDismiss={onDismiss}
    />
  );
}

export function OutdatedInfoAlert({ onDismiss, onRefresh }: { onDismiss?: () => void; onRefresh?: () => void }) {
  return (
    <UncertaintyAlert
      type="warning"
      title="Information May Be Outdated"
      message="The knowledge cutoff for this model may not include recent events or data."
      onDismiss={onDismiss}
      action={onRefresh ? { label: "Refresh with latest data", onClick: onRefresh } : undefined}
    />
  );
}

export function SpeculativeAlert({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <UncertaintyAlert
      type="suggestion"
      title="Speculative Content"
      message="Parts of this response contain educated guesses or hypotheses rather than confirmed facts."
      onDismiss={onDismiss}
    />
  );
}
