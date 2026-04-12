"use client";
import AxiomLogo from "./AxiomLogo";
import type { SessionStatus } from "@/types";

const S: Record<SessionStatus, { dot: string; label: string }> = {
  idle:      { dot: "var(--border-med)",  label: "Ready"    },
  queued:    { dot: "var(--term-amber)",  label: "Queued"   },
  running:   { dot: "var(--term-green)",  label: "Running"  },
  completed: { dot: "var(--term-green)",  label: "Complete" },
  partial:   { dot: "var(--term-amber)",  label: "Partial"  },
  failed:    { dot: "var(--term-red)",    label: "Error"    },
};

interface Props { status: SessionStatus; onNewSession: () => void; showNav: boolean; }

export default function NavBar({ status, onNewSession, showNav }: Props) {
  const s = S[status] ?? S.idle;

  return (
    <nav
      className="glass-nav"
      style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        gap: 10,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand */}
      <button
        onClick={onNewSession}
        style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          flexShrink: 0,
        }}
        aria-label="Axiom home"
      >
        <AxiomLogo size={22} />
        <span style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 700,
          fontSize: "0.9375rem",
          color: "var(--text-primary)",
          letterSpacing: "-0.025em",
          lineHeight: 1,
        }}>
          Axiom
        </span>
      </button>

      <div style={{ flex: 1 }} />

      {showNav && (
        <>
          {/* Status */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px",
            borderRadius: 99,
            background: "var(--bg)",
            border: "1px solid var(--border)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: s.dot, flexShrink: 0,
              animation: (status === "running" || status === "queued")
                ? "soft-pulse 1.4s ease infinite" : "none",
            }} />
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.625rem",
              fontWeight: 400,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.09em",
            }}>
              {s.label}
            </span>
          </div>

          <button
            onClick={onNewSession}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "5px 13px",
              cursor: "pointer",
              transition: "all 0.14s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "var(--text-primary)";
              el.style.borderColor = "var(--border-med)";
              el.style.background = "var(--surface)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "var(--text-muted)";
              el.style.borderColor = "var(--border)";
              el.style.background = "transparent";
            }}
          >
            New session
          </button>
        </>
      )}
    </nav>
  );
}
