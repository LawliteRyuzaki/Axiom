"use client";

interface Props {
  message: string;
  onReset: () => void;
}

function isQuotaError(msg: string): boolean {
  return (
    msg.toLowerCase().includes("quota") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("exhausted") ||
    msg.toLowerCase().includes("tomorrow")
  );
}

export default function ErrorPanel({ message, onReset }: Props) {
  const isQuota = isQuotaError(message);

  return (
    <div className={`rounded-xl border p-5 ${isQuota ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{isQuota ? "⏳" : "⚠️"}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold mb-1 ${isQuota ? "text-amber-800" : "text-red-700"}`}>
            {isQuota ? "API Quota Limit Reached" : "Research Failed"}
          </p>
          <p className={`text-sm ${isQuota ? "text-amber-700" : "text-red-600"}`}>
            {message}
          </p>

          {isQuota && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-amber-800">What you can do:</p>
              <ul className="text-xs text-amber-700 space-y-1 list-none">
                <li>⏰ Wait until midnight Pacific Time — free quota resets daily</li>
                <li>
                  💳 Add billing to{" "}
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900"
                  >
                    Google AI Studio
                  </a>{" "}
                  for higher limits (pay-as-you-go, very cheap)
                </li>
                <li>
                  🔑 Create a new API key at{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900"
                  >
                    aistudio.google.com/app/apikey
                  </a>{" "}
                  on a different Google account
                </li>
              </ul>
            </div>
          )}

          <button
            onClick={onReset}
            className={`mt-3 text-xs underline ${isQuota ? "text-amber-700 hover:text-amber-900" : "text-red-700 hover:text-red-900"}`}
          >
            ← Back to research form
          </button>
        </div>
      </div>
    </div>
  );
}
