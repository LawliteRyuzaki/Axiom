"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResearch } from "@/hooks/useResearch";
import NavBar from "@/components/NavBar";
import LandingView from "@/components/LandingView";
import InvestigationSidebar from "@/components/InvestigationSidebar";
import ResearchCanvas from "@/components/ResearchCanvas";
import AgentHub from "@/components/AgentHub";
import HistoryDrawer from "@/components/HistoryDrawer";
import type { SelectedModel, AppView } from "@/types";

const EASING = [0.22, 1, 0.36, 1] as const;
const isMobile = () => typeof window !== "undefined" && window.innerWidth <= 1024;

export default function AxiomApp() {
  const { state, startResearch, loadSession, reset } = useResearch();

  const [view,          setView]          = useState<AppView>("landing");
  const [historyKey,    setHistoryKey]    = useState(0);
  const [selectedModel, setSelectedModel] = useState<SelectedModel>("flash");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [hubOpen,       setHubOpen]       = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  // Detect screen size
  useEffect(() => {
    const check = () => setIsMobileLayout(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // When entering research view, set sidebar based on screen size
  useEffect(() => {
    if (view === "research") {
      if (!isMobileLayout) {
        setSidebarOpen(true);
        setHubOpen(true);
      } else {
        setSidebarOpen(false);
        setHubOpen(false);
      }
    }
  // Only run when view changes or mobile layout changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isMobileLayout]);

  // ── Start new research ─────────────────────────────────────────────────
  const handleSubmit = useCallback((goal: string, model: SelectedModel) => {
    setView("research");
    setDrawerOpen(false);
    startResearch(goal, model);
  }, [startResearch]);

  // ── Reset to landing ───────────────────────────────────────────────────
  const handleNewSession = useCallback(() => {
    reset();
    setView("landing");
    setDrawerOpen(false);
    setSidebarOpen(false);
    setHubOpen(false);
    setHistoryKey(k => k + 1);
  }, [reset]);

  // ── Logo click: toggle sidebar in research / toggle drawer on landing ──
  const handleLogoClick = useCallback(() => {
    if (view === "research") {
      setSidebarOpen(v => {
        const next = !v;
        if (next && isMobile()) setHubOpen(false); // close hub on mobile when opening sidebar
        return next;
      });
    } else {
      setDrawerOpen(v => !v);
    }
  }, [view]);

  // ── Hub toggle ─────────────────────────────────────────────────────────
  const handleHubClick = useCallback(() => {
    setHubOpen(v => {
      const next = !v;
      if (next && isMobile()) setSidebarOpen(false); // close sidebar on mobile when opening hub
      return next;
    });
  }, []);

  // ── Select history session ─────────────────────────────────────────────
  const handleSelectSession = useCallback((id: string) => {
    setDrawerOpen(false);
    if (isMobile()) {
      setSidebarOpen(false);
      setHubOpen(false);
    }
    setView("research");
    loadSession(id);
  }, [loadSession]);

  const sessionTitle = state.goal
    ? (state.goal.length > 68 ? state.goal.slice(0, 68) + "…" : state.goal)
    : undefined;

  const showBackdrop = isMobileLayout && (sidebarOpen || hubOpen);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Global history drawer ────────────────────────────────────────── */}
      <HistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSelectSession}
        onNewSession={handleNewSession}
      />

      {/* ── Persistent glass nav (always visible) ───────────────────────── */}
      <NavBar
        status={state.status}
        onLogoClick={handleLogoClick}
        onHubClick={handleHubClick}
        sessionTitle={sessionTitle}
        showNav={view === "research"}
      />

      {/* ── Views ───────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* LANDING */}
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeIn" }}
            style={{ flex: 1, overflow: "hidden" }}
          >
            <LandingView
              onSubmit={handleSubmit}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onMenuClick={handleLogoClick}
            />
          </motion.div>
        )}

        {/* RESEARCH — 3-column layout */}
        {view === "research" && (
          <motion.div
            key="research"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASING }}
            className="app-wrap"
          >
            {/* Mobile backdrop — tap to close drawers */}
            {showBackdrop && (
              <div
                onClick={() => { setSidebarOpen(false); setHubOpen(false); }}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  backdropFilter: "blur(3px)",
                  zIndex: 150,
                }}
              />
            )}

            {/* Left: history sidebar */}
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.div
                  key="sidebar"
                  initial={{ x: -285, opacity: 0 }}
                  animate={{ x: 0,    opacity: 1 }}
                  exit={{ x: -285,    opacity: 0 }}
                  transition={{ duration: 0.32, ease: EASING }}
                  style={{ flexShrink: 0, zIndex: isMobileLayout ? 200 : 10 }}
                >
                  <InvestigationSidebar
                    refreshKey={historyKey}
                    onNewSession={handleNewSession}
                    onSelect={handleSelectSession}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center: report canvas */}
            <div
              className="canvas-panel"
              onClick={() => {
                if (isMobileLayout) {
                  setSidebarOpen(false);
                  setHubOpen(false);
                }
              }}
            >
              <ResearchCanvas state={state} />
            </div>

            {/* Right: agent hub */}
            <AnimatePresence initial={false}>
              {hubOpen && (
                <motion.div
                  key="hub"
                  initial={{ x: 320, opacity: 0 }}
                  animate={{ x: 0,   opacity: 1 }}
                  exit={{ x: 320,    opacity: 0 }}
                  transition={{ duration: 0.32, ease: EASING }}
                  style={{ flexShrink: 0, zIndex: isMobileLayout ? 200 : 10 }}
                >
                  <AgentHub state={state} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
