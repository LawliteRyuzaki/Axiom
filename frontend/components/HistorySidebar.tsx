"use client";

import { useEffect, useState } from "react";
import type { SessionSummary } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-400",
  partial:   "bg-orange-400",
  failed:    "bg-red-400",
  running:   "bg-blue-400 animate-pulse",
  queued:    "bg-yellow-400",
};

interface Props {
  refreshTrigger: number;
  onSelect: (id: string) => void;
}

export default function HistorySidebar({ refreshTrigger, onSelect }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/history?limit=15`)
      .then((r) => r.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-2xl mb-1">📂</p>
        <p className="text-sm">No research sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="w-full text-left rounded-lg border border-slate-200 bg-white
                     hover:border-blue-300 hover:bg-blue-50 p-3 transition-all group"
        >
          <div className="flex items-start gap-2">
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[s.status] ?? "bg-slate-400"}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700 font-medium line-clamp-2 group-hover:text-blue-700">
                {s.goal}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
                {s.duration_seconds && (
                  <span className="text-xs text-slate-400">
                    · {s.duration_seconds}s
                  </span>
                )}
                {s.partial && (
                  <span className="text-xs text-orange-500">· partial</span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
