import Link from "next/link";
import type { ReactNode } from "react";
import { FX_AS_OF } from "@/data/config";
import { formatShortDate } from "@/lib/format";

export function RatesAsOf() {
  return <span className="text-muted">[✦] RATES AS OF {formatShortDate(FX_AS_OF)}</span>;
}

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
