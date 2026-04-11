"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EXAMPLES = [
  "Attention mechanisms in transformer architectures: theory and empirical performance",
  "Federated learning for privacy-preserving medical image classification",
  "Graph neural networks for molecular property prediction in drug discovery",
  "Diffusion models vs GANs: a comparative analysis of generative approaches",
  "Reinforcement learning from human feedback: alignment techniques and limitations",
];

interface Props {
  onSubmit: (goal: string) => void;
  onReset: () => void;
  isRunning: boolean;
}

export default function ResearchForm({ onSubmit, onReset, isRunning }: Props) {
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = goal.trim();
    if (trimmed.length < 10) { setError("Enter at least 10 characters."); return; }
    if (trimmed.length > 500) { setError("Maximum 500 characters."); return; }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <div className="px-5 py-4 border-b border-[var(--rule)] bg-[var(--alabaster)] shrink-0">
      {/* Label */}
      <label
        className="block font-mono text-[10px] uppercase tracking-[0.12em] mb-2"
        style={{ color: "var(--ghost)" }}
      >
        Research Objective
      </label>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Input area */}
        <div
          className="rounded transition-all"
          style={{
            border: `1px solid ${focused ? "var(--crimson)" : "var(--rule-heavy)"}`,
            background: "#FAFAF7",
            boxShadow: focused ? "0 0 0 3px var(--crimson-faint)" : "none",
          }}
        >
          <textarea
            ref={textareaRef}
            value={goal}
            onChange={e => { setGoal(e.target.value); setError(""); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isRunning}
            placeholder="Describe your research objective in precise academic language..."
            rows={2}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: "0.875rem",
              lineHeight: 1.65,
              color: "var(--carbon)",
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <div
            className="flex items-center justify-between px-3 py-1.5"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            <span className="font-mono text-[10px]" style={{ color: "var(--ghost)" }}>
              {goal.length}/500
            </span>
            {error && (
              <span className="font-mono text-[10px]" style={{ color: "var(--crimson)" }}>
                {error}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isRunning || goal.trim().length < 10}
            className="flex-1 py-2.5 rounded font-mono text-[11px] uppercase tracking-[0.12em] transition-all"
            style={{
              background: isRunning || goal.trim().length < 10
                ? "var(--carbon-10)" : "var(--crimson)",
              color: isRunning || goal.trim().length < 10
                ? "var(--ghost)" : "#F2F0EA",
              border: "1px solid transparent",
              cursor: isRunning || goal.trim().length < 10 ? "not-allowed" : "pointer",
            }}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full border-t border-current"
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
                Researching
              </span>
            ) : "Initiate Research"}
          </button>

          {isRunning && (
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2.5 rounded font-mono text-[11px] uppercase tracking-wider transition-all"
              style={{
                border: "1px solid var(--rule-heavy)",
                color: "var(--ghost)",
                background: "transparent",
              }}
            >
              Abort
            </button>
          )}
        </div>
      </form>

      {/* Examples */}
      <AnimatePresence>
        {!isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <p
              className="font-mono text-[9px] uppercase tracking-[0.12em] mb-1.5"
              style={{ color: "var(--ghost)" }}
            >
              Example objectives
            </p>
            <div className="space-y-1">
              {EXAMPLES.map(eg => (
                <button
                  key={eg}
                  onClick={() => { setGoal(eg); setError(""); textareaRef.current?.focus(); }}
                  className="block w-full text-left transition-colors"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--ghost)",
                    lineHeight: 1.5,
                    padding: "0.2rem 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--crimson)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--ghost)")}
                >
                  {eg}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
