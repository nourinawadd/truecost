"use client";

import { useEffect, useState } from "react";

export function ShareButton({ href }: { href: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(href, location.origin).href);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex min-h-11 items-center self-start text-left text-[13px] underline ${state === "failed" ? "text-red" : ""}`}
    >
      <span aria-live="polite">
        {state === "copied"
          ? "[✓] copied"
          : state === "failed"
            ? "[×] couldn't copy, use the address bar"
            : "[↗] copy a link to this result"}
      </span>
    </button>
  );
}
