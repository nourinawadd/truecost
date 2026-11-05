import { CATEGORIES, type CategoryId } from "@/data/categories";

export type CategoryGuess = { id: CategoryId; by: "keyword" };

// Counts how many of each category's keywords appear as whole words in the
// title and brand. The best score wins. A tie or no match means we don't
// know, and the user picks on the result page.
export function guessCategory(title: string, brand?: string): CategoryGuess | null {
  const text = `${title} ${brand ?? ""}`.toLowerCase();
  let best: CategoryId | null = null;
  let bestScore = 0;
  let tie = false;

  for (const category of CATEGORIES) {
    // an "iphone case" mentions a phone but isn't one
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

// whole word with an optional plural: "shirt" matches "shirts", not "shirtless"
function hasWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}(?:s|es)?\\b`).test(text);
}
