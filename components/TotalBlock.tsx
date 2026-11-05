import type { Blocked } from "@/components/ResultView";
import type { Range } from "@/lib/cost/calculate";
import { formatEgp, formatPercentRange, isSingleValue } from "@/lib/format";

type Props = {
  total: Range;
  itemEgp: number; // the shelf price in EGP
  price: number;
  cur: string | null;
  blocked: Blocked;
  categoryLabel: string;
};

// The black panel: the landed cost, and how much more it is than the shelf price.
export function TotalBlock({ total, itemEgp, price, cur, blocked, categoryLabel }: Props) {
  const markup =
    itemEgp > 0
      ? formatPercentRange({ low: total.low / itemEgp - 1, high: total.high / itemEgp - 1 })
      : "0%";

  return (
    <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 bg-ink p-6 text-paper">
      <span className="text-label text-muted-inverse">LANDED COST, ESTIMATED</span>
      {blocked === null ? (
        <>
          <p className="flex flex-wrap gap-x-3.5 font-display text-[clamp(34px,5vw,56px)] leading-none font-medium tracking-[-0.03em]">
            <span>EGP {formatEgp(total.low)}</span>
            {!isSingleValue(total) && <span>– {formatEgp(total.high)}</span>}
          </p>
          <span className="text-xs leading-relaxed text-muted-inverse">
            shelf price {cur} {price.toFixed(2)} · that is {markup} more once it lands
          </span>
        </>
      ) : (
        <p className="font-display text-[clamp(24px,3vw,32px)] leading-tight font-medium tracking-[-0.02em]">
          {blocked === "rate"
            ? `rate to be added for ${categoryLabel}`
            : "[?] pick the shop's currency below"}
        </p>
      )}
    </div>
  );
}
