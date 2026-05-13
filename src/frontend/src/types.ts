import {
  Variant_bear_bull_neutral,
  Variant_other_mission70_governance_chainFusion,
} from "./backend.d";
import type {
  DataSourceStatus,
  MetricSignal,
  MetricSnapshot,
  NnsProposal,
  ProtocolEvent,
  SentimentBreakdown,
} from "./backend.d";

export type SignalType = Variant_bear_bull_neutral;
export const Signal = Variant_bear_bull_neutral;

export type EventCategory = Variant_other_mission70_governance_chainFusion;
export const EventCategory = Variant_other_mission70_governance_chainFusion;

export type {
  MetricSnapshot,
  MetricSignal,
  NnsProposal,
  ProtocolEvent,
  SentimentBreakdown,
  DataSourceStatus,
};

export type { AssetSnapshot, AssetProtocolEvent } from "./backend.d";

export interface SparklineData {
  values: number[];
  signal: SignalType;
}

export type SentimentLabel = "BEAR" | "NEUTRAL" | "BULL";

export function scoreToLabel(score: number): SentimentLabel {
  if (score < 40) return "BEAR";
  if (score < 65) return "NEUTRAL";
  return "BULL";
}

export function signalColor(signal: SignalType): string {
  switch (signal) {
    case Signal.bull:
      return "text-primary";
    case Signal.bear:
      return "text-secondary";
    default:
      return "text-accent";
  }
}

export function formatLargeNumber(n: number | bigint): string {
  const num = typeof n === "bigint" ? Number(n) : n;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return num.toLocaleString();
  return num.toString();
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}

export function formatChange(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}
