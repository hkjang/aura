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
  // 네비게이션
  { id: "dashboard", label: "대시보드", href: "/dashboard", icon: LayoutDashboard, category: "네비게이션" },
  { id: "chat", label: "새 채팅", href: "/dashboard/chat", icon: MessageSquare, category: "네비게이션", keywords: ["conversation", "message", "대화"] },
  { id: "compare", label: "모델 비교", href: "/dashboard/compare", icon: Scale, category: "네비게이션", keywords: ["comparison", "benchmark"] },
  { id: "quality", label: "품질", href: "/dashboard/quality", icon: Sparkles, category: "네비게이션" },
  { id: "agents", label: "에이전트", href: "/dashboard/agents", icon: Bot, category: "네비게이션" },
  { id: "knowledge", label: "지식 베이스", href: "/dashboard/knowledge", icon: Brain, category: "네비게이션", keywords: ["rag", "documents", "문서"] },
  
  // 엔터프라이즈
  { id: "cost", label: "비용 관리", href: "/dashboard/cost", icon: DollarSign, category: "엔터프라이즈", keywords: ["billing", "usage", "요금"] },
  { id: "governance", label: "거버넌스", href: "/dashboard/governance", icon: Shield, category: "엔터프라이즈", keywords: ["policy", "compliance", "정책"] },
  { id: "mlops", label: "MLOps", href: "/dashboard/mlops", icon: Rocket, category: "엔터프라이즈", keywords: ["deployment", "models", "배포"] },
  { id: "plugins", label: "플러그인", href: "/dashboard/plugins", icon: Puzzle, category: "엔터프라이즈", keywords: ["extensions", "integrations", "확장"] },
  
  // 운영
  { id: "sre", label: "SRE 대시보드", href: "/dashboard/sre", icon: HeartPulse, category: "운영", keywords: ["monitoring", "health", "모니터링"] },
  { id: "offline", label: "오프라인 모드", href: "/dashboard/offline", icon: CloudOff, category: "운영" },
  { id: "documents", label: "문서", href: "/dashboard/documents", icon: Files, category: "운영", keywords: ["files", "upload", "업로드"] },
  { id: "prompts", label: "프롬프트", href: "/dashboard/prompts", icon: FileText, category: "운영", keywords: ["templates", "템플릿"] },
  
  // 관리자
  { id: "users", label: "사용자", href: "/dashboard/users", icon: Users, category: "관리자", keywords: ["members", "team", "팀"] },
  { id: "settings", label: "설정", href: "/dashboard/settings", icon: Settings, category: "관리자", keywords: ["configuration", "preferences", "구성"] },
  { id: "logs", label: "로그", href: "/dashboard/logs", icon: Activity, category: "관리자" },
  { id: "audit", label: "감사 추적", href: "/dashboard/audit", icon: ShieldAlert, category: "관리자", keywords: ["history", "changes", "이력"] },
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
        className="fixed inset-0 animate-in fade-in duration-200"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999 }}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette */}
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '640px', padding: '0 16px', zIndex: 10000 }}>
        <div 
          className="rounded-xl shadow-2xl overflow-hidden"
          style={{ 
            background: 'var(--bg-primary)', 
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Search Input */}
          <div 
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="명령어, 페이지 또는 기능 검색..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-tertiary)' }}>esc</kbd>
              <span>닫기</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {/* Recent Items */}
            {!query && recentItems.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="w-3 h-3" />
                  최근 사용
                </div>
                {recentItems.map((id) => {
                  const item = commandItems.find((i) => i.id === id);
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                    >
                      <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      <span className="flex-1" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                      <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grouped Results */}
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                      style={{ 
                        background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      }}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                    >
                      <Icon 
                        className="w-4 h-4" 
                        style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)' }} 
                      />
                      <span className="flex-1" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)', fontWeight: isSelected ? 500 : 400 }}>{item.label}</span>
                      <ArrowRight 
                        className="w-4 h-4" 
                        style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-tertiary)' }} 
                      />
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>&quot;{query}&quot;에 대한 결과가 없습니다</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="px-4 py-2 flex items-center gap-4 text-xs"
            style={{ 
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)'
            }}
          >
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>↑↓</kbd>
              <span>이동</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>↵</kbd>
              <span>선택</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Command className="w-3 h-3" />
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>K</kbd>
              <span>열기</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
