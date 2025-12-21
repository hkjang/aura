"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo } from "react";
import { 
  Puzzle, 
  Plus, 
  Trash2, 
  RefreshCw,
  Settings,
  Power,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PluginMenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  action?: () => void;
  parent?: string;
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  icon?: string;
  isEnabled: boolean;
  menuItems: PluginMenuItem[];
  settings?: Record<string, unknown>;
}

interface PluginRegistryContextType {
  plugins: Plugin[];
  registerPlugin: (plugin: Omit<Plugin, "isEnabled">) => void;
  unregisterPlugin: (pluginId: string) => void;
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  getMenuItems: (parentId?: string) => PluginMenuItem[];
}

const PluginRegistryContext = createContext<PluginRegistryContextType | null>(null);

const STORAGE_KEY = "aura-plugin-registry";

export function PluginRegistryProvider({ children }: { children: ReactNode }) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  
  // 초기 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPlugins(JSON.parse(saved));
      }
    } catch {
      // 무시
    }
  }, []);
  
  // 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
  }, [plugins]);
  
  const registerPlugin = useCallback((plugin: Omit<Plugin, "isEnabled">) => {
    setPlugins(prev => {
      // 이미 존재하면 업데이트
      const exists = prev.find(p => p.id === plugin.id);
      if (exists) {
        return prev.map(p => p.id === plugin.id ? { ...plugin, isEnabled: p.isEnabled } : p);
      }
      return [...prev, { ...plugin, isEnabled: true }];
    });
  }, []);
  
  const unregisterPlugin = useCallback((pluginId: string) => {
    setPlugins(prev => prev.filter(p => p.id !== pluginId));
  }, []);
  
  const enablePlugin = useCallback((pluginId: string) => {
    setPlugins(prev => prev.map(p => 
      p.id === pluginId ? { ...p, isEnabled: true } : p
    ));
  }, []);
  
  const disablePlugin = useCallback((pluginId: string) => {
    setPlugins(prev => prev.map(p => 
      p.id === pluginId ? { ...p, isEnabled: false } : p
    ));
  }, []);
  
  const getMenuItems = useCallback((parentId?: string) => {
    const enabledPlugins = plugins.filter(p => p.isEnabled);
    const items: PluginMenuItem[] = [];
    
    enabledPlugins.forEach(plugin => {
      plugin.menuItems.forEach(item => {
        if (item.parent === parentId) {
          items.push(item);
        } else if (!parentId && !item.parent) {
          items.push(item);
        }
      });
    });
    
    return items;
  }, [plugins]);
  
  return (
    <PluginRegistryContext.Provider value={{
      plugins,
      registerPlugin,
      unregisterPlugin,
      enablePlugin,
      disablePlugin,
      getMenuItems
    }}>
      {children}
    </PluginRegistryContext.Provider>
  );
}

export function usePluginRegistry() {
  const context = useContext(PluginRegistryContext);
  if (!context) {
    throw new Error("usePluginRegistry must be used within PluginRegistryProvider");
  }
  return context;
}

// 플러그인 관리 UI
export function PluginManager() {
  const { plugins, unregisterPlugin, enablePlugin, disablePlugin } = usePluginRegistry();
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  
  const selected = plugins.find(p => p.id === selectedPlugin);
  
  return (
    <div className="plugin-manager">
      <div className="manager-header">
        <h3>
          <Puzzle className="header-icon" />
          플러그인 관리
        </h3>
        <span className="plugin-count">{plugins.filter(p => p.isEnabled).length} / {plugins.length} 활성화</span>
      </div>
      
      <div className="manager-content">
        <div className="plugins-list">
          {plugins.length === 0 ? (
            <div className="empty-state">
              <Puzzle className="empty-icon" />
              <p>설치된 플러그인이 없습니다</p>
            </div>
          ) : (
            plugins.map(plugin => (
              <div
                key={plugin.id}
                className={`plugin-item ${selectedPlugin === plugin.id ? "selected" : ""} ${!plugin.isEnabled ? "disabled" : ""}`}
                onClick={() => setSelectedPlugin(plugin.id)}
              >
                <div className="plugin-icon">
                  {plugin.icon ? (
                    <span>{plugin.icon}</span>
                  ) : (
                    <Puzzle size={20} />
                  )}
                </div>
                <div className="plugin-info">
                  <span className="plugin-name">{plugin.name}</span>
                  <span className="plugin-version">v{plugin.version}</span>
                </div>
                <label className="toggle" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={plugin.isEnabled}
                    onChange={() => plugin.isEnabled ? disablePlugin(plugin.id) : enablePlugin(plugin.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))
          )}
        </div>
        
        {selected && (
          <div className="plugin-details">
            <div className="details-header">
              <div className="details-icon">
                {selected.icon ? <span>{selected.icon}</span> : <Puzzle size={24} />}
              </div>
              <div className="details-info">
                <h4>{selected.name}</h4>
                <span>v{selected.version} {selected.author && `by ${selected.author}`}</span>
              </div>
            </div>
            
            <p className="details-description">{selected.description}</p>
            
            {selected.menuItems.length > 0 && (
              <div className="menu-items-section">
                <h5>등록된 메뉴</h5>
                <ul className="menu-items-list">
                  {selected.menuItems.map(item => (
                    <li key={item.id}>
                      <ChevronRight size={12} />
                      {item.label}
                      {item.path && <span className="item-path">{item.path}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="details-actions">
              <Button variant="outline" size="sm">
                <Settings size={14} />
                설정
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  unregisterPlugin(selected.id);
                  setSelectedPlugin(null);
                }}
              >
                <Trash2 size={14} />
                제거
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .plugin-manager {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .manager-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .manager-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 15px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 18px;
          height: 18px;
          color: var(--primary, #7c3aed);
        }
        
        .plugin-count {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .manager-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 300px;
        }
        
        .plugins-list {
          border-right: 1px solid var(--border-color, #3e3e5a);
          max-height: 400px;
          overflow-y: auto;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .empty-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        
        .plugin-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .plugin-item:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .plugin-item.selected {
          background: rgba(124, 58, 237, 0.1);
          border-left: 2px solid var(--primary, #7c3aed);
        }
        
        .plugin-item.disabled {
          opacity: 0.5;
        }
        
        .plugin-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
          font-size: 18px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .plugin-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .plugin-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .plugin-version {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .toggle {
          position: relative;
          width: 36px;
          height: 20px;
        }
        
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: var(--bg-tertiary, #252536);
          border-radius: 20px;
          transition: background 0.2s ease;
        }
        
        .toggle-slider:before {
          content: "";
          position: absolute;
          width: 16px;
          height: 16px;
          left: 2px;
          bottom: 2px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }
        
        .toggle input:checked + .toggle-slider {
          background: var(--primary, #7c3aed);
        }
        
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(16px);
        }
        
        .plugin-details {
          padding: 16px;
        }
        
        .details-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        
        .details-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 12px;
          font-size: 24px;
          color: var(--primary, #7c3aed);
        }
        
        .details-info h4 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .details-info span {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .details-description {
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .menu-items-section h5 {
          margin: 0 0 8px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .menu-items-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px;
        }
        
        .menu-items-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .item-path {
          margin-left: auto;
          font-size: 10px;
          font-family: monospace;
          color: var(--text-muted, #6e6e7e);
        }
        
        .details-actions {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

export default PluginManager;
