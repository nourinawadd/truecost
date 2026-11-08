import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CATEGORIES } from "@/data/categories";
import { DEFAULT_SHIPPING_BAND, FX_AS_OF, SHIPPING_BANDS, VAT_RATE } from "@/data/config";
import { formatRate, formatShortDate } from "@/lib/format";

export const metadata: Metadata = { title: "How it works · TrueCost" };

const defaultBand = SHIPPING_BANDS.find((band) => band.id === DEFAULT_SHIPPING_BAND);
const vat = `${Math.round(VAT_RATE * 100)}%`;

export default function HowPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-10 pt-10 pb-16">
        <Link href="/" className="inline-flex min-h-11 items-center self-start text-[13px]">
          [←] back
        </Link>

        <section className="flex flex-col gap-5">
          <h1 className="font-display text-[clamp(28px,6vw,44px)] leading-[1.05] font-medium tracking-[-0.025em]">
            how truecost works.
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            four steps, from a link to a verdict. every number on the result page can be edited, so a
            wrong read is never the last word.
          </p>
        </section>

        <Section step="[01] READ">
          <p>
            truecost fetches the page and tries one reader after another, stopping when it has a
            price:
          </p>
          <ul className="flex flex-col">
            <Line mark="[●]">shopify stores: the product&apos;s own data file</Line>
            <Line mark="[●]">product data (json-ld) in the page</Line>
            <Line mark="[●]">page previews (open graph tags)</Line>
            <Line mark="[ ]">nothing worked: you fill it in yourself</Line>
          </ul>
          <p>
            values from shopify or product data are marked [✓]. values from a page preview are marked
            [?], check them. a bare ¥ stays unknown, since it could be cny or jpy.
          </p>
        </Section>

        <Section step="[02] GUESS">
          <p>
            the category comes from words in the product title. it&apos;s marked [?] until you pick
            one yourself.
          </p>
        </Section>

        <Section step="[03] ADD">
          <ul className="flex flex-col">
            <Line mark="cif">item price + shipping, in egp</Line>
            <Line mark="duty">cif × the category&apos;s rate</Line>
            <Line mark="vat">(cif + duty) × {vat}</Line>
            <Line mark="total">cif + duty + vat + fees</Line>
          </ul>

          <div className="flex flex-col">
            <span className="border-b border-ink pb-3 text-label text-ink">RATES BY CATEGORY</span>
            <ul className="flex flex-col">
              {CATEGORIES.map((category) => (
                <li
                  key={category.id}
                  className={`flex justify-between gap-4 border-b border-rule-soft py-3 ${category.kind === "pending" ? "text-faint" : "text-ink"}`}
                >
                  <span>{category.label}</span>
                  <span>
                    {formatRate(category)}
                    {category.kind === "flat" && " flat"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p>
            phones skip duty and vat and pay a flat rate of cif instead. shipping is always in usd,
            because forwarders quote in usd.
            {defaultBand &&
              ` without a weight, truecost assumes ${defaultBand.label}, about USD ${defaultBand.usd}.`}{" "}
            exchange rates as of {formatShortDate(FX_AS_OF)}.
          </p>
        </Section>

        <Section step="[04] COMPARE">
          <p>type what a seller in egypt asks. truecost holds it against the range:</p>
          <ul className="flex flex-col">
            <Line mark="below">buy local</Line>
            <Line mark="above">import it</Line>
            <Line mark="inside">too close to call, customs decides</Line>
          </ul>
        </Section>

        <Link
          href="/"
          className="flex h-14 items-center gap-3 self-start bg-ink px-7 text-[13px] tracking-[0.1em] text-paper"
        >
          CHECK A LINK <span aria-hidden="true">[→]</span>
        </Link>
      </main>
    </>
  );
}

function Section({ step, children }: { step: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-ink pt-4 text-sm leading-[1.6] text-ink-soft">
      <h2 className="text-label text-ink">{step}</h2>
      {children}
    </section>
  );
}

function Line({ mark, children }: { mark: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 border-b border-rule-soft py-3 text-ink last:border-b-0">
      <span className="w-14 shrink-0 whitespace-pre text-muted">{mark}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
