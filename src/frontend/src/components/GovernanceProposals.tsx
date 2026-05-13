import { NnsProposalStatus } from "../backend.d";
import type { NnsProposal } from "../types";

interface GovernanceProposalsProps {
  proposals: NnsProposal[];
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: NnsProposalStatus }) {
  const map: Record<NnsProposalStatus, { label: string; cls: string }> = {
    [NnsProposalStatus.open]: {
      label: "Open",
      cls: "bg-accent/15 text-accent border-accent/30",
    },
    [NnsProposalStatus.adopted]: {
      label: "Adopted",
      cls: "bg-primary/15 text-primary border-primary/30",
    },
    [NnsProposalStatus.rejected]: {
      label: "Rejected",
      cls: "bg-secondary/15 text-secondary border-secondary/30",
    },
    [NnsProposalStatus.executing]: {
      label: "Executing",
      cls: "bg-primary/15 text-primary border-primary/30",
    },
    [NnsProposalStatus.executed]: {
      label: "Executed",
      cls: "bg-primary/10 text-primary/70 border-primary/20",
    },
    [NnsProposalStatus.failed]: {
      label: "Failed",
      cls: "bg-muted/30 text-muted-foreground border-border",
    },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-muted/30 text-muted-foreground border-border",
  };
  return (
    <span
      className={`font-body text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${cls}`}
    >
      {label}
    </span>
  );
}

function TopicBadge({ topic }: { topic: string }) {
  return (
    <span className="font-body text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border bg-accent/10 text-accent border-accent/20">
      {topic}
    </span>
  );
}

function VoteBar({ yes, no }: { yes: bigint; no: bigint }) {
  const total = Number(yes + no);
  if (total === 0) return null;
  const yesPct = (Number(yes) / total) * 100;
  return (
    <div className="mt-2">
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground mb-1">
        <span>Yes {yesPct.toFixed(0)}%</span>
        <span>No {(100 - yesPct).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${yesPct}%` }}
        />
      </div>
    </div>
  );
}

function DeadlineBadge({ ts }: { ts: bigint }) {
  const ms = Number(ts);
  if (!ms || ms < Date.now()) return null;
  const diff = ms - Date.now();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const label = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
  return (
    <span className="font-mono text-[9px] text-muted-foreground/70">
      ⏱ {label}
    </span>
  );
}

function ProposalCard({
  proposal,
  index,
}: { proposal: NnsProposal; index: number }) {
  return (
    <div
      className="rounded-md border border-border bg-card/60 px-4 py-3 flex flex-col gap-1.5 hover:border-primary/40 transition-colors duration-200"
      data-ocid={`governance.proposal.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="font-body text-xs text-foreground font-medium leading-snug flex-1 min-w-0">
          {proposal.title}
        </p>
        <StatusBadge status={proposal.status} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <TopicBadge topic={proposal.topic} />
        {proposal.status === NnsProposalStatus.open && (
          <DeadlineBadge ts={proposal.votingPeriodEnd} />
        )}
      </div>
      {proposal.summary && (
        <p className="font-body text-[10px] text-muted-foreground leading-snug line-clamp-2">
          {proposal.summary}
        </p>
      )}
      <VoteBar yes={proposal.votesYes} no={proposal.votesNo} />
      <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">
        Proposer: {proposal.proposer} · ID #{proposal.id.toString()}
      </p>
    </div>
  );
}

export function GovernanceProposals({
  proposals,
  isLoading,
}: GovernanceProposalsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" data-ocid="governance.loading_state">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-md border border-border bg-card/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!proposals.length) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 gap-3"
        data-ocid="governance.empty_state"
      >
        <span className="text-3xl">🗳️</span>
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground text-center">
          No governance proposals loaded yet
        </p>
        <p className="font-body text-[10px] text-muted-foreground/60 text-center max-w-xs">
          Proposals will appear here once the backend fetches data from the NNS.
        </p>
      </div>
    );
  }

  const mission70 = proposals.filter((p) => p.isMission70Related);
  // Sort: open first, then adopted/executing/executed, then rejected/failed
  const statusOrder: Record<string, number> = {
    [NnsProposalStatus.open]: 0,
    [NnsProposalStatus.adopted]: 1,
    [NnsProposalStatus.executing]: 2,
    [NnsProposalStatus.executed]: 3,
    [NnsProposalStatus.rejected]: 4,
    [NnsProposalStatus.failed]: 5,
  };
  const allSorted = [...proposals].sort(
    (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9),
  );

  return (
    <div className="flex flex-col gap-6" data-ocid="governance.panel">
      {/* Mission 70 Milestones */}
      {mission70.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
              Mission 70 Milestones
            </h3>
            <span className="font-body text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border bg-primary/15 text-primary border-primary/30">
              {mission70.length} tracked
            </span>
          </div>
          <div
            className="flex flex-col gap-2"
            data-ocid="governance.mission70.list"
          >
            {mission70.map((p, i) => (
              <ProposalCard key={p.id.toString()} proposal={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* All NNS Proposals */}
      <div className="flex flex-col gap-3">
        <h3 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
          All NNS Proposals
        </h3>
        <div
          className="flex flex-col gap-2"
          data-ocid="governance.all_proposals.list"
        >
          {allSorted.map((p, i) => (
            <ProposalCard key={p.id.toString()} proposal={p} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
