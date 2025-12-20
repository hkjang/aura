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
  ShieldAlert
} from "lucide-react";
import { useTranslations } from "next-intl";

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) {
  const pathname = usePathname();

  const t = useTranslations('Sidebar');

  const navItems = [
    {
      group: "Overview",
      items: [
        { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { label: t("chat"), href: "/dashboard/chat", icon: MessageSquare },
      ]
    },
    {
      group: "Work",
      items: [
        { label: t("documents"), href: "/dashboard/documents", icon: Files },
        { label: t("prompts"), href: "/dashboard/prompts", icon: Bot },
      ]
    },
    {
      group: "Admin",
      items: [
        { label: t("users"), href: "/dashboard/users", icon: Users },
        { label: t("settings"), href: "/dashboard/settings", icon: Settings },
        { label: t("logs"), href: "/dashboard/logs", icon: Activity },
        { label: t("audit"), href: "/dashboard/audit", icon: ShieldAlert },
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
