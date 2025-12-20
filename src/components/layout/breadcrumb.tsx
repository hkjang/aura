"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

const pathLabels: Record<string, string> = {
  dashboard: "대시보드",
  chat: "채팅",
  compare: "모델 비교",
  quality: "품질",
  agents: "에이전트",
  knowledge: "지식 베이스",
  cost: "비용",
  governance: "거버넌스",
  mlops: "MLOps",
  plugins: "플러그인",
  sre: "SRE",
  offline: "오프라인",
  documents: "문서",
  prompts: "프롬프트",
  users: "사용자",
  settings: "설정",
  logs: "로그",
  audit: "감사",
  profile: "프로필",
  tools: "도구",
};

export function Breadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname || pathname === "/") return [];
    
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    let currentPath = "";
    for (const segment of segments) {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <Link 
        href="/dashboard" 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '6px',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          textDecoration: 'none',
          transition: 'all 150ms ease'
        }}
      >
        <Home style={{ width: '13px', height: '13px' }} />
      </Link>
      
      {breadcrumbs.slice(1).map((item, index) => {
        const isLast = index === breadcrumbs.length - 2;
        return (
          <div key={item.href} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ChevronRight style={{ 
              width: '14px', 
              height: '14px', 
              color: 'var(--text-tertiary)',
              opacity: 0.5
            }} />
            {isLast ? (
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                padding: '4px 10px',
                background: 'var(--color-primary-light)',
                borderRadius: '6px'
              }}>
                {item.label}
              </span>
            ) : (
              <Link 
                href={item.href}
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 150ms ease'
                }}
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
