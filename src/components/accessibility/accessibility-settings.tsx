"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { 
  Keyboard, 
  Eye, 
  Type, 
  Sun, 
  Moon, 
  Monitor,
  HelpCircle,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Accessibility Context
interface AccessibilitySettings {
  fontSize: "small" | "medium" | "large" | "xlarge";
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardMode: boolean;
  guidedMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: "medium",
  highContrast: false,
  reducedMotion: false,
  keyboardMode: false,
  guidedMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aura-accessibility");
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Failed to load accessibility settings:", e);
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    const fontSizes = { small: "14px", medium: "16px", large: "18px", xlarge: "20px" };
    root.style.fontSize = fontSizes[settings.fontSize];
    
    // High contrast
    root.classList.toggle("high-contrast", settings.highContrast);
    
    // Reduced motion
    root.classList.toggle("reduce-motion", settings.reducedMotion);
    
  }, [settings]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    try {
      localStorage.setItem("aura-accessibility", JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save accessibility settings:", e);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Accessibility Settings Panel
interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilitySettings({ isOpen, onClose }: AccessibilitySettingsProps) {
  const { settings, updateSettings } = useAccessibility();

  if (!isOpen) return null;

  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
    { value: "xlarge", label: "Extra Large" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-violet-500" />
            Accessibility Settings
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Font Size */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Type className="w-4 h-4" />
              Font Size
            </label>
            <div className="flex gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => updateSettings({ fontSize: size.value })}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    settings.fontSize === size.value
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                      : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">High Contrast Mode</p>
              <p className="text-xs text-muted-foreground">Increase color contrast for better visibility</p>
            </div>
            <button
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.highContrast ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.highContrast ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Reduced Motion</p>
              <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
            </div>
            <button
              onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.reducedMotion ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.reducedMotion ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Keyboard Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Keyboard Navigation
              </p>
              <p className="text-xs text-muted-foreground">Enhanced keyboard focus indicators</p>
            </div>
            <button
              onClick={() => updateSettings({ keyboardMode: !settings.keyboardMode })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.keyboardMode ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.keyboardMode ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Guided Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Guided Mode
              </p>
              <p className="text-xs text-muted-foreground">Show helpful tooltips and tutorials</p>
            </div>
            <button
              onClick={() => updateSettings({ guidedMode: !settings.guidedMode })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.guidedMode ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.guidedMode ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
          <Button className="w-full" onClick={onClose}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

// Keyboard Shortcuts Dialog
interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["⌘", "K"], description: "Open command palette" },
    { keys: ["⌘", "/"], description: "Focus chat input" },
    { keys: ["⌘", "\\"], description: "Toggle sidebar" },
  ]},
  { category: "Chat", items: [
    { keys: ["Enter"], description: "Send message" },
    { keys: ["Shift", "Enter"], description: "New line" },
    { keys: ["⌘", "↑"], description: "Edit last message" },
  ]},
  { category: "General", items: [
    { keys: ["⌘", "S"], description: "Save current work" },
    { keys: ["⌘", "D"], description: "Toggle dark mode" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
  ]},
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-violet-500" />
            Keyboard Shortcuts
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {group.category}
              </h4>
              <div className="space-y-2">
                {group.items.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <kbd
                          key={kidx}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">?</kbd> anytime to show this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
