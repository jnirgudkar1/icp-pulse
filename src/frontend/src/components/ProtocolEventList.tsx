import { EventCategory } from "../types";
import type { ProtocolEvent } from "../types";

interface ProtocolEventListProps {
  events: ProtocolEvent[];
  limit?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  [EventCategory.mission70]: "Mission 70",
  [EventCategory.chainFusion]: "Chain Fusion",
  [EventCategory.governance]: "Governance",
  [EventCategory.other]: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  [EventCategory.mission70]: "text-primary border-primary/40 bg-primary/10",
  [EventCategory.chainFusion]: "text-accent border-accent/40 bg-accent/10",
  [EventCategory.governance]: "text-chart-3 border-chart-3/40 bg-chart-3/10",
  [EventCategory.other]: "text-muted-foreground border-border bg-muted",
};

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category;
  const cls =
    CATEGORY_COLORS[category] ?? "text-muted-foreground border-border bg-muted";
  return (
    <span
      className={`font-body text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded border ${cls}`}
    >
      {label}
    </span>
  );
}

// Fallback seed events shown when backend returns empty
const SEED_EVENTS: ProtocolEvent[] = [
  {
    date: "2024-05-01",
    title: "Mission 70: 70% of ICP supply staked milestone",
    category: EventCategory.mission70,
  },
  {
    date: "2024-04-18",
    title: "Chain Fusion BTC integration live on mainnet",
    category: EventCategory.chainFusion,
  },
  {
    date: "2024-04-05",
    title: "NNS governance proposal #134 passed: reduced dissolve delay",
    category: EventCategory.governance,
  },
  {
    date: "2024-03-22",
    title: "ICP reaches 45k+ canisters deployed",
    category: EventCategory.other,
  },
  {
    date: "2024-03-10",
    title: "Chain Fusion ETH signer nodes activated",
    category: EventCategory.chainFusion,
  },
];

export function ProtocolEventList({
  events,
  limit = 5,
}: ProtocolEventListProps) {
  const displayed = (events.length > 0 ? events : SEED_EVENTS).slice(0, limit);

  return (
    <div className="flex flex-col gap-0" data-ocid="events.list">
      {displayed.map((ev, i) => (
        <div
          key={`${ev.date}-${i}`}
          className="flex items-start gap-3 px-0 py-3 border-b border-border last:border-0"
          data-ocid={`events.item.${i + 1}`}
        >
          <span className="font-body text-xs text-muted-foreground whitespace-nowrap mt-0.5 min-w-[76px]">
            {ev.date}
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-body text-xs text-foreground leading-snug break-words">
              {ev.title}
            </span>
            <CategoryBadge
              category={
                typeof ev.category === "object"
                  ? Object.keys(ev.category)[0]
                  : (ev.category as string)
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
