"use client";

import { useState } from "react";
import type { Src } from "@/lib/resultUrl";

type Props = { title?: string; img?: string; shop?: string; src: Src };

// The product as the shop shows it, plus chips saying which values were
// read from the shop [✓] and which are guesses to check [?].
export function ProductCard({ title, img, shop, src }: Props) {
  const [broken, setBroken] = useState(false);

  const chips = [
    src.price === "read" && "[✓] price · product data",
    src.price === "guess" && "[?] price · page preview, check it",
    src.cat === "guess" && "[?] category · guessed, check it",
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className="flex min-w-0 flex-[999_1_480px] flex-wrap items-start gap-6">
      <div className="relative size-[132px] shrink-0 border border-ink bg-field">
        {img && !broken ? (
          // A plain <img>: images come from any shop's CDN, and next/image
          // would need every host allow-listed. no-referrer, because some
          // CDNs refuse images linked from other sites.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            // an image that failed before React took over the page never
            // fires onError for us: "complete" with no width means it broke
            ref={(el) => {
              if (el?.complete && el.naturalWidth === 0) setBroken(true);
            }}
            className="size-full object-contain"
          />
        ) : (
          <>
            <svg viewBox="0 0 130 130" preserveAspectRatio="none" aria-hidden="true" className="block size-full">
              <line x1="0" y1="0" x2="130" y2="130" stroke="currentColor" vectorEffect="non-scaling-stroke" />
              <line x1="130" y1="0" x2="0" y2="130" stroke="currentColor" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute -bottom-[22px] left-0 text-[11px] tracking-[0.08em] text-muted">
              PRODUCT IMAGE
            </span>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
        <span className="text-label text-muted uppercase [overflow-wrap:anywhere]">
          {shop ?? "ENTERED BY HAND"}
        </span>
        <h1 className="line-clamp-3 font-display text-[clamp(26px,4vw,40px)] leading-[1.05] font-medium tracking-[-0.02em] [overflow-wrap:anywhere]">
          {title ?? "[untitled product]"}
        </h1>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {chips.map((chip) => (
              <span key={chip} className="border border-ink px-2.5 py-1.5">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
