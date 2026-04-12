"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

const MODEL_OPTIONS: { id: SelectedModel; name: string; meta: string }[] = [
  { id: "flash", name: "Gemini Flash",   meta: "Fast · Free tier" },
  { id: "pro",   name: "Gemini 1.5 Pro", meta: "Powerful · Paid"  },
];

interface DropdownPos { top: number; right: number }

interface Props {
  onSubmit: (goal: string, model: SelectedModel) => void;
  selectedModel: SelectedModel;
  onModelChange: (model: SelectedModel) => void;
}

export default function LandingView({ onSubmit, selectedModel, onModelChange }: Props) {
  const [goal,          setGoal]          = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [dropdownPos,   setDropdownPos]   = useState<DropdownPos>({ top: 0, right: 0 });
  const [phIdx,         setPhIdx]         = useState(0);
  const [error,         setError]         = useState("");
  const [mounted,       setMounted]       = useState(false);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);

  // Only render portals after mount (SSR safety)
  useEffect(() => { setMounted(true); }, []);

  // Rotating placeholders
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 4200);
    return () => clearInterval(t);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [goal]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!showModelMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModelMenu(false); };
    const onMouse = (e: MouseEvent) => {
      // Close if click is outside the trigger button
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouse, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouse, true);
    };
  }, [showModelMenu]);

  // Calculate position of the dropdown relative to the viewport
  const openMenu = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        // Open BELOW the button
        top:   rect.bottom + 6,
        // Align right edge of dropdown with right edge of button
        right: window.innerWidth - rect.right,
      });
    }
    setShowModelMenu(v => !v);
  }, []);

  const handleModelSelect = useCallback((id: SelectedModel) => {
    onModelChange(id);
    setShowModelMenu(false);
    // Return focus to textarea after selection
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [onModelChange]);

  const submit = useCallback(() => {
    const g = goal.trim();
    if (g.length < 10) {
      setError("Please be a bit more specific — at least 10 characters.");
      return;
    }
    setError("");
    onSubmit(g, selectedModel);
  }, [goal, selectedModel, onSubmit]);

  const currentLabel = selectedModel === "flash" ? "Flash" : "Pro";

  // The dropdown is rendered into document.body via a portal so it is never
  // clipped by overflow:hidden on .landing-wrap or .search-bar
  const dropdown = mounted && showModelMenu ? createPortal(
    <AnimatePresence>
      <motion.div
        role="listbox"
        aria-label="Select AI model"
        initial={{ opacity: 0, y: -4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{    opacity: 0, y: -4, scale: 0.97 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        style={{
          position:  "fixed",
          top:       dropdownPos.top,
          right:     dropdownPos.right,
          zIndex:    9999,          // above everything
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border:       "1px solid var(--border-med)",
          borderRadius: "var(--radius-lg)",
          padding:      "4px",
          boxShadow:    "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          minWidth:     192,
        }}
      >
        {MODEL_OPTIONS.map(opt => {
          const isSelected = selectedModel === opt.id;
          return (
            <button
              key={opt.id}
              role="option"
              aria-selected={isSelected}
              type="button"
              // onMouseDown + preventDefault: fires before outside-click
              // handler, so selection registers before menu closes
              onMouseDown={e => {
                e.preventDefault();
                handleModelSelect(opt.id);
              }}
              style={{
                display:        "flex",
                flexDirection:  "column",
                width:          "100%",
                padding:        "9px 12px",
                borderRadius:   "var(--radius)",
                background:     isSelected ? "var(--accent-light)" : "transparent",
                border:         "none",
                cursor:         "pointer",
                textAlign:      "left",
                gap:            2,
                outline:        "none",
                transition:     "background 0.1s",
              }}
              onMouseEnter={e => {
                if (!isSelected)
                  (e.currentTarget as HTMLElement).style.background = "var(--overlay-soft)";
              }}
              onMouseLeave={e => {
                if (!isSelected)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {/* Name row */}
              <span style={{
                display:     "flex",
                alignItems:  "center",
                gap:         6,
                fontFamily:  "var(--font-ui)",
                fontWeight:  isSelected ? 600 : 400,
                fontSize:    "0.8125rem",
                color:       isSelected ? "var(--accent)" : "var(--text-primary)",
              }}>
                {/* Fixed-width checkmark slot so text doesn't shift */}
                <span style={{ width: 12, display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5"
                        stroke="var(--accent)" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {opt.name}
              </span>

              {/* Meta row */}
              <span style={{
                fontFamily:  "var(--font-mono)",
                fontSize:    "0.6rem",
                color:       "var(--text-faint)",
                paddingLeft: 18,
              }}>
                {opt.meta}
              </span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <div className="landing-wrap">
      {/* Portal dropdown — rendered outside all overflow:hidden containers */}
      {dropdown}

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: "center", marginBottom: "2.25rem", position: "relative", zIndex: 1 }}
      >
        <h1 style={{
          fontFamily:    "var(--font-ui)",
          fontSize:      "clamp(1.875rem, 4.5vw, 2.75rem)",
          fontWeight:    700,
          color:         "var(--text-primary)",
          lineHeight:    1.12,
          letterSpacing: "-0.03em",
          marginBottom:  "0.875rem",
        }}>
          Research, at the speed<br />of a question.
        </h1>
        <p style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 400,
          fontSize:   "1rem",
          color:      "var(--text-muted)",
          lineHeight: 1.65,
          maxWidth:   "420px",
          margin:     "0 auto",
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
            ref={textareaRef}
            value={goal}
            onChange={e => { setGoal(e.target.value); setError(""); }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            placeholder={PLACEHOLDERS[phIdx]}
            rows={1}
            aria-label="Research question"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
          />

          <div className="bar-actions">
            {/* ── Model selector trigger ──────────────────────────────── */}
            <button
              ref={triggerRef}
              type="button"
              className="bar-btn"
              style={{ gap: 5, outline: "none" }}
              onClick={openMenu}
              aria-haspopup="listbox"
              aria-expanded={showModelMenu}
              aria-label={`Model: ${currentLabel}. Click to change.`}
            >
              {/* Clock icon */}
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M5.5 3v2.5l1.5 0.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>

              {/* Current label */}
              <span style={{ minWidth: 28, textAlign: "left" }}>{currentLabel}</span>

              {/* Chevron — rotates when open */}
              <svg
                width="9" height="9" viewBox="0 0 9 9" fill="none"
                aria-hidden="true"
                style={{
                  transition: "transform 0.15s ease",
                  transform:  showModelMenu ? "rotate(180deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              >
                <path d="M2.5 3.5l2 2 2-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
            </button>

            {/* ── Submit ──────────────────────────────────────────────── */}
            <button
              type="button"
              className="bar-submit"
              onClick={submit}
              disabled={goal.trim().length < 10}
              aria-label="Run research"
              style={{ outline: "none" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 10.5V2.5M2.5 6.5l4-4 4 4"
                  stroke="white" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Validation error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1,  y:  0 }}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize:   "0.75rem",
              color:      "var(--accent)",
              marginTop:  7,
              paddingLeft: 4,
            }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* ── Prompt chips ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26 }}
        style={{
          display:        "flex",
          flexWrap:       "wrap",
          gap:            "7px",
          marginTop:      "14px",
          justifyContent: "center",
          position:       "relative",
          zIndex:         1,
        }}
      >
        {CHIPS.map((c, i) => (
          <motion.button
            key={c.label}
            type="button"
            className="chip"
            onClick={() => { setGoal(c.prompt); setError(""); textareaRef.current?.focus(); }}
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
          marginTop:   "2rem",
          fontFamily:  "var(--font-ui)",
          fontSize:    "0.75rem",
          fontWeight:  400,
          color:       "var(--text-faint)",
          textAlign:   "center",
          position:    "relative",
          zIndex:      1,
          lineHeight:  1.6,
        }}
      >
        Powered by Gemini · Serper.dev · CrewAI &nbsp;·&nbsp; Reports take 60–120 seconds
      </motion.p>
    </div>
  );
}
