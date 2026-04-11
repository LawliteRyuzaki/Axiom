import type { SessionStatus } from "@/types";

const CONFIG: Record<
  SessionStatus,
  { label: string; classes: string; dot: string }
> = {
  idle:      { label: "Ready",       classes: "bg-slate-100 text-slate-600",   dot: "bg-slate-400" },
  queued:    { label: "Queued",      classes: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse" },
  running:   { label: "Researching", classes: "bg-blue-100 text-blue-700",     dot: "bg-blue-500 animate-pulse" },
  completed: { label: "Completed",   classes: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  partial:   { label: "Partial",     classes: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  failed:    { label: "Failed",      classes: "bg-red-100 text-red-700",       dot: "bg-red-500" },
};

export default function StatusBadge({ status }: { status: SessionStatus }) {
  const { label, classes, dot } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
