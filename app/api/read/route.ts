import { getCategory } from "@/data/categories";
import { guessCategory, type CategoryGuess } from "@/lib/classify/keywords";
import { fetchJson, fetchPage, type FetchFailure } from "@/lib/scrape/fetchPage";
import { matchesShopify } from "@/lib/scrape/parsers/shopify";
import { parseSafeUrl } from "@/lib/scrape/safeUrl";
import { scrapeProduct } from "@/lib/scrape/scrape";
import type { ProductInfo, Sources, Step } from "@/lib/scrape/types";

// POST /api/read { url } → the product, or why we couldn't read it.
// This is the only server code: browsers can't fetch other shops (CORS).

export type ReadFailure = "invalid_url" | FetchFailure | "no_data";

// always sent with HTTP 200: a shop that blocks us is an answer, not an error
export type ReadResponse =
  | {
      ok: true;
      product: ProductInfo;
      sources: Sources;
      strong: boolean;
      category: CategoryGuess | null;
      steps: Step[];
      shop: string;
    }
  | { ok: false; reason: ReadFailure; steps: Step[]; shop: string | null };

// one deadline for the whole read: the page and Shopify's .js together
const TIMEOUT_MS = 8000;

// the red [×] line in the progress log for each way the page fetch fails
const FAILED_STEP: Record<FetchFailure, string> = {
  blocked: "shop refused the reader",
  challenge: "shop answered with a checkpoint, not the page",
  timeout: "shop took too long to answer",
  not_found: "page not found",
  not_html: "this link isn't a web page",
  too_large: "page too big to read",
};

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const steps: Step[] = [];
  const step = (text: string, ok = true) => steps.push({ text, ms: Date.now() - startedAt, ok });
  const reply = (body: ReadResponse) => Response.json(body);

  // 1. only public http(s) links (see lib/scrape/safeUrl.ts for why)
  const url = parseSafeUrl(await readUrlField(request));
  if (!url) return reply({ ok: false, reason: "invalid_url", steps, shop: null });
  const shop = url.hostname;

  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS);

    // 2. fetch the page
    step(`reading ${shop}`);
    const page = await fetchPage(url, signal);
    if (!page.ok) {
      step(FAILED_STEP[page.reason], false);
      // a shop that blocks its pages often still answers Shopify's .js
      // endpoint, so a blocked Shopify link gets one more try
      const blocked = page.reason === "blocked" || page.reason === "challenge";
      if (!blocked || !matchesShopify(url)) {
        return reply({ ok: false, reason: page.reason, steps, shop });
      }
    }

    // 3. run the parser ladder: Shopify → JSON-LD → OpenGraph
    const scraped = await scrapeProduct(
      url,
      page.ok ? page.html : null,
      (jsonUrl) => fetchJson(jsonUrl, signal),
      startedAt,
    );
    if (!page.ok && scraped.info.price === undefined) {
      return reply({ ok: false, reason: page.reason, steps, shop });
    }
    steps.push(...scraped.steps);
    if (scraped.info.price === undefined) return reply({ ok: false, reason: "no_data", steps, shop });

    // 4. guess the category; the result page lets the user change it
    const category = guessCategory(scraped.info.title ?? "", scraped.info.brand);
    step(category ? `category guessed: ${getCategory(category.id).label}` : "category unclear, pick one");

    return reply({
      ok: true,
      product: scraped.info,
      sources: scraped.sources,
      strong: scraped.strong,
      category,
      steps,
      shop,
    });
  } catch (error) {
    // logged on the server only; the visitor never sees a stack trace
    console.warn("[api/read]", shop, error);
    return reply({ ok: false, reason: "blocked", steps, shop });
  }
}

// the "url" field of a JSON body, or undefined for anything else
async function readUrlField(request: Request): Promise<unknown> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null ? (body as { url?: unknown }).url : undefined;
  } catch {
    return undefined;
  }
}
