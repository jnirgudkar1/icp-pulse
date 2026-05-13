import Debug "mo:core/Debug";

module {

  /// Supported asset identifiers
  public type AssetId = {
    #ICP;
    #BTC;
    #ETH;
    #SOL;
    #XRP;
    #ADA;
    #AVAX;
    #INJ;
    #FET;
  };

  /// A protocol or ecosystem event tied to a specific asset
  public type AssetProtocolEvent = {
    title : Text;
    description : Text;
    eventType : Text;
    timestamp : Int;
    assetId : AssetId;
  };

  /// Full asset snapshot capturing price, sentiment, and on-chain signals
  public type AssetSnapshot = {
    assetId : AssetId;
    price : Float;
    priceChange24h : Float;
    priceChange7d : Float;
    marketCap : Float;
    volume24h : Float;
    sentimentScore : Nat;
    metrics : [(Text, Float)];
    events : [AssetProtocolEvent];
    timestamp : Int;
  };

  /// Returns the ticker string for an asset (e.g., #BTC -> "BTC")
  public func assetIdToText(id : AssetId) : Text {
    switch id {
      case (#ICP)  "ICP";
      case (#BTC)  "BTC";
      case (#ETH)  "ETH";
      case (#SOL)  "SOL";
      case (#XRP)  "XRP";
      case (#ADA)  "ADA";
      case (#AVAX) "AVAX";
      case (#INJ)  "INJ";
      case (#FET)  "FET";
    };
  };

  /// Returns the CoinGecko coin ID for an asset
  public func assetIdToCoinGeckoId(id : AssetId) : Text {
    switch id {
      case (#ICP)  "internet-computer";
      case (#BTC)  "bitcoin";
      case (#ETH)  "ethereum";
      case (#SOL)  "solana";
      case (#XRP)  "ripple";
      case (#ADA)  "cardano";
      case (#AVAX) "avalanche-2";
      case (#INJ)  "injective-protocol";
      case (#FET)  "fetch-ai";
    };
  };
};
