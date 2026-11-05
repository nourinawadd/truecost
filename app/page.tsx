"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReadFailure, ReadResponse } from "@/app/api/read/route";
import { LinkInput } from "@/components/LinkInput";
import { ManualEntry } from "@/components/ManualEntry";
import { ProgressSteps } from "@/components/ProgressSteps";
import { RatesAsOf, SiteHeader } from "@/components/SiteHeader";
import { buildResultUrl, DEFAULT_SHIP_USD, rateFor, sourcesToSrc } from "@/lib/resultUrl";
import type { Step } from "@/lib/scrape/types";

// "network": our own API didn't answer, so there is no reason from the shop
type Failure = ReadFailure | "network";

type State =
  | { status: "idle" }
  | { status: "reading"; url: URL }
  | { status: "failed"; url: URL; reason: Failure; steps: Step[] };

// the headline on the failed screen, one human sentence per reason
const HEADLINE: Record<Failure, string> = {
  blocked: "this shop hides its details from readers.",
  challenge: "this shop hides its details from readers.",
  timeout: "the shop took too long to answer.",
  not_found: "that page doesn't exist anymore.",
  not_html: "that link isn't a product page.",
  too_large: "that page is too big to read.",
  no_data: "this page doesn't say what it costs.",
  invalid_url: "truecost can't read that link.",
  network: "something went wrong on our side.",
};

// Home: idle → reading → the result page, or the failed screen with the
// manual form. The link is kept in state so [←] back doesn't lose it.
export default function Home() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function check(url: URL) {
    setState({ status: "reading", url });
    const answer = await readProduct(url);

    if (!answer.ok) {
      setState({ status: "failed", url, reason: answer.reason, steps: answer.steps });
      return;
    }

    // fx is written into the url, so a shared link keeps today's rate.
    // We stay on "reading" until the result page takes over.
    const { product, category } = answer;
    router.push(
      buildResultUrl({
        price: product.price,
        cur: product.currency,
        cat: category?.id,
        ship: DEFAULT_SHIP_USD,
        fx: rateFor(product.currency),
        title: product.title,
        img: product.image,
        shop: answer.shop,
        src: sourcesToSrc(answer.sources, category !== null),
      }),
    );
  }

  if (state.status === "failed") {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-10 pt-10 pb-16">
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="inline-flex min-h-11 items-center self-start text-[13px] hover:underline"
          >
            [←] back
          </button>

          <section className="flex flex-col gap-4">
            <span className="text-label text-muted">CHECKING</span>
            <div className="border border-ink bg-field p-4 text-sm [overflow-wrap:anywhere]">
              {state.url.href}
            </div>
            <ProgressSteps steps={state.steps} />
          </section>

          <section className="flex flex-col gap-5 border-t border-ink pt-6">
            <h1 className="font-display text-[clamp(28px,6vw,44px)] leading-[1.05] font-medium tracking-[-0.025em]">
              {HEADLINE[state.reason]}
            </h1>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              fill in what you know. the link is saved, and the math works the same.
            </p>
          </section>

          <ManualEntry shop={state.url.hostname} />
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader>
        <a href="#how" className="inline-flex min-h-11 items-center">
          HOW IT WORKS
        </a>
        <RatesAsOf />
      </SiteHeader>

      <main className="flex flex-1 flex-wrap items-start gap-12 pt-12 pb-16 sm:pt-18">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-9">
          <h1 className="font-display text-[clamp(44px,8vw,104px)] leading-[0.95] font-medium tracking-[-0.035em]">
            know the real price
            <br />
            before it lands.
          </h1>
          <p className="max-w-[520px] text-[15px] leading-relaxed text-ink-soft">
            paste a product link from any shop abroad. truecost reads the price and shows duty, 14%
            vat and shipping in egp, before you order.
          </p>
          <div className="flex max-w-[720px] flex-col gap-2.5">
            <LinkInput
              value={link}
              onChange={setLink}
              onSubmit={check}
              disabled={state.status === "reading"}
            />
            {state.status === "reading" ? (
              <ProgressSteps steps={[]} reading={state.url.hostname} />
            ) : (
              <Link
                href="/manual"
                className="inline-flex min-h-11 items-center self-start text-[13px] underline"
              >
                no link? fill it in yourself
              </Link>
            )}
          </div>
        </section>

        <aside className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5 border-t border-ink pt-4 text-sm">
          <span className="text-label text-muted">WHAT IT READS</span>
          <Reads mark="[●]">shopify stores</Reads>
          <Reads mark="[●]">product data (json-ld)</Reads>
          <Reads mark="[●]">page previews (open graph)</Reads>
          <Reads mark="[ ]" muted>
            everything else, you fill it in
          </Reads>
          <p className="mt-2 border-t border-ink pt-3.5 text-[13px] leading-relaxed text-ink-soft">
            a value read from the shop is marked [✓]. a guess is marked [?] so you know to check it.
          </p>
        </aside>
      </main>

      <section
        id="how"
        className="grid scroll-mt-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 pb-14"
      >
        <How step="[01] PASTE">a link from any shop that ships to egypt, or through a forwarder.</How>
        <How step="[02] READ">truecost reads the price from the page and guesses the category.</How>
        <How step="[03] SEE">duty, vat and shipping in egp, as a range, next to the local price.</How>
      </section>
    </>
  );
}

// POST the link to our API. Anything unexpected (offline, a crash that
// isn't JSON) becomes a "network" failure instead of an exception.
async function readProduct(
  url: URL,
): Promise<ReadResponse | { ok: false; reason: "network"; steps: Step[] }> {
  try {
    const res = await fetch("/api/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url.href }),
    });
    return (await res.json()) as ReadResponse;
  } catch {
    return { ok: false, reason: "network", steps: [] };
  }
}

function Reads({ mark, muted, children }: { mark: string; muted?: boolean; children: string }) {
  return (
    <div className={`flex gap-3 ${muted ? "text-muted" : ""}`}>
      <span aria-hidden="true" className="shrink-0 whitespace-pre">
        {mark}
      </span>
      <span>{children}</span>
    </div>
  );
}

function How({ step, children }: { step: string; children: string }) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-ink pt-3.5">
      <span className="text-label">{step}</span>
      <p className="text-sm leading-[1.55] text-ink-soft">{children}</p>
    </div>
  );
}
