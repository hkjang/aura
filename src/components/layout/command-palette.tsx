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
  Clock,
  X
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
        onClick={() => setIsOpen(false)}
        style={{ 
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)', 
          backdropFilter: 'blur(4px)', 
          zIndex: 9999
        }}
      />
      
      {/* Palette */}
      <div style={{ 
        position: 'fixed', 
        top: '12%', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '100%', 
        maxWidth: '600px', 
        padding: '0 16px', 
        zIndex: 10000 
      }}>
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }}>
          {/* Search Input */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Search style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="페이지, 명령어 검색..."
              style={{ 
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Results */}
          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
            {/* Recent Items */}
            {!query && recentItems.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <Clock style={{ width: '12px', height: '12px' }} />
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
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 150ms ease'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
                      </div>
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.label}
                      </span>
                      <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--text-tertiary)' }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grouped Results */}
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '8px' }}>
                <div style={{ 
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {category}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const flatIndex = flatItems.indexOf(item);
                  const isSelected = flatIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 150ms ease'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 150ms ease'
                      }}>
                        <Icon style={{ 
                          width: '16px', 
                          height: '16px', 
                          color: isSelected ? 'white' : 'var(--text-secondary)' 
                        }} />
                      </div>
                      <span style={{ 
                        flex: 1, 
                        fontSize: '14px', 
                        fontWeight: isSelected ? 600 : 500, 
                        color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' 
                      }}>
                        {item.label}
                      </span>
                      <ArrowRight style={{ 
                        width: '14px', 
                        height: '14px', 
                        color: isSelected ? 'var(--color-primary)' : 'var(--text-tertiary)',
                        opacity: isSelected ? 1 : 0.5
                      }} />
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div style={{ 
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-tertiary)'
              }}>
                <Search style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>"{query}"에 대한 결과가 없습니다</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            fontSize: '12px',
            color: 'var(--text-tertiary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <kbd style={{ 
                padding: '3px 6px',
                borderRadius: '4px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 500
              }}>↑↓</kbd>
              <span>이동</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <kbd style={{ 
                padding: '3px 6px',
                borderRadius: '4px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 500
              }}>↵</kbd>
              <span>선택</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              <kbd style={{ 
                padding: '3px 6px',
                borderRadius: '4px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 500
              }}>esc</kbd>
              <span>닫기</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
