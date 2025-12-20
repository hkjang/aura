"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Command, 
  LayoutDashboard, 
  MessageSquare, 
  Scale, 
  Bot,
  Brain,
  DollarSign,
  Shield,
  Rocket,
  Puzzle,
  HeartPulse,
  CloudOff,
  Files,
  Users,
  Settings,
  Activity,
  ShieldAlert,
  Sparkles,
  FileText,
  ArrowRight,
  Clock
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  category: string;
  keywords?: string[];
}

const commandItems: CommandItem[] = [
  // Navigation
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, category: "Navigation" },
  { id: "chat", label: "New Chat", href: "/dashboard/chat", icon: MessageSquare, category: "Navigation", keywords: ["conversation", "message"] },
  { id: "compare", label: "Model Compare", href: "/dashboard/compare", icon: Scale, category: "Navigation", keywords: ["comparison", "benchmark"] },
  { id: "quality", label: "Quality", href: "/dashboard/quality", icon: Sparkles, category: "Navigation" },
  { id: "agents", label: "Agents", href: "/dashboard/agents", icon: Bot, category: "Navigation" },
  { id: "knowledge", label: "Knowledge Base", href: "/dashboard/knowledge", icon: Brain, category: "Navigation", keywords: ["rag", "documents"] },
  
  // Enterprise
  { id: "cost", label: "Cost Management", href: "/dashboard/cost", icon: DollarSign, category: "Enterprise", keywords: ["billing", "usage"] },
  { id: "governance", label: "Governance", href: "/dashboard/governance", icon: Shield, category: "Enterprise", keywords: ["policy", "compliance"] },
  { id: "mlops", label: "MLOps", href: "/dashboard/mlops", icon: Rocket, category: "Enterprise", keywords: ["deployment", "models"] },
  { id: "plugins", label: "Plugins", href: "/dashboard/plugins", icon: Puzzle, category: "Enterprise", keywords: ["extensions", "integrations"] },
  
  // Operations
  { id: "sre", label: "SRE Dashboard", href: "/dashboard/sre", icon: HeartPulse, category: "Operations", keywords: ["monitoring", "health"] },
  { id: "offline", label: "Offline Mode", href: "/dashboard/offline", icon: CloudOff, category: "Operations" },
  { id: "documents", label: "Documents", href: "/dashboard/documents", icon: Files, category: "Operations", keywords: ["files", "upload"] },
  { id: "prompts", label: "Prompts", href: "/dashboard/prompts", icon: FileText, category: "Operations", keywords: ["templates"] },
  
  // Admin
  { id: "users", label: "Users", href: "/dashboard/users", icon: Users, category: "Admin", keywords: ["members", "team"] },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings, category: "Admin", keywords: ["configuration", "preferences"] },
  { id: "logs", label: "Logs", href: "/dashboard/logs", icon: Activity, category: "Admin" },
  { id: "audit", label: "Audit Trail", href: "/dashboard/audit", icon: ShieldAlert, category: "Admin", keywords: ["history", "changes"] },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aura-command-recent");
      if (saved) {
        setRecentItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recent commands:", e);
    }
  }, []);

  // Keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = query
    ? commandItems.filter((item) => {
        const searchText = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(searchText) ||
          item.category.toLowerCase().includes(searchText) ||
          item.keywords?.some((k) => k.toLowerCase().includes(searchText))
        );
      })
    : commandItems;

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flatItems = Object.values(groupedItems).flat();

  const handleSelect = useCallback((item: CommandItem) => {
    // Save to recent
    const newRecent = [item.id, ...recentItems.filter(id => id !== item.id)].slice(0, 5);
    setRecentItems(newRecent);
    localStorage.setItem("aura-command-recent", JSON.stringify(newRecent));

    router.push(item.href);
    setIsOpen(false);
    setQuery("");
  }, [router, recentItems]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter" && flatItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatItems[selectedIndex]);
    }
  }, [flatItems, selectedIndex, handleSelect]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette */}
      <div className="fixed inset-x-4 top-[20%] max-w-2xl mx-auto z-50 animate-in slide-in-from-top-4 duration-200">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, pages, or features..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">esc</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {/* Recent Items */}
            {!query && recentItems.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Recent
                </div>
                {recentItems.map((id) => {
                  const item = commandItems.find((i) => i.id === id);
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                    >
                      <Icon className="w-4 h-4 text-violet-500" />
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grouped Results */}
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {category}
                </div>
                {items.map((item, idx) => {
                  const Icon = item.icon;
                  const flatIndex = flatItems.indexOf(item);
                  const isSelected = flatIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected 
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100" 
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-violet-600" : "text-muted-foreground"}`} />
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight className={`w-4 h-4 ${isSelected ? "text-violet-600" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Command className="w-3 h-3" />
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">K</kbd>
              <span>to open</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
