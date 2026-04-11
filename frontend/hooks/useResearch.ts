"use client";
import { useCallback, useRef, useState } from "react";
import type { ResearchState, SSEPayload, LogEntry } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const INITIAL: ResearchState = {
  sessionId: null, status: "idle", logs: [],
  queries: [], report: "", error: null,
  duration: null, partial: false, model: null, goal: "",
};

let _id = 0;

function classifyLog(text: string): LogEntry["level"] {
  const t = text.toLowerCase();
  if (t.startsWith("error") || t.includes("failed") || t.includes("fatal")) return "error";
  if (t.includes("warning") || t.includes("quota") || t.includes("rate limit")) return "warn";
  if (t.includes("complete") || t.includes("success") || t.includes("ready") || t.includes("finalised")) return "success";
  if (t.includes("axiom") || t.includes("model selected") || t.includes("starting") || t.includes("session")) return "dim";
  return "default";
}

function mkLog(text: string): LogEntry {
  return {
    id: ++_id,
    text,
    level: classifyLog(text),
    timestamp: new Date().toTimeString().slice(0, 8),
  };
}

export function useResearch() {
  const [state, setState] = useState<ResearchState>(INITIAL);
  const reportRef = useRef("");

  const reset = useCallback(() => {
    reportRef.current = "";
    setState(INITIAL);
  }, []);

  const startResearch = useCallback(async (goal: string) => {
    reportRef.current = "";
    setState({ ...INITIAL, status: "queued", goal });

    try {
      const res = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.detail ?? `Server error ${res.status}`);
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try { handle(JSON.parse(raw) as SSEPayload); } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setState(p => ({
        ...p, status: "failed", error: msg,
        logs: [...p.logs, mkLog(`ERROR: ${msg}`)],
      }));
    }
  }, []);

  function handle(payload: SSEPayload) {
    const { type, data } = payload;
    switch (type) {
      case "status":
        setState(p => ({ ...p, status: data as ResearchState["status"], sessionId: payload.session_id }));
        break;
      case "log":
      case "progress":
        setState(p => ({ ...p, logs: [...p.logs, mkLog(data)] }));
        break;
      case "query":
        setState(p => ({ ...p, queries: [...p.queries, data] }));
        break;
      case "report_chunk":
        reportRef.current += data;
        setState(p => ({ ...p, report: reportRef.current }));
        break;
      case "complete":
        try {
          const m = JSON.parse(data);
          setState(p => ({
            ...p,
            status: m.partial ? "partial" : "completed",
            duration: m.duration, partial: m.partial,
            sessionId: m.session_id, model: m.model,
          }));
        } catch { setState(p => ({ ...p, status: "completed" })); }
        break;
      case "error":
        setState(p => ({
          ...p, status: "failed", error: data,
          logs: [...p.logs, mkLog(`ERROR: ${data}`)],
        }));
        break;
    }
  }

  return { state, startResearch, reset };
}
