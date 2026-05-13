import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import type {
  MetricSnapshot,
  NnsProposal,
  ProtocolEvent,
  SentimentBreakdown,
} from "../types";

const POLL_INTERVAL = 300_000; // 5 minutes

export function useLatestSnapshot() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MetricSnapshot | null>({
    queryKey: ["latestSnapshot"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLatestSnapshot();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSnapshotHistory(days = 30n) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MetricSnapshot[]>({
    queryKey: ["snapshotHistory", days.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSnapshotHistory(days);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useProtocolEvents() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ProtocolEvent[]>({
    queryKey: ["protocolEvents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProtocolEvents();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSentimentBreakdown() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SentimentBreakdown>({
    queryKey: ["sentimentBreakdown"],
    queryFn: async () => {
      if (!actor) {
        return { overallScore: 0, drivingFactors: [] };
      }
      return actor.getSentimentBreakdown();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useGovernanceProposals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<NnsProposal[]>({
    queryKey: ["governanceProposals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGovernanceProposals();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: POLL_INTERVAL,
  });
}

// Convenience hook: all metrics in one place
export function useMetrics() {
  const snapshot = useLatestSnapshot();
  const history = useSnapshotHistory(30n);
  const events = useProtocolEvents();
  const sentiment = useSentimentBreakdown();

  return {
    snapshot,
    history,
    events,
    sentiment,
    isLoading:
      snapshot.isLoading ||
      history.isLoading ||
      events.isLoading ||
      sentiment.isLoading,
    lastUpdated: snapshot.dataUpdatedAt,
  };
}
