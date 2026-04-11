"use client";

import { useEffect, useRef } from "react";
import type { ResearchState } from "@/types";

interface Props { state: ResearchState }

function isRateLimitMsg(msg: string) {
  return msg.includes("rate limit") || msg.includes("Quota exhausted") ||
         msg.includes("auto-retrying") || msg.includes("Switching to fallback");
}

export default function ProgressPanel({ state }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.progress.length]);

  const isActive = state.status === "running" || state.status === "queued";
  const lastMsg = state.progress[state.progress.length - 1] ?? "";
  const isWaiting = isActive && isRateLimitMsg(lastMsg);

  if (state.status === "idle") return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Research Progress</h3>
        {isActive && (
          <span className={`flex items-center gap-1.5 text-xs ${isWaiting ? "text-amber-600" : "text-blue-600"}`}>
            {isWaiting ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Rate-limit wait
              </>
            ) : (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Live
              </>
            )}
          </span>
        )}
      </div>

      {/* Rate-limit banner */}
      {isWaiting && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2">
          <span className="text-amber-500 text-base shrink-0 mt-0.5">⏳</span>
          <div>
            <p className="text-xs font-medium text-amber-800">Gemini API rate limit reached</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The system is automatically retrying with backoff. This may take 1-2 minutes.
              Trying fallback models if needed.
            </p>
          </div>
        </div>
      )}

      {/* Progress log */}
      <div className="p-4 space-y-2 max-h-52 overflow-y-auto font-mono">
        {state.progress.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2 text-sm ${isRateLimitMsg(msg) ? "text-amber-700" : ""}`}>
            <span className="text-slate-400 select-none shrink-0 text-xs mt-0.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={isRateLimitMsg(msg) ? "text-amber-700" : "text-slate-700"}>{msg}</span>
          </div>
        ))}
        {isActive && !isWaiting && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-400 select-none text-xs">
              {String(state.progress.length + 1).padStart(2, "0")}
            </span>
            <span className="inline-flex gap-1">
              <span className="animate-bounce [animation-delay:0ms]">·</span>
              <span className="animate-bounce [animation-delay:150ms]">·</span>
              <span className="animate-bounce [animation-delay:300ms]">·</span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sub-queries */}
      {state.queries.length > 0 && (
        <div className="px-4 pb-4 border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Search Queries
          </p>
          <div className="flex flex-wrap gap-2">
            {state.queries.map((q, i) => (
              <span key={i}
                className="inline-block bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1 text-xs">
                {q}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
