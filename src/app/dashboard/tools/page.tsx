"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Power, RefreshCw } from "lucide-react";

interface ToolConfig {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  config: string | null;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tools");
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const toggleTool = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/tools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });
      if (res.ok) {
        fetchTools();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bot className="w-8 h-8 text-violet-600" />
          Plugin Management
        </h1>
        <Button variant="outline" onClick={fetchTools} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        Enable or disable AI plugins and configure their settings.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <div className={`w-2 h-2 rounded-full ${tool.isEnabled ? "bg-green-500" : "bg-slate-300"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 h-10 line-clamp-2">
                {tool.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between">
                <code className="text-xs bg-muted px-2 py-1 rounded">{tool.key}</code>
                <Button 
                  size="sm" 
                  variant={tool.isEnabled ? "destructive" : "outline"}
                  onClick={() => toggleTool(tool.id, tool.isEnabled)}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {tool.isEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {tools.length === 0 && !loading && (
        <div className="text-center py-10 text-muted-foreground">
          No plugins found.
        </div>
      )}
    </div>
  );
}
