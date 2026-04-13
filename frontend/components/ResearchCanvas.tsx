"use client";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import type { Components } from "react-markdown";
import TableOfContents from "./TableOfContents";
import ReportAnalytics from "./ReportAnalytics";
import type { ResearchState } from "@/types";

const slug = (t: string) =>
  String(t).toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

const md: Components = {
  h1: ({ children }) => (
    <motion.h1
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38 }}
    >
      {children}
    </motion.h1>
  ),
  h2: ({ children }) => {
    const id = slug(String(children));
    return (
      <motion.h2
        id={id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.h2>
    );
  },
  h3: ({ children }) => <h3 id={slug(String(children))}>{children}</h3>,
  p: ({ children }) => (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.p>
  ),
  a: ({ href, children }) => (
    <a href={href ?? "#"} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "1.75rem 0" }}>
      <table>{children}</table>
    </div>
  ),
};

export default function ResearchCanvas({ state }: { state: ResearchState }) {
  const { report, status, duration, partial, model, sessionId, error, goal } = state;
  const isStreaming = status === "running" && report.length > 0;
  const isDone      = status === "completed" || status === "partial";
  const hasToc      = report.split("\n").filter(l => l.startsWith("##")).length >= 2;
  const endRef      = useRef<HTMLDivElement>(null);

  const download = () => {
    const a = document.createElement("a");
    a.href  = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
    a.download = `axiom-${sessionId?.slice(0, 8) ?? "report"}.md`;
    a.click();
  };

  return (
    <div className="canvas-scroll">
      <div style={{
        maxWidth: "48rem",
        margin: "0 auto",
        padding: "0 2.5rem",
      }}>

        {/* ── Queued state ─────────────────────────────────────────── */}
        <AnimatePresence>
          {status === "queued" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", paddingTop: "5rem" }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "2px solid var(--accent)",
                borderTopColor: "transparent",
                margin: "0 auto 1rem",
                animation: "spin 0.75s linear infinite",
              }} />
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
              }}>
                Initialising Axiom agent pipeline...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Auto h1 if report doesn't open with one ──────────────── */}
        {(isStreaming || isDone) && !report.trimStart().startsWith("#") && goal && (
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "1.625rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "0.875rem",
              paddingBottom: "0.875rem",
              borderBottom: "2px solid var(--accent)",
              letterSpacing: "-0.018em",
              lineHeight: 1.2,
            }}
          >
            {goal}
          </motion.h1>
        )}

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        {report.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.75rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                padding: "3px 9px",
                borderRadius: 99,
                border: `1px solid ${isStreaming ? "var(--accent-mid)" : "rgba(63,185,80,0.3)"}`,
                background: isStreaming ? "var(--accent-light)" : "rgba(63,185,80,0.06)",
                color: isStreaming ? "var(--accent)" : "var(--term-green)",
              }}>
                {isStreaming ? "Streaming" : partial ? "Partial" : "Complete"}
              </span>
              {isDone && model    && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-faint)" }}>
                  {model}
                </span>
              )}
              {isDone && duration && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-faint)" }}>
                  {duration}s
                </span>
              )}
            </div>
            {isDone && (
              <button
                onClick={download}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  padding: "5px 14px",
                  borderRadius: "var(--radius)",
                  background: "var(--text-primary)",
                  color: "#fff",
                  border: "1px solid var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 0.14s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "var(--accent)";
                  el.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "var(--text-primary)";
                  el.style.borderColor = "var(--text-primary)";
                }}
              >
                Export .md
              </button>
            )}
          </div>
        )}

        {/* ── Table of contents ────────────────────────────────────── */}
        {hasToc && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TableOfContents markdown={report} />
          </motion.div>
        )}

        {/* ── Report body ───────────────────────────────────────────── */}
        {report.length > 0 && (
          <div
            className="report-prose"
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.75,
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
              {report}
            </ReactMarkdown>
            {isStreaming && (
              <span style={{
                display: "inline-block",
                width: 2,
                height: "1.1em",
                background: "var(--accent)",
                marginLeft: 2,
                verticalAlign: "middle",
                animation: "blink 1s linear infinite",
              }} />
            )}
          </div>
        )}

        {/* ── Analytics Panel (shown after report is complete) ─────── */}
        <ReportAnalytics state={state} />

        {/* ── Error state ──────────────────────────────────────────── */}
        {status === "failed" && error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--accent-mid)",
              background: "var(--accent-light)",
              padding: "1.25rem 1.5rem",
              marginTop: "1rem",
            }}
          >
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              color: "var(--accent)",
              marginBottom: "0.5rem",
            }}>
              Pipeline error
            </p>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
            }}>
              {error}
            </p>
            {error.toLowerCase().includes("quota") && (
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                marginTop: "0.75rem",
                lineHeight: 1.6,
              }}>
                Free quota resets at midnight Pacific.{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent)" }}
                >
                  Generate a new API key
                </a>{" "}
                to continue immediately.
              </p>
            )}
          </motion.div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
