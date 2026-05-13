import AssetTypes "../types/assets";
import Float "mo:core/Float";

module {
  /// Clamp a float to [0, 100].
  func clamp(v : Float) : Float {
    if (v < 0.0) 0.0 else if (v > 100.0) 100.0 else v;
  };

  /// Compute a 0–100 sentiment score for any asset.
  ///
  /// Weights:
  ///   - Price momentum (24h change)        30%
  ///   - Asset-specific on-chain signal 1   25%
  ///   - Ecosystem/dev activity             20%
  ///   - Network health                     15%
  ///   - Market momentum (volume/mcap)      10%
  ///
  /// `assetSpecificMetrics` is a [(Text, Float)] list from the snapshot.
  /// Expected keys (asset-dependent, fallback to neutral 50 if missing):
  ///   - "onChainSignal1"  : primary on-chain metric (staking ratio, MVRV, validator count, etc.)
  ///   - "devActivity"     : dev/ecosystem proxy (0–100 normalised)
  ///   - "networkHealth"   : network health proxy (0–100 normalised)
  ///   - "volumeToMcap"    : volume/market-cap ratio in percent (0–100 capped)
  public func computeAssetSentiment(
    _assetId : AssetTypes.AssetId,
    price : Float,
    priceChange24h : Float,
    assetSpecificMetrics : [(Text, Float)],
  ) : Nat {
    // Helper: look up a named metric, defaulting to 50 (neutral)
    func metric(name : Text) : Float {
      var val : Float = 50.0;
      for ((k, v) in assetSpecificMetrics.values()) {
        if (k == name) { val := v };
      };
      val;
    };

    // Suppress unused price warning
    ignore price;

    // 1. Price momentum (30%) — +5% → 100, -5% → 0, linear
    let priceScore = clamp(50.0 + priceChange24h * 10.0);

    // 2. Asset-specific on-chain signal (25%) — already 0–100 normalised
    let onChainScore = clamp(metric("onChainSignal1"));

    // 3. Ecosystem/dev activity (20%) — already 0–100 normalised
    let devScore = clamp(metric("devActivity"));

    // 4. Network health (15%) — already 0–100 normalised
    let networkScore = clamp(metric("networkHealth"));

    // 5. Volume-to-market-cap ratio momentum (10%) — higher = more interest
    let volScore = clamp(metric("volumeToMcap"));

    let weighted =
      priceScore  * 30.0
      + onChainScore * 25.0
      + devScore     * 20.0
      + networkScore * 15.0
      + volScore     * 10.0;

    let final = clamp(weighted / 100.0);
    final.toInt().toNat();
  };
};
