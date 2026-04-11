"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { SelectedModel } from "@/types";

const CHIPS = [
  { icon: "</>", label: "Technical Audit",    template: "Conduct a technical audit of " },
  { icon: "✎",   label: "Academic Summary",   template: "Write an academic summary of research on " },
  { icon: "A",   label: "Literature Review",  template: "Perform a literature review on " },
];

const PLACEHOLDERS = [
  "Describe your research objective...",
  "e.g. Attention mechanisms in large language models",
  "e.g. Federated learning for privacy-preserving AI",
  "e.g. Graph neural networks in molecular biology",
];

interface Props {
  onSubmit: (goal: string, model: SelectedModel) => void;
}

export default function LandingView({ onSubmit }: Props) {
  const [goal, setGoal]   = useState("");
  const [model, setModel] = useState<SelectedModel>("flash");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [phIdx, setPhIdx] = useState(0);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cycle placeholder text
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [goal]);

  const handleSubmit = () => {
    const g = goal.trim();
    if (g.length < 10) { setError("Please enter at least 10 characters."); return; }
    setError("");
    onSubmit(g, model);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const applyChip = (template: string) => {
    setGoal(template);
    textareaRef.current?.focus();
  };

  return (
    <div className="landing-wrap">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: "center", marginBottom: "2.5rem" }}
      >
        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "clamp(2.2rem, 5vw, 3.25rem)",
          fontWeight: 400,
          color: "var(--carbon)",
          lineHeight: 1.12,
          letterSpacing: "-0.025em",
          marginBottom: "0.6rem",
        }}>
          Autonomous Synthesis
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.9375rem",
          color: "var(--ghost)",
          lineHeight: 1.6,
          maxWidth: "420px",
          margin: "0 auto",
        }}>
          Multi-agent research intelligence. Define an objective —<br />
          Axiom researches, synthesises, and reports.
        </p>
      </motion.div>

      {/* Search pill */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: "680px" }}
      >
        <div className="search-pill">
          {/* Context icon */}
          <button
            className="pill-icon-btn"
            title="Add context"
            type="button"
            aria-label="Add context"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="pill-divider" />

          {/* Input */}
          <textarea
            ref={textareaRef}
            value={goal}
            onChange={e => { setGoal(e.target.value); setError(""); }}
            onKeyDown={handleKey}
            placeholder={PLACEHOLDERS[phIdx]}
            rows={1}
            aria-label="Research objective"
          />

          <div className="pill-divider" />

          {/* Model selector */}
          <div style={{ position: "relative" }}>
            <button
              className="model-selector"
              onClick={() => setShowModelMenu(v => !v)}
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {model === "flash" ? "Flash" : "Pro"}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>

            {showModelMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  right: 0,
                  background: "#fff",
                  border: "1px solid var(--rule-h)",
                  borderRadius: "10px",
                  padding: "6px",
                  boxShadow: "0 8px 24px rgba(26,26,26,0.12)",
                  minWidth: "160px",
                  zIndex: 100,
                }}
              >
                {[
                  { id: "flash", name: "Gemini Flash",   desc: "Fast · Free tier"   },
                  { id: "pro",   name: "Gemini Pro",     desc: "Powerful · Paid"    },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setModel(opt.id as SelectedModel); setShowModelMenu(false); }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      padding: "8px 10px",
                      background: model === opt.id ? "var(--crimson-faint)" : "none",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: "1px",
                    }}
                  >
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 500, color: "var(--carbon)" }}>
                      {opt.name}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "var(--ghost)" }}>
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Submit */}
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={goal.trim().length < 10}
            type="button"
            aria-label="Initiate research"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 12V2M2 7l5-5 5 5" stroke="#F2F0EA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem",
            color: "var(--crimson)",
            marginTop: "6px",
            paddingLeft: "16px",
          }}>
            {error}
          </p>
        )}
      </motion.div>

      {/* Action chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.24, ease: "easeOut" }}
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "16px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {CHIPS.map(chip => (
          <button
            key={chip.label}
            className="chip"
            onClick={() => applyChip(chip.template)}
            type="button"
          >
            <span className="chip-icon" style={{ fontFamily: chip.icon === "A" ? "'Instrument Serif', serif" : "inherit" }}>
              {chip.icon}
            </span>
            {chip.label}
          </button>
        ))}
      </motion.div>

      {/* Fine print */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        style={{
          marginTop: "2rem",
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.73rem",
          color: "var(--mist)",
          textAlign: "center",
        }}
      >
        Axiom uses Gemini and Serper.dev. Research may take 60 – 120 seconds.
      </motion.p>
    </div>
  );
}
