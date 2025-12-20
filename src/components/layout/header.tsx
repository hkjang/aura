"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "./header.module.css";
import { Menu } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { UserNav } from "./user-nav";
import { NotificationDropdown } from "./notification-dropdown";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button variant="ghost" size="icon" className={styles.menuBtn} onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <Breadcrumb />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ThemeToggle />
        <NotificationDropdown />
        <div style={{ 
          height: '24px', 
          width: '1px', 
          background: 'var(--border-color)', 
          margin: '0 4px' 
        }} />
        <UserNav />
      </div>
    </header>
  );
}
