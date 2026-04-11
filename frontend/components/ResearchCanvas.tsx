"use client";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import type { Components } from "react-markdown";
import TableOfContents from "./TableOfContents";
import type { ResearchState } from "@/types";

function slug(t: string) {
  return String(t).toLowerCase().replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-");
}

const md: Components = {
  h1: ({ children }) => (
    <motion.h1 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
      {children}
    </motion.h1>
  ),
  h2: ({ children }) => {
    const id = slug(String(children));
    return (
      <motion.h2 id={id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
        {children}
      </motion.h2>
    );
  },
  h3: ({ children }) => <h3 id={slug(String(children))}>{children}</h3>,
  p:  ({ children }) => (
    <motion.p initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.28, ease:"easeOut" }}>
      {children}
    </motion.p>
  ),
  a: ({ href, children }) => (
    <a href={href ?? "#"} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  table: ({ children }) => (
    <div style={{ overflowX:"auto", margin:"1.5rem 0" }}>
      <table>{children}</table>
    </div>
  ),
};

export default function ResearchCanvas({ state }: { state: ResearchState }) {
  const { report, status, duration, partial, model, sessionId, error, goal } = state;
  const isStreaming = status === "running"   && report.length > 0;
  const isDone      = status === "completed" || status === "partial";
  const hasToc      = report.split("\n").filter(l => l.startsWith("##")).length >= 2;
  const endRef      = useRef<HTMLDivElement>(null);

  const download = () => {
    const a   = document.createElement("a");
    a.href    = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
    a.download = `axiom-${sessionId?.slice(0,8) ?? "report"}.md`;
    a.click();
  };

  return (
    <div className="canvas-scroll">
      <div className="canvas-inner">

        {/* Queued spinner */}
        <AnimatePresence>
          {status === "queued" && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ textAlign:"center", paddingTop:"6rem" }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                border: "2px solid var(--crimson)", borderTopColor: "transparent",
                margin: "0 auto 1rem",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--mist)" }}>
                Assembling agent crew...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-title while report streams without its own h1 */}
        {(isStreaming || isDone) && !report.trimStart().startsWith("#") && goal && (
          <motion.h1
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{
              fontFamily:"var(--font-display)",
              fontSize:"1.875rem", fontWeight:700,
              color:"var(--carbon)",
              marginBottom:"1rem", paddingBottom:"1rem",
              borderBottom:"2.5px solid var(--crimson)",
              letterSpacing:"-0.02em",
            }}
          >
            {goal}
          </motion.h1>
        )}

        {/* Toolbar */}
        {report.length > 0 && (
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:"1.5rem", paddingBottom:"1rem",
            borderBottom:"1px solid var(--rule)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{
                fontFamily:"var(--font-mono)",
                fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.1em",
                padding:"3px 10px", borderRadius:99,
                border:`1px solid ${isStreaming ? "var(--crimson-mid)" : "rgba(52,211,153,0.3)"}`,
                background: isStreaming ? "var(--crimson-faint)" : "rgba(52,211,153,0.07)",
                color: isStreaming ? "var(--crimson)" : "var(--term-green)",
              }}>
                {isStreaming ? "Streaming" : partial ? "Partial" : "Complete"}
              </span>
              {isDone && model    && <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"var(--fog)" }}>{model}</span>}
              {isDone && duration && <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"var(--fog)" }}>{duration}s</span>}
            </div>
            {isDone && (
              <button
                onClick={download}
                style={{
                  fontFamily:"var(--font-body)", fontSize:"0.8125rem", fontWeight:500,
                  padding:"5px 14px", borderRadius:7,
                  background:"var(--carbon)", color:"var(--alabaster)",
                  border:"1px solid var(--carbon)", cursor:"pointer", transition:"all 0.15s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "var(--crimson)";
                  el.style.borderColor = "var(--crimson)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "var(--carbon)";
                  el.style.borderColor = "var(--carbon)";
                }}
              >
                Export .md
              </button>
            )}
          </div>
        )}

        {/* TOC */}
        {hasToc && (
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
            <TableOfContents markdown={report} />
          </motion.div>
        )}

        {/* Report */}
        {report.length > 0 && (
          <div className="report-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
              {report}
            </ReactMarkdown>
            {isStreaming && (
              <span style={{
                display:"inline-block", width:2, height:"1.1em",
                background:"var(--crimson)", marginLeft:2, verticalAlign:"middle",
                animation:"blink 1s linear infinite",
              }} />
            )}
          </div>
        )}

        {/* Error */}
        {status === "failed" && error && (
          <motion.div
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{
              borderRadius:10, border:"1px solid var(--crimson-mid)",
              background:"var(--crimson-faint)", padding:"1.25rem 1.5rem", marginTop:"1rem",
            }}
          >
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--crimson)", marginBottom:"0.5rem" }}>
              Pipeline error
            </p>
            <p style={{ fontFamily:"var(--font-body)", fontSize:"0.875rem", color:"var(--ink)", lineHeight:1.65 }}>
              {error}
            </p>
            {error.toLowerCase().includes("quota") && (
              <p style={{ fontFamily:"var(--font-body)", fontWeight:300, fontSize:"0.8125rem", color:"var(--slate)", marginTop:"0.75rem", lineHeight:1.6 }}>
                Free quota resets at midnight Pacific.{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color:"var(--crimson)" }}>
                  Get a new API key
                </a>{" "}
                to continue now.
              </p>
            )}
          </motion.div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
