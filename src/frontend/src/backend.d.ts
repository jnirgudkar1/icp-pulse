import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SentimentBreakdown {
    overallScore: number;
    drivingFactors: Array<MetricSignal>;
}
export interface AssetSnapshot {
    sentimentScore: bigint;
    metrics: Array<[string, number]>;
    assetId: AssetId;
    marketCap: number;
    volume24h: number;
    priceChange7d: number;
    events: Array<AssetProtocolEvent>;
    timestamp: bigint;
    priceChange24h: number;
    price: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type RefreshResult = {
    __kind__: "ok";
    ok: {
        snapshot: MetricSnapshot;
        dataSourceStatus: DataSourceStatus;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface AssetProtocolEvent {
    title: string;
    assetId: AssetId;
    description: string;
    timestamp: bigint;
    eventType: string;
}
export interface MetricSignal {
    value: string;
    name: string;
    signal: Variant_bear_bull_neutral;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ProtocolEvent {
    title: string;
    date: string;
    category: Variant_other_mission70_governance_chainFusion;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface MetricSnapshot {
    cycleBurnRateTcycles: number;
    icpPrice24hChange: number;
    icpPriceUsd: number;
    devCommitsWeekly: bigint;
    sentimentScore: number;
    totalCanistersDeployed: bigint;
    activeAddressesIsReal: boolean;
    burnRateIsReal: boolean;
    tvlUsd: number;
    timestamp: bigint;
    activeAddresses7d: bigint;
    activeAddresses24h: bigint;
    activeAddresses30d: bigint;
}
export interface DataSourceStatus {
    burnRateLive: boolean;
    activeAddressesLive: boolean;
    proposalsLive: boolean;
    icpPriceLive: boolean;
}
export interface NnsProposal {
    id: bigint;
    status: NnsProposalStatus;
    title: string;
    topic: string;
    votesYes: bigint;
    summary: string;
    votingPeriodEnd: bigint;
    votesNo: bigint;
    proposer: string;
    isMission70Related: boolean;
}
export enum AssetId {
    ADA = "ADA",
    BTC = "BTC",
    ETH = "ETH",
    FET = "FET",
    ICP = "ICP",
    INJ = "INJ",
    SOL = "SOL",
    XRP = "XRP",
    AVAX = "AVAX"
}
export enum NnsProposalStatus {
    open = "open",
    rejected = "rejected",
    executing = "executing",
    executed = "executed",
    failed = "failed",
    adopted = "adopted"
}
export enum Variant_bear_bull_neutral {
    bear = "bear",
    bull = "bull",
    neutral = "neutral"
}
export enum Variant_other_mission70_governance_chainFusion {
    other = "other",
    mission70 = "mission70",
    governance = "governance",
    chainFusion = "chainFusion"
}
export interface backendInterface {
    getGovernanceProposals(): Promise<Array<NnsProposal>>;
    getGovernanceProposalsByAsset(assetId: string): Promise<Array<AssetProtocolEvent>>;
    getLatestSnapshot(): Promise<MetricSnapshot | null>;
    getLatestSnapshotByAsset(assetId: string): Promise<AssetSnapshot | null>;
    getOpenProposals(): Promise<Array<NnsProposal>>;
    getProtocolEvents(): Promise<Array<ProtocolEvent>>;
    getRecentProposals(limit: bigint): Promise<Array<NnsProposal>>;
    getSentimentBreakdown(): Promise<SentimentBreakdown>;
    getSnapshotHistory(days: bigint): Promise<Array<MetricSnapshot>>;
    getSnapshotHistoryByAsset(assetId: string, limit: bigint): Promise<Array<AssetSnapshot>>;
    refreshAllAssets(): Promise<void>;
    refreshAsset(assetIdText: string): Promise<void>;
    refreshMetrics(): Promise<RefreshResult>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    transform_addresses(input: TransformationInput): Promise<TransformationOutput>;
    transform_burnrate(input: TransformationInput): Promise<TransformationOutput>;
    transform_cg_chart(input: TransformationInput): Promise<TransformationOutput>;
    transform_cg_markets(input: TransformationInput): Promise<TransformationOutput>;
    transform_proposals(input: TransformationInput): Promise<TransformationOutput>;
}
