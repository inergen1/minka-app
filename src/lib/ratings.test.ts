import { describe, expect, it } from "vitest";
import { ratingBefore } from "./ratings";
import type { Review } from "./types";

const r = (week: string, score: number): Review => ({ week, notes: [], top: [], ratings: { health: score } });
const today = new Date(2026, 9, 18);

describe("ratingBefore", () => {
  it("falls back when no review is old enough", () => {
    expect(ratingBefore([r("2026-10-10", 7)], "health", today, 4)).toBe(4);
  });
  it("uses the newest review at least 90 days old", () => {
    expect(ratingBefore([r("2026-05-02", 3), r("2026-07-18", 5), r("2026-10-10", 8)], "health", today, 1)).toBe(5);
  });
});
