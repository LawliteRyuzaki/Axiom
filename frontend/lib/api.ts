export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchWithRetry(url: string, options?: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status !== 429 && res.status < 500) return res;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  return fetch(url, options);
}
