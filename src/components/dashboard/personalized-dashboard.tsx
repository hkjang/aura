"use client";

import { useState, useEffect } from "react";
import { 
  Grip, 
  X, 
  Plus,
  Settings,
  BarChart3,
  Bot,
  FileText,
  Activity,
  Clock,
  DollarSign,
  Sparkles,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Widget {
  id: string;
  type: string;
  title: string;
  icon: React.ElementType;
  size: "small" | "medium" | "large";
  data?: any;
}

const availableWidgets: Omit<Widget, "id">[] = [
  { type: "stats", title: "Quick Stats", icon: BarChart3, size: "small" },
  { type: "recent_chats", title: "Recent Chats", icon: Bot, size: "medium" },
  { type: "documents", title: "Recent Documents", icon: FileText, size: "small" },
  { type: "activity", title: "Activity Feed", icon: Activity, size: "large" },
  { type: "usage", title: "Usage Overview", icon: Clock, size: "medium" },
  { type: "cost", title: "Cost Tracker", icon: DollarSign, size: "small" },
  { type: "recommendations", title: "AI Recommendations", icon: Sparkles, size: "medium" },
];

const STORAGE_KEY = "aura-dashboard-widgets";

interface PersonalizedDashboardProps {
  userId?: string;
}

export function PersonalizedDashboard({ userId }: PersonalizedDashboardProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // Load widgets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${userId || "default"}`);
      if (saved) {
        setWidgets(JSON.parse(saved));
      } else {
        // Default widgets
        setWidgets([
          { id: "1", type: "stats", title: "Quick Stats", icon: BarChart3, size: "small" },
          { id: "2", type: "recent_chats", title: "Recent Chats", icon: Bot, size: "medium" },
          { id: "3", type: "recommendations", title: "AI Recommendations", icon: Sparkles, size: "medium" },
        ]);
      }
    } catch (e) {
      console.error("Failed to load widgets:", e);
    }
  }, [userId]);

  // Save widgets to localStorage
  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem(`${STORAGE_KEY}-${userId || "default"}`, JSON.stringify(newWidgets));
    } catch (e) {
      console.error("Failed to save widgets:", e);
    }
  };

  const addWidget = (widgetType: Omit<Widget, "id">) => {
    const newWidget: Widget = {
      ...widgetType,
      id: `widget-${Date.now()}`,
    };
    saveWidgets([...widgets, newWidget]);
    setShowAddWidget(false);
  };

  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter((w) => w.id !== id));
  };

  const sizeClasses = {
    small: "col-span-1",
    medium: "col-span-2",
    large: "col-span-3",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm">Customize your workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "primary" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Layout className="w-4 h-4 mr-2" />
            {isEditing ? "Done" : "Customize"}
          </Button>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={() => setShowAddWidget(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          )}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-3 gap-4">
        {widgets.map((widget) => {
          const Icon = widget.icon || Settings;
          return (
            <Card
              key={widget.id}
              className={`${sizeClasses[widget.size]} ${
                isEditing ? "ring-2 ring-dashed ring-violet-300 dark:ring-violet-700" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="w-4 h-4 text-violet-500" />
                  {widget.title}
                </CardTitle>
                {isEditing && (
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-move">
                      <Grip className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <WidgetContent type={widget.type} data={widget.data} />
              </CardContent>
            </Card>
          );
        })}

        {/* Add Widget Placeholder */}
        {isEditing && widgets.length < 6 && (
          <button
            onClick={() => setShowAddWidget(true)}
            className="col-span-1 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center py-8 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors"
          >
            <Plus className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Add Widget</span>
          </button>
        )}
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Widget</h3>
              <button onClick={() => setShowAddWidget(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableWidgets.map((widget) => {
                const Icon = widget.icon;
                const isAdded = widgets.some((w) => w.type === widget.type);
                return (
                  <button
                    key={widget.type}
                    onClick={() => !isAdded && addWidget(widget)}
                    disabled={isAdded}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      isAdded
                        ? "bg-zinc-100 dark:bg-zinc-800 opacity-50 cursor-not-allowed"
                        : "hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-violet-500 mb-2" />
                    <p className="font-medium text-sm">{widget.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{widget.size}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Widget content renderer
function WidgetContent({ type, data }: { type: string; data?: any }) {
  switch (type) {
    case "stats":
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-violet-600">42</p>
            <p className="text-xs text-muted-foreground">Chats Today</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">98%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
        </div>
      );
    case "recent_chats":
      return (
        <div className="space-y-2">
          {["Code review analysis", "Document summary", "Project planning"].map((chat, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
              <Bot className="w-4 h-4 text-violet-500" />
              <span className="text-sm truncate">{chat}</span>
            </div>
          ))}
        </div>
      );
    case "recommendations":
      return (
        <div className="space-y-2">
          <p className="text-sm">Based on your usage:</p>
          <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded text-sm">
            Try the &quot;Code Analysis&quot; feature for your recent projects
          </div>
        </div>
      );
    default:
      return <p className="text-sm text-muted-foreground">Widget content</p>;
  }
}
