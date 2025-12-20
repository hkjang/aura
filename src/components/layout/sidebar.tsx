"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import styles from "./sidebar.module.css";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Files, 
  Settings, 
  Bot,
  Users,
  Activity,
  ShieldAlert,
  Scale,
  DollarSign,
  Shield,
  Rocket,
  Brain,
  Puzzle,
  CloudOff,
  HeartPulse,
  Sparkles,
  Star,
  ChevronDown,
  ChevronRight,
  Search
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

interface NavGroup {
  group: string;
  purpose: "use" | "manage" | "analyze" | "admin";
  items: NavItem[];
  defaultExpanded?: boolean;
}

const FAVORITES_KEY = "aura-sidebar-favorites";

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "AI 사용": true,
    "관리": true,
    "분석": true,
    "시스템": false,
  });

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load favorites:", e);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (e) {
      console.error("Failed to save favorites:", e);
    }
  };

  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favorites.includes(href)) {
      saveFavorites(favorites.filter(f => f !== href));
    } else {
      saveFavorites([...favorites, href]);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Purpose-based menu structure (AI 사용, 관리, 분석 분리)
  const navItems: NavGroup[] = [
    {
      group: "AI 사용",
      purpose: "use",
      defaultExpanded: true,
      items: [
        { label: "채팅", href: "/dashboard/chat", icon: MessageSquare, description: "AI와 대화" },
        { label: "모델 비교", href: "/dashboard/compare", icon: Scale, description: "모델 비교" },
        { label: "에이전트", href: "/dashboard/agents", icon: Bot, description: "AI 에이전트" },
        { label: "프롬프트", href: "/dashboard/prompts", icon: Sparkles, description: "프롬프트 관리" },
      ]
    },
    {
      group: "관리",
      purpose: "manage",
      defaultExpanded: true,
      items: [
        { label: "지식 베이스", href: "/dashboard/knowledge", icon: Brain, description: "지식 베이스" },
        { label: "문서", href: "/dashboard/documents", icon: Files, description: "문서 관리" },
        { label: "플러그인", href: "/dashboard/plugins", icon: Puzzle, description: "플러그인" },
        { label: "거버넌스", href: "/dashboard/governance", icon: Shield, description: "거버넌스" },
      ]
    },
    {
      group: "분석",
      purpose: "analyze",
      defaultExpanded: true,
      items: [
        { label: "대시보드", href: "/dashboard", icon: LayoutDashboard, description: "대시보드" },
        { label: "품질", href: "/dashboard/quality", icon: Sparkles, description: "품질 분석" },
        { label: "비용", href: "/dashboard/cost", icon: DollarSign, description: "비용 분석" },
        { label: "MLOps", href: "/dashboard/mlops", icon: Rocket, description: "ML 운영" },
      ]
    },
    {
      group: "시스템",
      purpose: "admin",
      defaultExpanded: false,
      items: [
        { label: "SRE", href: "/dashboard/sre", icon: HeartPulse, description: "시스템 상태" },
        { label: "오프라인", href: "/dashboard/offline", icon: CloudOff, description: "오프라인 모드" },
        { label: "사용자", href: "/dashboard/users", icon: Users, description: "사용자 관리" },
        { label: "설정", href: "/dashboard/settings", icon: Settings, description: "설정" },
        { label: "로그", href: "/dashboard/logs", icon: Activity, description: "로그" },
        { label: "감사", href: "/dashboard/audit", icon: ShieldAlert, description: "감사" },
      ]
    }
  ];

  // Get all items for favorites lookup
  const allItems = navItems.flatMap(g => g.items);
  const favoriteItems = favorites.map(href => allItems.find(i => i.href === href)).filter(Boolean) as NavItem[];

  return (
    <aside className={cn(styles.sidebar, mobileOpen && styles.mobileOpen)}>
      {/* Logo Section */}
      <Link 
        href="/dashboard" 
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 20px',
          textDecoration: 'none',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
        }}>
          <span style={{ fontSize: '16px', color: 'white' }}>✦</span>
        </div>
        <div>
          <div style={{ 
            fontSize: '15px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            Aura Portal
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--text-tertiary)',
            fontWeight: 500
          }}>
            Enterprise AI
          </div>
        </div>
      </Link>

      {/* Search Button */}
      <div style={{ padding: '12px 12px 0' }}>
        <button 
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            window.dispatchEvent(event);
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            fontSize: '13px',
            color: 'var(--text-tertiary)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
        >
          <Search style={{ width: '15px', height: '15px' }} />
          <span style={{ flex: 1, textAlign: 'left' }}>검색...</span>
          <kbd style={{ 
            fontSize: '11px', 
            padding: '3px 6px',
            background: 'var(--bg-primary)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            fontFamily: 'inherit',
            fontWeight: 500
          }}>⌘K</kbd>
        </button>
      </div>
      
      <nav className={styles.nav}>
        {/* Favorites Section */}
        {favoriteItems.length > 0 && (
          <div className={styles.navGroup}>
            <div className={cn(styles.groupLabel, "flex items-center gap-1")}>
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              즐겨찾기
            </div>
            {favoriteItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={`fav-${item.href}`}
                  href={item.href} 
                  className={cn(styles.link, isActive && styles.active)}
                  onClick={() => setMobileOpen?.(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Navigation Groups */}
        {navItems.map((group) => {
          const isExpanded = expandedGroups[group.group] ?? group.defaultExpanded ?? true;
          return (
            <div key={group.group} className={styles.navGroup}>
              <button 
                onClick={() => toggleGroup(group.group)}
                className={cn(styles.groupLabel, "w-full flex items-center justify-between cursor-pointer hover:text-foreground transition-colors")}
              >
                <span>{group.group}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              {isExpanded && group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isFav = favorites.includes(item.href);
                return (
                  <div key={item.href} className="relative group">
                    <Link 
                      href={item.href} 
                      className={cn(styles.link, isActive && styles.active)}
                      onClick={() => setMobileOpen?.(false)}
                      title={item.description}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isFav && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className="text-xs text-slate-500">v0.2.0 - Enhanced UX</div>
      </div>
    </aside>
  );
}
