import Types "types/metrics";
import AssetTypes "types/assets";
import MetricsMixin "mixins/metrics-api";
import AssetApiMixin "mixins/assetApi";
import List "mo:core/List";
import Queue "mo:core/Queue";
import Map "mo:core/Map";
import Text "mo:core/Text";



actor {
  let snapshots = Queue.empty<Types.MetricSnapshot>();
  let events = List.empty<Types.ProtocolEvent>();
  let proposals = List.empty<Types.NnsProposal>();

  // Multi-asset snapshot store: ticker -> List<AssetSnapshot>
  let assetSnapshots = Map.empty<Text, List.List<AssetTypes.AssetSnapshot>>();

  // Seed 5 protocol events on first deploy
  do {
    if (events.isEmpty()) {
      events.add({
        date = "2024-04-01";
        title = "Mission 70 Launch — ICP sets goal of 70 sovereign projects";
        category = #mission70;
      });
      events.add({
        date = "2025-01-15";
        title = "Chain Fusion ETH Integration — native Ethereum connectivity live";
        category = #chainFusion;
      });
      events.add({
        date = "2024-11-10";
        title = "SNS Governance Expansion — new framework for community-run DAOs";
        category = #governance;
      });
      events.add({
        date = "2025-02-20";
        title = "ICP Ecosystem Fund Announcement — $50M allocated for developer grants";
        category = #other;
      });
      events.add({
        date = "2025-03-05";
        title = "Community-Driven Neuron Initiative — grassroots governance participation surge";
        category = #governance;
      });
    };
  };

  include MetricsMixin(snapshots, events, proposals);
  include AssetApiMixin(assetSnapshots);
};

