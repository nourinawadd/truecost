import type { ReactNode } from "react";
import type { Blocked, TextField } from "@/components/ResultView";
import type { Category } from "@/data/categories";
import { FX_AS_OF, FX_RATES, VAT_RATE, type Currency } from "@/data/config";
import type { CostBreakdown as Breakdown } from "@/lib/cost/calculate";
import { formatEgp, formatRange, formatRate, formatShortDate } from "@/lib/format";
import { rateFor } from "@/lib/resultUrl";

const CURRENCIES = Object.keys(FX_RATES) as Currency[];

type Props = {
  texts: Record<TextField, string>;
  onText(field: TextField, value: string): void;
  cur: string | null;
  onCurrency(code: Currency): void;
  breakdown: Breakdown;
  category: Category;
  blocked: Blocked;
};

// The ledger from the design: rows [01] to [07], then the total.
// Item price, shipping, exchange rate and fees can be edited in place.
export function CostBreakdown({ texts, onText, cur, onCurrency, breakdown: b, category, blocked }: Props) {
  const flat = category.kind === "flat";
  // what to show where a number can't be worked out yet
  const noFx = "—";
  const noRate = "rate to be added";
  const egp = (n: number) => `EGP ${formatEgp(n)}`;
  const taxed = (text: string) => (blocked === "currency" ? noFx : blocked === "rate" ? noRate : text);

  const input = (field: TextField) => (
    <input
      id={field}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={texts[field]}
      onChange={(event) => onText(field, event.target.value)}
      className="h-11 w-20 border border-ink bg-field px-2.5 text-sm text-ink sm:w-24"
    />
  );

  return (
    <div className="flex min-w-0 flex-[999_1_560px] flex-col">
      <div className="flex flex-wrap justify-between gap-4 border-b border-ink pb-3 text-label">
        <span>BREAKDOWN</span>
        <span className="text-muted">EDIT ANY VALUE</span>
      </div>

      <Row n="01" label={<label htmlFor="price">item price</label>} amount={blocked === "currency" ? noFx : egp(b.itemEgp)}>
        {cur ?? "[?]"} {input("price")}
      </Row>

      <Row n="02" label={<label htmlFor="ship">shipping</label>} amount={egp(b.shippingEgp)}>
        USD {input("ship")} forwarder estimate
      </Row>

      <Row
        n="03"
        label={<label htmlFor="fx">exchange rate</label>}
        amount={<span className="text-muted">×</span>}
        rule="border-ink"
      >
        1
        <select
          aria-label="shop's currency"
          value={cur ?? ""}
          onChange={(event) => {
            const code = event.target.value;
            if (rateFor(code) !== null) onCurrency(code as Currency);
          }}
          className="h-11 border border-ink bg-field px-2 text-sm text-ink"
        >
          {cur === null && <option value="">[?]</option>}
          {cur !== null && rateFor(cur) === null && <option value={cur}>{cur}</option>}
          {CURRENCIES.map((code) => (
            <option key={code}>{code}</option>
          ))}
        </select>
        = {input("fx")} EGP ·{" "}
        {rateFor(cur) === null ? "type the rate" : `rate as of ${formatShortDate(FX_AS_OF)}`}
      </Row>

      <Row n="04" label="cif value" amount={blocked === "currency" ? noFx : egp(b.cif)}>
        item + shipping, in egp
      </Row>

      <Row n="05" label={flat ? "phone tax" : "customs duty"} amount={taxed(`EGP ${formatRange(b.duty)}`)}>
        {category.kind === "pending"
          ? `rate to be added for ${category.label}`
          : `${formatRate(category)} of cif · ${category.label}`}
      </Row>

      <Row n="06" label="vat" amount={taxed(`EGP ${formatRange(b.vat)}`)}>
        {flat ? "included in the phone tax" : `${Math.round(VAT_RATE * 100)}% of cif + duty`}
      </Row>

      <Row n="07" label={<label htmlFor="fees">other fees</label>} amount={egp(b.fees)} rule="border-b-2 border-ink">
        EGP {input("fees")} if your forwarder charges any
      </Row>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-5">
        <span className="text-label">TOTAL</span>
        <span className="ml-auto text-right font-display text-2xl font-semibold tracking-[-0.01em]">
          {taxed(`EGP ${formatRange(b.total)}`)}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-muted">
        the range comes from the category&apos;s duty band. customs decides the final category, so
        the real number lands somewhere inside it.
      </p>
    </div>
  );
}

type RowProps = {
  n: string;
  label: ReactNode;
  amount: ReactNode;
  rule?: string; // the line under the row: soft by default
  children: ReactNode; // the detail: inputs or a note
};

// One ledger row. On a phone the number, label and detail share the first
// line and the amount wraps underneath, right-aligned.
function Row({ n, label, amount, rule = "border-rule-soft", children }: RowProps) {
  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 border-b py-4 ${rule}`}>
      <div className="flex min-w-0 flex-[1_1_320px] flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
        <span className="w-8 shrink-0 text-xs text-muted">[{n}]</span>
        <span className="w-28 shrink-0 text-sm sm:w-[140px]">{label}</span>
        {/* basis 0: it stays next to the label and wraps inside itself */}
        <span className="flex min-w-0 flex-[1_1_0%] flex-wrap items-center gap-2 text-[13px] text-muted">
          {children}
        </span>
      </div>
      <span className="ml-auto min-w-[140px] text-right text-[15px]">{amount}</span>
    </div>
  );
}
