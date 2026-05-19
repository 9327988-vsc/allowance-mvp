// src/components/charts/LineChart.jsx — SVG 꺾은선 차트
import { useMemo } from "react";

/**
 * @param {{ data: Array<{label: string, value: number}>, height?: number, color?: string }} props
 */
export default function LineChart({ data, height = 160, color = "var(--color-primary)" }) {
  const { points, polyline, areaPath } = useMemo(() => {
    const values = data.map(d => d.value);
    const max = Math.max(...values, 1);
    const padX = 30;
    const padY = 20;
    const w = 300;
    const h = height;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    const pts = data.map((d, i) => ({
      x: padX + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2),
      y: padY + plotH - (d.value / max) * plotH,
      label: d.label,
      value: d.value,
    }));

    const line = pts.map(p => `${p.x},${p.y}`).join(" ");
    const area = pts.length > 0
      ? `M${pts[0].x},${padY + plotH} ${pts.map(p => `L${p.x},${p.y}`).join(" ")} L${pts[pts.length - 1].x},${padY + plotH} Z`
      : "";

    return { points: pts, maxVal: max, labels: data.map(d => d.label), polyline: line, areaPath: area };
  }, [data, height]);

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 300 ${height}`} preserveAspectRatio="xMidYMid meet" className="line-chart__svg">
        {/* 그리드 라인 */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = 20 + (height - 40) * (1 - pct);
          return (
            <line key={pct} x1="30" y1={y} x2="270" y2={y}
              stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4,4" />
          );
        })}

        {/* 영역 */}
        <path d={areaPath} fill={color} opacity="0.1" />

        {/* 꺾은선 */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 점 + 값 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} />
            {p.value > 0 && (
              <text
                x={p.x} y={p.y - 10}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-text-secondary)"
              >
                {p.value >= 10000 ? `${Math.round(p.value / 10000)}만` : p.value.toLocaleString("ko-KR")}
              </text>
            )}
            {/* x축 라벨 */}
            <text
              x={p.x} y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-tertiary)"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
