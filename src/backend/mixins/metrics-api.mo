import Types "../types/metrics";
import MetricsLib "../lib/metrics";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import List "mo:core/List";
import Queue "mo:core/Queue";
import Time "mo:core/Time";
import Float "mo:core/Float";

mixin (
  snapshots : Queue.Queue<Types.MetricSnapshot>,
  events : List.List<Types.ProtocolEvent>,
  proposals : List.List<Types.NnsProposal>
) {
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query func transform_burnrate(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query func transform_addresses(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query func transform_proposals(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  /// Returns the latest metric snapshot.
  public query func getLatestSnapshot() : async ?Types.MetricSnapshot {
    MetricsLib.getLatest(snapshots);
  };

  /// Returns up to 24*days most recent snapshots.
  public query func getSnapshotHistory(days : Nat) : async [Types.MetricSnapshot] {
    MetricsLib.getHistory(snapshots, days);
  };

  /// Returns all curated protocol events.
  public query func getProtocolEvents() : async [Types.ProtocolEvent] {
    MetricsLib.listEvents(events);
  };

  /// Returns a sentiment breakdown computed from the latest snapshot.
  public query func getSentimentBreakdown() : async Types.SentimentBreakdown {
    switch (MetricsLib.getLatest(snapshots)) {
      case null {
        // Return a neutral breakdown when no data yet
        {
          drivingFactors = [];
          overallScore = 50.0;
        };
      };
      case (?snap) { MetricsLib.computeSentiment(snap) };
    };
  };

  /// Returns all stored NNS governance proposals.
  public query func getGovernanceProposals() : async [Types.NnsProposal] {
    proposals.toArray();
  };

  /// Returns only open NNS proposals.
  public query func getOpenProposals() : async [Types.NnsProposal] {
    proposals.filter(func(p) { p.status == #open }).toArray();
  };

  /// Returns the most recent `limit` NNS proposals.
  public query func getRecentProposals(limit : Nat) : async [Types.NnsProposal] {
    let all = proposals.toArray();
    let total = all.size();
    if (total <= limit) { all }
    else {
      let start = total - limit;
      all.sliceToArray(start.toInt(), total.toInt());
    };
  };

  /// Triggers an HTTP outcall to fetch fresh ICP price and on-chain metrics.
  public func refreshMetrics() : async Types.RefreshResult {
    // -----------------------------------------------------------------------
    // 1. Fetch ICP price from CoinGecko
    // -----------------------------------------------------------------------
    let priceUrl = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd&include_24hr_change=true";
    let priceResponseText = await OutCall.httpGetRequest(priceUrl, [], transform);

    let priceOpt  = MetricsLib.extractFloat(priceResponseText, "usd");
    let changeOpt = MetricsLib.extractFloat(priceResponseText, "usd_24h_change");

    let icpPriceUsd = switch (priceOpt) {
      case (?p) p;
      case null { return #err("Failed to parse ICP price from: " # priceResponseText) };
    };
    let icpPrice24hChange = switch (changeOpt) {
      case (?c) c;
      case null 0.0;
    };

    let now  = Time.now();
    let seed = now / 1_000_000_000; // seconds

    // -----------------------------------------------------------------------
    // 2. Fetch cycle burn rate from IC Dashboard
    // -----------------------------------------------------------------------
    let burnUrl = "https://ic-api.internetcomputer.org/api/v3/metrics/cycle-burn-rate";
    var cycleBurnRateTcycles = MetricsLib.jitter(95.0, seed, 15.0);
    var burnRateIsReal = false;
    try {
      let burnResponseText = await OutCall.httpGetRequest(burnUrl, [], transform_burnrate);
      // Response: {"cycle_burn_rate":[{"value":"12345678901234","timestamp":...}]}
      // value is in cycles; 1 Tcycle = 1e12 cycles
      switch (MetricsLib.extractFloat(burnResponseText, "value")) {
        case (?rawCycles) {
          let tcycles = rawCycles / 1_000_000_000_000.0;
          if (tcycles > 0.0) {
            cycleBurnRateTcycles := tcycles;
            burnRateIsReal := true;
          };
        };
        case null {
          // Try numeric (unquoted) value field
          switch (MetricsLib.extractFloat(burnResponseText, "cycle_burn_rate")) {
            case (?v) {
              let tcycles = v / 1_000_000_000_000.0;
              if (tcycles > 0.0) {
                cycleBurnRateTcycles := tcycles;
                burnRateIsReal := true;
              };
            };
            case null {};
          };
        };
      };
    } catch (_e) { /* fall back to simulated */ };

    // -----------------------------------------------------------------------
    // 3. Fetch active user count from IC Dashboard
    // -----------------------------------------------------------------------
    let addrUrl = "https://ic-api.internetcomputer.org/api/v3/metrics/ic-user-total";
    var activeAddresses24h  = MetricsLib.jitterNat(5_800, seed, 400);
    var activeAddressesIsReal = false;
    try {
      let addrResponseText = await OutCall.httpGetRequest(addrUrl, [], transform_addresses);
      // Response: {"ic_user_total":[{"value":"123456","timestamp":...}]}
      switch (MetricsLib.extractFloat(addrResponseText, "value")) {
        case (?rawCount) {
          let count = rawCount.toInt();
          if (count > 0) {
            activeAddresses24h  := count.toNat();
            activeAddressesIsReal := true;
          };
        };
        case null {};
      };
    } catch (_e) { /* fall back to simulated */ };

    // -----------------------------------------------------------------------
    // 4. Fetch NNS governance proposals
    // -----------------------------------------------------------------------
    let proposalsUrl = "https://ic-api.internetcomputer.org/api/v3/proposals?limit=50&include_status=1";
    var proposalsLive = false;
    try {
      let propResponseText = await OutCall.httpGetRequest(proposalsUrl, [], transform_proposals);
      // Response: {"data":[{"id":...,"title":...,...}]}
      // Extract the array value after "data":
      let dataKey = "\"data\":";
      let dataParts = propResponseText.split(#text dataKey);
      ignore dataParts.next();
      switch (dataParts.next()) {
        case null {};
        case (?afterData) {
          let trimmed = afterData.trimStart(#char ' ');
          let objects = MetricsLib.splitJsonArray(trimmed);
          if (objects.size() > 0) {
            proposals.clear();
            for (obj in objects.values()) {
              switch (MetricsLib.parseProposal(obj)) {
                case (?p) { proposals.add(p) };
                case null {};
              };
            };
            proposalsLive := true;
          };
        };
      };
    } catch (_e) { /* fall back to existing cached proposals */ };

    // -----------------------------------------------------------------------
    // 5. Derive remaining simulated metrics and compose snapshot
    // -----------------------------------------------------------------------
    let activeAddresses7d  = MetricsLib.jitterNat(28_000, seed + 1, 2_000);
    let activeAddresses30d = MetricsLib.jitterNat(95_000, seed + 2, 5_000);
    let devCommitsWeekly   = MetricsLib.jitterNat(145, seed + 3, 20);
    let totalCanistersDeployed = MetricsLib.jitterNat(650_000, seed + 4, 1_000);
    let tvlUsd             = MetricsLib.jitter(68_000_000.0, seed + 5, 5_000_000.0);

    let snapshotBase : Types.MetricSnapshot = {
      timestamp = now;
      icpPriceUsd;
      icpPrice24hChange;
      cycleBurnRateTcycles;
      burnRateIsReal;
      activeAddresses24h;
      activeAddressesIsReal;
      activeAddresses7d;
      activeAddresses30d;
      devCommitsWeekly;
      totalCanistersDeployed;
      tvlUsd;
      sentimentScore = 0.0;
    };
    let snapshot : Types.MetricSnapshot = {
      snapshotBase with
      sentimentScore = MetricsLib.computeSentiment(snapshotBase).overallScore;
    };

    let dataSourceStatus : Types.DataSourceStatus = {
      icpPriceLive = true;
      burnRateLive = burnRateIsReal;
      activeAddressesLive = activeAddressesIsReal;
      proposalsLive;
    };

    MetricsLib.pushSnapshot(snapshots, snapshot);
    #ok { snapshot; dataSourceStatus };
  };
};
