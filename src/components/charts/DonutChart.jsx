// src/components/charts/DonutChart.jsx — SVG 도넛 차트
import { useMemo } from "react";

const COLORS = [
  "var(--color-primary)", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

/**
 * @param {{ data: Array<{label: string, value: number}>, size?: number }} props
 */
export default function DonutChart({ data = [], size = 180 }) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  const segments = useMemo(() => {
    if (total === 0) return [];
    const R = 70;
    const C = 2 * Math.PI * R;
    let offset = 0;
    return data.filter(d => d.value > 0).map((d, i) => {
      const pct = d.value / total;
      const dash = C * pct;
      const gap = C - dash;
      const seg = {
        label: d.label,
        value: d.value,
        pct: Math.round(pct * 100),
        color: COLORS[i % COLORS.length],
        dashArray: `${dash} ${gap}`,
        dashOffset: -offset,
      };
      offset += dash;
      return seg;
    });
  }, [data, total]);

  if (total === 0) {
    return (
      <div className="donut-chart donut-chart--empty" style={{ width: size, height: size }}>
        <svg viewBox="0 0 200 200" width={size} height={size}>
          <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-border)" strokeWidth="24" />
        </svg>
        <div className="donut-chart__center">데이터 없음</div>
      </div>
    );
  }

  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size}>
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="100" cy="100" r="70"
            fill="none"
            stroke={seg.color}
            strokeWidth="24"
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            transform="rotate(-90 100 100)"
            className="donut-chart__segment"
          >
            <title>{seg.label}: {seg.pct}%</title>
          </circle>
        ))}
      </svg>
      <div className="donut-chart__center">
        <div className="donut-chart__center-label">총합</div>
        <div className="donut-chart__center-value">
          {total >= 10000 ? `${Math.round(total / 10000)}만` : total.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export function DonutLegend({ data = [] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="donut-legend">
      {data.filter(d => d.value > 0).map((d, i) => (
        <div key={d.label} className="donut-legend__item">
          <span className="donut-legend__dot" style={{ background: COLORS[i % COLORS.length] }} />
          <span className="donut-legend__label">{d.label}</span>
          <span className="donut-legend__pct">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
        </div>
      ))}
    </div>
  );
}
