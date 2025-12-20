"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  MessageSquare, 
  FileText, 
  Bot, 
  Scale,
  Search,
  Filter,
  Calendar,
  Tag,
  Trash2,
  ExternalLink,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface WorkHistoryItem {
  id: string;
  type: "chat" | "document" | "comparison" | "agent";
  title: string;
  summary: string;
  timestamp: Date;
  tags: string[];
  model?: string;
}

// Mock data
const mockHistory: WorkHistoryItem[] = [
  {
    id: "1",
    type: "chat",
    title: "Code Review Analysis",
    summary: "Reviewed authentication module for security vulnerabilities",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    tags: ["code", "security"],
    model: "gpt-4o",
  },
  {
    id: "2",
    type: "document",
    title: "Q4 Report Summary",
    summary: "Generated executive summary from quarterly report",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    tags: ["summary", "report"],
    model: "claude-3.5-sonnet",
  },
  {
    id: "3",
    type: "comparison",
    title: "Model Response Comparison",
    summary: "Compared GPT-4 and Claude for creative writing task",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    tags: ["comparison", "creative"],
  },
  {
    id: "4",
    type: "agent",
    title: "Data Analysis Agent",
    summary: "Ran automated data analysis pipeline",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    tags: ["agent", "data"],
  },
];

const typeIcons = {
  chat: MessageSquare,
  document: FileText,
  comparison: Scale,
  agent: Bot,
};

const typeColors = {
  chat: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
  document: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  comparison: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  agent: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
};

export function WorkHistory() {
  const [history, setHistory] = useState<WorkHistoryItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load work history
  useEffect(() => {
    // In production, this would fetch from API
    setHistory(mockHistory);
    setLoaded(true);
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch = search === "" || 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-violet-500" />
          Work History
        </h2>
        <span className="text-sm text-muted-foreground">
          {filteredHistory.length} items
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-1">
          {["all", "chat", "document", "comparison", "agent"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 text-sm rounded-lg border capitalize transition-colors ${
                filter === type
                  ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500 text-violet-600"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-violet-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2">
        {filteredHistory.map((item) => {
          const Icon = typeIcons[item.type];
          return (
            <Card key={item.id} className="p-4 hover:border-violet-300 transition-colors group">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.summary}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.timestamp)}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {item.model && (
                      <span className="text-[10px] text-muted-foreground">
                        via {item.model}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredHistory.length === 0 && loaded && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No history found</p>
          </div>
        )}
      </div>
    </div>
  );
}
