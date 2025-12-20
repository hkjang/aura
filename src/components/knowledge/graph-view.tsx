
"use client";

import { useEffect, useRef, useState } from "react";
import { GraphData } from "@/lib/knowledge/knowledge-service";

interface GraphViewProps {
    data: GraphData;
}

export function GraphView({ data }: GraphViewProps) {
    // Simple verification visualization
    // In a real app, we would use d3-force or react-force-graph
    
    return (
        <div className="w-full h-[400px] border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center relative overflow-hidden">
            {data.nodes.length === 0 ? (
                <p className="text-muted-foreground">No data to display</p>
            ) : (
                <svg className="w-full h-full">
                    {/* Render Links */}
                    {data.links.map((link, i) => {
                         // Mock positions for MVP visualization
                         // We just place them in a circle
                         const sourceIdx = data.nodes.findIndex(n => n.id === link.source);
                         const targetIdx = data.nodes.findIndex(n => n.id === link.target);
                         if (sourceIdx === -1 || targetIdx === -1) return null;

                         const center = { x: 400, y: 200 };
                         const radius = 150;
                         const sAngle = (sourceIdx / data.nodes.length) * 2 * Math.PI;
                         const tAngle = (targetIdx / data.nodes.length) * 2 * Math.PI;

                         const x1 = center.x + radius * Math.cos(sAngle);
                         const y1 = center.y + radius * Math.sin(sAngle);
                         const x2 = center.x + radius * Math.cos(tAngle);
                         const y2 = center.y + radius * Math.sin(tAngle);

                        return (
                            <line 
                                key={i}
                                x1={x1} y1={y1} 
                                x2={x2} y2={y2} 
                                stroke="currentColor" 
                                strokeOpacity={0.2}
                            />
                        );
                    })}

                    {/* Render Nodes */}
                    {data.nodes.map((node, i) => {
                         const center = { x: 400, y: 200 };
                         const radius = 150;
                         const angle = (i / data.nodes.length) * 2 * Math.PI;
                         const x = center.x + radius * Math.cos(angle);
                         const y = center.y + radius * Math.sin(angle);

                        return (
                            <g key={node.id}>
                                <circle 
                                    cx={x} cy={y} 
                                    r={node.val} 
                                    className="fill-violet-500" 
                                />
                                <text 
                                    x={x} y={y - 10} 
                                    textAnchor="middle" 
                                    className="text-[10px] fill-zinc-600 dark:fill-zinc-400"
                                >
                                    {node.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            )}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                Verified: {data.nodes.length} nodes, {data.links.length} links
            </div>
        </div>
    );
}
