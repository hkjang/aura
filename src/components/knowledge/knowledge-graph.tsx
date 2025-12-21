"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Maximize2,
  Filter,
  Circle
} from "lucide-react";

interface GraphNode {
  id: string;
  type: "question" | "response" | "note" | "topic";
  label: string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "follows" | "references" | "relates";
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
}

const NODE_COLORS: Record<GraphNode["type"], string> = {
  question: "#3b82f6",
  response: "#10b981",
  note: "#f59e0b",
  topic: "#8b5cf6"
};

const NODE_SIZES: Record<GraphNode["type"], number> = {
  question: 12,
  response: 14,
  note: 10,
  topic: 16
};

// 간단한 force-directed layout 시뮬레이션
function layoutNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const positioned = nodes.map((node, i) => ({
    ...node,
    x: node.x ?? 200 + Math.cos(i * 2.4) * 150,
    y: node.y ?? 200 + Math.sin(i * 2.4) * 150
  }));
  
  // 간단한 반복 시뮬레이션
  for (let iter = 0; iter < 50; iter++) {
    // 노드간 반발력
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const dx = positioned[j].x! - positioned[i].x!;
        const dy = positioned[j].y! - positioned[i].y!;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 1000 / (dist * dist);
        
        positioned[i].x! -= (dx / dist) * force * 0.1;
        positioned[i].y! -= (dy / dist) * force * 0.1;
        positioned[j].x! += (dx / dist) * force * 0.1;
        positioned[j].y! += (dy / dist) * force * 0.1;
      }
    }
    
    // 엣지 인력
    edges.forEach(edge => {
      const source = positioned.find(n => n.id === edge.source);
      const target = positioned.find(n => n.id === edge.target);
      if (!source || !target) return;
      
      const dx = target.x! - source.x!;
      const dy = target.y! - source.y!;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - 100) * 0.01;
      
      source.x! += (dx / dist) * force;
      source.y! += (dy / dist) * force;
      target.x! -= (dx / dist) * force;
      target.y! -= (dy / dist) * force;
    });
    
    // 중심으로 약간 끌어당김
    positioned.forEach(node => {
      node.x = 200 + (node.x! - 200) * 0.99;
      node.y = 200 + (node.y! - 200) * 0.99;
    });
  }
  
  return positioned;
}

export function KnowledgeGraph({
  nodes,
  edges,
  onNodeClick,
  onNodeHover
}: KnowledgeGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<GraphNode["type"] | "all">("all");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 레이아웃된 노드
  const positionedNodes = useMemo(() => layoutNodes(nodes, edges), [nodes, edges]);
  
  // 필터링
  const filteredNodes = useMemo(() => {
    if (selectedType === "all") return positionedNodes;
    return positionedNodes.filter(n => n.type === selectedType);
  }, [positionedNodes, selectedType]);
  
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = useMemo(() => {
    return edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
  }, [edges, filteredNodeIds]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId);
    onNodeHover?.(nodeId);
  }, [onNodeHover]);
  
  // 연결된 노드 하이라이트
  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>([hoveredNode]);
    edges.forEach(e => {
      if (e.source === hoveredNode) connected.add(e.target);
      if (e.target === hoveredNode) connected.add(e.source);
    });
    return connected;
  }, [hoveredNode, edges]);
  
  return (
    <div className="knowledge-graph">
      <div className="graph-header">
        <h3>
          <Network className="header-icon" />
          지식 그래프
        </h3>
        <div className="graph-controls">
          <div className="type-filter">
            <Filter size={14} />
            <select 
              value={selectedType} 
              onChange={e => setSelectedType(e.target.value as GraphNode["type"] | "all")}
            >
              <option value="all">전체</option>
              <option value="question">질문</option>
              <option value="response">응답</option>
              <option value="note">노트</option>
              <option value="topic">주제</option>
            </select>
          </div>
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
            <ZoomIn size={18} />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
            <ZoomOut size={18} />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
            <Maximize2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="graph-legend">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <span key={type} className="legend-item">
            <Circle size={10} fill={color} stroke={color} />
            {type === "question" ? "질문" : type === "response" ? "응답" : type === "note" ? "노트" : "주제"}
          </span>
        ))}
      </div>
      
      <div 
        className="graph-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 400 400"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            cursor: isDragging ? "grabbing" : "grab"
          }}
        >
          {/* 엣지 */}
          <g className="edges">
            {filteredEdges.map((edge, i) => {
              const source = positionedNodes.find(n => n.id === edge.source);
              const target = positionedNodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              const isHighlighted = hoveredNode && 
                (edge.source === hoveredNode || edge.target === hoveredNode);
              
              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className={`edge ${edge.type} ${isHighlighted ? "highlighted" : ""}`}
                />
              );
            })}
          </g>
          
          {/* 노드 */}
          <g className="nodes">
            {filteredNodes.map(node => {
              const isHovered = hoveredNode === node.id;
              const isConnected = connectedNodes.has(node.id);
              const opacity = hoveredNode ? (isConnected ? 1 : 0.3) : 1;
              
              return (
                <g
                  key={node.id}
                  className="node-group"
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => onNodeClick?.(node.id)}
                  onMouseEnter={() => handleNodeHover(node.id)}
                  onMouseLeave={() => handleNodeHover(null)}
                  style={{ opacity }}
                >
                  <circle
                    r={NODE_SIZES[node.type] * (isHovered ? 1.3 : 1)}
                    fill={NODE_COLORS[node.type]}
                    className={`node ${isHovered ? "hovered" : ""}`}
                  />
                  <text
                    dy={NODE_SIZES[node.type] + 12}
                    textAnchor="middle"
                    className="node-label"
                  >
                    {node.label.length > 15 ? node.label.slice(0, 15) + "..." : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      
      <div className="graph-stats">
        <span>{filteredNodes.length} 노드</span>
        <span>·</span>
        <span>{filteredEdges.length} 연결</span>
      </div>
      
      <style jsx>{`
        .knowledge-graph {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .graph-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .graph-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 18px;
          height: 18px;
          color: var(--primary, #7c3aed);
        }
        
        .graph-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .type-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: var(--bg-tertiary, #252536);
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .type-filter select {
          background: transparent;
          border: none;
          color: var(--text-secondary, #a0a0b0);
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        
        .graph-controls button {
          padding: 6px;
          background: var(--bg-tertiary, #252536);
          border: none;
          border-radius: 6px;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .graph-controls button:hover {
          color: var(--text-primary, #e0e0e0);
        }
        
        .graph-legend {
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 8px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .graph-viewport {
          height: 300px;
          overflow: hidden;
        }
        
        .graph-viewport svg {
          width: 100%;
          height: 100%;
          transition: transform 0.1s ease;
        }
        
        .edge {
          stroke: var(--border-color, #3e3e5a);
          stroke-width: 1;
          stroke-opacity: 0.6;
        }
        
        .edge.highlighted {
          stroke: var(--primary, #7c3aed);
          stroke-width: 2;
          stroke-opacity: 1;
        }
        
        .edge.follows {
          stroke-dasharray: none;
        }
        
        .edge.references {
          stroke-dasharray: 4 2;
        }
        
        .edge.relates {
          stroke-dasharray: 2 2;
        }
        
        .node-group {
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        
        .node {
          transition: r 0.2s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        .node.hovered {
          filter: drop-shadow(0 0 8px currentColor);
        }
        
        .node-label {
          font-size: 9px;
          fill: var(--text-secondary, #a0a0b0);
          pointer-events: none;
        }
        
        .graph-stats {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 8px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
          background: var(--bg-secondary, #1e1e2e);
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
      `}</style>
    </div>
  );
}

export default KnowledgeGraph;
