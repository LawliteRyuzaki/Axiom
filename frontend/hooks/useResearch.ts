"use client";
import { useCallback, useRef, useState } from "react";
import type { ResearchState, SSEPayload, LogEntry, SelectedModel } from "@/types";
import { classifyLog } from "@/utils/status";
import { API_URL } from "@/lib/api";
import { streamResearch } from "@/lib/sse";


const INITIAL: ResearchState = {
  sessionId: null,
  status:    "idle",
  logs:      [],
  queries:   [],
  report:    "",
  error:     null,
  duration:  null,
  partial:   false,
  model:     null,
  goal:      "",
  thoughts:  [],
};

let _id = 0;


function mkLog(text: string): LogEntry {
  return {
    id:        ++_id,
    text,
    level:     classifyLog(text),
    timestamp: new Date().toTimeString().slice(0, 8),
  };
}

export function useResearch() {
  const [state, setState] = useState<ResearchState>(INITIAL);
  const reportRef         = useRef("");

  const reset = useCallback(() => {
    reportRef.current = "";
    setState(INITIAL);
  }, []);

  // ── Live research stream ──────────────────────────────────────────────────
  const startResearch = useCallback(async (goal: string, model: SelectedModel) => {
    reportRef.current = "";
    setState({ ...INITIAL, status: "queued", goal });

    await streamResearch(
      `${API_URL}/api/research`,
      goal,
      model,
      (payload) => handle(payload),
      (msg) => {
        setState(p => ({
          ...p,
          status: "failed",
          error:  msg,
          logs:   [...p.logs, mkLog(`ERROR: ${msg}`)],
        }));
      }
    );
  }, []);

  // ── Load a past session from history (GET) ────────────────────────────────
  const loadSession = useCallback(async (id: string) => {
    reportRef.current = "";
    // Set to queued while loading to show spinner
    setState(p => ({ ...p, status: "queued", sessionId: id }));

    try {

      const res = await fetch(`${API_URL}/api/history/${id}`);
      if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
      const doc = await res.json();


      reportRef.current = doc.report ?? "";
      setState({
        sessionId: doc.id,
        status:    doc.status === "completed" ? "completed"
                 : doc.status === "partial"   ? "partial"
                 : doc.status === "failed"    ? "failed"
                 : "completed",
        logs:      [mkLog(`Loaded session ${doc.id.slice(0, 8)}`)],
        queries:   doc.sub_queries ?? [],
        report:    doc.report ?? "",
        error:     doc.error ?? null,
        duration:  doc.duration_seconds ?? null,
        partial:   doc.partial ?? false,
        model:     doc.model ?? null,
        goal:      doc.goal ?? "",
        thoughts:  [], // History doesn't persist thoughts yet
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load session";

      setState(p => ({
        ...p,
        status: "failed",
        error:  msg,
        logs:   [...p.logs, mkLog(`ERROR: ${msg}`)],
      }));
    }
  }, []);

  // ── SSE event handler ────────────────────────────────────────────────────
  function handle(payload: SSEPayload) {
    const { type, data } = payload;
    switch (type) {
      case "status":
        setState(p => ({
          ...p,
          status:    data as ResearchState["status"],
          sessionId: payload.session_id,
        }));
        break;
      case "log":
      case "progress":
        setState(p => ({ ...p, logs: [...p.logs, mkLog(data)] }));
        break;
      case "reasoning":
      case "thought":
        setState(p => ({
          ...p,
          thoughts: [...(p.thoughts || []), {
            id: Date.now(),
            text: data,
            type: type as "reasoning" | "thought"
          }]
        }));
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
            status:    m.partial ? "partial" : "completed",
            duration:  m.duration,
            partial:   m.partial,
            sessionId: m.session_id,
            model:     m.model,
          }));
        } catch {
          setState(p => ({ ...p, status: "completed" }));
        }
        break;
      case "error":
        setState(p => ({
          ...p,
          status: "failed",
          error:  data,
          logs:   [...p.logs, mkLog(`ERROR: ${data}`)],
        }));
        break;
    }
  }

  return { state, startResearch, loadSession, reset };
}
