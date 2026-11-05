"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CATEGORIES, type CategoryId } from "@/data/categories";
import { DEFAULT_SHIPPING_BAND, FX_RATES, SHIPPING_BANDS, type Currency } from "@/data/config";
import { buildResultUrl, DEFAULT_SHIP_USD } from "@/lib/resultUrl";
import { parsePrice } from "@/lib/scrape/price";

const CURRENCIES = Object.keys(FX_RATES) as Currency[];

const FIELD = "h-12 w-full min-w-0 border border-ink bg-field px-3.5 text-[15px]";

// For shops that block the reader, or no link at all. Everything here is
// typed by the user, so the result page shows no [✓] or [?] marks.
// The form isn't controlled: we read it once, on submit.
export function ManualEntry({ shop }: { shop?: string }) {
  const router = useRouter();
  const [priceMissing, setPriceMissing] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    // parsePrice reads "12,99" and "1,299.00" the same way the scraper does
    const price = parsePrice(String(form.get("price")));
    if (!price) {
      setPriceMissing(true);
      return;
    }

    const cur = form.get("currency") as Currency;
    const band = SHIPPING_BANDS.find((b) => b.id === form.get("weight"));
    // shipping is always USD; left empty, the weight band estimates it
    const ship = parsePrice(String(form.get("shipping"))) ?? band?.usd ?? DEFAULT_SHIP_USD;

    router.push(
      buildResultUrl({
        price,
        cur,
        cat: form.get("category") as CategoryId,
        ship,
        fx: FX_RATES[cur],
        shop,
      }),
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col border-t border-ink">
      <div className="flex flex-wrap border-b border-ink">
        <div className="flex flex-[2_1_260px] flex-col gap-2 py-4.5 sm:pr-5">
          <label htmlFor="price" className="text-label">
            PRICE
          </label>
          <input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            onChange={() => setPriceMissing(false)}
            aria-invalid={priceMissing}
            aria-describedby={priceMissing ? "price-error" : undefined}
            className={`${FIELD} text-base`}
          />
          {priceMissing && (
            <p id="price-error" className="text-[13px] text-red">
              <span aria-hidden="true">[×]</span> enter the price the shop shows.
            </p>
          )}
        </div>
        <div className="flex flex-[1_1_160px] flex-col gap-2 py-4.5 sm:border-l sm:border-ink sm:pl-5">
          <label htmlFor="currency" className="text-label">
            CURRENCY
          </label>
          <select id="currency" name="currency" defaultValue="USD" className={FIELD}>
            {CURRENCIES.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap border-b border-ink">
        <div className="flex flex-[1_1_260px] flex-col gap-2 py-4.5 sm:pr-5">
          <label htmlFor="category" className="text-label">
            CATEGORY
          </label>
          <select id="category" name="category" defaultValue="clothing" className={FIELD}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kind === "pending" ? `${c.label} (rate to be added)` : c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-2 py-4.5 sm:border-l sm:border-ink sm:pl-5">
          <label htmlFor="weight" className="text-label">
            WEIGHT
          </label>
          <select id="weight" name="weight" defaultValue={DEFAULT_SHIPPING_BAND} className={FIELD}>
            {SHIPPING_BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-ink py-4.5">
        <label htmlFor="shipping" className="text-label">
          SHIPPING, USD <span className="text-muted">(OPTIONAL)</span>
        </label>
        <input
          id="shipping"
          name="shipping"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="empty = estimate from weight"
          className={FIELD}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <span className="text-[13px] text-muted">you can change any of this on the next screen.</span>
        <button
          type="submit"
          className="flex h-14 items-center gap-3 bg-ink px-7 text-[13px] tracking-[0.1em] text-paper"
        >
          CALCULATE <span aria-hidden="true">[→]</span>
        </button>
      </div>
    </form>
  );
}
