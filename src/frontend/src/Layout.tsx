import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  lastUpdated?: number;
}

function formatTimestamp(ts: number): string {
  if (!ts) return "—";
  return `${new Date(ts).toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

export function Layout({ children, lastUpdated }: LayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col bg-background text-foreground"
      data-ocid="app.page"
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 h-12 bg-card border-b border-border shadow-sm shrink-0"
        data-ocid="app.header"
      >
        <div className="flex items-center gap-3">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="9"
              stroke="var(--primary)"
              strokeWidth="2"
            />
            <circle cx="11" cy="11" r="4" fill="var(--primary)" opacity="0.6" />
            <path
              d="M11 2 Q14 11 11 20"
              stroke="var(--primary)"
              strokeWidth="1"
              fill="none"
            />
          </svg>
          <span className="font-display font-bold text-sm tracking-widest uppercase text-foreground">
            ICP Pulse
          </span>
        </div>
        <div
          className="font-body text-xs text-muted-foreground tracking-widest uppercase"
          data-ocid="header.last_updated"
        >
          {lastUpdated ? (
            <>
              <span className="text-muted-foreground/60 mr-1">
                Last Update:
              </span>
              <span className="text-foreground/70">
                {formatTimestamp(lastUpdated)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground/40">Connecting…</span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background" data-ocid="app.main">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="shrink-0 border-t border-border bg-card/60 px-6 py-3 flex items-center justify-between"
        data-ocid="app.footer"
      >
        <span className="font-body text-[10px] text-muted-foreground tracking-widest uppercase">
          © {new Date().getFullYear()} ICP Pulse
        </span>
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[10px] text-muted-foreground/50 hover:text-muted-foreground tracking-widest uppercase transition-colors duration-200"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
