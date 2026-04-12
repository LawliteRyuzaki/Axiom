"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SelectedModel } from "@/types";

const CHIPS = [
  { label: "Technical deep-dive",  prompt: "Conduct a technical deep-dive into "        },
  { label: "Literature review",    prompt: "Write a literature review on "               },
  { label: "Competitive analysis", prompt: "Analyse the competitive landscape in "       },
  { label: "State of the art",     prompt: "Summarise the current state of the art in "  },
];

const PLACEHOLDERS = [
  "Ask a research question or paste a topic...",
  "e.g. How does retrieval-augmented generation work?",
  "e.g. Diffusion models vs. GANs for image synthesis",
  "e.g. Open problems in multi-agent reinforcement learning",
  "e.g. Privacy techniques in federated learning",
];

interface Props {
  onSubmit: (goal: string, model: SelectedModel) => void;
  selectedModel: SelectedModel;
  onModelChange: (model: SelectedModel) => void;
}

export default function LandingView({ onSubmit, selectedModel, onModelChange }: Props) {
  const [goal,          setGoal]          = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [phIdx,         setPhIdx]         = useState(0);
  const [error,         setError]         = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 4200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [goal]);

  // Close menu on outside click
  useEffect(() => {
    if (!showModelMenu) return;
    const handler = () => setShowModelMenu(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModelMenu]);

  const submit = () => {
    const g = goal.trim();
    if (g.length < 10) { setError("Please be a bit more specific — at least 10 characters."); return; }
    setError("");
    onSubmit(g, selectedModel);
  };

  return (
    <div className="landing-wrap">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          textAlign: "center",
          marginBottom: "2.25rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1 style={{
          fontFamily: "var(--font-ui)",
          fontSize: "clamp(1.875rem, 4.5vw, 2.75rem)",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.12,
          letterSpacing: "-0.03em",
          marginBottom: "0.875rem",
        }}>
          Research, at the speed<br />of a question.
        </h1>
        <p style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 400,
          fontSize: "1rem",
          color: "var(--text-muted)",
          lineHeight: 1.65,
          maxWidth: "420px",
          margin: "0 auto",
        }}>
          Axiom deploys a multi-agent crew to search the web,
          gather evidence, and synthesise a cited report —
          in the time it takes to read one paper.
        </p>
      </motion.div>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: "660px", position: "relative", zIndex: 2 }}
      >
        <div className="search-bar">
          <textarea
            ref={ref}
            value={goal}
            onChange={e => { setGoal(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }}}
            placeholder={PLACEHOLDERS[phIdx]}
            rows={1}
            aria-label="Research question"
          />

          <div className="bar-actions">
            {/* ── Model selector ───────────────────────────────────── */}
            <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
              <button
                type="button"
                className="bar-btn"
                onClick={() => setShowModelMenu(v => !v)}
                style={{ gap: 5 }}
                aria-haspopup="listbox"
                aria-expanded={showModelMenu}
              >
                {/* Gemini spark icon */}
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M5.5 3v2.5l1.5 0.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                {selectedModel === "flash" ? "Flash" : "Pro"}
                {/* Chevron */}
                <svg
                  width="9" height="9" viewBox="0 0 9 9" fill="none"
                  style={{ transition: "transform 0.14s", transform: showModelMenu ? "rotate(180deg)" : "none" }}
                >
                  <path d="M2.5 3.5l2 2 2-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
              </button>

              <AnimatePresence>
                {showModelMenu && (
                  <motion.div
                    role="listbox"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.13 }}
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      right: 0,
                      background: "rgba(255,255,255,0.92)",
                      backdropFilter: "blur(16px) saturate(160%)",
                      WebkitBackdropFilter: "blur(16px) saturate(160%)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      padding: 5,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                      minWidth: 180,
                      zIndex: 99,
                    }}
                  >
                    {([
                      { id: "flash" as SelectedModel, name: "Gemini Flash",  meta: "Fast · Free tier"  },
                      { id: "pro"   as SelectedModel, name: "Gemini 1.5 Pro", meta: "Powerful · Paid"  },
                    ] as const).map(opt => (
                      <button
                        key={opt.id}
                        role="option"
                        aria-selected={selectedModel === opt.id}
                        type="button"
                        onClick={() => { onModelChange(opt.id); setShowModelMenu(false); }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "var(--radius)",
                          background: selectedModel === opt.id ? "var(--accent-light)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={e => {
                          if (selectedModel !== opt.id)
                            (e.currentTarget as HTMLElement).style.background = "var(--bg)";
                        }}
                        onMouseLeave={e => {
                          if (selectedModel !== opt.id)
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <span style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "var(--font-ui)",
                          fontWeight: 500,
                          fontSize: "0.8125rem",
                          color: selectedModel === opt.id ? "var(--accent)" : "var(--text-primary)",
                        }}>
                          {selectedModel === opt.id && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4l2 2 3-3" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {opt.name}
                        </span>
                        <span style={{
                          display: "block",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6rem",
                          color: "var(--text-faint)",
                          marginTop: 2,
                          paddingLeft: selectedModel === opt.id ? 14 : 0,
                        }}>
                          {opt.meta}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Submit ───────────────────────────────────────────── */}
            <button
              type="button"
              className="bar-submit"
              onClick={submit}
              disabled={goal.trim().length < 10}
              aria-label="Run research"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 10.5V2.5M2.5 6.5l4-4 4 4"
                  stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.75rem",
            color: "var(--accent)",
            marginTop: 7,
            paddingLeft: 4,
          }}>
            {error}
          </p>
        )}
      </motion.div>

      {/* ── Chips ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "7px",
          marginTop: "14px",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {CHIPS.map((c, i) => (
          <motion.button
            key={c.label}
            type="button"
            className="chip"
            onClick={() => { setGoal(c.prompt); setError(""); ref.current?.focus(); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 + i * 0.05 }}
          >
            {c.label}
          </motion.button>
        ))}
      </motion.div>

      {/* ── Fine print ────────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: "2rem",
          fontFamily: "var(--font-ui)",
          fontSize: "0.75rem",
          fontWeight: 400,
          color: "var(--text-faint)",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          lineHeight: 1.6,
        }}
      >
        Powered by Gemini · Serper.dev · CrewAI &nbsp;·&nbsp; Reports take 60–120 seconds
      </motion.p>
    </div>
  );
}
