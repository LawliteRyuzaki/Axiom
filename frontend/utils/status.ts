import type { SessionStatus } from "@/types";

export interface StatusConfig {
  dot: string;
  label: string;
}

export const STATUS_CONFIG: Record<SessionStatus, StatusConfig> = {
  idle:      { dot: "var(--border-med)",  label: "Ready"    },
  queued:    { dot: "var(--term-amber)",  label: "Queued"   },
  running:   { dot: "var(--term-green)",  label: "Running"  },
  completed: { dot: "var(--term-green)",  label: "Complete" },
  partial:   { dot: "var(--term-amber)",  label: "Partial"  },
  failed:    { dot: "var(--term-red)",    label: "Error"    },
};

export function classifyLog(text: string): "default" | "success" | "warn" | "error" | "dim" {
  const t = text.toLowerCase();
  if (t.startsWith("error") || t.includes("failed") || t.includes("fatal")) return "error";
  if (t.includes("warning") || t.includes("quota") || t.includes("rate limit")) return "warn";
  if (
    t.includes("complete") || t.includes("success") ||
    t.includes("ready") || t.includes("finalised")
  ) return "success";
  if (
    t.includes("axiom") || t.includes("model selected") ||
    t.includes("starting") || t.includes("session")
  ) return "dim";
  return "default";
}
