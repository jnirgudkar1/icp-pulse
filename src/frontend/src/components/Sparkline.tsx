import { Signal } from "../types";
import type { SignalType } from "../types";

interface SparklineProps {
  data: number[];
  signal?: SignalType;
  width?: number;
  height?: number;
  showFill?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  signal = Signal.neutral,
  width = 200,
  height = 48,
  showFill = true,
  className = "",
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * w,
    y: pad + h - ((v - min) / range) * h,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const fillPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(pad + h).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad + h).toFixed(1)} Z`;

  const strokeColor =
    signal === Signal.bull
      ? "oklch(0.70 0.22 142)"
      : signal === Signal.bear
        ? "oklch(0.55 0.22 25)"
        : "oklch(0.65 0.03 240)";

  const fillId = `spark-fill-${signal}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={`sparkline ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {showFill && <path d={fillPath} fill={`url(#${fillId})`} />}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
