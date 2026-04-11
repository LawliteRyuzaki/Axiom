"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ResearchState } from "@/types";

interface Props {
  state: ResearchState;
}

export default function ReportViewer({ state }: Props) {
  const { report, status, duration, partial, sessionId } = state;

  if (!report && status !== "running") return null;

  const isStreaming = status === "running" && report.length > 0;
  const isDone = status === "completed" || status === "partial";

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Research Report</h3>
          {partial && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              Partial — timed out
            </span>
          )}
          {isStreaming && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Writing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDone && duration && (
            <span className="text-xs text-slate-400">
              Completed in {duration}s
            </span>
          )}
          {isDone && report && (
            <button
              onClick={() => {
                const blob = new Blob([report], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scholarsync-report-${sessionId ?? "report"}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              ↓ Download .md
            </button>
          )}
        </div>
      </div>

      {/* Markdown body */}
      <div className="p-6 bg-white prose prose-slate prose-sm max-w-none
                      prose-headings:font-semibold prose-headings:text-slate-800
                      prose-h1:text-2xl prose-h2:text-lg prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-1
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                      prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded
                      prose-blockquote:border-l-blue-400 prose-blockquote:text-slate-500
                      overflow-y-auto max-h-[70vh]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}
