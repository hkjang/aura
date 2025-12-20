"use client";

import { useState, useEffect } from "react";
import { 
  Brain, 
  Globe, 
  Palette, 
  Bell, 
  Save,
  Check,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface UserPreferencesData {
  defaultModel: string;
  language: string;
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    browser: boolean;
    digest: "daily" | "weekly" | "never";
  };
  chatSettings: {
    autoSave: boolean;
    streamResponse: boolean;
    showConfidence: boolean;
    showSources: boolean;
  };
}

const models = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "llama-3.1-70b", name: "Llama 3.1 70B", provider: "Local" },
];

const languages = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
];

const STORAGE_KEY = "aura-user-preferences";

export function UserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    defaultModel: "gpt-4o",
    language: "ko",
    theme: "system",
    notifications: {
      email: true,
      browser: true,
      digest: "daily",
    },
    chatSettings: {
      autoSave: true,
      streamResponse: true,
      showConfidence: true,
      showSources: true,
    },
  });
  const [saved, setSaved] = useState(false);

  // Load preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error("Failed to load preferences:", e);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save preferences:", e);
    }
  };

  const updatePreference = <K extends keyof UserPreferencesData>(
    key: K,
    value: UserPreferencesData[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Default Model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            Default AI Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => updatePreference("defaultModel", model.id)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  preferences.defaultModel === model.id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-violet-300"
                }`}
              >
                <p className="font-medium text-sm">{model.name}</p>
                <p className="text-xs text-muted-foreground">{model.provider}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Language / 언어
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => updatePreference("language", lang.code)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  preferences.language === lang.code
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-blue-300"
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map(theme => (
              <button
                key={theme}
                onClick={() => updatePreference("theme", theme)}
                className={`px-4 py-2 rounded-lg border capitalize transition-colors ${
                  preferences.theme === theme
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-500" />
            Chat Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.chatSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <button
                onClick={() => updatePreference("chatSettings", {
                  ...preferences.chatSettings,
                  [key]: !value
                })}
                className={`w-10 h-5 rounded-full transition-colors ${
                  value ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    value ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Email Notifications</span>
            <button
              onClick={() => updatePreference("notifications", {
                ...preferences.notifications,
                email: !preferences.notifications.email
              })}
              className={`w-10 h-5 rounded-full transition-colors ${
                preferences.notifications.email ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  preferences.notifications.email ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Browser Notifications</span>
            <button
              onClick={() => updatePreference("notifications", {
                ...preferences.notifications,
                browser: !preferences.notifications.browser
              })}
              className={`w-10 h-5 rounded-full transition-colors ${
                preferences.notifications.browser ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  preferences.notifications.browser ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full">
        {saved ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </>
        )}
      </Button>
    </div>
  );
}
