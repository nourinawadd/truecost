import type { Blocked } from "@/components/ResultView";
import { ShareButton } from "@/components/ShareButton";
import type { Verdict } from "@/lib/cost/verdict";
import { formatRange } from "@/lib/format";

type Props = {
  local: string; // the box as typed
  onLocal(value: string): void;
  verdict: Verdict;
  blocked: Blocked;
  categoryLabel: string;
  shareHref: string;
};

// The local price box and the verdict. Red only when buying local wins.
export function ComparePanel({ local, onLocal, verdict, blocked, categoryLabel, shareHref }: Props) {
  const { tag, title, body } = describe(verdict, blocked, categoryLabel);
  const red = verdict.kind === "buy-local" && blocked === null;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="border-b border-ink pb-3 text-label">COMPARE</div>
      <label htmlFor="local" className="text-[13px] text-ink-soft">
        what does a local seller charge?
      </label>
      <div className="flex h-[52px] items-center border border-ink bg-field">
        <span className="pl-3.5 text-[13px] text-muted">EGP</span>
        <input
          id="local"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={local}
          onChange={(event) => onLocal(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-base"
        />
      </div>

      <div
        aria-live="polite"
        className={`flex flex-col gap-2.5 border p-5 ${red ? "border-red" : "border-ink"}`}
      >
        <span className={`text-label ${red ? "text-red" : ""}`}>{tag}</span>
        <span
          className={`font-display text-[26px] leading-[1.1] font-medium tracking-[-0.02em] ${red ? "text-red" : ""}`}
        >
          {title}
        </span>
        <span className="text-[13px] leading-relaxed text-ink-soft">{body}</span>
      </div>

      <ShareButton href={shareHref} />
    </div>
  );
}

// the words for each verdict, as on the design canvas
function describe(verdict: Verdict, blocked: Blocked, categoryLabel: string) {
  if (blocked === "currency") {
    return {
      tag: "WAITING",
      title: "pick the currency first",
      body: "truecost needs the shop's currency before it can compare prices.",
    };
  }

  switch (verdict.kind) {
    case "pending":
      return {
        tag: "WAITING",
        title: "no rate yet",
        body: `${categoryLabel} has no duty rate yet, so there's nothing to compare.`,
      };
    case "none":
      return {
        tag: "WAITING",
        title: "add a local price",
        body: "type what a seller in egypt asks for the same item and truecost will tell you which way is cheaper.",
      };
    case "buy-local":
      return {
        tag: "VERDICT",
        title: "buy local",
        body: `importing costs EGP ${formatRange(verdict.extra)} more than the local price.`,
      };
    case "import":
      return {
        tag: "VERDICT",
        title: "import it",
        body: `you save EGP ${formatRange(verdict.saves)} compared to the local price.`,
      };
    case "too-close":
      return {
        tag: "VERDICT",
        title: "too close to call",
        body: "the local price sits inside the estimate range. customs will decide this one.",
      };
  }
}
