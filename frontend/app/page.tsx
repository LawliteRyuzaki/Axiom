"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResearch } from "@/hooks/useResearch";
import NavBar from "@/components/NavBar";
import LandingView from "@/components/LandingView";
import InvestigationSidebar from "@/components/InvestigationSidebar";
import ResearchCanvas from "@/components/ResearchCanvas";
import AgentHub from "@/components/AgentHub";
import type { SelectedModel, AppView } from "@/types";

const EASING = [0.22, 1, 0.36, 1] as const;

export default function AxiomApp() {
  const { state, startResearch, loadSession, reset } = useResearch();

  const [view,          setView]          = useState<AppView>("landing");
  const [historyKey,    setHistoryKey]    = useState(0);
  const [selectedModel, setSelectedModel] = useState<SelectedModel>("flash");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);

  const isRunning = state.status === "running" || state.status === "queued";

  // ── Start new research ─────────────────────────────────────────────────────
  const handleSubmit = useCallback((goal: string, model: SelectedModel) => {
    setView("research");
    setSidebarOpen(true);
    startResearch(goal, model);
  }, [startResearch]);

  // ── Reset to landing ───────────────────────────────────────────────────────
  const handleNewSession = useCallback(() => {
    reset();
    setView("landing");
    setHistoryKey(k => k + 1);
  }, [reset]);

  // ── Logo click: toggle sidebar on research view; go home on landing ────────
  const handleLogoClick = useCallback(() => {
    if (view === "research") {
      setSidebarOpen(v => !v);
    } else {
      handleNewSession();
    }
  }, [view, handleNewSession]);

  // ── Load a past session ────────────────────────────────────────────────────
  const handleSelectSession = useCallback((id: string) => {
    setView("research");
    loadSession(id);
  }, [loadSession]);

  // Derive a short session title for the nav
  const sessionTitle = state.goal
    ? (state.goal.length > 72 ? state.goal.slice(0, 72) + "…" : state.goal)
    : undefined;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Glass nav ──────────────────────────────────────────────────── */}
      <NavBar
        status={state.status}
        onLogoClick={handleLogoClick}
        sessionTitle={sessionTitle}
        showNav={view === "research"}
      />

      {/* ── LANDING ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
            style={{ flex: 1, overflow: "hidden" }}
          >
            <LandingView
              onSubmit={handleSubmit}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </motion.div>
        )}

        {/* ── RESEARCH 3-COLUMN ──────────────────────────────────────── */}
        {view === "research" && (
          <motion.div
            key="research"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="app-wrap"
          >
            {/* Left sidebar — slides in from left, toggled by logo */}
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.div
                  key="sidebar"
                  initial={{ x: -240, opacity: 0 }}
                  animate={{ x: 0,    opacity: 1 }}
                  exit={{ x: -240,    opacity: 0 }}
                  transition={{ duration: 0.38, ease: EASING }}
                  style={{ display: "flex", flexShrink: 0 }}
                >
                  <InvestigationSidebar
                    refreshKey={historyKey}
                    onNewSession={handleNewSession}
                    onSelect={handleSelectSession}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center canvas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASING, delay: 0.12 }}
              className="canvas-panel"
            >
              <ResearchCanvas state={state} />
            </motion.div>

            {/* Right agent hub — slides in from right */}
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0,   opacity: 1 }}
              transition={{ duration: 0.45, ease: EASING, delay: 0.1 }}
              style={{ display: "flex", flexShrink: 0 }}
            >
              <AgentHub state={state} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
