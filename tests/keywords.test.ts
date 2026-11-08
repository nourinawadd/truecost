import { describe, expect, it } from "vitest";
import { guessCategory } from "@/lib/classify/keywords";

describe("guessCategory", () => {
  it("a clear match wins", () => {
    expect(guessCategory("Linen Overshirt Jacket")).toEqual({ id: "clothing", by: "keyword" });
    expect(guessCategory("Vitamin C Serum 30ml")).toEqual({ id: "cosmetics", by: "keyword" });
  });

  it("matches plurals and hyphenated words, ignoring case", () => {
    expect(guessCategory("Summer DRESSES")?.id).toBe("clothing");
    expect(guessCategory("Oversized T-Shirt")?.id).toBe("clothing");
  });

  it("matches whole words only", () => {
    expect(guessCategory("Teeth whitening kit for the committee")).toBeNull();
  });

  it("the brand counts too", () => {
    expect(guessCategory("Note 13 Pro 256GB", "Xiaomi")?.id).toBe("phones");
  });

  it("an exclude word rules a category out", () => {
    expect(guessCategory("iPhone 15 Pro")?.id).toBe("phones");
    expect(guessCategory("iPhone 15 Pro silicone case")).toBeNull();
    expect(guessCategory("Redmi wireless earbuds")?.id).toBe("electronics");
  });

  it("no match gives null", () => {
    expect(guessCategory("Gift card")).toBeNull();
    expect(guessCategory("")).toBeNull();
  });

  it("a tie gives null: better to ask than to guess", () => {
    expect(guessCategory("Hoodie and lipstick bundle")).toBeNull();
  });
});
