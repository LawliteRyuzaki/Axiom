"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SessionSummary } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const EASING = [0.22, 1, 0.36, 1] as const;

const STATUS_DOT: Record<string, string> = {
  completed: "var(--term-green)",
  partial:   "var(--term-amber)",
  failed:    "var(--term-red)",
  running:   "var(--accent)",
  queued:    "var(--term-amber)",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Complete",
  partial:   "Partial",
  failed:    "Failed",
  running:   "Running",
  queued:    "Queued",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewSession: () => void;
}

export default function HistoryDrawer({ open, onClose, onSelect, onNewSession }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch history whenever drawer opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${API_URL}/api/history?limit=50`)
      .then(r => r.json())
      .then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Small delay so the logo click that opened it doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler, true);
    }, 80);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler, true);
    };
  }, [open, onClose]);

  const filtered = sessions.filter(s =>
    s.goal.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)  return `${diffDays} days ago`;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,17,23,0.28)",
              zIndex: 200,
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            ref={drawerRef}
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0,    opacity: 1 }}
            exit={{ x: -380,    opacity: 0 }}
            transition={{ duration: 0.38, ease: EASING }}
            style={{
              position:    "fixed",
              top:         0,
              left:        0,
              width:       360,
              height:      "100vh",
              background:  "var(--surface)",
              borderRight: "1px solid var(--border)",
              zIndex:      201,
              display:     "flex",
              flexDirection: "column",
              boxShadow:   "4px 0 32px rgba(0,0,0,0.10)",
            }}
          >
            {/* ── Header ──────────────────────────────────────────── */}
            <div style={{
              padding:      "16px 20px 12px",
              borderBottom: "1px solid var(--border)",
              flexShrink:   0,
            }}>
              {/* Top row: title + close button */}
              <div style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                marginBottom:   12,
              }}>
                <div>
                  <p style={{
                    fontFamily:    "var(--font-ui)",
                    fontSize:      "1rem",
                    fontWeight:    600,
                    color:         "var(--text-primary)",
                    letterSpacing: "-0.01em",
                    lineHeight:    1,
                    marginBottom:  3,
                  }}>
                    Research History
                  </p>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize:   "0.6rem",
                    color:      "var(--text-faint)",
                    letterSpacing: "0.06em",
                  }}>
                    {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
                  </p>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    width:        28,
                    height:       28,
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    background:   "var(--bg)",
                    border:       "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    cursor:       "pointer",
                    flexShrink:   0,
                    outline:      "none",
                    transition:   "all 0.12s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--accent-light)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-mid)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  }}
                  aria-label="Close history drawer"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                      stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Search input */}
              <div style={{
                display:      "flex",
                alignItems:   "center",
                gap:          8,
                background:   "var(--bg)",
                border:       "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding:      "7px 10px",
                transition:   "border-color 0.14s",
              }}
                onFocusCapture={e =>
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
                }
                onBlurCapture={e =>
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                }
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="5.5" cy="5.5" r="4" stroke="var(--text-faint)" strokeWidth="1.2"/>
                  <path d="M9 9l2.5 2.5" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search sessions…"
                  style={{
                    flex:       1,
                    border:     "none",
                    outline:    "none",
                    background: "transparent",
                    fontFamily: "var(--font-ui)",
                    fontSize:   "0.8125rem",
                    color:      "var(--text-primary)",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      background: "none",
                      border:     "none",
                      cursor:     "pointer",
                      padding:    0,
                      color:      "var(--text-faint)",
                      lineHeight: 1,
                      outline:    "none",
                    }}
                    aria-label="Clear search"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ── Session list ─────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>

              {/* Loading skeletons */}
              {loading && (
                <div style={{ padding: "8px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      height: 64,
                      borderRadius: "var(--radius)",
                      background: "linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s infinite",
                    }} />
                  ))}
                </div>
              )}

              {/* Empty states */}
              {!loading && sessions.length === 0 && (
                <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: "50%",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 12px",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="3" y="2" width="12" height="14" rx="2"
                        stroke="var(--text-faint)" strokeWidth="1.2"/>
                      <path d="M6 6h6M6 9h6M6 12h4"
                        stroke="var(--text-faint)" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}>
                    No research sessions yet
                  </p>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.75rem",
                    color: "var(--text-faint)",
                    lineHeight: 1.6,
                  }}>
                    Start a new research query and<br/>it will appear here.
                  </p>
                </div>
              )}

              {!loading && sessions.length > 0 && filtered.length === 0 && (
                <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}>
                    No sessions match "{search}"
                  </p>
                </div>
              )}

              {/* Session cards */}
              {!loading && filtered.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.2 }}
                  style={{
                    margin:       "0 12px 4px",
                    borderRadius: "var(--radius-lg)",
                    border:       "1px solid var(--border-light)",
                    background:   "var(--surface)",
                    overflow:     "hidden",
                    transition:   "border-color 0.14s, box-shadow 0.14s",
                    cursor:       "pointer",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-med)";
                    el.style.boxShadow   = "0 2px 10px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-light)";
                    el.style.boxShadow   = "none";
                  }}
                  onClick={() => { onSelect(s.id); onClose(); }}
                >
                  <div style={{ padding: "12px 14px 10px" }}>
                    {/* Goal text */}
                    <p style={{
                      fontFamily:   "var(--font-ui)",
                      fontSize:     "0.8125rem",
                      fontWeight:   400,
                      color:        "var(--text-primary)",
                      lineHeight:   1.5,
                      marginBottom: 8,
                      display:      "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow:     "hidden",
                    }}>
                      {s.goal}
                    </p>

                    {/* Meta row */}
                    <div style={{
                      display:    "flex",
                      alignItems: "center",
                      gap:        10,
                      flexWrap:   "wrap",
                    }}>
                      {/* Status dot + label */}
                      <div style={{
                        display:    "flex",
                        alignItems: "center",
                        gap:        5,
                      }}>
                        <span style={{
                          width:        6,
                          height:       6,
                          borderRadius: "50%",
                          background:   STATUS_DOT[s.status] ?? "var(--border-med)",
                          flexShrink:   0,
                        }} />
                        <span style={{
                          fontFamily:    "var(--font-mono)",
                          fontSize:      "0.6rem",
                          color:         "var(--text-faint)",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </span>
                      </div>

                      {/* Date */}
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize:   "0.6rem",
                        color:      "var(--text-faint)",
                      }}>
                        {formatDate(s.created_at)}
                      </span>

                      {/* Duration */}
                      {s.duration_seconds && (
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize:   "0.6rem",
                          color:      "var(--text-faint)",
                        }}>
                          {s.duration_seconds}s
                        </span>
                      )}

                      {/* Partial badge */}
                      {s.partial && (
                        <span style={{
                          fontFamily:    "var(--font-mono)",
                          fontSize:      "0.55rem",
                          color:         "var(--term-amber)",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          background:    "rgba(210,153,34,0.10)",
                          padding:       "1px 5px",
                          borderRadius:  99,
                        }}>
                          partial
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover accent bar at bottom */}
                  <div style={{
                    height:     2,
                    background: "var(--accent)",
                    transform:  "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.2s ease",
                  }}
                    onMouseEnter={e =>
                      (e.currentTarget as HTMLElement).style.transform = "scaleX(1)"
                    }
                    onMouseLeave={e =>
                      (e.currentTarget as HTMLElement).style.transform = "scaleX(0)"
                    }
                  />
                </motion.div>
              ))}
            </div>

            {/* ── Footer ──────────────────────────────────────────── */}
            <div style={{
              padding:   "12px 12px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}>
              <button
                onClick={() => { onNewSession(); onClose(); }}
                style={{
                  width:         "100%",
                  display:       "flex",
                  alignItems:    "center",
                  justifyContent: "center",
                  gap:           7,
                  padding:       "9px 12px",
                  background:    "var(--text-primary)",
                  border:        "none",
                  borderRadius:  "var(--radius)",
                  cursor:        "pointer",
                  fontFamily:    "var(--font-ui)",
                  fontSize:      "0.8125rem",
                  fontWeight:    500,
                  color:         "#fff",
                  outline:       "none",
                  transition:    "background 0.14s",
                }}
                onMouseEnter={e =>
                  (e.currentTarget as HTMLElement).style.background = "var(--accent)"
                }
                onMouseLeave={e =>
                  (e.currentTarget as HTMLElement).style.background = "var(--text-primary)"
                }
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                New Research
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
