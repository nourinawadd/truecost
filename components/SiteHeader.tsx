import Link from "next/link";
import type { ReactNode } from "react";
import { FX_AS_OF } from "@/data/config";

// "2026-11-01" → "01.11.26", the way the design writes dates
const [year, month, day] = FX_AS_OF.split("-");
const RATES_DATE = `${day}.${month}.${year.slice(2)}`;

export function RatesAsOf() {
  return <span className="text-muted">[✦] RATES AS OF {RATES_DATE}</span>;
}

// The wordmark and label on the left. The right side changes per page,
// so it's `children`; when a page passes nothing it shows the rates date.
export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1 border-b border-ink pt-4 pb-2">
      <div className="flex flex-wrap items-center gap-x-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-xl font-semibold tracking-[0.04em]"
        >
          TRUECOST
        </Link>
        <span className="text-label text-muted">[EG] IMPORT COST CHECK</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 text-label">{children ?? <RatesAsOf />}</div>
    </header>
  );
}
