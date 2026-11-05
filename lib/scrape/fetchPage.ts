import { isChallenge } from "@/lib/scrape/challenge";
import { parseSafeUrl } from "@/lib/scrape/safeUrl";

// Server-only network code, called from app/api/read/route.ts.

export type FetchFailure = "blocked" | "challenge" | "timeout" | "not_found" | "not_html" | "too_large";

export type PageResult = { ok: true; html: string } | { ok: false; reason: FetchFailure };

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;

// many shops turn away requests that don't look like a browser
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Accept-Language": "en",
};

// The product page, or the reason we couldn't get it.
export async function fetchPage(url: URL, signal: AbortSignal): Promise<PageResult> {
  try {
    const res = await guardedFetch(url, signal, "text/html");
    if (res.status === 404 || res.status === 410) return { ok: false, reason: "not_found" };

    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return { ok: false, reason: res.ok ? "not_html" : "blocked" };

    const html = await readText(res);
    if (html === null) return { ok: false, reason: "too_large" };
    // checked before the status: bot walls often answer 403 or 503
    if (isChallenge(html)) return { ok: false, reason: "challenge" };
    if (!res.ok) return { ok: false, reason: "blocked" };
    return { ok: true, html };
  } catch (error) {
    return { ok: false, reason: isTimeout(error) ? "timeout" : "blocked" };
  }
}

// For Shopify's .js endpoint. Throws on any failure; the parser catches it.
export async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const safe = parseSafeUrl(url);
  if (!safe) throw new Error("refused url");

  const res = await guardedFetch(safe, signal, "application/json");
  if (!res.ok) throw new Error(`status ${res.status}`);

  const text = await readText(res);
  if (text === null) throw new Error("too large");
  return JSON.parse(text);
}

// fetch, but we follow redirects ourselves so every hop passes the SSRF guard.
// Otherwise a public link could simply redirect us to http://127.0.0.1.
async function guardedFetch(url: URL, signal: AbortSignal, accept: string): Promise<Response> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, {
      headers: { ...HEADERS, Accept: accept },
      redirect: "manual",
      signal,
    });

    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return res;

    const next = parseSafeUrl(new URL(location, current).href);
    if (!next) throw new Error("redirect to a refused address");
    current = next;
  }

  throw new Error("too many redirects");
}

// The body as text, or null past 2 MB. content-length can be missing or
// wrong, so we also count the bytes as they arrive.
async function readText(res: Response): Promise<string | null> {
  if (Number(res.headers.get("content-length")) > MAX_BYTES) return null;
  if (!res.body) return "";

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

// AbortSignal.timeout() rejects with an error named "TimeoutError"
function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}
