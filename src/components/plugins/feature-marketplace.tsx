"use client";

import { useState, useMemo } from "react";
import { 
  Store, 
  Search, 
  Star,
  Download,
  TrendingUp,
  Clock,
  Filter,
  Grid,
  List,
  ExternalLink,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  rating: number;
  downloads: number;
  version: string;
  icon?: string;
  tags: string[];
  isInstalled: boolean;
  isFeatured?: boolean;
  updatedAt: Date;
}

interface FeatureMarketplaceProps {
  items: MarketplaceItem[];
  onInstall: (itemId: string) => Promise<void>;
  onUninstall: (itemId: string) => Promise<void>;
  onViewDetails: (item: MarketplaceItem) => void;
}

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "productivity", label: "생산성" },
  { value: "development", label: "개발" },
  { value: "analysis", label: "분석" },
  { value: "integration", label: "연동" },
  { value: "theme", label: "테마" }
];

export function FeatureMarketplace({
  items,
  onInstall,
  onUninstall,
  onViewDetails
}: FeatureMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "rating">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set());
  
  // 필터링 및 정렬
  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query) &&
            !item.description.toLowerCase().includes(query) &&
            !item.tags.some(t => t.toLowerCase().includes(query))) {
          return false;
        }
      }
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });
    
    // 정렬
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case "recent":
        result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }
    
    return result;
  }, [items, searchQuery, selectedCategory, sortBy]);
  
  // 추천 아이템
  const featuredItems = useMemo(() => {
    return items.filter(item => item.isFeatured).slice(0, 3);
  }, [items]);
  
  const handleInstall = async (itemId: string) => {
    setInstallingIds(prev => new Set(prev).add(itemId));
    try {
      await onInstall(itemId);
    } finally {
      setInstallingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };
  
  const formatDownloads = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  return (
    <div className="feature-marketplace">
      <div className="marketplace-header">
        <h2>
          <Store className="header-icon" />
          기능 마켓플레이스
        </h2>
        <p>AI 포털의 기능을 확장하세요</p>
      </div>
      
      {/* 추천 섹션 */}
      {featuredItems.length > 0 && (
        <div className="featured-section">
          <h3>추천 기능</h3>
          <div className="featured-grid">
            {featuredItems.map(item => (
              <div key={item.id} className="featured-card">
                <div className="featured-icon">
                  {item.icon || "⭐"}
                </div>
                <div className="featured-info">
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                  <div className="featured-stats">
                    <span><Star size={12} /> {item.rating.toFixed(1)}</span>
                    <span><Download size={12} /> {formatDownloads(item.downloads)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 검색/필터 */}
      <div className="marketplace-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="기능 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="popular">인기순</option>
            <option value="recent">최신순</option>
            <option value="rating">평점순</option>
          </select>
          
          <div className="view-toggle">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              <Grid size={16} />
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* 아이템 목록 */}
      <div className={`items-container ${viewMode}`}>
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <Store className="empty-icon" />
            <p>검색 결과가 없습니다</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isInstalling = installingIds.has(item.id);
            
            return (
              <div key={item.id} className="item-card">
                <div className="item-icon">
                  {item.icon || "📦"}
                </div>
                
                <div className="item-content">
                  <div className="item-header">
                    <h4>{item.name}</h4>
                    <span className="item-version">v{item.version}</span>
                  </div>
                  
                  <p className="item-description">{item.description}</p>
                  
                  <div className="item-meta">
                    <span className="item-author">by {item.author}</span>
                    <div className="item-stats">
                      <span><Star size={12} /> {item.rating.toFixed(1)}</span>
                      <span><Download size={12} /> {formatDownloads(item.downloads)}</span>
                    </div>
                  </div>
                  
                  <div className="item-tags">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                
                <div className="item-actions">
                  {item.isInstalled ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUninstall(item.id)}
                    >
                      <Check size={14} />
                      설치됨
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleInstall(item.id)}
                      disabled={isInstalling}
                    >
                      <Download size={14} />
                      {isInstalling ? "설치 중..." : "설치"}
                    </Button>
                  )}
                  <button className="details-btn" onClick={() => onViewDetails(item)}>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <style jsx>{`
        .feature-marketplace {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .marketplace-header {
          padding: 24px;
          text-align: center;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1));
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .marketplace-header h2 {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 0;
          font-size: 20px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 24px;
          height: 24px;
          color: var(--primary, #7c3aed);
        }
        
        .marketplace-header p {
          margin: 8px 0 0;
          font-size: 14px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .featured-section {
          padding: 16px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .featured-section h3 {
          margin: 0 0 12px;
          font-size: 14px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .featured-card {
          display: flex;
          gap: 12px;
          padding: 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .featured-card:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .featured-icon {
          font-size: 28px;
        }
        
        .featured-info h4 {
          margin: 0;
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .featured-info p {
          margin: 4px 0;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .featured-stats {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .featured-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .marketplace-toolbar {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          padding: 10px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          outline: none;
        }
        
        .filters {
          display: flex;
          gap: 8px;
        }
        
        .filters select {
          padding: 10px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }
        
        .view-toggle {
          display: flex;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .view-toggle button {
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .view-toggle button.active {
          background: var(--primary, #7c3aed);
          color: white;
        }
        
        .items-container {
          padding: 16px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .items-container.grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .items-container.list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        
        .item-card {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          transition: border-color 0.2s ease;
        }
        
        .item-card:hover {
          border-color: var(--primary, #7c3aed);
        }
        
        .item-icon {
          font-size: 32px;
          flex-shrink: 0;
        }
        
        .item-content {
          flex: 1;
          min-width: 0;
        }
        
        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .item-header h4 {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .item-version {
          font-size: 10px;
          padding: 2px 6px;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .item-description {
          margin: 6px 0;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .item-author {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .item-stats {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .item-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .item-tags {
          display: flex;
          gap: 6px;
        }
        
        .tag {
          padding: 2px 8px;
          background: var(--bg-tertiary, #252536);
          border-radius: 10px;
          font-size: 10px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .item-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        
        .details-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          border-radius: 6px;
        }
        
        .details-btn:hover {
          background: var(--bg-tertiary, #252536);
          color: var(--text-primary, #e0e0e0);
        }
      `}</style>
    </div>
  );
}

export default FeatureMarketplace;
