import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import type { AssetProtocolEvent, AssetSnapshot } from "../backend.d";
import { useAssetData } from "../hooks/useAssetData";
import {
  Signal,
  formatLargeNumber,
  formatUsd,
  scoreToLabel,
  signalColor,
} from "../types";
import type { SignalType, SparklineData } from "../types";
import { MetricCard } from "./MetricCard";
import { SentimentGauge } from "./SentimentGauge";
import { Sparkline } from "./Sparkline";

type DashTab = "overview" | "governance";

interface AssetDashboardProps {
  assetId: string;
  assetName: string;
  activeTab: DashTab;
}

function changeSignal(change: number): SignalType {
  if (change > 1) return Signal.bull;
  if (change < -1) return Signal.bear;
  return Signal.neutral;
}

function makePriceSparkline(
  history: AssetSnapshot[],
  signal: SignalType,
): SparklineData {
  return {
    values: history.slice(-7).map((s) => s.price),
    signal,
  };
}

function formatTimestamp(ts: bigint): string {
  if (!ts) return "—";
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString();
}

function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    governance: "text-chart-3 border-chart-3/40 bg-chart-3/10",
    protocol: "text-primary border-primary/40 bg-primary/10",
    ecosystem: "text-accent border-accent/40 bg-accent/10",
    listing: "text-secondary border-secondary/40 bg-secondary/10",
  };
  const cls =
    colors[type.toLowerCase()] ??
    "text-muted-foreground border-border bg-muted";
  return (
    <span
      className={`font-body text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded border ${cls}`}
    >
      {type}
    </span>
  );
}

function AssetEventList({ events }: { events: AssetProtocolEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-6 text-center" data-ocid="asset.events.empty_state">
        <p className="font-body text-xs text-muted-foreground uppercase tracking-widest">
          No events recorded yet
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0" data-ocid="asset.events.list">
      {events.slice(0, 8).map((ev, i) => (
        <div
          key={`${String(ev.timestamp)}-${i}`}
          className="flex items-start gap-3 py-3 border-b border-border last:border-0"
          data-ocid={`asset.events.item.${i + 1}`}
        >
          <span className="font-body text-xs text-muted-foreground whitespace-nowrap mt-0.5 min-w-[76px]">
            {formatTimestamp(ev.timestamp)}
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-body text-xs text-foreground leading-snug break-words">
              {ev.title}
            </span>
            <span className="font-body text-[10px] text-muted-foreground/70 leading-snug">
              {ev.description}
            </span>
            <EventTypeBadge type={ev.eventType} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {["c1", "c2", "c3", "c4", "c5", "c6"].map((k) => (
        <div key={k} className="metric-card flex flex-col gap-2 min-h-[170px]">
          <Skeleton className="w-28 h-3" />
          <Skeleton className="w-36 h-7" />
          <Skeleton className="w-20 h-4" />
          <div className="mt-auto pt-2">
            <Skeleton className="w-full h-[52px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ assetId }: { assetId: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-4"
      data-ocid="asset.empty_state"
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="font-body text-sm text-foreground uppercase tracking-widest">
          {assetId} data loading
        </p>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Backend is fetching live data. This may take a moment.
        </p>
      </div>
    </div>
  );
}

export function AssetDashboard({
  assetId,
  assetName,
  activeTab,
}: AssetDashboardProps) {
  const { snapshot, history, events, isLoading } = useAssetData(assetId);

  const priceSig = snapshot
    ? changeSignal(snapshot.priceChange24h)
    : Signal.neutral;
  const price7dSig = snapshot
    ? changeSignal(snapshot.priceChange7d)
    : Signal.neutral;
  const sentimentScore = snapshot ? Number(snapshot.sentimentScore) : 50;
  const sentimentLabel = scoreToLabel(sentimentScore);
  const sectionBorderClass =
    sentimentLabel === "BULL"
      ? "border-l-primary"
      : sentimentLabel === "BEAR"
        ? "border-l-secondary"
        : "border-l-accent";

  const priceSparkline =
    history.length > 1 ? makePriceSparkline(history, priceSig) : null;

  if (!isLoading && !snapshot) {
    return <EmptyState assetId={assetId} />;
  }

  return (
    <div
      className="flex flex-col gap-0"
      data-ocid={`asset.${assetId.toLowerCase()}.page`}
    >
      {/* Sentiment section */}
      {activeTab === "overview" && (
        <section
          className={`bg-card border-b border-border px-6 py-8 flex flex-col items-center gap-3 border-l-4 ${sectionBorderClass}`}
          data-ocid="asset.gauge.section"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Skeleton className="w-56 h-36 rounded-[50%_50%_0_0]" />
              <Skeleton className="w-36 h-5" />
            </div>
          ) : (
            <>
              <SentimentGauge score={sentimentScore} size={220} />
              <p
                className={`font-body text-xs uppercase tracking-wider text-center max-w-xs ${signalColor(priceSig)}`}
              >
                {assetName} —{" "}
                {sentimentLabel === "BULL"
                  ? "Bullish momentum building"
                  : sentimentLabel === "BEAR"
                    ? "Bearish pressure detected"
                    : "Neutral — watching key levels"}
              </p>
            </>
          )}
        </section>
      )}

      {/* Price & Market metrics */}
      {activeTab === "overview" && (
        <section
          className="bg-background border-b border-border px-6 py-6"
          data-ocid="asset.metrics.section"
        >
          <h2 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Market Data
          </h2>
          {isLoading ? (
            <LoadingGrid />
          ) : snapshot ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Price */}
              <MetricCard
                title={`${assetId} Price`}
                value={formatUsd(snapshot.price)}
                change={snapshot.priceChange24h}
                signal={priceSig}
                sparkline={priceSparkline ?? undefined}
                description="24h price change — rising price signals growing demand (bull)"
                data-ocid={`asset.${assetId.toLowerCase()}.price.card`}
              />
              {/* 7d change */}
              <MetricCard
                title="7-Day Change"
                value={`${snapshot.priceChange7d >= 0 ? "+" : ""}${snapshot.priceChange7d.toFixed(2)}%`}
                signal={price7dSig}
                description="7-day price trend — sustained growth signals institutional momentum"
                data-ocid={`asset.${assetId.toLowerCase()}.change7d.card`}
              />
              {/* Market Cap */}
              <MetricCard
                title="Market Cap"
                value={formatUsd(snapshot.marketCap)}
                signal={Signal.neutral}
                description="Total market capitalization — size of the asset's ecosystem"
                data-ocid={`asset.${assetId.toLowerCase()}.marketcap.card`}
              />
              {/* Volume */}
              <MetricCard
                title="24h Volume"
                value={formatUsd(snapshot.volume24h)}
                signal={
                  snapshot.volume24h > snapshot.marketCap * 0.05
                    ? Signal.bull
                    : Signal.neutral
                }
                description="High volume = active market participation (bull)"
                data-ocid={`asset.${assetId.toLowerCase()}.volume.card`}
              />
              {/* Asset-specific metrics from the metrics array */}
              {snapshot.metrics.slice(0, 2).map(([key, value]) => (
                <MetricCard
                  key={key}
                  title={key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={
                    value >= 1_000_000
                      ? formatLargeNumber(value)
                      : value.toFixed(2)
                  }
                  signal={Signal.neutral}
                  description={`On-chain metric tracked for ${assetName}`}
                  data-ocid={`asset.${assetId.toLowerCase()}.metric.${key}`}
                />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Price History chart */}
      {activeTab === "overview" && priceSparkline && !isLoading && (
        <section
          className="bg-muted/20 border-b border-border px-6 py-6"
          data-ocid="asset.chart.section"
        >
          <h2 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            7-Day Price History
          </h2>
          <div className="h-24">
            <Sparkline
              data={priceSparkline.values}
              signal={priceSig}
              height={96}
              showFill
            />
          </div>
        </section>
      )}

      {/* Overview: Events panel */}
      {activeTab === "overview" && (
        <section
          className="bg-background border-b border-border px-6 py-6"
          data-ocid="asset.events.section"
        >
          <h2 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Protocol Events
          </h2>
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {["e1", "e2", "e3"].map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-border"
                >
                  <Skeleton className="w-32 h-3" />
                  <Skeleton className="w-16 h-5 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <AssetEventList events={events} />
          )}
        </section>
      )}

      {/* Governance tab */}
      {activeTab === "governance" && (
        <section
          className="bg-background border-b border-border px-6 py-6"
          data-ocid="asset.governance.section"
        >
          <h2 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            {assetName} Governance & Events
          </h2>
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {["e1", "e2", "e3", "e4", "e5"].map((k) => (
                <div
                  key={k}
                  className="flex items-start gap-3 py-3 border-b border-border"
                >
                  <Skeleton className="w-20 h-3 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-20 h-5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AssetEventList events={events} />
          )}
        </section>
      )}
    </div>
  );
}
