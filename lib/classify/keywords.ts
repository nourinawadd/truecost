import { CATEGORIES, type CategoryId } from "@/data/categories";

export type CategoryGuess = { id: CategoryId; by: "keyword" };

export function guessCategory(title: string, brand?: string): CategoryGuess | null {
  const text = `${title} ${brand ?? ""}`.toLowerCase();
  let best: CategoryId | null = null;
  let bestScore = 0;
  let tie = false;

  for (const category of CATEGORIES) {
    if (category.exclude.some((word) => hasWord(text, word))) continue;

    const score = category.keywords.filter((word) => hasWord(text, word)).length;
    if (score > bestScore) {
      best = category.id;
      bestScore = score;
      tie = false;
    } else if (score > 0 && score === bestScore) {
      tie = true;
    }
  }

  return best && !tie ? { id: best, by: "keyword" } : null;
}

function hasWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}(?:s|es)?\\b`).test(text);
}
