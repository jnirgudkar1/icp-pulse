import { scoreToLabel } from "../types";

interface SentimentGaugeProps {
  score: number; // 0–100
  size?: number;
}

const GAUGE_R = 80;
const CX = 100;
const CY = 100;
// Semicircular arc: 180° (left) → 360°/0° (right)
const START_DEG = 180;
const SWEEP_DEG = 180;
const END_DEG = START_DEG + SWEEP_DEG; // 360

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

// Needle tip, pivot at center
function needleAngle(score: number) {
  return START_DEG + (score / 100) * SWEEP_DEG;
}

export function SentimentGauge({ score, size = 200 }: SentimentGaugeProps) {
  const label = scoreToLabel(score);
  const angle = needleAngle(Math.max(0, Math.min(100, score)));
  const tip = polarToXY(CX, CY, GAUGE_R - 12, angle);
  const left = polarToXY(CX, CY, 10, angle - 90);
  const right = polarToXY(CX, CY, 10, angle + 90);

  const labelClass =
    label === "BULL"
      ? "text-primary"
      : label === "BEAR"
        ? "text-destructive"
        : "text-accent-foreground";

  // Gradient arc stops — using CSS custom properties for token consistency
  const gradStops = [
    { offset: "0%", color: "var(--destructive)" }, // bear red
    { offset: "40%", color: "var(--secondary)" }, // bear-amber
    { offset: "55%", color: "var(--accent)" }, // neutral amber
    { offset: "70%", color: "var(--chart-2)" }, // amber-green
    { offset: "100%", color: "var(--primary)" }, // bull green
  ];

  return (
    <div
      className="flex flex-col items-center gap-1"
      data-ocid="sentiment.gauge"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 115"
        width={size}
        height={size * 0.575}
        aria-label={`Sentiment gauge: ${score} — ${label}`}
        role="img"
      >
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradStops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d={arcPath(CX, CY, GAUGE_R, START_DEG, END_DEG)}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.2"
        />

        {/* Colored arc fill */}
        <path
          d={arcPath(CX, CY, GAUGE_R, START_DEG, END_DEG)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((t) => {
          const a = needleAngle(t);
          const inner = polarToXY(CX, CY, GAUGE_R - 10, a);
          const outer = polarToXY(CX, CY, GAUGE_R + 4, a);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
              opacity="0.5"
            />
          );
        })}

        {/* Needle */}
        <polygon
          points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
          fill="var(--foreground)"
          opacity="0.95"
        />
        {/* Pivot dot */}
        <circle cx={CX} cy={CY} r="5" fill="var(--muted-foreground)" />
        <circle cx={CX} cy={CY} r="3" fill="var(--foreground)" />

        {/* Score */}
        <text
          x={CX}
          y={CY + 20}
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="22"
          fontFamily="Geist Mono, monospace"
          fontWeight="700"
        >
          {Math.round(score)}
        </text>
      </svg>

      {/* Label */}
      <div className="flex items-center gap-2 mt-1" data-ocid="sentiment.label">
        <span className="text-xs font-body text-muted-foreground tracking-widest uppercase">
          Current Sentiment:
        </span>
        <span
          className={`font-body text-sm font-bold tracking-widest uppercase ${labelClass}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
