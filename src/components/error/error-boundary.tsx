"use client";

import { Component, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home, ChevronDown, ChevronUp, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log to error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            
            <div className="flex items-center justify-center gap-3 mb-6">
              <Button onClick={this.handleReset}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
            
            {/* Error Details (collapsible) */}
            {this.state.error && (
              <div className="text-left">
                <button
                  onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <Bug className="w-3 h-3" />
                  Technical Details
                  {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                
                {this.state.showDetails && (
                  <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
                    <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-[10px] text-muted-foreground overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback Model Suggestion component
interface FallbackSuggestionProps {
  failedModel: string;
  alternatives: { id: string; name: string; reason: string }[];
  onSelectAlternative: (modelId: string) => void;
  onRetry: () => void;
}

export function FallbackSuggestion({ 
  failedModel, 
  alternatives, 
  onSelectAlternative, 
  onRetry 
}: FallbackSuggestionProps) {
  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-1">
            Model Unavailable
          </h4>
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
            {failedModel} is currently unavailable. You can try an alternative model:
          </p>
          
          <div className="space-y-2 mb-3">
            {alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSelectAlternative(alt.id)}
                className="w-full flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-amber-200 dark:border-amber-800 hover:border-amber-400 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-sm">{alt.name}</p>
                  <p className="text-xs text-muted-foreground">{alt.reason}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
              </button>
            ))}
          </div>
          
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="w-3 h-3 mr-2" />
            Retry {failedModel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Delay indicator component
interface DelayIndicatorProps {
  estimatedSeconds: number;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function DelayIndicator({ estimatedSeconds, onCancel, onRetry }: DelayIndicatorProps) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Processing Request...
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          ~{estimatedSeconds}s remaining
        </span>
      </div>
      
      <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-blue-500 rounded-full animate-pulse"
          style={{ width: "60%" }}
        />
      </div>
      
      <div className="flex items-center gap-2">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
