"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'var(--bg-tertiary)'
      }} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title="테마 변경"
      style={{
        position: 'relative',
        width: '60px',
        height: '32px',
        borderRadius: '16px',
        background: isDark 
          ? 'linear-gradient(135deg, #1e293b, #334155)' 
          : 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '1px solid',
        borderColor: isDark ? 'var(--border-color)' : '#fcd34d',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 200ms ease',
        boxShadow: isDark 
          ? 'inset 0 1px 2px rgba(0,0,0,0.3)' 
          : 'inset 0 1px 2px rgba(0,0,0,0.1)'
      }}
    >
      {/* Toggle circle */}
      <div style={{
        position: 'absolute',
        top: '3px',
        left: isDark ? '30px' : '3px',
        width: '24px',
        height: '24px',
        borderRadius: '12px',
        background: isDark ? '#475569' : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 200ms ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {isDark ? (
          <Moon style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
        ) : (
          <Sun style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
        )}
      </div>
    </button>
  );
}
