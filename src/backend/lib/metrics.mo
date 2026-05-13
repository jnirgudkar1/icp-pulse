import Types "../types/metrics";
import List "mo:core/List";
import Queue "mo:core/Queue";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Nat64 "mo:core/Nat64";

module {
  /// Maximum number of hourly snapshots to retain (30 days * 24 hours)
  public let MAX_SNAPSHOTS : Nat = 720;

  /// Returns the most recent snapshot, if any.
  public func getLatest(snapshots : Queue.Queue<Types.MetricSnapshot>) : ?Types.MetricSnapshot {
    snapshots.peekBack();
  };

  /// Returns snapshots from the last N days (up to 24*days entries).
  public func getHistory(snapshots : Queue.Queue<Types.MetricSnapshot>, days : Nat) : [Types.MetricSnapshot] {
    let limit = days * 24;
    let all = snapshots.toArray();
    let total = all.size();
    if (total <= limit) {
      all;
    } else {
      // Return only the most recent `limit` entries
      let start : Nat = total - limit;
      var result : [Types.MetricSnapshot] = [];
      var i : Nat = start;
      while (i < total) {
        switch (all[i]) {
          case snap { result := result.concat([snap]) };
        };
        i += 1;
      };
      result;
    };
  };

  /// Appends a new snapshot and evicts oldest entries beyond MAX_SNAPSHOTS.
  public func pushSnapshot(snapshots : Queue.Queue<Types.MetricSnapshot>, snapshot : Types.MetricSnapshot) {
    snapshots.pushBack(snapshot);
    while (snapshots.size() > MAX_SNAPSHOTS) {
      ignore snapshots.popFront();
    };
  };

  /// Clamp a float to [0, 100].
  func clamp(v : Float) : Float {
    if (v < 0.0) 0.0 else if (v > 100.0) 100.0 else v;
  };

  /// Derives a SentimentBreakdown from a MetricSnapshot.
  /// Scoring: each factor contributes 0‒100; final is a weighted average.
  ///   - Price momentum (24h change)   weight 30
  ///   - Burn rate trend               weight 20
  ///   - Active address growth (24h)   weight 20
  ///   - Developer activity            weight 15
  ///   - TVL change (inferred)         weight 15
  public func computeSentiment(snapshot : Types.MetricSnapshot) : Types.SentimentBreakdown {
    // --- Price momentum ---
    // +5% or more → fully bull (100); -5% or less → fully bear (0); linear between.
    let priceScore : Float = clamp(50.0 + snapshot.icpPrice24hChange * 10.0);
    let priceSignal : { #bull; #bear; #neutral } =
      if (snapshot.icpPrice24hChange >= 2.0) #bull
      else if (snapshot.icpPrice24hChange <= -2.0) #bear
      else #neutral;

    // --- Burn rate ---
    // Baseline: 80 Tcycles/day is neutral; >120 bull, <40 bear.
    let burnScore : Float = clamp((snapshot.cycleBurnRateTcycles - 40.0) / 80.0 * 100.0);
    let burnSignal : { #bull; #bear; #neutral } =
      if (snapshot.cycleBurnRateTcycles >= 120.0) #bull
      else if (snapshot.cycleBurnRateTcycles <= 40.0) #bear
      else #neutral;

    // --- Active addresses (24h) ---
    // Baseline: 5000 = neutral; >8000 bull, <2000 bear.
    let addrF = snapshot.activeAddresses24h.toFloat();
    let addrScore : Float = clamp((addrF - 2000.0) / 6000.0 * 100.0);
    let addrSignal : { #bull; #bear; #neutral } =
      if (snapshot.activeAddresses24h >= 8000) #bull
      else if (snapshot.activeAddresses24h <= 2000) #bear
      else #neutral;

    // --- Developer activity (weekly commits) ---
    // Baseline: 100 = neutral; >200 bull, <30 bear.
    let devF = snapshot.devCommitsWeekly.toFloat();
    let devScore : Float = clamp((devF - 30.0) / 170.0 * 100.0);
    let devSignal : { #bull; #bear; #neutral } =
      if (snapshot.devCommitsWeekly >= 200) #bull
      else if (snapshot.devCommitsWeekly <= 30) #bear
      else #neutral;

    // --- TVL ---
    // Baseline: $50M = neutral; >$100M bull, <$10M bear.
    let tvlScore : Float = clamp((snapshot.tvlUsd - 10_000_000.0) / 90_000_000.0 * 100.0);
    let tvlSignal : { #bull; #bear; #neutral } =
      if (snapshot.tvlUsd >= 100_000_000.0) #bull
      else if (snapshot.tvlUsd <= 10_000_000.0) #bear
      else #neutral;

    let overallScore : Float =
      (priceScore * 30.0 + burnScore * 20.0 + addrScore * 20.0 +
       devScore * 15.0 + tvlScore * 15.0) / 100.0;

    let factors : [Types.MetricSignal] = [
      {
        name = "Price Momentum (24h)";
        value = (if (snapshot.icpPrice24hChange >= 0.0) "+" else "") #
                snapshot.icpPrice24hChange.toText() # "%";
        signal = priceSignal;
      },
      {
        name = "Cycle Burn Rate";
        value = snapshot.cycleBurnRateTcycles.toText() # " Tcycles/day";
        signal = burnSignal;
      },
      {
        name = "Active Addresses (24h)";
        value = snapshot.activeAddresses24h.toText();
        signal = addrSignal;
      },
      {
        name = "Developer Commits (weekly)";
        value = snapshot.devCommitsWeekly.toText();
        signal = devSignal;
      },
      {
        name = "Total Value Locked";
        value = "$" # (snapshot.tvlUsd / 1_000_000.0).toText() # "M";
        signal = tvlSignal;
      },
    ];

    { drivingFactors = factors; overallScore };
  };

  /// Returns all stored protocol events.
  public func listEvents(events : List.List<Types.ProtocolEvent>) : [Types.ProtocolEvent] {
    events.toArray();
  };

  // ---------------------------------------------------------------------------
  // JSON parsing helpers (minimal, hand-rolled for CoinGecko simple/price)
  // ---------------------------------------------------------------------------

  /// Extract the float value of a named key from a flat JSON object.
  /// Works for: `"key":1.23` or `"key": -4.56`
  public func extractFloat(json : Text, key : Text) : ?Float {
    let needle = "\"" # key # "\":";
    let parts = json.split(#text needle);
    ignore parts.next(); // discard the part before the needle
    switch (parts.next()) {
      case null null;
      case (?after) {
        let trimmed = after.trimStart(#char ' ');
        // Collect numeric characters: sign, digits, decimal point, exponent
        var buf = "";
        var started = false;
        for (c in trimmed.toIter()) {
          if (not started and (c == '-' or c == '+' or (c >= '0' and c <= '9'))) {
            buf #= Text.fromChar(c);
            started := true;
          } else if (started and (c == '.' or (c >= '0' and c <= '9') or c == 'e' or c == 'E' or c == '-' or c == '+')) {
            buf #= Text.fromChar(c);
          } else if (started) {
            // Non-numeric char after we started: we've captured the number
            // Can't break, but buf already has what we need - continue without adding
            started := false; // stop appending
          };
        };
        // Parse collected digits as integer numerator/denominator
        // Motoko has no Float.fromText, so we split on '.'
        let subParts = buf.split(#char '.');
        switch (subParts.next()) {
          case null null;
          case (?intPart) {
            let isNeg = intPart.startsWith(#text "-");
            let absInt = if (isNeg) intPart.trimStart(#text "-") else intPart;
            switch (Int.fromText(absInt)) {
              case null null;
              case (?intVal) {
                let baseF : Float = intVal.toFloat();
                let fracF : Float = switch (subParts.next()) {
                  case null 0.0;
                  case (?fracStr) {
                    switch (Int.fromText(fracStr)) {
                      case null 0.0;
                      case (?fracVal) {
                        // Scale factor: 10^(fracStr.size())
                        var scale = 1.0;
                        var k = 0;
                        while (k < fracStr.size()) { scale *= 10.0; k += 1 };
                        fracVal.toFloat() / scale;
                      };
                    };
                  };
                };
                ?(if (isNeg) -(baseF + fracF) else baseF + fracF);
              };
            };
          };
        };
      };
    };
  };

  /// Simulates minor variance to keep seeded metrics realistic on each refresh.
  /// `seed` should be a value that changes over time (e.g. timestamp mod N).
  public func jitter(base : Float, seed : Int, range : Float) : Float {
    // Deterministic perturbation using seed.
    let s = ((seed % 100) + 100) % 100; // 0..99
    let sF : Float = s.toFloat();
    base + (sF / 100.0 - 0.5) * 2.0 * range;
  };

  public func jitterNat(base : Nat, seed : Int, range : Nat) : Nat {
    let s = ((seed % 100) + 100) % 100; // 0..99
    // Map 0..99 → [-range, +range] as Int
    let delta : Int = (s * range.toInt() * 2) / 99 - range.toInt();
    let result : Int = base.toInt() + delta;
    if (result < 0) 0 else result.toNat();
  };
  /// Extract the Nat64 value of a named key from a flat JSON object.
  /// Works for integer values like proposal IDs and vote counts.
  public func extractNat64(json : Text, key : Text) : ?Nat64 {
    let needle = "\"" # key # "\":";
    let parts = json.split(#text needle);
    ignore parts.next();
    switch (parts.next()) {
      case null null;
      case (?after) {
        let trimmed = after.trimStart(#char ' ');
        var buf = "";
        var started = false;
        for (c in trimmed.toIter()) {
          if (not started and c >= '0' and c <= '9') {
            buf #= Text.fromChar(c);
            started := true;
          } else if (started and c >= '0' and c <= '9') {
            buf #= Text.fromChar(c);
          } else if (started) {
            started := false;
          };
        };
        switch (Int.fromText(buf)) {
          case null null;
          case (?n) {
            if (n < 0) null
            else ?Nat64.fromNat(n.toNat());
          };
        };
      };
    };
  };

  /// Extract a quoted string value of a named key from a JSON object.
  /// Works for: `"key":"somevalue"`
  public func extractString(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":";
    let parts = json.split(#text needle);
    ignore parts.next();
    switch (parts.next()) {
      case null null;
      case (?after) {
        let trimmed = after.trimStart(#char ' ');
        // Must start with a quote
        if (not trimmed.startsWith(#text "\"")) { return null };
        let inner = trimmed.trimStart(#text "\"");
        // Collect until next quote (simple scan for well-formed API responses)
        var buf = "";
        var done = false;
        for (c in inner.toIter()) {
          if (done) { /* skip */ }
          else if (Text.fromChar(c) == "\"") { done := true; }
          else { buf #= Text.fromChar(c) };
        };
        ?buf;
      };
    };
  };

  /// Check if a proposal title or topic contains Mission-70-related keywords.
  public func isMission70(title : Text, topic : Text) : Bool {
    let keywords = ["Mission 70", "M70", "neuron fund", "ecosystem growth", "SNS treasury", "developer grants"];
    let combined = title.toLower() # " " # topic.toLower();
    var found = false;
    for (kw in keywords.values()) {
      if (combined.contains(#text (kw.toLower()))) { found := true };
    };
    found;
  };

  /// Parse a single proposal JSON object (the {...} block for one proposal).
  /// Returns null if required fields are missing.
  public func parseProposal(obj : Text) : ?Types.NnsProposal {
    let idOpt       = extractNat64(obj, "id");
    let titleOpt    = extractString(obj, "title");
    let summaryOpt  = extractString(obj, "summary");
    let statusOpt   = extractNat64(obj, "status");
    let topicOpt    = extractString(obj, "topic");
    let proposerOpt = extractString(obj, "proposer");
    let votesYesOpt = extractNat64(obj, "tally_yes");
    let votesNoOpt  = extractNat64(obj, "tally_no");
    let deadlineOpt = extractFloat(obj, "deadline_timestamp_seconds");

    switch (idOpt, titleOpt) {
      case (?pid, ?ptitle) {
        let summary  = switch (summaryOpt)  { case (?s) s; case null "" };
        let topic    = switch (topicOpt)    { case (?t) t; case null "" };
        let proposer = switch (proposerOpt) { case (?p) p; case null "" };
        let votesYes = switch (votesYesOpt) { case (?v) v; case null 0 : Nat64 };
        let votesNo  = switch (votesNoOpt)  { case (?v) v; case null 0 : Nat64 };
        let statusN  = switch (statusOpt)   { case (?s) s; case null 0 : Nat64 };
        let deadline : Int = switch (deadlineOpt) {
          case (?d) {
            // d is seconds since epoch; convert to nanoseconds
            let secs : Int = if (d >= 0.0) d.toInt() else 0;
            secs * 1_000_000_000;
          };
          case null 0;
        };
        let status : Types.NnsProposalStatus = 
          if (statusN == 1) #open
          else if (statusN == 2) #rejected
          else if (statusN == 3) #adopted
          else if (statusN == 4) #executing
          else if (statusN == 5) #executed
          else if (statusN == 6) #failed
          else #open;
        ?{
          id = pid;
          title = ptitle;
          summary;
          status;
          topic;
          proposer;
          votesYes;
          votesNo;
          votingPeriodEnd = deadline;
          isMission70Related = isMission70(ptitle, topic);
        };
      };
      case _ null;
    };
  };

  /// Split a JSON array body into individual object strings.
  /// Input: the raw JSON array text (e.g. `[{...},{...}]`).
  /// Returns an array of individual `{...}` strings (best-effort, not fully recursive).
  public func splitJsonArray(json : Text) : [Text] {
    // Find the opening '['
    let stripped = json.trimStart(#char ' ');
    if (not stripped.startsWith(#text "[")) { return [] };
    var inner = stripped.trimStart(#text "[");
    inner := inner.trimEnd(#char ' ');
    // Strip trailing ']'
    if (inner.endsWith(#text "]")) {
      inner := inner.trimEnd(#text "]");
    };
    // Split on top-level object boundaries by counting braces
    var objects : [Text] = [];
    var depth = 0;
    var current = "";
    for (c in inner.toIter()) {
      if (c == '{') {
        depth += 1;
        current #= Text.fromChar(c);
      } else if (c == '}') {
        current #= Text.fromChar(c);
        depth -= 1;
        if (depth == 0) {
          objects := objects.concat([current]);
          current := "";
        };
      } else {
        if (depth > 0) { current #= Text.fromChar(c) };
      };
    };
    objects;
  };
};
