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

interface Props {
  status: SessionStatus;
  onLogoClick: () => void;
  sessionTitle?: string;
  // true = research view (show status pill)
  // false = landing view (logo opens history drawer)
  showNav: boolean;
}

export default function NavBar({ status, onLogoClick, sessionTitle, showNav }: Props) {
  const s = S[status] ?? S.idle;

  // Tooltip text changes based on view context
  const logoTooltip = showNav
    ? "Toggle sessions panel"
    : "View research history";

  return (
    <nav
      className="glass-nav"
      style={{
        height:   52,
        display:  "flex",
        alignItems: "center",
        padding:  "0 18px",
        position: "sticky",
        top:      0,
        zIndex:   50,
      }}
    >
      {/* ── Logo button ─────────────────────────────────────────────── */}
      {/* On landing view: opens history drawer
          On research view: toggles left sidebar                        */}
      <button
        onClick={onLogoClick}
        title={logoTooltip}
        aria-label={logoTooltip}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          9,
          background:   "none",
          border:       "none",
          cursor:       "pointer",
          padding:      "4px 8px",
          borderRadius: "var(--radius)",
          flexShrink:   0,
          transition:   "background 0.14s, opacity 0.14s",
          outline:      "none",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "var(--overlay-soft)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "none";
        }}
      >
        <AxiomLogo size={22} />
        <span style={{
          fontFamily:    "var(--font-ui)",
          fontWeight:    700,
          fontSize:      "0.9375rem",
          color:         "var(--text-primary)",
          letterSpacing: "-0.025em",
          lineHeight:    1,
        }}>
          Axiom
        </span>
      </button>

      {/* ── Separator (research view only) ──────────────────────────── */}
      {showNav && (
        <div style={{
          width:      1,
          height:     20,
          background: "var(--border)",
          margin:     "0 14px",
          flexShrink: 0,
        }} />
      )}

      {/* ── Session title (research view only) ──────────────────────── */}
      {showNav && sessionTitle && (
        <span style={{
          flex:          1,
          fontFamily:    "var(--font-ui)",
          fontSize:      "0.8125rem",
          fontWeight:    400,
          color:         "var(--text-muted)",
          letterSpacing: "-0.005em",
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          whiteSpace:    "nowrap",
          maxWidth:      520,
        }}>
          {sessionTitle}
        </span>
      )}

      {!showNav && <div style={{ flex: 1 }} />}

      {/* ── Status pill (research view only) ────────────────────────── */}
      {showNav && (
        <div style={{
          display:    "flex",
          alignItems: "center",
          gap:        6,
          padding:    "4px 10px",
          borderRadius: 99,
          background: "var(--bg)",
          border:     "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <span style={{
            width:        6,
            height:       6,
            borderRadius: "50%",
            background:   s.dot,
            flexShrink:   0,
            animation: (status === "running" || status === "queued")
              ? "soft-pulse 1.4s ease infinite" : "none",
          }} />
          <span style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.625rem",
            fontWeight:    400,
            color:         "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.09em",
          }}>
            {s.label}
          </span>
        </div>
      )}
    </nav>
  );
}
