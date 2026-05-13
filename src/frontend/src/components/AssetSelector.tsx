interface AssetConfig {
  ticker: string;
  name: string;
  color: string;
}

const ASSETS: AssetConfig[] = [
  { ticker: "ICP", name: "Internet Computer", color: "#00B7D4" },
  { ticker: "BTC", name: "Bitcoin", color: "#F7931A" },
  { ticker: "ETH", name: "Ethereum", color: "#A855F7" },
  { ticker: "SOL", name: "Solana", color: "#14F195" },
  { ticker: "XRP", name: "XRP", color: "#346AA9" },
  { ticker: "ADA", name: "Cardano", color: "#0B5EA7" },
  { ticker: "AVAX", name: "Avalanche", color: "#E84142" },
  { ticker: "INJ", name: "Injective", color: "#6366F1" },
  { ticker: "FET", name: "Fetch.ai", color: "#14B8A6" },
];

interface AssetSelectorProps {
  activeAsset: string;
  onSelect: (ticker: string) => void;
}

export function AssetSelector({ activeAsset, onSelect }: AssetSelectorProps) {
  return (
    <div
      className="bg-card border-b border-border px-4 py-2.5 overflow-x-auto"
      data-ocid="asset.selector"
    >
      <div className="flex items-center gap-1.5 min-w-max">
        {ASSETS.map((asset) => {
          const isActive = activeAsset === asset.ticker;
          return (
            <button
              key={asset.ticker}
              type="button"
              onClick={() => onSelect(asset.ticker)}
              data-ocid={`asset.${asset.ticker.toLowerCase()}.tab`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-body text-[11px] font-medium tracking-widest uppercase transition-all duration-200 whitespace-nowrap bg-transparent border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              style={
                isActive
                  ? {
                      color: asset.color,
                      borderColor: `${asset.color}99`,
                      backgroundColor: `${asset.color}26`,
                    }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: asset.color }}
              />
              {asset.ticker}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ASSETS };
export type { AssetConfig };
