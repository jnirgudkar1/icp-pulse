import { Signal } from "../types";
import type { SignalType, SparklineData } from "../types";
import { Sparkline } from "./Sparkline";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number | null;
  signal?: SignalType;
  sparkline?: SparklineData;
  unit?: string;
  description?: string;
  dataAccuracy?: "live" | "estimated" | null;
  "data-ocid"?: string;
}

function TrendArrow({
  signal,
  change,
}: { signal: SignalType; change: number }) {
  const arrow =
    signal === Signal.bull ? "↑" : signal === Signal.bear ? "↓" : "→";
  const cls =
    signal === Signal.bull
      ? "text-primary"
      : signal === Signal.bear
        ? "text-secondary"
        : "text-accent";
  const sign = change >= 0 ? "+" : "";
  return (
    <span className={`metric-change ${cls} flex items-center gap-1`}>
      <span>{arrow}</span>
      <span>
        {sign}
        {change.toFixed(1)}%
      </span>
    </span>
  );
}

function AccuracyIndicator({ status }: { status: "live" | "estimated" }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 font-body text-[9px] uppercase tracking-widest text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 font-body text-[9px] uppercase tracking-widest text-muted-foreground/60">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      Est.
    </span>
  );
}

export function MetricCard({
  title,
  value,
  change,
  signal = Signal.neutral,
  sparkline,
  unit,
  description,
  dataAccuracy,
  "data-ocid": ocid,
}: MetricCardProps) {
  return (
    <div className="metric-card flex flex-col gap-2 h-full" data-ocid={ocid}>
      <div className="flex items-center justify-between gap-2">
        <span className="metric-label">{title}</span>
        {dataAccuracy && <AccuracyIndicator status={dataAccuracy} />}
      </div>
      {description && (
        <span className="font-body text-[10px] text-muted-foreground/70 leading-snug -mt-1">
          {description}
        </span>
      )}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="metric-value">{value}</span>
        {unit && (
          <span className="text-muted-foreground font-body text-sm tracking-widest uppercase">
            {unit}
          </span>
        )}
      </div>
      {change != null && <TrendArrow signal={signal} change={change} />}
      {sparkline && (
        <div className="mt-auto pt-2">
          <Sparkline
            data={sparkline.values}
            signal={sparkline.signal}
            height={52}
            showFill
          />
        </div>
      )}
    </div>
  );
}
