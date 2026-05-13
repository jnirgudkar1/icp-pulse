import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BarChart3, Landmark, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Layout } from "../Layout";
import { NnsProposalStatus } from "../backend";
import {
  AssetDashboard,
  AssetSelector,
  GovernanceProposals,
  MetricCard,
  ProtocolEventList,
  SentimentDrivers,
  SentimentGauge,
} from "../components";
import { useGovernanceProposals, useMetrics } from "../hooks/useMetrics";
import type { DataSourceStatus } from "../types";
import {
  Signal,
  formatLargeNumber,
  formatUsd,
  scoreToLabel,
  signalColor,
} from "../types";
import type { MetricSnapshot, SignalType, SparklineData } from "../types";

// ─ Seed mock data shown while backend loads ───────────────────────────────
const MOCK_SNAP: MetricSnapshot = {
  icpPriceUsd: 14.85,
  icpPrice24hChange: 5.2,
  cycleBurnRateTcycles: 12.5,
  activeAddresses24h: 88432n,
  activeAddresses7d: 512000n,
  activeAddresses30d: 1840000n,
  devCommitsWeekly: 1940n,
  totalCanistersDeployed: 45671n,
  tvlUsd: 198_000_000,
  sentimentScore: 68,
  timestamp: BigInt(Date.now()) * 1_000_000n,
  burnRateIsReal: false,
  activeAddressesIsReal: false,
};

const MOCK_HIST: MetricSnapshot[] = Array.from({ length: 30 }, (_, i) => ({
  ...MOCK_SNAP,
  icpPriceUsd: 13.5 + Math.sin(i * 0.4) * 2 + i * 0.05,
  cycleBurnRateTcycles: 11.8 + Math.sin(i * 0.3) * 1.2,
  activeAddresses24h: BigInt(82000 + i * 250 + Math.floor(Math.sin(i) * 1200)),
  devCommitsWeekly: BigInt(1500 + i * 18 + Math.floor(Math.sin(i) * 80)),
  totalCanistersDeployed: BigInt(43000 + i * 110),
  tvlUsd: 155_000_000 + i * 2_200_000 + Math.sin(i * 0.5) * 4_000_000,
  timestamp: BigInt(Date.now() - (29 - i) * 86_400_000) * 1_000_000n,
}));

// ─ Helpers ─────────────────────────────────────────────────────────────────
function changeSignal(change: number): SignalType {
  if (change > 1) return Signal.bull;
  if (change < -1) return Signal.bear;
  return Signal.neutral;
}

function sparklineFromHist(
  hist: MetricSnapshot[],
  key: keyof MetricSnapshot,
  signal: SignalType,
): SparklineData {
  return {
    values: hist.slice(-7).map((s) => {
      const v = s[key];
      return typeof v === "bigint" ? Number(v) : (v as number);
    }),
    signal,
  };
}

function formatTs(ts: number): string {
  if (!ts) return "—";
  return `${new Date(ts).toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

function drivingOneLiner(
  factors: { name: string; value: string; signal: SignalType | string }[],
): string {
  if (!factors.length) return "Awaiting signal data from backend…";
  const getKey = (sig: SignalType | string) =>
    typeof sig === "object" ? Object.keys(sig as object)[0] : (sig as string);
  const bulls = factors.filter((f) => getKey(f.signal) === "bull");
  const bears = factors.filter((f) => getKey(f.signal) === "bear");
  if (bulls.length >= bears.length && bulls.length > 0) {
    return `Driven by ${bulls
      .slice(0, 2)
      .map((f) => f.name)
      .join(" & ")} (${bulls[0].value})`;
  }
  if (bears.length > 0) {
    return `Pressure from ${bears
      .slice(0, 2)
      .map((f) => f.name)
      .join(" & ")} (${bears[0].value})`;
  }
  return "Signals mixed — watch developer activity and TVL for direction.";
}

// ─ Skeleton components ──────────────────────────────────────────────────
function GaugeSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-4 py-6"
      data-ocid="gauge.loading_state"
    >
      <Skeleton className="w-56 h-36 rounded-[50%_50%_0_0]" />
      <Skeleton className="w-36 h-5" />
      <Skeleton className="w-64 h-3" />
    </div>
  );
}

function CardSkeleton({ ocid }: { ocid: string }) {
  return (
    <div
      className="metric-card flex flex-col gap-2 min-h-[170px]"
      data-ocid={ocid}
    >
      <Skeleton className="w-28 h-3" />
      <Skeleton className="w-36 h-7" />
      <Skeleton className="w-20 h-4" />
      <div className="mt-auto pt-2">
        <Skeleton className="w-full h-[52px]" />
      </div>
    </div>
  );
}

function RowSkeleton({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, n) => `r${n}`);
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((k) => (
        <div
          key={k}
          className="flex items-center justify-between gap-3 py-2.5 border-b border-border"
        >
          <Skeleton className="w-32 h-3" />
          <div className="flex gap-2">
            <Skeleton className="w-12 h-3" />
            <Skeleton className="w-16 h-5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EventSkeleton({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, n) => `e${n}`);
  return (
    <div className="flex flex-col gap-0">
      {items.map((k) => (
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
  );
}

// ─ URL param helpers ────────────────────────────────────────────────────────
function getUrlParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

function setUrlParams(params: Record<string, string>) {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(params)) {
    sp.set(k, v);
  }
  const newUrl = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

const ASSET_NAMES: Record<string, string> = {
  ICP: "Internet Computer",
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  XRP: "XRP",
  ADA: "Cardano",
  AVAX: "Avalanche",
  INJ: "Injective",
  FET: "Fetch.ai",
};

// ─ Dashboard page ───────────────────────────────────────────────────────────
type DashTab = "overview" | "governance";

export default function Dashboard() {
  const { snapshot, history, events, sentiment, isLoading, lastUpdated } =
    useMetrics();
  const governance = useGovernanceProposals();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DashTab>(
    (getUrlParam("tab") as DashTab) ?? "overview",
  );
  const [activeAsset, setActiveAsset] = useState<string>(
    getUrlParam("asset") ?? "ICP",
  );
  const [dataSourceStatus, setDataSourceStatus] =
    useState<DataSourceStatus | null>(null);

  // Sync URL params with state
  const handleAssetChange = useCallback(
    (ticker: string) => {
      setActiveAsset(ticker);
      setUrlParams({ asset: ticker, tab: activeTab });
    },
    [activeTab],
  );

  const handleTabChange = useCallback(
    (tab: DashTab) => {
      setActiveTab(tab);
      setUrlParams({ asset: activeAsset, tab });
    },
    [activeAsset],
  );

  // Read URL params on mount
  useEffect(() => {
    const asset = getUrlParam("asset");
    const tab = getUrlParam("tab") as DashTab | null;
    if (asset) setActiveAsset(asset);
    if (tab && (tab === "overview" || tab === "governance")) setActiveTab(tab);
  }, []);

  // Resolved data — fall back to mock data so page is never blank
  const snap = snapshot.data ?? MOCK_SNAP;
  const hist = history.data?.length ? history.data : MOCK_HIST;
  const evts = events.data ?? [];
  const sent = sentiment.data ?? { overallScore: 68, drivingFactors: [] };

  const isError =
    snapshot.isError && history.isError && events.isError && sentiment.isError;

  const isBgRefetching =
    !isLoading &&
    (snapshot.isFetching ||
      history.isFetching ||
      events.isFetching ||
      sentiment.isFetching);

  async function handleRefresh() {
    if (!actor || isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (activeAsset === "ICP") {
        const result = await actor.refreshMetrics();
        if (result.__kind__ === "ok") {
          setDataSourceStatus(result.ok.dataSourceStatus);
        }
      } else {
        await actor.refreshAsset(activeAsset);
      }
      await queryClient.invalidateQueries();
    } finally {
      setIsRefreshing(false);
    }
  }

  const score = Number(sent.overallScore);
  const label = scoreToLabel(score);
  const labelColorClass = signalColor(
    label === "BULL"
      ? Signal.bull
      : label === "BEAR"
        ? Signal.bear
        : Signal.neutral,
  );
  const sectionBorderClass =
    label === "BULL"
      ? "border-l-primary"
      : label === "BEAR"
        ? "border-l-secondary"
        : "border-l-accent";

  // Per-metric signal classification
  const priceSig = changeSignal(snap.icpPrice24hChange);
  const burnSig = snap.cycleBurnRateTcycles > 10 ? Signal.bull : Signal.neutral;
  const addr24hChange =
    hist.length > 1
      ? ((Number(hist[hist.length - 1].activeAddresses24h) -
          Number(hist[0].activeAddresses24h)) /
          Math.max(Number(hist[0].activeAddresses24h), 1)) *
        100
      : -0.7;
  const addrSig = changeSignal(addr24hChange);
  const tvlChange =
    hist.length > 1
      ? ((hist[hist.length - 1].tvlUsd - hist[0].tvlUsd) /
          Math.max(hist[0].tvlUsd, 1)) *
        100
      : 8.9;
  const tvlSig = changeSignal(tvlChange);

  // ─ Error state
  if (isError) {
    return (
      <Layout>
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
          data-ocid="dashboard.error_state"
        >
          <AlertCircle className="w-12 h-12 text-secondary" />
          <div className="text-center">
            <p className="font-body text-sm uppercase tracking-widest text-foreground">
              Failed to load metrics
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Backend connection error. Check your network.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-body text-xs uppercase tracking-widest"
            onClick={() => queryClient.invalidateQueries()}
            data-ocid="dashboard.retry_button"
          >
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  const proposals = governance.data ?? [];

  return (
    <Layout lastUpdated={activeAsset === "ICP" ? lastUpdated : undefined}>
      <div className="flex flex-col gap-0" data-ocid="dashboard.page">
        {/* ─────────────────────────────────────────────────────
            ASSET SELECTOR
        ───────────────────────────────────────────────────── */}
        <AssetSelector activeAsset={activeAsset} onSelect={handleAssetChange} />

        {/* ─────────────────────────────────────────────────────
            TAB BAR
        ───────────────────────────────────────────────────── */}
        <div
          className="bg-card border-b border-border px-6 flex items-center gap-1"
          data-ocid="dashboard.tabs"
        >
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-3 font-body text-[10px] uppercase tracking-widest border-b-2 transition-colors duration-200 ${
              activeTab === "overview"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleTabChange("overview")}
            data-ocid="dashboard.overview.tab"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-3 font-body text-[10px] uppercase tracking-widest border-b-2 transition-colors duration-200 ${
              activeTab === "governance"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleTabChange("governance")}
            data-ocid="dashboard.governance.tab"
          >
            <Landmark className="w-3.5 h-3.5" />
            {activeAsset === "ICP" ? "Governance" : "Events"}
            {activeAsset === "ICP" &&
              proposals.filter((p) => p.status === NnsProposalStatus.open)
                .length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary font-mono text-[9px] px-1.5 py-0.5 rounded-full">
                  {
                    proposals.filter((p) => p.status === NnsProposalStatus.open)
                      .length
                  }
                </span>
              )}
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────
            NON-ICP ASSET DASHBOARD
        ───────────────────────────────────────────────────── */}
        {activeAsset !== "ICP" && (
          <AssetDashboard
            assetId={activeAsset}
            assetName={ASSET_NAMES[activeAsset] ?? activeAsset}
            activeTab={activeTab}
          />
        )}

        {/* ─────────────────────────────────────────────────────
            ICP-ONLY SECTIONS
        ───────────────────────────────────────────────────── */}
        {activeAsset === "ICP" && activeTab === "overview" && (
          <>
            {/* SECTION 1 — Sentiment Gauge */}
            <section
              className={`bg-card border-b border-border px-6 py-8 flex flex-col items-center gap-3 border-l-4 ${sectionBorderClass}`}
              data-ocid="gauge.section"
            >
              {isLoading ? (
                <GaugeSkeleton />
              ) : (
                <>
                  <SentimentGauge score={score} size={220} />
                  <p
                    className={`font-body text-xs uppercase tracking-wider text-center max-w-xs ${labelColorClass}`}
                    data-ocid="gauge.driving_factor"
                  >
                    {drivingOneLiner(sent.drivingFactors)}
                  </p>
                  {isBgRefetching && (
                    <span
                      className="font-body text-[10px] uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1"
                      data-ocid="gauge.refreshing_indicator"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Refreshing…
                    </span>
                  )}
                </>
              )}
            </section>

            {/* SECTION 2 — 2×3 Metric Card Grid */}
            <section
              className="bg-background border-b border-border px-6 py-6"
              data-ocid="metrics.section"
            >
              <h2 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Live Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {isLoading ? (
                  ["c1", "c2", "c3", "c4", "c5", "c6"].map((k, n) => (
                    <CardSkeleton
                      key={k}
                      ocid={`metrics.loading_state.${n + 1}`}
                    />
                  ))
                ) : (
                  <>
                    {/* ICP Price */}
                    <MetricCard
                      title="ICP Price"
                      value={formatUsd(snap.icpPriceUsd)}
                      change={snap.icpPrice24hChange}
                      signal={priceSig}
                      sparkline={sparklineFromHist(
                        hist,
                        "icpPriceUsd",
                        priceSig,
                      )}
                      description="Rising price signals growing market confidence (bull)"
                      data-ocid="metrics.icp_price.card"
                    />
                    {/* Cycle Burn Rate */}
                    <MetricCard
                      title="Cycle Burn Rate"
                      value={`${snap.cycleBurnRateTcycles.toFixed(1)}T`}
                      unit="/ SEC"
                      signal={burnSig}
                      sparkline={sparklineFromHist(
                        hist,
                        "cycleBurnRateTcycles",
                        burnSig,
                      )}
                      description="Higher burn = more network usage = bull signal"
                      dataAccuracy={snap.burnRateIsReal ? "live" : "estimated"}
                      data-ocid="metrics.burn_rate.card"
                    />
                    {/* Active Addresses 24h */}
                    <MetricCard
                      title="Active Addresses (24H)"
                      value={formatLargeNumber(snap.activeAddresses24h)}
                      change={addr24hChange}
                      signal={addrSig}
                      sparkline={sparklineFromHist(
                        hist,
                        "activeAddresses24h",
                        addrSig,
                      )}
                      description="Growth in unique addresses = adoption momentum (bull)"
                      dataAccuracy={
                        snap.activeAddressesIsReal ? "live" : "estimated"
                      }
                      data-ocid="metrics.active_addresses.card"
                    />
                    {/* Developer Activity */}
                    <MetricCard
                      title="Developer Activity"
                      value={formatLargeNumber(snap.devCommitsWeekly)}
                      unit="WEEKLY COMMITS"
                      signal={Signal.bull}
                      sparkline={sparklineFromHist(
                        hist,
                        "devCommitsWeekly",
                        Signal.bull,
                      )}
                      description="More commits = ecosystem expansion (bull)"
                      data-ocid="metrics.dev_activity.card"
                    />
                    {/* Total Canisters */}
                    <MetricCard
                      title="Total Canisters"
                      value={formatLargeNumber(snap.totalCanistersDeployed)}
                      unit="DEPLOYED"
                      signal={Signal.neutral}
                      sparkline={sparklineFromHist(
                        hist,
                        "totalCanistersDeployed",
                        Signal.neutral,
                      )}
                      description="More dApps deployed = ecosystem growth (bull)"
                      data-ocid="metrics.canisters.card"
                    />
                    {/* TVL */}
                    <MetricCard
                      title="TVL"
                      value={formatUsd(snap.tvlUsd)}
                      change={tvlChange}
                      signal={tvlSig}
                      sparkline={sparklineFromHist(hist, "tvlUsd", tvlSig)}
                      description="Rising TVL = capital flowing in = bull signal"
                      data-ocid="metrics.tvl.card"
                    />
                  </>
                )}
              </div>
            </section>

            {/* SECTION 3 — Signal Drivers + Protocol Events */}
            <section
              className="bg-muted/20 border-b border-border px-6 py-6"
              data-ocid="analysis.section"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Sentiment Drivers */}
                <div className="flex flex-col gap-3" data-ocid="drivers.panel">
                  <h2 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
                    Signal Drivers
                  </h2>
                  {isLoading ? (
                    <RowSkeleton count={5} />
                  ) : (
                    <SentimentDrivers factors={sent.drivingFactors} />
                  )}
                </div>

                {/* Right: Protocol Events */}
                <div className="flex flex-col gap-3" data-ocid="events.panel">
                  <h2 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
                    Protocol Events
                  </h2>
                  {isLoading ? (
                    <EventSkeleton count={5} />
                  ) : (
                    <ProtocolEventList events={evts} limit={5} />
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ICP-ONLY: Governance Tab */}
        {activeAsset === "ICP" && activeTab === "governance" && (
          <section
            className="bg-background border-b border-border px-6 py-6"
            data-ocid="governance.section"
          >
            <GovernanceProposals
              proposals={proposals}
              isLoading={governance.isLoading}
            />
          </section>
        )}
        {/* ─────────────────────────────────────────────────────
            SECTION 4 — Footer Row (refresh)
        ───────────────────────────────────────────────────── */}
        <section
          className="bg-card/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4"
          data-ocid="dashboard.footer_row"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
              Last Refreshed:
            </span>
            <span
              className="font-mono text-[10px] text-foreground/70"
              data-ocid="dashboard.last_refreshed"
            >
              {lastUpdated ? formatTs(lastUpdated) : "—"}
            </span>
            {isBgRefetching && (
              <span
                className="font-body text-[10px] uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1"
                data-ocid="dashboard.refreshing_indicator"
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                Refreshing…
              </span>
            )}
          </div>
          {/* Data source accuracy indicators */}
          {dataSourceStatus && (
            <div
              className="flex items-center gap-3 flex-wrap"
              data-ocid="dashboard.data_sources"
            >
              {(
                [
                  { key: "icpPriceLive", label: "ICP Price" },
                  { key: "burnRateLive", label: "Burn Rate" },
                  { key: "activeAddressesLive", label: "Addresses" },
                  { key: "proposalsLive", label: "Proposals" },
                ] as { key: keyof typeof dataSourceStatus; label: string }[]
              ).map(({ key, label }) => (
                <span
                  key={key}
                  className="flex items-center gap-1 font-body text-[9px] uppercase tracking-widest"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dataSourceStatus[key]
                        ? "bg-primary animate-pulse"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                  <span
                    className={
                      dataSourceStatus[key]
                        ? "text-primary"
                        : "text-muted-foreground/50"
                    }
                  >
                    {label}: {dataSourceStatus[key] ? "Live" : "Est."}
                  </span>
                </span>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefreshing || !actor}
            onClick={handleRefresh}
            className="font-body text-[10px] uppercase tracking-widest h-7 px-3 gap-1.5 border-border hover:border-primary hover:text-primary transition-colors duration-200"
            data-ocid="dashboard.refresh_button"
          >
            <RefreshCw
              className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing…" : "Refresh Now"}
          </Button>
        </section>
      </div>
    </Layout>
  );
}
