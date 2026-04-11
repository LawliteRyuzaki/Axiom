"use client";
import AxiomLogo from "./AxiomLogo";
import type { SessionStatus } from "@/types";

const STATUS: Record<SessionStatus, { dot: string; label: string }> = {
  idle:      { dot: "var(--mist)",       label: "Standby"  },
  queued:    { dot: "#D97706",           label: "Queued"   },
  running:   { dot: "var(--term-green)", label: "Active"   },
  completed: { dot: "var(--term-green)", label: "Complete" },
  partial:   { dot: "#D97706",           label: "Partial"  },
  failed:    { dot: "var(--term-red)",   label: "Error"    },
};

interface Props {
  status: SessionStatus;
  onNewSession: () => void;
  showNav: boolean;
}

export default function NavBar({ status, onNewSession, showNav }: Props) {
  const s = STATUS[status] ?? { dot: "var(--mist)", label: "Standby" };

  return (
    <nav className="glass-nav sticky top-0 z-50 h-14 flex items-center px-5 gap-4">
      {/* Brand */}
      <button
        onClick={onNewSession}
        className="flex items-center gap-2.5 shrink-0 group"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <AxiomLogo size={24} />
        <span style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "1.1rem",
          color: "var(--carbon)",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}>
          Axiom
        </span>
      </button>

      <div style={{ flex: 1 }} />

      {/* Status pill — only when active */}
      {showNav && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "99px",
          border: "1px solid var(--rule-h)",
          background: "var(--carbon-10)",
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s.dot,
            flexShrink: 0,
            animation: status === "running" ? "pulse-glow 1.4s ease infinite" : "none",
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "var(--ghost)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            {s.label}
          </span>
        </div>
      )}

      {showNav && (
        <button
          onClick={onNewSession}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--ghost)",
            background: "none",
            border: "1px solid var(--rule-h)",
            borderRadius: "6px",
            padding: "5px 12px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "var(--carbon)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--carbon-25)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "var(--ghost)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--rule-h)";
          }}
        >
          New Session
        </button>
      )}
    </nav>
  );
}
