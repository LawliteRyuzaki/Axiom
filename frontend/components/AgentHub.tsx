"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LogEntry, SessionStatus, ResearchState } from "@/types";

interface Props { state: ResearchState; }

function logClass(level: LogEntry["level"]): string {
  const map: Record<LogEntry["level"], string> = {
    success: "log-success", warn: "log-warn",
    error: "log-error",     dim: "log-dim", default: "log-default",
  };
  return map[level] ?? "log-default";
}

// Optional-chained status config — fallback prevents TypeError
const STATUS_CFG: Partial<Record<SessionStatus, { label: string; color: string }>> = {
  idle:      { label: "STANDBY",  color: "#6B6860" },
  queued:    { label: "QUEUED",   color: "#D97706" },
  running:   { label: "ACTIVE",   color: "#3ECF8E" },
  completed: { label: "COMPLETE", color: "#3ECF8E" },
  partial:   { label: "PARTIAL",  color: "#F59E0B" },
  failed:    { label: "ERROR",    color: "#EF4444" },
};
const FALLBACK_CFG = { label: "UNKNOWN", color: "#888888" };

export default function AgentHub({ state }: Props) {
  const { logs, queries, status, model, duration, sessionId, partial } = state;
  const cfg = STATUS_CFG[status] ?? FALLBACK_CFG;
  const bottomRef = useRef<HTMLDivElement>(null);
  const isRunning = status === "running";
  const isDone    = status === "completed" || status === "partial";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <aside className="hub-panel">
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--rule)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.63rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--ghost)",
        }}>
          Agent Intelligence Hub
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.63rem",
          letterSpacing: "0.08em",
          color: cfg?.color || "#888888",
        }}>
          {cfg?.label || "UNKNOWN"}
        </span>
      </div>

      {/* Terminal window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* macOS traffic lights */}
        <div style={{
          background: "#1A1A1A",
          padding: "7px 10px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          flexShrink: 0,
        }}>
          {["#FF5F57","#FFBD2E","#28C840"].map(c => (
            <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
          ))}
          <span style={{
            marginLeft: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            color: "var(--term-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            axiom-agent — zsh
          </span>
        </div>

        {/* Log output */}
        <div className="terminal">
          {/* Boot line */}
          <div className="log-dim" style={{ marginBottom: "6px" }}>
            $ axiom-runtime --session {sessionId?.slice(0, 8) ?? "--------"}
          </div>

          <AnimatePresence initial={false}>
            {logs.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={logClass(entry.level)}
                style={{ display: "flex", gap: "8px", lineHeight: 1.65 }}
              >
                <span className="log-dim" style={{ flexShrink: 0, userSelect: "none" }}>
                  {entry.timestamp}
                </span>
                <span style={{ wordBreak: "break-word" }}>{entry.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Running cursor — linear easing, no TypeError */}
          {isRunning && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
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

          {/* Done summary */}
          {isDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, ease: "easeOut" }}
              style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #2D2D2D" }}
            >
              <div className="log-success">Session complete.</div>
              {model    && <div className="log-dim">Model: {model}</div>}
              {duration && <div className="log-dim">Duration: {duration}s</div>}
              {partial  && <div className="log-warn">Note: partial result.</div>}
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Queries panel */}
        {queries.length > 0 && (
          <div style={{
            borderTop: "1px solid #2D2D2D",
            background: "#0D0D0D",
            padding: "10px 12px",
            flexShrink: 0,
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--term-dim)",
              marginBottom: "8px",
            }}>
              Dispatched Queries
            </p>
            <div style={{ maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {queries.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ease: "easeOut" }}
                  style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
                >
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "var(--crimson)",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}>
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "var(--term-text)",
                    lineHeight: 1.5,
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

      {/* Footer */}
      <div style={{
        padding: "8px 14px",
        borderTop: "1px solid var(--rule)",
        display: "flex",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "var(--mist)" }}>
          {logs.length} events
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "var(--mist)" }}>
          gemini-2.0-flash
        </span>
      </div>
    </aside>
  );
}
