import { CATEGORIES, type CategoryId } from "@/data/categories";
import { formatRate } from "@/lib/format";

type Props = {
  selected: CategoryId;
  guessed: boolean; // the reader picked it from the title; the user hasn't yet
  onPick(id: CategoryId): void;
};

// The bracket list. Categories with a rate are real toggle buttons;
// the ones still waiting for a rate are greyed-out rows you can't press.
export function CategoryPicker({ selected, guessed, onPick }: Props) {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between gap-3 border-b border-ink pb-3 text-label">
        <span>CATEGORY</span>
        {guessed && <span className="text-muted">[?] GUESSED</span>}
      </div>

      {CATEGORIES.map((category) => {
        const on = category.id === selected;

        if (category.kind === "pending") {
          return (
            <div
              key={category.id}
              className="flex min-h-12 items-center gap-3.5 border-b border-rule-soft text-sm text-faint"
            >
              <span aria-hidden="true" className="shrink-0 whitespace-pre">
                {on ? "[●]" : "[–]"}
              </span>
              <span className="flex-1">{category.label}</span>
              <span className="text-xs">rate to be added</span>
            </div>
          );
        }

        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(category.id)}
            className="flex min-h-12 w-full items-center gap-3.5 border-b border-rule-soft text-left text-sm"
          >
            <span aria-hidden="true" className="shrink-0 whitespace-pre">
              {on ? "[●]" : "[ ]"}
            </span>
            <span className={`flex-1 ${on ? "font-medium" : ""}`}>{category.label}</span>
            <span className="text-xs text-muted">
              {formatRate(category)}
              {category.kind === "flat" && " flat"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
