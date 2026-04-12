"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { SessionSummary } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DOT: Record<string, string> = {
  completed: "var(--term-green)", partial: "var(--term-amber)",
  failed: "var(--term-red)", running: "var(--accent)",
};

export default function InvestigationSidebar({
  refreshKey, onSelect,
}: { refreshKey: number; onSelect: (id: string) => void }) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

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
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <p style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          Sessions
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {[100, 80, 90].map((w, i) => (
              <div key={i} style={{
                height: 48, borderRadius: "var(--radius)",
                background: `linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%)`,
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
              color: "var(--text-faint)",
              lineHeight: 1.6,
              fontWeight: 400,
            }}>
              No sessions yet
            </p>
          </div>
        )}

        {!loading && sessions.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(s.id)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "10px 16px",
              background: "none", border: "none",
              borderBottom: "1px solid var(--border-light)",
              cursor: "pointer", transition: "background 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--overlay-soft)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{
                marginTop: 5, width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                background: DOT[s.status] ?? "var(--border-med)",
              }} />
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.8125rem",
                  fontWeight: 400,
                  color: "var(--text-secondary)",
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
                  color: "var(--text-faint)",
                }}>
                  {new Date(s.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  {s.duration_seconds ? ` · ${s.duration_seconds}s` : ""}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-faint)" }}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>
    </aside>
  );
}
