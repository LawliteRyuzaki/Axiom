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
  // Dynamically import jsPDF to avoid SSR issues
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Helper: add text with word-wrap and page breaks ─────────────────────────
  const addWrappedText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" | "italic",
    color: [number, number, number],
    lineHeightFactor: number = 1.5,
    indent: number = 0
  ): void => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineH = (fontSize * lineHeightFactor) / 2.83; // pt to mm approx

    for (const line of lines) {
      if (y + lineH > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + indent, y);
      y += lineH;
    }
  };

  const addSpacing = (mm: number) => {
    y += mm;
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Cover / Header ──────────────────────────────────────────────────────────
  // Accent bar at top
  doc.setFillColor(196, 30, 58); // --accent color
  doc.rect(0, 0, pageWidth, 8, "F");

  y = 20;

  // Axiom branding
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(196, 30, 58);
  doc.text("AXIOM RESEARCH INTELLIGENCE", margin, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, margin, y);
  if (sessionId) {
    doc.text(`Session: ${sessionId.slice(0, 8)}`, pageWidth - margin - 30, y);
  }
  y += 8;

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Parse and render markdown ────────────────────────────────────────────────
  const lines = report.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      const text = line.replace(/^# /, "");
      addSpacing(2);
      // Accent underline for h1
      addWrappedText(text, 18, "bold", [15, 17, 23], 1.4);
      const titleY = y;
      doc.setDrawColor(196, 30, 58);
      doc.setLineWidth(0.8);
      doc.line(margin, titleY, pageWidth - margin, titleY);
      y += 6;
    }
    // H2
    else if (line.startsWith("## ")) {
      const text = line.replace(/^## /, "");
      addSpacing(5);
      addWrappedText(text, 13, "bold", [15, 17, 23], 1.3);
      addSpacing(2);
    }
    // H3
    else if (line.startsWith("### ")) {
      const text = line.replace(/^### /, "").toUpperCase();
      addSpacing(3);
      addWrappedText(text, 8, "bold", [196, 30, 58], 1.3);
      addSpacing(1);
    }
    // Horizontal rule
    else if (line.startsWith("---") || line.startsWith("===")) {
      addSpacing(2);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      addSpacing(3);
    }
    // Blank line
    else if (line.trim() === "") {
      addSpacing(2);
    }
    // Table row (basic rendering)
    else if (line.startsWith("|")) {
      // Skip separator rows
      if (line.includes("---")) continue;
      const cells = line.split("|").filter((c) => c.trim() !== "");
      if (cells.length === 0) continue;
      const isHeader = i > 0 && lines[i + 1]?.includes("---");

      doc.setFontSize(8);
      const cellWidth = contentWidth / cells.length;
      const rowH = 6;

      if (y + rowH > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      cells.forEach((cell, ci) => {
        const cx = margin + ci * cellWidth;
        if (isHeader) {
          doc.setFillColor(245, 245, 245);
          doc.rect(cx, y - 4, cellWidth, rowH, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(107, 114, 128);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 65, 81);
        }
        const cellText = doc.splitTextToSize(cell.trim(), cellWidth - 2);
        doc.text(cellText[0] || "", cx + 1, y);
      });

      // Row border
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += rowH;
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      const text = line.replace(/^> /, "");
      addSpacing(2);
      // Left accent bar
      doc.setFillColor(196, 30, 58);
      doc.rect(margin, y - 3, 2, 8, "F");
      doc.setFillColor(255, 240, 243);
      doc.rect(margin + 2, y - 3, contentWidth - 2, 8, "F");
      addWrappedText(text, 9, "italic", [55, 65, 81], 1.4, 6);
      addSpacing(3);
    }
    // Code block
    else if (line.startsWith("```")) {
      // Collect code block
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const code = codeLines.join("\n");
      if (code.trim()) {
        addSpacing(2);
        const codeLineH = 4;
        const blockH = codeLines.length * codeLineH + 6;

        if (y + blockH > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.setFillColor(13, 17, 23);
        doc.rect(margin, y - 3, contentWidth, blockH, "F");
        doc.setFontSize(7.5);
        doc.setFont("courier", "normal");
        doc.setTextColor(201, 209, 217);

        codeLines.forEach((cl) => {
          if (y + codeLineH > pageHeight - margin - 5) {
            doc.addPage();
            y = margin;
            doc.setFillColor(13, 17, 23);
            doc.rect(margin, y - 3, contentWidth, pageHeight, "F");
          }
          doc.text(cl, margin + 3, y);
          y += codeLineH;
        });
        addSpacing(5);
      }
    }
    // List items
    else if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
      const isBullet = line.match(/^[-*+]\s/);
      const text = line.replace(/^[-*+]\s/, "").replace(/^\d+\.\s/, "");
      const stripped = stripInlineMarkdown(text);

      if (y + 5 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      // Bullet dot or number
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(196, 30, 58);
      if (isBullet) {
        doc.circle(margin + 2, y - 1.5, 0.8, "F");
      } else {
        const num = line.match(/^(\d+)\./)?.[1] ?? "•";
        doc.text(num + ".", margin, y);
      }

      addWrappedText(stripped, 9, "normal", [55, 65, 81], 1.4, 6);
      addSpacing(0.5);
    }
    // Normal paragraph text
    else if (line.trim()) {
      const stripped = stripInlineMarkdown(line);
      addWrappedText(stripped, 9.5, "normal", [55, 65, 81], 1.6);
      addSpacing(1);
    }
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Bottom accent bar
    doc.setFillColor(196, 30, 58);
    doc.rect(0, pageHeight - 6, pageWidth, 6, "F");
    // Page number
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Axiom Research Intelligence  ·  Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 2,
      { align: "center" }
    );
  }

  const filename = `axiom-${sessionId?.slice(0, 8) ?? "report"}-${Date.now()}.pdf`;
  doc.save(filename);
}

// ── Strip inline markdown (bold, italic, code, links) ─────────────────────────
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/!\[.*?\]\(.+?\)/g, "")
    .replace(/~~(.+?)~~/g, "$1");
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ResearchCanvas({ state }: { state: ResearchState }) {
  const { report, status, duration, partial, model, sessionId, error, goal } = state;
  const isStreaming = status === "running" && report.length > 0;
  const isDone      = status === "completed" || status === "partial";
  const hasToc      = report.split("\n").filter(l => l.startsWith("##")).length >= 2;
  const endRef      = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadMarkdown = () => {
    const a = document.createElement("a");
    a.href  = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
    a.download = `axiom-${sessionId?.slice(0, 8) ?? "report"}.md`;
    a.click();
  };

  const downloadPDF = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      await exportToPDF(report, goal, sessionId);
    } catch (err) {
      console.error("PDF export failed:", err);
      // Fallback: open print dialog
      window.print();
    } finally {
      setPdfLoading(false);
    }
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

            {/* Export buttons */}
            {isDone && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Export .md */}
                <button
                  onClick={downloadMarkdown}
                  title="Download as Markdown"
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    padding: "5px 12px",
                    borderRadius: "var(--radius)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "all 0.14s",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-med)";
                    el.style.color = "var(--text-secondary)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border)";
                    el.style.color = "var(--text-muted)";
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1v6M2.5 4.5l3 3 3-3M1.5 9.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  .md
                </button>

                {/* Export PDF */}
                <button
                  onClick={downloadPDF}
                  disabled={pdfLoading}
                  title="Download as PDF"
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    padding: "5px 14px",
                    borderRadius: "var(--radius)",
                    background: pdfLoading ? "var(--border-med)" : "var(--text-primary)",
                    color: "#fff",
                    border: `1px solid ${pdfLoading ? "var(--border-med)" : "var(--text-primary)"}`,
                    cursor: pdfLoading ? "not-allowed" : "pointer",
                    transition: "all 0.14s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: pdfLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    if (pdfLoading) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "var(--accent)";
                    el.style.borderColor = "var(--accent)";
                  }}
                  onMouseLeave={e => {
                    if (pdfLoading) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "var(--text-primary)";
                    el.style.borderColor = "var(--text-primary)";
                  }}
                >
                  {pdfLoading ? (
                    <>
                      <span style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        border: "1.5px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        animation: "spin 0.6s linear infinite",
                        flexShrink: 0,
                      }} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 8.5v1a1 1 0 001 1h6a1 1 0 001-1v-1M5.5 1v6M2.5 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
              </div>
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
