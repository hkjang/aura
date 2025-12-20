"use client";

import { useState, useEffect, ReactNode } from "react";
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Lightbulb,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuidedStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting
  position?: "top" | "bottom" | "left" | "right";
}

interface GuidedModeProps {
  steps: GuidedStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedMode({ steps, onComplete, onSkip }: GuidedModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Find and highlight target element
  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
  }, [step.target, currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const pos = step.position || "bottom";
    const offset = 16;

    switch (pos) {
      case "top":
        return {
          top: targetRect.top - offset,
          left: targetRect.left + targetRect.width / 2,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: targetRect.bottom + offset,
          left: targetRect.left + targetRect.width / 2,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - offset,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + offset,
          transform: "translate(0, -50%)",
        };
      default:
        return {};
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60" />

      {/* Target Highlight */}
      {targetRect && (
        <div
          className="fixed z-50 border-2 border-violet-500 rounded-lg shadow-lg animate-pulse"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-sm p-4"
        style={getTooltipPosition() as any}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Lightbulb className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button onClick={onSkip} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h4 className="font-semibold mb-2">{step.title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${
                idx <= currentStep ? "bg-violet-500" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSkip}>
              Skip Tutorial
            </Button>
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Tooltip wrapper for guided mode
interface GuidedTooltipProps {
  children: ReactNode;
  content: string;
  show?: boolean;
}

export function GuidedTooltip({ children, content, show = true }: GuidedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!show) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div
        className={`
          absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2
          bg-violet-600 text-white text-xs rounded-lg shadow-lg
          opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
          pointer-events-none
        `}
      >
        <HelpCircle className="w-3 h-3 inline mr-1" />
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-violet-600" />
      </div>
    </div>
  );
}

// Example guided tour steps
export const dashboardTourSteps: GuidedStep[] = [
  {
    id: "welcome",
    title: "Welcome to Aura Portal!",
    content: "Let's take a quick tour to help you get started with the AI workspace.",
  },
  {
    id: "sidebar",
    title: "Navigation Menu",
    content: "Use the sidebar to navigate between different sections. You can pin your favorites!",
    target: "aside",
    position: "right",
  },
  {
    id: "search",
    title: "Quick Search",
    content: "Press ⌘K anytime to search for anything - pages, features, or documents.",
    target: "[data-search-trigger]",
    position: "bottom",
  },
  {
    id: "chat",
    title: "AI Chat",
    content: "Start conversations with AI here. You can upload files and choose different models.",
    target: "[data-chat-input]",
    position: "top",
  },
  {
    id: "complete",
    title: "You're all set!",
    content: "Explore the portal and feel free to use the help button (?) for more guidance.",
  },
];
