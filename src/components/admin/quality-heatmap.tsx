"use client";

import { useMemo } from "react";

interface QualityDataPoint {
  modelId: string;
  metric: string;
  value: number; // 0-100
  count: number;
}

interface QualityHeatmapProps {
  data: QualityDataPoint[];
  models: string[];
  metrics: string[];
}

const METRIC_LABELS: Record<string, string> = {
  accuracy: "정확도",
  relevance: "관련성",
  speed: "응답속도",
  satisfaction: "만족도",
  safety: "안전성"
};

function getColorForValue(value: number): string {
  // 0-40: 빨강, 40-60: 노랑, 60-80: 연두, 80-100: 초록
  if (value < 40) {
    return `rgba(239, 68, 68, ${0.3 + (value / 40) * 0.5})`; // Red
  } else if (value < 60) {
    return `rgba(245, 158, 11, ${0.3 + ((value - 40) / 20) * 0.5})`; // Yellow
  } else if (value < 80) {
    return `rgba(34, 197, 94, ${0.3 + ((value - 60) / 20) * 0.5})`; // Light green
  } else {
    return `rgba(16, 185, 129, ${0.5 + ((value - 80) / 20) * 0.5})`; // Green
  }
}

export function QualityHeatmap({ data, models, metrics }: QualityHeatmapProps) {
  // 데이터를 모델x메트릭 맵으로 변환
  const heatmapData = useMemo(() => {
    const map: Record<string, Record<string, { value: number; count: number }>> = {};
    
    models.forEach(model => {
      map[model] = {};
      metrics.forEach(metric => {
        const point = data.find(d => d.modelId === model && d.metric === metric);
        map[model][metric] = point 
          ? { value: point.value, count: point.count }
          : { value: 0, count: 0 };
      });
    });
    
    return map;
  }, [data, models, metrics]);
  
  // 모델별 평균 계산
  const modelAverages = useMemo(() => {
    const averages: Record<string, number> = {};
    models.forEach(model => {
      const values = metrics.map(m => heatmapData[model][m]?.value || 0);
      averages[model] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    return averages;
  }, [heatmapData, models, metrics]);
  
  // 메트릭별 평균 계산
  const metricAverages = useMemo(() => {
    const averages: Record<string, number> = {};
    metrics.forEach(metric => {
      const values = models.map(m => heatmapData[m][metric]?.value || 0);
      averages[metric] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    return averages;
  }, [heatmapData, models, metrics]);
  
  return (
    <div className="quality-heatmap">
      <div className="heatmap-header">
        <h3>모델별 품질 히트맵</h3>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color low"></span>
            낮음 (0-40)
          </span>
          <span className="legend-item">
            <span className="legend-color medium"></span>
            보통 (40-60)
          </span>
          <span className="legend-item">
            <span className="legend-color good"></span>
            좋음 (60-80)
          </span>
          <span className="legend-item">
            <span className="legend-color excellent"></span>
            우수 (80-100)
          </span>
        </div>
      </div>
      
      <div className="heatmap-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th className="corner-cell">모델 / 지표</th>
              {metrics.map(metric => (
                <th key={metric} className="metric-header">
                  <span className="metric-name">{METRIC_LABELS[metric] || metric}</span>
                  <span className="metric-avg">{metricAverages[metric].toFixed(1)}</span>
                </th>
              ))}
              <th className="avg-header">평균</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model}>
                <td className="model-cell">{model}</td>
                {metrics.map(metric => {
                  const cell = heatmapData[model][metric];
                  return (
                    <td
                      key={metric}
                      className="value-cell"
                      style={{ background: getColorForValue(cell.value) }}
                    >
                      <span className="cell-value">{cell.value.toFixed(0)}</span>
                      {cell.count > 0 && (
                        <span className="cell-count">n={cell.count}</span>
                      )}
                    </td>
                  );
                })}
                <td
                  className="avg-cell"
                  style={{ background: getColorForValue(modelAverages[model]) }}
                >
                  {modelAverages[model].toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="heatmap-footer">
        <p>* 값은 0-100 척도로 표시됩니다. 높을수록 좋습니다.</p>
      </div>
      
      <style jsx>{`
        .quality-heatmap {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .heatmap-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .heatmap-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .legend {
          display: flex;
          gap: 16px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        
        .legend-color.low {
          background: rgba(239, 68, 68, 0.6);
        }
        
        .legend-color.medium {
          background: rgba(245, 158, 11, 0.6);
        }
        
        .legend-color.good {
          background: rgba(34, 197, 94, 0.6);
        }
        
        .legend-color.excellent {
          background: rgba(16, 185, 129, 0.8);
        }
        
        .heatmap-container {
          padding: 20px;
          overflow-x: auto;
        }
        
        .heatmap-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .heatmap-table th,
        .heatmap-table td {
          padding: 12px 16px;
          text-align: center;
          border: 1px solid var(--border-color, #3e3e5a);
        }
        
        .corner-cell {
          background: var(--bg-tertiary, #252536);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted, #6e6e7e);
          text-align: left !important;
        }
        
        .metric-header {
          background: var(--bg-secondary, #1e1e2e);
          min-width: 100px;
        }
        
        .metric-name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .metric-avg {
          display: block;
          font-size: 11px;
          font-weight: normal;
          color: var(--text-muted, #6e6e7e);
          margin-top: 4px;
        }
        
        .avg-header {
          background: var(--bg-tertiary, #252536);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
          min-width: 80px;
        }
        
        .model-cell {
          background: var(--bg-secondary, #1e1e2e);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
          text-align: left !important;
          white-space: nowrap;
        }
        
        .value-cell {
          position: relative;
          transition: all 0.2s ease;
        }
        
        .value-cell:hover {
          transform: scale(1.05);
          z-index: 1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .cell-value {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .cell-count {
          display: block;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 2px;
        }
        
        .avg-cell {
          font-size: 14px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .heatmap-footer {
          padding: 12px 20px;
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
        
        .heatmap-footer p {
          margin: 0;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
      `}</style>
    </div>
  );
}

export default QualityHeatmap;
