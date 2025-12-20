"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className={styles.main}>
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <div className={styles.content}>
          <Breadcrumb />
          {children}
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
