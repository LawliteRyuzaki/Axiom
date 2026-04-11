"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { SessionSummary } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DOT: Record<string, string> = {
  completed: "var(--term-green)", partial: "var(--term-amber)",
  failed: "var(--term-red)",      running: "var(--crimson)",
};

export default function InvestigationSidebar({
  refreshKey, onSelect,
}: { refreshKey: number; onSelect: (id: string) => void }) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading,  setLoading]  = useState(false);

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
      <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--rule)", flexShrink: 0 }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.13em",
          color: "var(--mist)",
        }}>
          Sessions
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {loading && [...Array(4)].map((_, i) => (
          <div key={i} style={{
            margin: "5px 12px", height: 44, borderRadius: 7,
            background: "linear-gradient(90deg, var(--carbon-08) 25%, var(--alabaster-d) 50%, var(--carbon-08) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s infinite",
          }} />
        ))}

        {!loading && sessions.length === 0 && (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-body)", fontWeight: 300, fontSize: "0.8125rem", color: "var(--fog)", lineHeight: 1.5 }}>
              No sessions yet.<br />Start your first research.
            </p>
          </div>
        )}

        {!loading && sessions.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.035, ease: "easeOut" }}
            onClick={() => onSelect(s.id)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "9px 16px",
              background: "none", border: "none",
              borderBottom: "1px solid var(--rule)",
              cursor: "pointer", transition: "background 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--carbon-08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{
                marginTop: 5, width: 5, height: 5, borderRadius: "50%",
                background: DOT[s.status] ?? "var(--fog)", flexShrink: 0,
              }} />
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8125rem", fontWeight: 400,
                  color: "var(--carbon)", lineHeight: 1.45,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  marginBottom: 3,
                }}>
                  {s.goal}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.59rem", color: "var(--fog)" }}>
                  {new Date(s.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  {s.duration_seconds ? ` · ${s.duration_seconds}s` : ""}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div style={{ padding: "8px 16px", borderTop: "1px solid var(--rule)", flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.59rem", color: "var(--fog)" }}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>
    </aside>
  );
}
