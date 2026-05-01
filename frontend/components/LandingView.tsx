"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { SelectedModel } from "@/types";
import AxiomLogo from "./AxiomLogo";

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
  onMenuClick?: () => void;
}

export default function LandingView({ onSubmit, selectedModel, onModelChange, onMenuClick }: Props) {
  const [goal,          setGoal]          = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [dropdownPos,   setDropdownPos]   = useState<DropdownPos>({ top: 0, right: 0 });
  const [phIdx,         setPhIdx]         = useState(0);
  const [error,         setError]         = useState("");
  const [mounted,       setMounted]       = useState(false);

  const [mousePos,      setMousePos]      = useState({ x: 0, y: 0 });

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const triggerRefMob = useRef<HTMLButtonElement>(null);
  const triggerRefDsk = useRef<HTMLButtonElement>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Only render portals after mount (SSR safety)
  useEffect(() => { setMounted(true); }, []);

  // Parallax Effect
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) - 0.5, y: (e.clientY / window.innerHeight) - 0.5 });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("axiom-theme") as "light" | "dark";
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("axiom-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

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
      // Close if click is outside BOTH trigger buttons
      const isOutsideMob = triggerRefMob.current && !triggerRefMob.current.contains(e.target as Node);
      const isOutsideDsk = triggerRefDsk.current && !triggerRefDsk.current.contains(e.target as Node);
      if (isOutsideMob && isOutsideDsk) {
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
    const trigger = window.innerWidth <= 600 ? triggerRefMob.current : triggerRefDsk.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
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
          zIndex:    9999,
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          border:       "1px solid var(--border-med)",
          borderRadius: "var(--radius-lg)",
          padding:      "6px",
          boxShadow:    "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--glass-border)",
          minWidth:     220,
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
                padding:        "10px 14px",
                borderRadius:   "var(--radius)",
                background:     isSelected ? "var(--accent-mid)" : "transparent",
                border:         "none",
                cursor:         "pointer",
                textAlign:      "left",
                gap:            2,
                outline:        "none",
                transition:     "background 0.1s",
              }}
              onMouseEnter={e => {
                if (!isSelected)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
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
                fontSize:    "0.875rem",
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
      <div className="landing-inner-wrap">
        {/* Main Content Area — This handles the perfect centering */}
        <div className="landing-content-area">
          {/* Portal dropdown — rendered outside all overflow:hidden containers */}
          {dropdown}
          {/* ── Claude-Style Top Header ────────────────────────────────── */}
          <div className="mobile-header">
            <button className="header-icon-btn" onClick={onMenuClick} aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="mobile-top-model-wrap">
              <button
                ref={triggerRefMob}
                type="button"
                className="model-selector-text"
                onClick={openMenu}
              >
                <span className="bar-model-label">{currentLabel}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <button className="header-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>
          </div>
    
          {/* ── Research Background ─────────────────────────────── */}
          <motion.div 
            className="research-grid-wrap" 
            style={{ 
              position: "absolute", 
              inset: -100, 
              overflow: "hidden", 
              pointerEvents: "none", 
              zIndex: 0, 
              opacity: 0.05,
              x: mousePos.x * 40,
              y: mousePos.y * 40,
            }}
          >
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          </motion.div>

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hero-motion-div"
            style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}
          >
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="hero-logo-wrap" 
              style={{ marginBottom: "1.25rem", cursor: "pointer" }}
            >
              <AxiomLogo size={64} />
            </motion.div>
            
            <h1 className="research-hero-text">
              Beyond Search.<br />
              Pure Insight.
            </h1>
          </motion.div>
    
          {/* ── Prompt chips ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.26 }}
            className="chip-container"
            style={{ marginBottom: "2.5rem" }}
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

          {/* ── Search bar ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="search-motion-div"
          >
            <div className="search-bar">
              {/* ── Desktop Model Selector ──────────────────────────────── */}
              <button
                ref={triggerRefDsk}
                type="button"
                className="bar-btn desktop-model-btn"
                onClick={openMenu}
              >
                <span className="bar-model-label">{currentLabel}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className="bar-lead-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
              </div>
              <textarea
                ref={textareaRef}
                value={goal}
                onChange={e => { setGoal(e.target.value); setError(""); }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                }}
                placeholder="Ask Axiom..."
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
                {/* ── Submit ──────────────────────────────────────────────── */}
                <button
                  type="button"
                  className="bar-submit-circular"
                  onClick={submit}
                  disabled={goal.trim().length < 10}
                  aria-label="Run research"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
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
        </div>
  
        {/* Footer / Attribution — Anchored at the bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          style={{
            paddingBottom: "1.5rem",
            textAlign: "center",
            zIndex: 2,
            width: "100%",
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] font-mono opacity-40">
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                SYSTEM_LIVE
              </motion.span>
              <span className="w-1 h-1 rounded-full bg-blue-500" />
              <span>QUANTUM_CORE_V4</span>
              <span className="w-1 h-1 rounded-full bg-purple-500" />
              <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                _
              </motion.span>
            </div>
            <p className="mobile-footer-text" style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: "var(--text-secondary)",
              letterSpacing: "0.05em",
              opacity: 0.3
            }}>
              Powered by Gemini • Serper.dev • CrewAI • Latency: 42ms
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
