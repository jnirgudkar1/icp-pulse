import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssetProtocolEvent, AssetSnapshot } from "../backend.d";

const POLL_INTERVAL = 300_000; // 5 minutes

export function useLatestAssetSnapshot(assetId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AssetSnapshot | null>({
    queryKey: ["assetSnapshot", assetId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLatestSnapshotByAsset(assetId);
    },
    enabled: !!actor && !isFetching && !!assetId,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useAssetSnapshotHistory(assetId: string, limit = 30) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AssetSnapshot[]>({
    queryKey: ["assetHistory", assetId, limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSnapshotHistoryByAsset(assetId, BigInt(limit));
    },
    enabled: !!actor && !isFetching && !!assetId,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useAssetGovernanceEvents(assetId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AssetProtocolEvent[]>({
    queryKey: ["assetGovernance", assetId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGovernanceProposalsByAsset(assetId);
    },
    enabled: !!actor && !isFetching && !!assetId,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useAssetData(assetId: string) {
  const snapshot = useLatestAssetSnapshot(assetId);
  const history = useAssetSnapshotHistory(assetId, 30);
  const events = useAssetGovernanceEvents(assetId);
  const queryClient = useQueryClient();

  const isLoading = snapshot.isLoading || history.isLoading || events.isLoading;
  const error = snapshot.error ?? history.error ?? events.error ?? null;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["assetSnapshot", assetId] });
    queryClient.invalidateQueries({ queryKey: ["assetHistory", assetId] });
    queryClient.invalidateQueries({ queryKey: ["assetGovernance", assetId] });
  }

  return {
    snapshot: snapshot.data ?? null,
    history: history.data ?? [],
    events: events.data ?? [],
    isLoading,
    error,
    refresh,
  };
}
