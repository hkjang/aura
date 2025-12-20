"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Sparkles
} from "lucide-react";

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) {
  const pathname = usePathname();

  const navItems = [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
      ]
    },
    {
      group: "AI Features",
      items: [
        { label: "Model Compare", href: "/dashboard/compare", icon: Scale },
        { label: "Quality", href: "/dashboard/quality", icon: Sparkles },
        { label: "Agents", href: "/dashboard/agents", icon: Bot },
        { label: "Knowledge", href: "/dashboard/knowledge", icon: Brain },
      ]
    },
    {
      group: "Enterprise",
      items: [
        { label: "Cost", href: "/dashboard/cost", icon: DollarSign },
        { label: "Governance", href: "/dashboard/governance", icon: Shield },
        { label: "MLOps", href: "/dashboard/mlops", icon: Rocket },
        { label: "Plugins", href: "/dashboard/plugins", icon: Puzzle },
      ]
    },
    {
      group: "Operations",
      items: [
        { label: "SRE", href: "/dashboard/sre", icon: HeartPulse },
        { label: "Offline", href: "/dashboard/offline", icon: CloudOff },
        { label: "Documents", href: "/dashboard/documents", icon: Files },
        { label: "Prompts", href: "/dashboard/prompts", icon: Bot },
      ]
    },
    {
      group: "Admin",
      items: [
        { label: "Users", href: "/dashboard/users", icon: Users },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
        { label: "Logs", href: "/dashboard/logs", icon: Activity },
        { label: "Audit", href: "/dashboard/audit", icon: ShieldAlert },
      ]
    }
  ];

  return (
    <aside className={cn(styles.sidebar, mobileOpen && styles.mobileOpen)}>
      <Link href="/" className={styles.logo}>
        <span className="text-violet-600 mr-2">✦</span> Aura Portal
      </Link>
      
      <nav className={styles.nav}>
        {navItems.map((group) => (
          <div key={group.group} className={styles.navGroup}>
            <div className={styles.groupLabel}>{group.group}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
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
        ))}
      </nav>

      <div className={styles.footer}>
        {/* Placeholder for user profile or simple info */}
        <div className="text-xs text-slate-500">v0.1.0 Alpha</div>
      </div>
    </aside>
  );
}
