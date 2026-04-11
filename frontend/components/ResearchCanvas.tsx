"use client";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import type { Components } from "react-markdown";
import TableOfContents from "./TableOfContents";
import type { ResearchState } from "@/types";

function slugify(t: string) {
  return String(t).toLowerCase().replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-");
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <motion.h1 initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
      {children}
    </motion.h1>
  ),
  h2: ({ children }) => {
    const id = slugify(String(children));
    return (
      <motion.h2 id={id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
        {children}
      </motion.h2>
    );
  },
  h3: ({ children }) => <h3 id={slugify(String(children))}>{children}</h3>,
  p:  ({ children }) => (
    <motion.p initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.28, ease:"easeOut" }}>
      {children}
    </motion.p>
  ),
  a:  ({ href, children }) => <a href={href ?? "#"} target="_blank" rel="noopener noreferrer">{children}</a>,
  table: ({ children }) => (
    <div style={{ overflowX:"auto", margin:"1.5rem 0" }}>
      <table>{children}</table>
    </div>
  ),
};

interface Props { state: ResearchState; }

export default function ResearchCanvas({ state }: Props) {
  const { report, status, duration, partial, model, sessionId, error, goal } = state;
  const isStreaming = status === "running" && report.length > 0;
  const isDone      = status === "completed" || status === "partial";
  const bottomRef   = useRef<HTMLDivElement>(null);
  const hasToc      = report.split("\n").filter(l => l.startsWith("##")).length >= 2;

  const handleDownload = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `axiom-${sessionId?.slice(0,8) ?? "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="canvas-scroll">
      <div className="canvas-inner">

        {/* ── Queued ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {status === "queued" && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ textAlign:"center", paddingTop:"5rem" }}
            >
              <div style={{
                width:28, height:28, borderRadius:"50%",
                border:"2px solid var(--crimson)", borderTopColor:"transparent",
                margin:"0 auto 1rem",
                animation:"spin 0.85s linear infinite",
              }} />
              <p style={{
                fontFamily:"'JetBrains Mono', monospace",
                fontSize:"0.72rem",
                textTransform:"uppercase",
                letterSpacing:"0.1em",
                color:"var(--ghost)",
              }}>
                Initialising agent pipeline...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Goal heading (shown while streaming) ─────────────────── */}
        {(isStreaming || isDone) && !report.startsWith("#") && goal && (
          <motion.h1
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{
              fontFamily:"'Instrument Serif', Georgia, serif",
              fontSize:"1.75rem",
              fontWeight:400,
              color:"var(--carbon)",
              marginBottom:"1rem",
              paddingBottom:"1rem",
              borderBottom:"2px solid var(--crimson)",
              letterSpacing:"-0.015em",
            }}
          >
            {goal}
          </motion.h1>
        )}

        {/* ── Report toolbar ───────────────────────────────────────── */}
        {report.length > 0 && (
          <div style={{
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            marginBottom:"1.5rem",
            paddingBottom:"1rem",
            borderBottom:"1px solid var(--rule)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{
                fontFamily:"'JetBrains Mono', monospace",
                fontSize:"0.65rem",
                textTransform:"uppercase",
                letterSpacing:"0.1em",
                padding:"3px 9px",
                borderRadius:"99px",
                border:`1px solid ${isStreaming ? "var(--crimson-mid)" : "rgba(62,207,142,0.3)"}`,
                background: isStreaming ? "var(--crimson-faint)" : "rgba(62,207,142,0.06)",
                color: isStreaming ? "var(--crimson)" : "var(--term-green)",
              }}>
                {isStreaming ? "Streaming" : partial ? "Partial" : "Complete"}
              </span>
              {isDone && model && (
                <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"0.65rem", color:"var(--mist)" }}>
                  {model}
                </span>
              )}
              {isDone && duration && (
                <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"0.65rem", color:"var(--mist)" }}>
                  {duration}s
                </span>
              )}
            </div>

            {isDone && (
              <button
                onClick={handleDownload}
                style={{
                  fontFamily:"'JetBrains Mono', monospace",
                  fontSize:"0.65rem",
                  textTransform:"uppercase",
                  letterSpacing:"0.08em",
                  padding:"5px 12px",
                  background:"var(--carbon)",
                  color:"var(--alabaster)",
                  border:"1px solid var(--carbon)",
                  borderRadius:"6px",
                  cursor:"pointer",
                  transition:"all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--crimson)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--crimson)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--carbon)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--carbon)";
                }}
              >
                Export .md
              </button>
            )}
          </div>
        )}

        {/* ── TOC ──────────────────────────────────────────────────── */}
        {hasToc && (
          <motion.div
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.35, delay:0.1 }}
          >
            <TableOfContents markdown={report} />
          </motion.div>
        )}

        {/* ── Report markdown ───────────────────────────────────────── */}
        {report.length > 0 && (
          <div className="report-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {report}
            </ReactMarkdown>

            {isStreaming && (
              <span style={{
                display:"inline-block",
                width:2, height:"1.1em",
                background:"var(--crimson)",
                marginLeft:2,
                verticalAlign:"middle",
                animation:"blink 1s linear infinite",
              }} />
            )}
          </div>
        )}

        {/* ── Error state ───────────────────────────────────────────── */}
        {status === "failed" && error && (
          <motion.div
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{
              borderRadius:8,
              border:"1px solid var(--crimson-mid)",
              background:"var(--crimson-faint)",
              padding:"1.25rem 1.5rem",
              marginTop:"1rem",
            }}
          >
            <p style={{
              fontFamily:"'JetBrains Mono', monospace",
              fontSize:"0.65rem",
              textTransform:"uppercase",
              letterSpacing:"0.1em",
              color:"var(--crimson)",
              marginBottom:"0.5rem",
            }}>
              Pipeline Error
            </p>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.875rem", color:"var(--ink)", lineHeight:1.65 }}>
              {error}
            </p>
            {error.toLowerCase().includes("quota") && (
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:"0.8rem", color:"var(--ghost)", marginTop:"0.75rem", lineHeight:1.6 }}>
                Free-tier quota resets at midnight Pacific Time. Generate a new key at{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                   style={{ color:"var(--crimson)", textDecoration:"underline" }}>
                  aistudio.google.com
                </a>.
              </p>
            )}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
