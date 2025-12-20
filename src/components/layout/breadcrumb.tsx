"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  chat: "Chat",
  compare: "Model Compare",
  quality: "Quality",
  agents: "Agents",
  knowledge: "Knowledge",
  cost: "Cost",
  governance: "Governance",
  mlops: "MLOps",
  plugins: "Plugins",
  sre: "SRE",
  offline: "Offline",
  documents: "Documents",
  prompts: "Prompts",
  users: "Users",
  settings: "Settings",
  logs: "Logs",
  audit: "Audit",
  profile: "Profile",
  tools: "Tools",
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
      className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
    >
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {breadcrumbs.slice(1).map((item, index) => (
        <div key={item.href} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          {index === breadcrumbs.length - 2 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
