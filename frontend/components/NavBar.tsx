"use client";
import AxiomLogo from "./AxiomLogo";
import type { SessionStatus } from "@/types";

const STATUS_MAP: Record<SessionStatus, { color: string; label: string; pulse: boolean }> = {
  idle:      { color: "var(--fog)",       label: "Ready",     pulse: false },
  queued:    { color: "var(--term-amber)", label: "Queued",   pulse: true  },
  running:   { color: "var(--term-green)", label: "Running",  pulse: true  },
  completed: { color: "var(--term-green)", label: "Done",     pulse: false },
  partial:   { color: "var(--term-amber)", label: "Partial",  pulse: false },
  failed:    { color: "var(--term-red)",   label: "Error",    pulse: false },
};

interface Props {
  status: SessionStatus;
  onNewSession: () => void;
  showNav: boolean;
}

export default function NavBar({ status, onNewSession, showNav }: Props) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.idle;

  return (
    <nav
      className="glass-nav h-14"
      style={{ display: "flex", alignItems: "center", padding: "0 20px", gap: "12px" }}
    >
      {/* Brand — clicking always returns to landing */}
      <button
        onClick={onNewSession}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "none", border: "none", cursor: "pointer", padding: "0",
          flexShrink: 0,
        }}
        aria-label="Axiom home"
      >
        <AxiomLogo size={28} />
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "1.0625rem",
          color: "var(--carbon)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}>
          axiom
        </span>
      </button>

      {/* Divider */}
      {showNav && (
        <span style={{ width: 1, height: 16, background: "var(--rule-strong)", flexShrink: 0 }} />
      )}

      {/* Breadcrumb copy — shown in research mode */}
      {showNav && (
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.8125rem",
          fontWeight: 300,
          color: "var(--mist)",
          letterSpacing: "0.01em",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          Synthesis in progress
        </span>
      )}

      <div style={{ flex: showNav ? "0 0 auto" : 1 }} />

      {/* Status badge */}
      {showNav && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 11px",
          borderRadius: 99,
          border: "1px solid var(--rule-strong)",
          background: "rgba(255,255,255,0.5)",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: s.color, flexShrink: 0,
            animation: s.pulse ? "glow-pulse 1.5s ease infinite" : "none",
          }} />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            color: "var(--slate)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            {s.label}
          </span>
        </div>
      )}

      {/* New session CTA */}
      {showNav && (
        <button
          onClick={onNewSession}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--slate)",
            background: "rgba(255,255,255,0.5)",
            border: "1px solid var(--rule-strong)",
            borderRadius: "8px",
            padding: "5px 14px",
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "var(--crimson-faint)";
            el.style.borderColor = "var(--crimson-mid)";
            el.style.color = "var(--crimson)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(255,255,255,0.5)";
            el.style.borderColor = "var(--rule-strong)";
            el.style.color = "var(--slate)";
          }}
        >
          New session
        </button>
      )}
    </nav>
  );
}
