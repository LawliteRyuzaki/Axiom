"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SelectedModel } from "@/types";

const CHIPS = [
  { sym: "⌥", label: "Technical Audit",    prompt: "Conduct a comprehensive technical audit of "    },
  { sym: "∑", label: "Literature Review",  prompt: "Write a deep literature review on "              },
  { sym: "◈", label: "Competitive Intel",  prompt: "Analyse the competitive landscape and state of the art in " },
];

// Cycling placeholder lines — each one is a real research prompt
const PLACEHOLDERS = [
  "What's the state of the art in diffusion-based image synthesis?",
  "How does retrieval-augmented generation actually work?",
  "Compare transformer vs. Mamba architectures for sequence modelling.",
  "What are the open problems in multi-agent reinforcement learning?",
  "Explain the technical tradeoffs in LLM quantisation techniques.",
];

interface Props {
  onSubmit: (goal: string, model: SelectedModel) => void;
}

export default function LandingView({ onSubmit }: Props) {
  const [goal,          setGoal]          = useState("");
  const [model,         setModel]         = useState<SelectedModel>("flash");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [phIdx,         setPhIdx]         = useState(0);
  const [error,         setError]         = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, [goal]);

  const submit = () => {
    const g = goal.trim();
    if (g.length < 10) { setError("Give it a bit more to go on — 10 chars minimum."); return; }
    setError("");
    onSubmit(g, model);
  };

  return (
    <div className="landing-wrap">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: "center", marginBottom: "2.75rem", position: "relative", zIndex: 1 }}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 99,
            border: "1px solid var(--crimson-mid)",
            background: "var(--crimson-faint)",
            marginBottom: "1.375rem",
          }}
        >
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--crimson)",
            animation: "glow-pulse 2s ease infinite",
          }} />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--crimson)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            Multi-agent · Live synthesis
          </span>
        </motion.div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.6rem, 6vw, 4rem)",
          fontWeight: 700,
          color: "var(--carbon)",
          lineHeight: 1.06,
          letterSpacing: "-0.04em",
          marginBottom: "1rem",
        }}>
          Think deeper,<br />
          <span style={{ color: "var(--crimson)" }}>know faster.</span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontFamily: "var(--font-body)",
          fontWeight: 300,
          fontSize: "1.0625rem",
          color: "var(--slate)",
          lineHeight: 1.6,
          maxWidth: "440px",
          margin: "0 auto",
        }}>
          Drop a research question. Axiom deploys a crew of AI agents to
          search, read, and synthesise — then hands you a proper report.
        </p>
      </motion.div>

      {/* ── Search pill ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.975 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: "700px", position: "relative", zIndex: 2 }}
      >
        <div className="search-pill">
          {/* Context attach button */}
          <button
            type="button"
            className="pill-icon-btn"
            title="Attach context"
            aria-label="Attach context"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2.5v10M2.5 7.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="pill-sep" />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={goal}
            onChange={e => { setGoal(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }}}
            placeholder={PLACEHOLDERS[phIdx]}
            rows={1}
            aria-label="Research question"
          />

          <div className="pill-sep" />

          {/* Model selector */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              className="model-btn"
              onClick={() => setShowModelMenu(v => !v)}
              aria-expanded={showModelMenu}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5.5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {model === "flash" ? "Flash" : "Pro"}
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M2 3.5l2.5 2.5L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>

            <AnimatePresence>
              {showModelMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 10px)",
                    right: 0,
                    background: "#fff",
                    border: "1px solid var(--rule-strong)",
                    borderRadius: "12px",
                    padding: "6px",
                    boxShadow: "0 10px 32px rgba(26,26,26,0.12), 0 2px 8px rgba(26,26,26,0.06)",
                    minWidth: "176px",
                    zIndex: 99,
                  }}
                >
                  {[
                    { id: "flash", name: "Gemini Flash", tag: "Fast  ·  Free tier" },
                    { id: "pro",   name: "Gemini Pro",   tag: "Powerful  ·  Paid"  },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setModel(opt.id as SelectedModel); setShowModelMenu(false); }}
                      style={{
                        display: "block", width: "100%",
                        padding: "9px 11px",
                        borderRadius: "8px",
                        background: model === opt.id ? "var(--crimson-faint)" : "transparent",
                        border: "none", cursor: "pointer", textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => { if (model !== opt.id) (e.currentTarget as HTMLElement).style.background = "var(--carbon-08)"; }}
                      onMouseLeave={e => { if (model !== opt.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <span style={{ display: "block", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.85rem", color: "var(--carbon)" }}>
                        {opt.name}
                      </span>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--mist)", marginTop: "1px" }}>
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <button
            type="button"
            className="submit-btn"
            onClick={submit}
            disabled={goal.trim().length < 10}
            aria-label="Run research"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 11V2M2 6.5l4.5-4.5 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.67rem",
            color: "var(--crimson)",
            marginTop: "7px",
            paddingLeft: "14px",
          }}>
            {error}
          </p>
        )}
      </motion.div>

      {/* ── Action chips ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
        style={{
          display: "flex", flexWrap: "wrap", gap: "8px",
          marginTop: "18px", justifyContent: "center",
          position: "relative", zIndex: 1,
        }}
      >
        {CHIPS.map((c, i) => (
          <motion.button
            key={c.label}
            type="button"
            className="chip"
            onClick={() => { setGoal(c.prompt); setError(""); textareaRef.current?.focus(); }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 + i * 0.06 }}
          >
            <span className="chip-sym" style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
            }}>
              {c.sym}
            </span>
            {c.label}
          </motion.button>
        ))}
      </motion.div>

      {/* ── Fine print ───────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        style={{
          marginTop: "2.25rem",
          fontFamily: "var(--font-body)",
          fontWeight: 300,
          fontSize: "0.75rem",
          color: "var(--fog)",
          textAlign: "center",
          position: "relative", zIndex: 1,
        }}
      >
        Powered by Gemini · Serper.dev · CrewAI &nbsp;·&nbsp; Research takes 60 – 120 s
      </motion.p>
    </div>
  );
}
