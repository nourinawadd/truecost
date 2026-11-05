"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CategoryPicker } from "@/components/CategoryPicker";
import { ComparePanel } from "@/components/ComparePanel";
import { CostBreakdown } from "@/components/CostBreakdown";
import { ProductCard } from "@/components/ProductCard";
import { TotalBlock } from "@/components/TotalBlock";
import { getCategory, type CategoryId } from "@/data/categories";
import { FX_RATES, type Currency } from "@/data/config";
import { calculateLandedCost } from "@/lib/cost/calculate";
import { compareWithLocal } from "@/lib/cost/verdict";
import { buildResultUrl, type MarkedField, type ResultParams, type Src } from "@/lib/resultUrl";
import { parsePrice } from "@/lib/scrape/price";

// Why the page can't show a total: no exchange rate for the shop's
// currency, or no duty rate for the category. null means it can.
export type Blocked = "currency" | "rate" | null;

export type TextField = "price" | "ship" | "fx" | "fees" | "local";

// The interactive part of the result page. It keeps the boxes as typed text
// (so "12." or an empty box works), works out the numbers on every render,
// and writes the state back into the url so a refresh or a shared link
// shows the same result.
export function ResultView({ initial }: { initial: ResultParams }) {
  const router = useRouter();
  const [texts, setTexts] = useState<Record<TextField, string>>({
    price: String(initial.price),
    ship: String(initial.ship),
    fx: initial.fx === null ? "" : String(initial.fx),
    fees: String(initial.fees),
    local: initial.local === null ? "" : String(initial.local),
  });
  const [cur, setCur] = useState(initial.cur);
  const [cat, setCat] = useState(initial.cat);
  const [src, setSrc] = useState(initial.src);

  // money boxes read "12,99" or "1,299.00" like the manual form does.
  // The rate is a plain decimal: "0.345" is a rate, not 345.
  const price = parsePrice(texts.price) ?? 0;
  const ship = parsePrice(texts.ship) ?? 0;
  const fees = parsePrice(texts.fees) ?? 0;
  const local = parsePrice(texts.local) || null;
  const typedFx = Number(texts.fx.trim().replace(",", "."));
  const fx = texts.fx.trim() && typedFx > 0 ? typedFx : null;

  const category = getCategory(cat);
  // shipping is quoted in USD. For a USD shop the rate box is the USD rate.
  const usdFx = cur === "USD" && fx ? fx : FX_RATES.USD;
  const breakdown = calculateLandedCost({
    price,
    fx: fx ?? 0,
    shippingUsd: ship,
    usdFx,
    category,
    feesEgp: fees,
  });
  const verdict = compareWithLocal(breakdown.total, local, breakdown.pending);
  const blocked: Blocked = fx === null ? "currency" : breakdown.pending ? "rate" : null;

  const href = buildResultUrl({
    price,
    cur,
    cat,
    ship,
    fx,
    fees,
    local,
    title: initial.title,
    img: initial.img,
    shop: initial.shop,
    src,
  });

  // Keep the url in step: 300ms after the last keystroke, or at once for a
  // click (category, currency). replace, not push: edits aren't new pages.
  const urgent = useRef(false);
  useEffect(() => {
    if (href === location.pathname + location.search) return;
    const wait = urgent.current ? 0 : 300;
    urgent.current = false;
    const timer = setTimeout(() => router.replace(href, { scroll: false }), wait);
    return () => clearTimeout(timer);
  }, [href, router]);

  function setText(field: TextField, value: string) {
    setTexts((t) => ({ ...t, [field]: value }));
    // an edited price no longer came from the shop
    if (field === "price") setSrc((s) => unmark(s, "price"));
  }

  function pickCurrency(code: Currency) {
    urgent.current = true;
    setCur(code);
    setTexts((t) => ({ ...t, fx: String(FX_RATES[code]) }));
    setSrc((s) => unmark(s, "cur"));
  }

  function pickCategory(id: CategoryId) {
    urgent.current = true;
    setCat(id);
    setSrc((s) => unmark(s, "cat"));
  }

  return (
    <main className="flex-1">
      <section className="flex flex-wrap gap-8 border-b border-ink py-10">
        <ProductCard title={initial.title} img={initial.img} shop={initial.shop} src={src} />
        <TotalBlock
          total={breakdown.total}
          itemEgp={breakdown.itemEgp}
          price={price}
          cur={cur}
          blocked={blocked}
          categoryLabel={category.label}
        />
      </section>

      <section className="flex flex-wrap gap-12 pt-10 pb-14">
        <CostBreakdown
          texts={texts}
          onText={setText}
          cur={cur}
          onCurrency={pickCurrency}
          breakdown={breakdown}
          category={category}
          blocked={blocked}
        />
        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-10">
          <CategoryPicker selected={cat} guessed={src.cat === "guess"} onPick={pickCategory} />
          <ComparePanel
            local={texts.local}
            onLocal={(value) => setText("local", value)}
            verdict={verdict}
            blocked={blocked}
            categoryLabel={category.label}
            shareHref={href}
          />
        </aside>
      </section>
    </main>
  );
}

// the same marks without one field: it's the user's value now
function unmark(src: Src, field: MarkedField): Src {
  const next = { ...src };
  delete next[field];
  return next;
}
