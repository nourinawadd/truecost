import type { ReactNode } from "react";
import type { Step } from "@/lib/scrape/types";

type Props = {
  steps: Step[];
  reading?: string;
};

export function ProgressSteps({ steps, reading }: Props) {
  return (
    <ol aria-live="polite" className="flex flex-col text-sm">
      {reading ? (
        <Row mark="[ ]">
          reading {reading}
          <span aria-hidden="true" className="motion-safe:animate-blink">
            ▍
          </span>
        </Row>
      ) : (
        steps.map((step, i) => (
          <Row key={i} mark={step.ok ? "[●]" : "[×]"} failed={!step.ok} time={step.ms}>
            {step.text}
          </Row>
        ))
      )}
    </ol>
  );
}

type RowProps = { mark: string; failed?: boolean; time?: number; children: ReactNode };

function Row({ mark, failed = false, time, children }: RowProps) {
  return (
    <li
      className={`flex gap-3.5 border-b border-rule-soft py-3 last:border-b-0 ${failed ? "text-red" : ""}`}
    >
      <span aria-hidden="true" className="shrink-0 whitespace-pre">
        {mark}
      </span>
      <span className="min-w-0 flex-1">
        {failed && <span className="sr-only">failed: </span>}
        {children}
      </span>
      {time !== undefined && (
        <span className={failed ? "" : "text-muted"}>{(time / 1000).toFixed(1)}s</span>
      )}
    </li>
  );
}
