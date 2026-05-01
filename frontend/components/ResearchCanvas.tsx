"use client";
import { useRef, useState } from "react";
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

// ── PDF Export ─────────────────────────────────────────────────────────────────

async function exportToPDF(
  report: string,
  goal: string,
  sessionId: string | null
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24; // Balanced professional margins
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const BRAND_BLUE: [number, number, number] = [59, 130, 246];
  const BODY_TEXT: [number, number, number] = [39, 39, 42];
  const MUTED_TEXT: [number, number, number] = [113, 113, 122];
  const PAPER_WHITE: [number, number, number] = [252, 252, 253]; // Subtle off-white for premium feel

  const addPageTint = () => {
    doc.setFillColor(...PAPER_WHITE);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  };

  const addHeader = (pageNum: number) => {
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.1);
    doc.line(margin, 15, pageWidth - margin, 15);
  };

  const addFooter = (pageNum: number) => {
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.1);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_TEXT);
    doc.text(`${pageNum}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  const checkSpace = (needed: number) => {
    if (y + needed > pageHeight - 18) { // Even tighter bottom margin
      addFooter(doc.getCurrentPageInfo().pageNumber);
      doc.addPage();
      addPageTint();
      y = 22; // Start higher on new pages
      addHeader(doc.getCurrentPageInfo().pageNumber);
      return true;
    }
    return false;
  };

  const addSpacing = (mm: number) => {
    if (y + mm > pageHeight - 18) {
      checkSpace(mm);
    } else {
      y += mm;
    }
  };

  const addWrappedText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" | "italic",
    color: [number, number, number],
    lineHeightFactor: number = 1.6, // Tighter line height
    fontFamily: string = "times",
    align: "left" | "center" | "right" | "justify" = "justify"
  ): void => {
    doc.setFont(fontFamily, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, contentWidth);
    const lineH = (fontSize * lineHeightFactor) / 2.83;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isSecondToLast = i === lines.length - 2;
      const spaceNeeded = isSecondToLast ? (lineH * 2) : lineH;

      if (checkSpace(spaceNeeded)) {
        doc.setFont(fontFamily, fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
      }

      const isLastLine = i === lines.length - 1;
      doc.text(line, margin, y, { 
        maxWidth: contentWidth,
        align: (align === "justify" && isLastLine) ? "left" : align 
      });

      // Detect URLs in the line and add clickable links
      const urlMatches = line.match(/https?:\/\/[^\s)]+/g);
      if (urlMatches) {
        urlMatches.forEach((url: string) => {
          // Simplistic link overlay for the whole line if it contains a URL
          // In academic reports, URLs often occupy their own lines in references
          doc.link(margin, y - fontSize/2.83, contentWidth, lineH, { url });
        });
      }

      y += lineH;
    }
  };

  // ── Cover ──────────────────────────────────────────────────────────
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 5, "F");

  y = 70;
  doc.setFontSize(54);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("AXIOM", margin, y);
  
  y += 12;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(113, 113, 122);
  doc.text("INTELLIGENCE SYNTHESIS REPORT", margin, y);

  y += 50;
  doc.setDrawColor(63, 63, 70);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 40, y);
  
  y += 20;
  addWrappedText(goal, 22, "bold", [255, 255, 255] as const, 1.3, "helvetica", "left");
  
  y = pageHeight - 40;
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);
  doc.text(`SESSION ID: ${sessionId ?? "N/A"}`, margin, y);
  y += 6;
  doc.text(`DATE: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, margin, y);
  y += 6;
  doc.text(`CLASSIFICATION: UNCLASSIFIED // PROPRIETARY`, margin, y);

  // ── Content ────────────────────────────────────────────────────────
  doc.addPage();
  addPageTint();
  y = 22;
  addHeader(1);

  const paragraphs = report.split("\n");
  for (const p of paragraphs) {
    if (p.startsWith("# ")) {
      const text = p.replace(/^# /, "");
      checkSpace(30);
      addSpacing(8);
      addWrappedText(text, 28, "bold", [15, 15, 18] as const, 1.1, "helvetica", "left");
      doc.setDrawColor(...BRAND_BLUE);
      doc.setLineWidth(1);
      doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
      addSpacing(10);
    } else if (p.startsWith("## ")) {
      const text = p.replace(/^## /, "");
      checkSpace(20);
      addSpacing(6);
      addWrappedText(text, 16, "bold", [24, 24, 27] as const, 1.2, "helvetica", "left");
      addSpacing(2.5); // Tight gap below H2
    } else if (p.startsWith("### ")) {
      const text = p.replace(/^### /, "").toUpperCase();
      checkSpace(12);
      addSpacing(3);
      addWrappedText(text, 8.5, "bold", BRAND_BLUE, 1.2, "helvetica", "left");
      addSpacing(1.5); // Very tight gap below H3
    } else if (p.trim() === "") {
      addSpacing(2);
    } else {
      const stripped = stripInlineMarkdown(p);
      addWrappedText(stripped, 10.5, "normal", BODY_TEXT, 1.6, "times", "justify");
      addSpacing(4); // Paragraph gap
    }
  }

  addFooter(doc.getCurrentPageInfo().pageNumber);
  const filename = `axiom-intelligence-${Date.now()}.pdf`;
  doc.save(filename);
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1");
}

// ── Reasoning Trace Component ──────────────────────────────────────────────────

function ReasoningTrace({ thoughts }: { thoughts: ResearchState["thoughts"] }) {
  if (!thoughts || thoughts.length === 0) return null;

  return (
    <div className="reasoning-trace" style={{
      marginBottom: "2.5rem",
      padding: "1.5rem",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "2px",
        height: "100%",
        background: "linear-gradient(to bottom, var(--accent), transparent)"
      }} />
      
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--accent)",
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <span className="pulse-dot" />
        Agent Reasoning Trace
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {thoughts.slice(-3).map((thought, i) => (
          <motion.div
            key={thought.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              fontSize: "0.875rem",
              color: i === 2 ? "var(--text-primary)" : "var(--text-muted)",
              lineHeight: "1.5",
              paddingLeft: "12px",
              borderLeft: "1px solid var(--border-med)"
            }}
          >
            {thought.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ResearchCanvas({ state }: { state: ResearchState }) {
  const { report, status, duration, partial, model, sessionId, error, goal, thoughts } = state;
  const isStreaming = status === "running" && report.length > 0;
  const isDone      = status === "completed" || status === "partial";
  const hasToc      = report.split("\n").filter(l => l.startsWith("##")).length >= 2;
  const endRef      = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadMarkdown = () => {
    const a = document.createElement("a");
    a.href  = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
    a.download = `axiom-research.md`;
    a.click();
  };

  const downloadPDF = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      await exportToPDF(report, goal, sessionId);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="canvas-scroll">
      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 2.5rem" }}>

        {/* ── Queued State ─────────────────────────────────────────── */}
        <AnimatePresence>
          {status === "queued" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", paddingTop: "8rem" }}
            >
              <div className="loading-spinner" />
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                marginTop: "1.5rem"
              }}>
                ◈ Axiom 2.0 Deep Research Engine Initializing...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reasoning Trace ──────────────────────────────────────── */}
        {status === "running" && <ReasoningTrace thoughts={thoughts} />}

        {/* ── Report Title ─────────────────────────────────────────── */}
        {(isStreaming || isDone) && goal && (
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="report-title"
          >
            {goal}
          </motion.h1>
        )}

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        {report.length > 0 && (
          <div className="canvas-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className={`status-badge ${status}`}>
                {status}
              </span>
              {isDone && model && <span className="meta-tag">{model}</span>}
              {isDone && duration && <span className="meta-tag">{duration}s</span>}
            </div>

            {isDone && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={downloadMarkdown} className="btn-secondary">.md</button>
                <button onClick={downloadPDF} disabled={pdfLoading} className="btn-primary">
                  {pdfLoading ? "Generating..." : "Export PDF"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TOC ──────────────────────────────────────────────────── */}
        {hasToc && <TableOfContents markdown={report} />}

        {/* ── Report Body ───────────────────────────────────────────── */}
        {report.length > 0 && (
          <div className="report-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
              {report}
            </ReactMarkdown>
            {isStreaming && <span className="streaming-cursor" />}
          </div>
        )}

        {/* ── Analytics ────────────────────────────────────────────── */}
        <ReportAnalytics state={state} />

        {/* ── Error State ──────────────────────────────────────────── */}
        {status === "failed" && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="error-panel"
          >
            <p className="error-label">Pipeline Interrupted</p>
            <p className="error-text">{error}</p>
          </motion.div>
        )}

        <div ref={endRef} style={{ height: "4rem" }} />
      </div>
    </div>
  );
}
