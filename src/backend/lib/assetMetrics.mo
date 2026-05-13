import AssetTypes "../types/assets";
import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";

module {
  /// Maximum number of snapshots to retain per asset (30 days * 24 hours)
  public let MAX_SNAPSHOTS : Nat = 720;

  /// Store a new AssetSnapshot for the given asset, evicting oldest beyond MAX_SNAPSHOTS.
  public func storeAssetSnapshot(
    store : Map.Map<Text, List.List<AssetTypes.AssetSnapshot>>,
    snapshot : AssetTypes.AssetSnapshot,
  ) {
    let key = AssetTypes.assetIdToText(snapshot.assetId);
    switch (store.get(key)) {
      case null {
        let list = List.empty<AssetTypes.AssetSnapshot>();
        list.add(snapshot);
        store.add(key, list);
      };
      case (?list) {
        list.add(snapshot);
        if (list.size() > MAX_SNAPSHOTS) {
          // Rebuild keeping only the most recent MAX_SNAPSHOTS entries
          let arr = list.toArray();
          let total = arr.size();
          let start = total - MAX_SNAPSHOTS;
          list.clear();
          list.addAll(arr.range(start.toInt(), total.toInt()));
        };
      };
    };
  };

  /// Returns the most recent snapshot for the given asset.
  public func getLatestAssetSnapshot(
    store : Map.Map<Text, List.List<AssetTypes.AssetSnapshot>>,
    assetId : AssetTypes.AssetId,
  ) : ?AssetTypes.AssetSnapshot {
    let key = AssetTypes.assetIdToText(assetId);
    switch (store.get(key)) {
      case null null;
      case (?list) { list.last() };
    };
  };

  /// Returns the last `limit` snapshots for the given asset (most recent first).
  public func getAssetSnapshotHistory(
    store : Map.Map<Text, List.List<AssetTypes.AssetSnapshot>>,
    assetId : AssetTypes.AssetId,
    limit : Nat,
  ) : [AssetTypes.AssetSnapshot] {
    let key = AssetTypes.assetIdToText(assetId);
    switch (store.get(key)) {
      case null [];
      case (?list) {
        let arr = list.toArray();
        let total = arr.size();
        if (total <= limit) {
          arr;
        } else {
          let start = total - limit;
          arr.sliceToArray(start.toInt(), total.toInt());
        };
      };
    };
  };
};
