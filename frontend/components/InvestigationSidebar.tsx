"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SessionSummary } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DOT: Record<string, string> = {
  completed: "var(--term-green)",
  partial:   "var(--term-amber)",
  failed:    "var(--term-red)",
  running:   "var(--accent)",
};

interface Props {
  refreshKey: number;
  onNewSession: () => void;
  onSelect: (id: string) => void;
}

export default function InvestigationSidebar({ refreshKey, onNewSession, onSelect }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading]   = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/history?limit=20`)
      .then(r => r.json())
      .then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    onSelect(id);
  };

  return (
    <aside className="sidebar-panel">
      {/* ── "NEW RESEARCH" button at very top ────────────────────────── */}
      <div style={{ padding: "10px 10px 6px", flexShrink: 0 }}>
        <button
          onClick={onNewSession}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "8px 12px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            cursor: "pointer",
            transition: "all 0.14s",
            fontFamily: "var(--font-ui)",
            fontSize: "0.625rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--accent)";
            el.style.color = "var(--accent)";
            el.style.background = "var(--accent-light)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--border)";
            el.style.color = "var(--text-muted)";
            el.style.background = "transparent";
          }}
          aria-label="Start new research session"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New Research
        </button>
      </div>

      {/* ── SESSIONS label ───────────────────────────────────────────── */}
      <div style={{
        padding: "6px 16px 8px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <p style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.6rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}>
          Sessions
        </p>
      </div>

      {/* ── Session list ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {[100, 80, 90].map((w, i) => (
              <div key={i} style={{
                height: 44,
                borderRadius: "var(--radius)",
                background: "linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
                width: `${w}%`,
              }} />
            ))}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ padding: "3rem 1.25rem", textAlign: "center" }}>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}>
              No sessions yet
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {!loading && sessions.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelect(s.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "9px 16px",
                background: activeId === s.id ? "var(--accent-light)" : "none",
                border: "none",
                borderBottom: "1px solid var(--border-light)",
                borderLeft: activeId === s.id
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => {
                if (activeId !== s.id)
                  (e.currentTarget as HTMLElement).style.background = "var(--overlay-soft)";
              }}
              onMouseLeave={e => {
                if (activeId !== s.id)
                  (e.currentTarget as HTMLElement).style.background = "none";
              }}
            >
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{
                  marginTop: 5,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: DOT[s.status] ?? "var(--border-med)",
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.8125rem",
                    fontWeight: 400,
                    color: activeId === s.id ? "var(--accent)" : "var(--text-secondary)",
                    lineHeight: 1.45,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    marginBottom: 3,
                  }}>
                    {s.goal}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--text-muted)",
                  }}>
                    {new Date(s.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                    {s.duration_seconds ? ` · ${s.duration_seconds}s` : ""}
                    {s.partial ? " · partial" : ""}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Footer count ──────────────────────────────────────────────── */}
      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--text-muted)",
        }}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>
    </aside>
  );
}
