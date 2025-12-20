"use client";

import { useState } from "react";
import { 
  Clock, 
  User, 
  Settings, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface AuditEvent {
  id: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    role: string;
  };
  action: string;
  category: "settings" | "security" | "user" | "model" | "policy";
  status: "success" | "warning" | "error";
  details?: string;
  changes?: {
    field: string;
    from: string;
    to: string;
  }[];
}

// Mock data
const mockEvents: AuditEvent[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    user: { id: "u1", name: "Admin User", role: "admin" },
    action: "Updated model configuration",
    category: "model",
    status: "success",
    changes: [
      { field: "Default Model", from: "gpt-4o-mini", to: "gpt-4o" },
      { field: "Max Tokens", from: "4096", to: "8192" }
    ]
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    user: { id: "u2", name: "Security Bot", role: "system" },
    action: "Detected unusual API usage pattern",
    category: "security",
    status: "warning",
    details: "User ID u5 exceeded rate limit by 200%"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    user: { id: "u1", name: "Admin User", role: "admin" },
    action: "Created new user account",
    category: "user",
    status: "success",
    details: "Added user john.doe@company.com with role 'analyst'"
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: { id: "u3", name: "John Doe", role: "analyst" },
    action: "Failed login attempt",
    category: "security",
    status: "error",
    details: "Invalid credentials - 3rd attempt"
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    user: { id: "u1", name: "Admin User", role: "admin" },
    action: "Updated access policy",
    category: "policy",
    status: "success",
    changes: [
      { field: "Model Access", from: "All models", to: "GPT-4 only" }
    ]
  }
];

const categoryIcons = {
  settings: Settings,
  security: Shield,
  user: User,
  model: Settings,
  policy: Shield
};

const categoryColors = {
  settings: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  security: "text-red-500 bg-red-100 dark:bg-red-900/30",
  user: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
  model: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  policy: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
};

const statusIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

const statusColors = {
  success: "text-green-500",
  warning: "text-amber-500",
  error: "text-red-500"
};

export function AuditTimeline() {
  const [events, setEvents] = useState<AuditEvent[]>(mockEvents);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

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

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === "all" || event.category === filter || event.status === filter;
    const matchesSearch = search === "" || 
      event.action.toLowerCase().includes(search.toLowerCase()) ||
      event.user.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-violet-500" />
          Audit Timeline
        </h2>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-1">
          {["all", "success", "warning", "error"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-lg border capitalize transition-colors ${
                filter === status
                  ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500 text-violet-600"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-violet-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Events */}
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const CategoryIcon = categoryIcons[event.category];
            const StatusIcon = statusIcons[event.status];
            const isExpanded = expandedId === event.id;

            return (
              <div key={event.id} className="relative pl-14">
                {/* Timeline Dot */}
                <div className={`absolute left-4 w-5 h-5 rounded-full ${categoryColors[event.category]} flex items-center justify-center z-10`}>
                  <CategoryIcon className="w-3 h-3" />
                </div>

                {/* Event Card */}
                <Card className={`p-4 ${event.status === "error" ? "border-red-200 dark:border-red-900" : event.status === "warning" ? "border-amber-200 dark:border-amber-900" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={`w-4 h-4 ${statusColors[event.status]}`} />
                        <span className="font-medium">{event.action}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.user.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.timestamp)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded capitalize">
                          {event.category}
                        </span>
                      </div>
                    </div>

                    {(event.details || event.changes) && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      {event.details && (
                        <p className="text-sm text-muted-foreground">{event.details}</p>
                      )}
                      {event.changes && (
                        <div className="space-y-2 mt-2">
                          {event.changes.map((change, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{change.field}:</span>
                              <span className="text-red-500 line-through">{change.from}</span>
                              <span>→</span>
                              <span className="text-green-500">{change.to}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No events found</p>
        </div>
      )}
    </div>
  );
}
