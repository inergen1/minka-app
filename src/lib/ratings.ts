import { addDays, parse, sod } from "./dates";
import type { Review } from "./types";

/**
 * Rating of an area about `days` ago, from the newest saved review on or before that date.
 * Falls back to `fallback` (the area's stored baseline) when no review is that old.
 */
export function ratingBefore(reviews: Review[], area: string, today: Date, fallback: number, days = 90) {
  const cutoff = addDays(sod(today), -days).getTime();
  const old = reviews
    .filter((r) => parse(r.week).getTime() <= cutoff && r.ratings[area] !== undefined)
    .sort((a, b) => b.week.localeCompare(a.week))[0];
  return old ? old.ratings[area] : fallback;
}
