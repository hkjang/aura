"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "./header.module.css";
import { Menu, Bell } from "lucide-react";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button variant="ghost" size="icon" className={styles.menuBtn} onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        {/* Breadcrumb could go here */}
      </div>

      <div className={styles.right}>
        <ThemeToggle />
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </header>
  );
}
