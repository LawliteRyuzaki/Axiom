export type SSEEventType =
  | "status" | "progress" | "log" | "reasoning" | "thought" | "query"
  | "report_chunk" | "complete" | "error";

export interface SSEPayload {
  type:       SSEEventType;
  data:       string;
  session_id: string | null;
}

export type SessionStatus =
  | "idle" | "queued" | "running"
  | "completed" | "partial" | "failed";

export type AppView = "landing" | "research";

export type SelectedModel = "flash" | "pro";

export interface LogEntry {
  id:        number;
  text:      string;
  level:     "default" | "success" | "warn" | "error" | "dim";
  timestamp: string;
}

export interface ResearchState {
  sessionId: string | null;
  status:    SessionStatus;
  logs:      LogEntry[];
  queries:   string[];
  report:    string;
  error:     string | null;
  duration:  number | null;
  partial:   boolean;
  model:     string | null;
  goal:      string;
  thoughts?: { id: number; text: string; type: "reasoning" | "thought" }[];
}

export interface SessionSummary {
  id:               string;
  goal:             string;
  status:           string;
  partial:          boolean;
  created_at:       string;
  duration_seconds: number | null;
}
