"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LogEntry, SessionStatus, ResearchState } from "@/types";

const STATUS_CFG: Partial<Record<SessionStatus, { label: string; color: string }>> = {
  idle:      { label: "STANDBY",  color: "#6B6860" },
  queued:    { label: "QUEUED",   color: "#FBBF24" },
  running:   { label: "LIVE",     color: "#34D399" },
  completed: { label: "DONE",     color: "#34D399" },
  partial:   { label: "PARTIAL",  color: "#FBBF24" },
  failed:    { label: "ERROR",    color: "#F87171" },
};
const FALLBACK = { label: "UNKNOWN", color: "#888888" };

function logClass(lvl: LogEntry["level"]) {
  return { success: "log-success", warn: "log-warn", error: "log-error", dim: "log-dim", default: "log-default" }[lvl] ?? "log-default";
}

export default function AgentHub({ state }: { state: ResearchState }) {
  const { logs, queries, status, model, duration, sessionId, partial } = state;
  const cfg = STATUS_CFG[status] ?? FALLBACK;
  const isRunning = status === "running";
  const isDone    = status === "completed" || status === "partial";
  const endRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <aside className="hub-panel">
      {/* Panel header */}
      <div style={{
        padding: "11px 14px",
        borderBottom: "1px solid var(--rule)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.13em",
          color: "var(--mist)",
        }}>
          Agent Hub
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: cfg?.color || "#888888",
          letterSpacing: "0.08em",
        }}>
          {cfg?.label || "UNKNOWN"}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Traffic light titlebar */}
        <div style={{
          background: "#161616",
          padding: "7px 11px",
          display: "flex", alignItems: "center", gap: 5,
          flexShrink: 0,
        }}>
          {["#FF5F57", "#FFBD2E", "#28C840"].map(c => (
            <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
          ))}
          <span style={{
            marginLeft: 9,
            fontFamily: "var(--font-mono)",
            fontSize: "0.59rem",
            color: "var(--term-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            axiom-runtime — zsh
          </span>
        </div>

        {/* Log stream */}
        <div className="terminal">
          <div className="log-dim" style={{ marginBottom: 7 }}>
            $ axiom --session {sessionId?.slice(0, 8) ?? "--------"}
          </div>

          <AnimatePresence initial={false}>
            {logs.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className={logClass(entry.level)}
                style={{ display: "flex", gap: 9, lineHeight: 1.68 }}
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
                width: 6, height: 13,
                background: "var(--term-green)",
                animation: "blink 1s linear infinite",
              }} />
            </div>
          )}

          {isDone && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.2, ease: "easeOut" }}
              style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #272727" }}
            >
              <div className="log-success">Session complete.</div>
              {model    && <div className="log-dim">Model: {model}</div>}
              {duration && <div className="log-dim">Elapsed: {duration}s</div>}
              {partial  && <div className="log-warn">Note: partial — crew timed out.</div>}
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* Queries */}
        {queries.length > 0 && (
          <div style={{
            borderTop: "1px solid #272727",
            background: "#0C0C0C",
            padding: "10px 12px",
            flexShrink: 0,
          }}>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.59rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--term-dim)",
              marginBottom: 8,
            }}>
              Dispatched queries
            </p>
            <div style={{ maxHeight: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
              {queries.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ease: "easeOut" }}
                  style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: "var(--crimson)", flexShrink: 0 }}>
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: "var(--term-text)", lineHeight: 1.5, wordBreak: "break-word" }}>
                    {q}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "7px 14px",
        borderTop: "1px solid var(--rule)",
        display: "flex", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.59rem", color: "var(--fog)" }}>
          {logs.length} events
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.59rem", color: "var(--fog)" }}>
          gemini-2.0-flash
        </span>
      </div>
    </aside>
  );
}
