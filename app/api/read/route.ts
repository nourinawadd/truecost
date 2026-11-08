import { getCategory } from "@/data/categories";
import { guessCategory, type CategoryGuess } from "@/lib/classify/keywords";
import { fetchJson, fetchPage, type FetchFailure } from "@/lib/scrape/fetchPage";
import { matchesShopify } from "@/lib/scrape/parsers/shopify";
import { parseSafeUrl } from "@/lib/scrape/safeUrl";
import { scrapeProduct } from "@/lib/scrape/scrape";
import type { ProductInfo, Sources, Step } from "@/lib/scrape/types";

export type ReadFailure = "invalid_url" | FetchFailure | "no_data";

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

const TIMEOUT_MS = 8000;

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

  const url = parseSafeUrl(await readUrlField(request));
  if (!url) return reply({ ok: false, reason: "invalid_url", steps, shop: null });
  const shop = url.hostname;

  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS);

    step(`reading ${shop}`);
    const page = await fetchPage(url, signal);
    if (!page.ok) {
      step(FAILED_STEP[page.reason], false);
      const blocked = page.reason === "blocked" || page.reason === "challenge";
      if (!blocked || !matchesShopify(url)) {
        return reply({ ok: false, reason: page.reason, steps, shop });
      }
    }

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
    console.warn("[api/read]", shop, error);
    return reply({ ok: false, reason: "blocked", steps, shop });
  }
}

async function readUrlField(request: Request): Promise<unknown> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null ? (body as { url?: unknown }).url : undefined;
  } catch {
    return undefined;
  }
}
