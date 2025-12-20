"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "./header.module.css";
import { Menu, Bell } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { UserNav } from "./user-nav";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button variant="ghost" size="icon" className={styles.menuBtn} onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <Breadcrumb />
      </div>

      <div className={styles.right}>
        <ThemeToggle />
        <Button 
          variant="ghost" 
          size="icon" 
          title="알림"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell className="w-5 h-5" />
        </Button>
        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', margin: '0 8px' }} />
        <UserNav />
      </div>
    </header>
  );
}
