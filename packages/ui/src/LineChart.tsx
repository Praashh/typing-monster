import { useState, useRef } from "react";

interface DataPoint {
  x: number;
  y: number;
}

export interface ChartLine {
  data: DataPoint[];
  color: string;
  label: string;
  dashed?: boolean;
}

export interface ErrorDot {
  x: number;
  count: number;
}

interface LineChartProps {
  lines: ChartLine[];
  errors?: ErrorDot[];
  xLabel?: string;
  yLabel?: string;
  className?: string;
}

const PAD = { top: 20, right: 20, bottom: 36, left: 46 };
const W = 600;
const H = 220;
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

function niceStep(max: number, count: number): number {
  const rough = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  const r = rough / mag;
  if (r <= 1.5) return mag;
  if (r <= 3) return 2 * mag;
  if (r <= 7) return 5 * mag;
  return 10 * mag;
}

export function LineChart({
  lines,
  errors,
  xLabel,
  yLabel,
  className = "",
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  let xMax = 0;
  let yMax = 0;
  for (const l of lines) {
    for (const p of l.data) {
      if (p.x > xMax) xMax = p.x;
      if (p.y > yMax) yMax = p.y;
    }
  }
  if (yMax === 0) yMax = 100;

  const yStep = niceStep(yMax, 4);
  const yCeil = Math.ceil(yMax / yStep) * yStep;
  const xStep = niceStep(xMax, 6);

  const sx = (x: number) => PAD.left + (x / (xMax || 1)) * PW;
  const sy = (y: number) => PAD.top + PH - (y / yCeil) * PH;

  const yTicks: number[] = [];
  for (let v = 0; v <= yCeil; v += yStep) yTicks.push(v);

  const xTicks: number[] = [];
  for (let v = 0; v <= xMax; v += xStep) xTicks.push(v);
  if (xTicks[xTicks.length - 1] < xMax) xTicks.push(xMax);

  const refPoints = lines[0]?.data ?? [];

  function onMouseMove(e: React.MouseEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg || refPoints.length === 0) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgX = (e.clientX - ctm.e) / ctm.a;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < refPoints.length; i++) {
      const dist = Math.abs(sx(refPoints[i].x) - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setHoverIdx(closest);
  }

  const hovered = hoverIdx !== null ? refPoints[hoverIdx] : null;
  const tooltipX = hovered ? sx(hovered.x) : 0;
  const tooltipValues = hoverIdx !== null
    ? lines.map((l) => ({ label: l.label, value: l.data[hoverIdx]?.y ?? 0, color: l.color }))
    : [];
  const tooltipErr = hoverIdx !== null && errors
    ? errors.find((e) => e.x === refPoints[hoverIdx]?.x)
    : null;

  const tipW = 90;
  const tipH = 16 + tooltipValues.length * 16 + (tooltipErr ? 16 : 0);
  const tipX = tooltipX + 12 + tipW > W - PAD.right ? tooltipX - 12 - tipW : tooltipX + 12;
  const tipY = PAD.top + 4;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full ${className}`}
      aria-hidden
    >
      <defs>
        {lines.map((l, i) =>
          !l.dashed ? (
            <linearGradient key={i} id={`fill-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={l.color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={l.color} stopOpacity={0} />
            </linearGradient>
          ) : null
        )}
      </defs>

      {yTicks.map((v) => (
        <g key={`y-${v}`}>
          <line
            x1={PAD.left} y1={sy(v)} x2={W - PAD.right} y2={sy(v)}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
          <text
            x={PAD.left - 8} y={sy(v)} textAnchor="end" dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="JetBrains Mono, monospace"
          >
            {v}
          </text>
        </g>
      ))}

      {xTicks.map((v) => (
        <text
          key={`x-${v}`} x={sx(v)} y={H - PAD.bottom + 18} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="JetBrains Mono, monospace"
        >
          {v}s
        </text>
      ))}

      {lines.map((l, i) => {
        if (l.dashed || l.data.length < 2) return null;
        const path =
          l.data.map((p, j) => `${j === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ") +
          ` L${sx(l.data[l.data.length - 1].x)},${sy(0)} L${sx(l.data[0].x)},${sy(0)} Z`;
        return <path key={`area-${i}`} d={path} fill={`url(#fill-${i})`} />;
      })}

      {lines.map((l, i) => {
        if (l.data.length < 2) return null;
        const d = l.data.map((p, j) => `${j === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ");
        return (
          <path
            key={`line-${i}`} d={d} fill="none" stroke={l.color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={l.dashed ? "6 4" : undefined}
          />
        );
      })}

      {errors?.map(
        (e) =>
          e.count > 0 && (
            <circle
              key={`err-${e.x}`} cx={sx(e.x)} cy={sy(0) - 3}
              r={Math.min(2 + e.count, 5)} fill="#f43f5e" opacity={0.7}
            />
          )
      )}

      {xLabel && (
        <text
          x={W / 2} y={H - 2} textAnchor="middle"
          fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="JetBrains Mono, monospace"
        >
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          x={10} y={PAD.top + PH / 2} textAnchor="middle"
          fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="JetBrains Mono, monospace"
          transform={`rotate(-90,10,${PAD.top + PH / 2})`}
        >
          {yLabel}
        </text>
      )}

      {lines.map((l, i) => {
        const lx = PAD.left + 8 + i * 80;
        return (
          <g key={`legend-${i}`}>
            <line
              x1={lx} y1={PAD.top - 8} x2={lx + 16} y2={PAD.top - 8}
              stroke={l.color} strokeWidth="2"
              strokeDasharray={l.dashed ? "4 3" : undefined}
            />
            <text
              x={lx + 22} y={PAD.top - 8} dominantBaseline="middle"
              fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="JetBrains Mono, monospace"
            >
              {l.label}
            </text>
          </g>
        );
      })}

      {hovered && (
        <line
          x1={tooltipX} y1={PAD.top} x2={tooltipX} y2={PAD.top + PH}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3"
          style={{ pointerEvents: "none" }}
        />
      )}

      {hoverIdx !== null &&
        lines.map((l, i) => {
          const pt = l.data[hoverIdx];
          if (!pt) return null;
          return (
            <g key={`dot-${i}`} style={{ pointerEvents: "none" }}>
              <circle cx={sx(pt.x)} cy={sy(pt.y)} r="5" fill={l.color} opacity={0.25} />
              <circle cx={sx(pt.x)} cy={sy(pt.y)} r="3" fill={l.color} />
            </g>
          );
        })}

      {hovered && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={tipX} y={tipY} width={tipW} height={tipH} rx="6"
            fill="rgba(15,17,24,0.92)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
          />
          <text
            x={tipX + 10} y={tipY + 14}
            fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="JetBrains Mono, monospace"
          >
            {hovered.x}s
          </text>
          {tooltipValues.map((v, i) => (
            <text
              key={i}
              x={tipX + 10} y={tipY + 14 + (i + 1) * 16}
              fill={v.color} fontSize="10" fontFamily="JetBrains Mono, monospace"
            >
              {v.label}: {v.value}
            </text>
          ))}
          {tooltipErr && tooltipErr.count > 0 && (
            <text
              x={tipX + 10} y={tipY + 14 + (tooltipValues.length + 1) * 16}
              fill="#f43f5e" fontSize="10" fontFamily="JetBrains Mono, monospace"
            >
              err: {tooltipErr.count}
            </text>
          )}
        </g>
      )}

      <rect
        x={PAD.left} y={PAD.top} width={PW} height={PH}
        fill="transparent"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ cursor: "crosshair" }}
      />
    </svg>
  );
}
