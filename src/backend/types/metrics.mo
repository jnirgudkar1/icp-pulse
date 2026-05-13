
module {
  public type MetricSnapshot = {
    timestamp : Int;
    icpPriceUsd : Float;
    icpPrice24hChange : Float;
    cycleBurnRateTcycles : Float;
    burnRateIsReal : Bool;
    activeAddresses24h : Nat;
    activeAddressesIsReal : Bool;
    activeAddresses7d : Nat;
    activeAddresses30d : Nat;
    devCommitsWeekly : Nat;
    totalCanistersDeployed : Nat;
    tvlUsd : Float;
    sentimentScore : Float;
  };

  public type ProtocolEvent = {
    date : Text;
    title : Text;
    category : { #mission70; #chainFusion; #governance; #other };
  };

  public type MetricSignal = {
    name : Text;
    value : Text;
    signal : { #bull; #bear; #neutral };
  };

  public type SentimentBreakdown = {
    drivingFactors : [MetricSignal];
    overallScore : Float;
  };

  public type DataSourceStatus = {
    icpPriceLive : Bool;
    burnRateLive : Bool;
    activeAddressesLive : Bool;
    proposalsLive : Bool;
  };

  public type RefreshResult = { #ok : { snapshot : MetricSnapshot; dataSourceStatus : DataSourceStatus }; #err : Text };

  public type NnsProposalStatus = {
    #open;
    #adopted;
    #rejected;
    #executing;
    #executed;
    #failed;
  };

  public type NnsProposal = {
    id : Nat64;
    title : Text;
    summary : Text;
    status : NnsProposalStatus;
    topic : Text;
    proposer : Text;
    votesYes : Nat64;
    votesNo : Nat64;
    votingPeriodEnd : Int;
    isMission70Related : Bool;
  };
};
