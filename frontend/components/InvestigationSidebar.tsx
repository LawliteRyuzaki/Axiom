"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { SessionSummary } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DOT_COLOR: Record<string, string> = {
  completed: "var(--term-green)", partial: "#F59E0B",
  failed: "var(--term-red)",      running: "var(--crimson)",
};

interface Props { refreshKey: number; onSelect: (id: string) => void; }

export default function InvestigationSidebar({ refreshKey, onSelect }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/history?limit=20`)
      .then(r => r.json())
      .then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <aside className="sidebar-panel">
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--rule)", flexShrink: 0 }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--ghost)",
        }}>
          Sessions
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {loading && [...Array(3)].map((_, i) => (
          <div key={i} style={{
            margin: "4px 10px",
            height: "48px",
            borderRadius: "6px",
            background: "var(--carbon-10)",
            animation: "pulse-glow 1.4s ease infinite",
          }} />
        ))}

        {!loading && sessions.length === 0 && (
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "var(--mist)",
            textAlign: "center",
            padding: "2rem 1rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            No sessions
          </p>
        )}

        {!loading && sessions.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, ease: "easeOut" }}
            onClick={() => onSelect(s.id)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "9px 14px",
              background: "none",
              border: "none",
              borderBottom: "1px solid var(--rule)",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--carbon-10)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{
                marginTop: "5px",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: DOT_COLOR[s.status] ?? "var(--mist)",
                flexShrink: 0,
              }} />
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.78rem",
                  color: "var(--carbon)",
                  lineHeight: 1.45,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  marginBottom: "3px",
                }}>
                  {s.goal}
                </p>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "var(--mist)",
                }}>
                  {new Date(s.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short",
                  })}
                  {s.duration_seconds ? ` · ${s.duration_seconds}s` : ""}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer count */}
      <div style={{
        padding: "8px 14px",
        borderTop: "1px solid var(--rule)",
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.6rem",
          color: "var(--mist)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          {sessions.length} total
        </span>
      </div>
    </aside>
  );
}
