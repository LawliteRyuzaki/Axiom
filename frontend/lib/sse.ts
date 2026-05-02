import type { SSEPayload } from "@/types";

export async function streamResearch(
  url: string,
  goal: string,
  model: string,
  onMessage: (payload: SSEPayload) => void,
  onError: (err: string) => void
) {
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ goal, model }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.detail ?? `Server error ${res.status}`);
    }
    if (!res.body) throw new Error("No response body");

    const reader  = res.body.getReader();
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
        try {
          onMessage(JSON.parse(raw) as SSEPayload);
        } catch {
          /* skip malformed */
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}
