"use client";

import { useEffect, useState } from "react";

// Copies a link to this exact result. `href` is the page's current state,
// so an edit still waiting to reach the address bar is included.
export function ShareButton({ href }: { href: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  // "copied" fades back after 2 seconds; a failure stays until the next try
  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      // navigator.clipboard is missing on plain http and in some browsers
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
