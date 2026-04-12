"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LogEntry, SessionStatus, ResearchState } from "@/types";

const STATUS_CFG: Partial<Record<SessionStatus, { label: string; color: string }>> = {
  idle:      { label: "IDLE",    color: "var(--term-dim)"    },
  queued:    { label: "QUEUED",  color: "var(--term-amber)"  },
  running:   { label: "RUNNING", color: "var(--term-green)"  },
  completed: { label: "DONE",    color: "var(--term-green)"  },
  partial:   { label: "PARTIAL", color: "var(--term-amber)"  },
  failed:    { label: "ERROR",   color: "var(--term-red)"    },
};
const FALLBACK = { label: "IDLE", color: "#888" };

function logCls(lvl: LogEntry["level"]) {
  const m: Record<LogEntry["level"], string> = {
    success: "log-success",
    warn:    "log-warn",
    error:   "log-error",
    dim:     "log-dim",
    default: "log-default",
  };
  return m[lvl] ?? "log-default";
}

export default function AgentHub({ state }: { state: ResearchState }) {
  const { logs, queries, status, model, duration, sessionId, partial } = state;

  // ── Safety: optional-chained cfg access prevents undefined crash ──────────
  const cfg = STATUS_CFG[status] ?? FALLBACK;

  const isRunning = status === "running";
  const isDone    = status === "completed" || status === "partial";
  const endRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <aside className="hub-panel">
      {/* ── Header — height aligned with InvestigationSidebar header ─── */}
      {/* InvestigationSidebar header is ~52px (button 36 + padding 8+8).
          We match that with padding + explicit min-height. */}
      <div style={{
        padding: "0 14px",
        minHeight: 52,           // ← matches sidebar header height
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        background: "var(--sidebar-bg)",
      }}>
        <span style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          Agent Log
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: cfg?.color ?? "#888",   // ← optional chaining safety
          letterSpacing: "0.07em",
        }}>
          {cfg?.label ?? "IDLE"}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* macOS-style titlebar */}
        <div style={{
          background: "#161B22",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
          borderBottom: "1px solid #21262D",
        }}>
          {["#FF5F57", "#FFBD2E", "#28C840"].map(c => (
            <span key={c} style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: c,
              flexShrink: 0,
            }} />
          ))}
          <span style={{
            marginLeft: 8,
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            color: "#484F58",
            letterSpacing: "0.06em",
          }}>
            axiom-runtime
          </span>
        </div>

        {/* ── Log stream ──────────────────────────────────────────────── */}
        <div className="terminal">
          <div className="log-dim" style={{ marginBottom: 8 }}>
            $ axiom run --session {sessionId?.slice(0, 8) ?? "--------"}
          </div>

          <AnimatePresence initial={false}>
            {logs.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
                className={logCls(entry.level)}
                style={{ display: "flex", gap: 10, lineHeight: 1.7 }}
              >
                <span className="log-dim" style={{ flexShrink: 0, userSelect: "none" }}>
                  {entry.timestamp}
                </span>
                <span style={{ wordBreak: "break-word" }}>{entry.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {isRunning && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
              <span className="log-dim">$</span>
              <span style={{
                display: "inline-block",
                width: 6,
                height: 13,
                background: "var(--term-green)",
                animation: "blink 1s linear infinite",
              }} />
            </div>
          )}

          {isDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #21262D" }}
            >
              <div className="log-success">Process complete.</div>
              {model    && <div className="log-dim">Model: {model}</div>}
              {duration && <div className="log-dim">Elapsed: {duration}s</div>}
              {partial  && <div className="log-warn">Partial result — timeout reached.</div>}
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* ── Sub-queries ─────────────────────────────────────────────── */}
        {queries.length > 0 && (
          <div style={{
            borderTop: "1px solid #21262D",
            background: "#0D1117",
            padding: "10px 12px",
            flexShrink: 0,
          }}>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: "#484F58",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}>
              Search queries
            </p>
            <div style={{
              maxHeight: 110,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}>
              {queries.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                >
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--accent)",
                    flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--term-text)",
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                  }}>
                    {q}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "8px 14px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        flexShrink: 0,
        background: "var(--sidebar-bg)",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--text-faint)",
        }}>
          {logs.length} events
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--text-faint)",
        }}>
          {model ?? "gemini-2.0-flash"}
        </span>
      </div>
    </aside>
  );
}
