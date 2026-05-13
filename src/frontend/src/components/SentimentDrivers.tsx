import { Signal } from "../types";
import type { MetricSignal } from "../types";

interface SentimentDriversProps {
  factors: MetricSignal[];
}

function SignalPill({ signal }: { signal: string }) {
  const s = signal as string;
  const isRaw = typeof signal === "string";
  const val = isRaw ? s : Object.keys(signal as object)[0];

  const cfg =
    val === "bull"
      ? { label: "BULL", cls: "text-primary border-primary/40 bg-primary/10" }
      : val === "bear"
        ? {
            label: "BEAR",
            cls: "text-secondary border-secondary/40 bg-secondary/10",
          }
        : {
            label: "NEUTRAL",
            cls: "text-accent border-accent/40 bg-accent/10",
          };

  return (
    <span
      className={`font-body text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// Fallback seed drivers
const SEED_FACTORS: MetricSignal[] = [
  { name: "ICP Price 24h", value: "+5.2%", signal: Signal.bull },
  { name: "Developer Commits", value: "+15.8%", signal: Signal.bull },
  { name: "TVL (USD)", value: "+8.9%", signal: Signal.bull },
  { name: "Active Addresses 24h", value: "-0.7%", signal: Signal.bear },
  { name: "Cycle Burn Rate", value: "+2.1%", signal: Signal.neutral },
];

export function SentimentDrivers({ factors }: SentimentDriversProps) {
  const displayed = factors.length > 0 ? factors : SEED_FACTORS;

  return (
    <div className="flex flex-col gap-0" data-ocid="drivers.list">
      {displayed.map((f, i) => (
        <div
          key={`${f.name}-${i}`}
          className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0"
          data-ocid={`drivers.item.${i + 1}`}
        >
          <span className="font-body text-xs text-muted-foreground uppercase tracking-wider truncate">
            {f.name}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-body text-xs font-medium text-foreground tabular-nums">
              {f.value}
            </span>
            <SignalPill
              signal={
                typeof f.signal === "object"
                  ? Object.keys(f.signal as object)[0]
                  : (f.signal as string)
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
