import { addDays, key, sod } from "./dates";
import type { Habit, Logs } from "./types";

export const target = (h: Habit) => (h.type === "check" ? 1 : h.target ?? 1);

export function isDue(h: Habit, d: Date) {
  const f = h.freq ?? { kind: "daily" };
  return f.kind === "daily" || f.days.includes(d.getDay());
}

export const value = (logs: Logs, h: Habit, d: Date) => logs[h.id]?.[key(d)] ?? 0;
export const isDone = (logs: Logs, h: Habit, d: Date) => value(logs, h, d) >= target(h);

/** Consecutive due days completed, ending today (or yesterday if today is not done yet). */
export function streak(logs: Logs, h: Habit, today: Date) {
  let d = sod(today);
  if (!isDone(logs, h, d)) d = addDays(d, -1);
  let n = 0;
  for (let i = 0; i < 1000; i++) {
    if (isDue(h, d)) {
      if (isDone(logs, h, d)) n++;
      else break;
    }
    d = addDays(d, -1);
  }
  return n;
}

export function bestStreak(logs: Logs, h: Habit, today: Date, lookback = 371) {
  let best = 0, run = 0;
  for (let k = lookback; k >= 0; k--) {
    const d = addDays(sod(today), -k);
    if (!isDue(h, d)) continue;
    if (isDone(logs, h, d)) { run++; best = Math.max(best, run); }
    else if (k > 0) run = 0; // an unfinished today does not break the run
  }
  return best;
}

/** Share of due days completed in the last `days` days; today counts only once done. */
export function rate(logs: Logs, h: Habit, today: Date, days: number) {
  let due = 0, done = 0;
  for (let k = days - 1; k >= 0; k--) {
    const d = addDays(sod(today), -k);
    if (!isDue(h, d)) continue;
    const ok = isDone(logs, h, d);
    if (k === 0 && !ok) continue;
    due++;
    if (ok) done++;
  }
  return due ? done / due : 0;
}

export const totalDone = (logs: Logs, h: Habit) =>
  Object.values(logs[h.id] ?? {}).filter((v) => v >= target(h)).length;

/** Next value when the habit button is tapped: check toggles, count adds 1, duration adds a step; full resets. */
export function nextValue(h: Habit, v: number) {
  const t = target(h);
  if (v >= t) return 0;
  if (h.type === "check") return 1;
  if (h.type === "count") return v + 1;
  return Math.min(t, v + Math.max(5, Math.round(t / 3 / 5) * 5));
}

/** Habits whose reminder time passed within the last hour, due today, not done, and not reminded yet. */
export function dueReminders(habits: Habit[], logs: Logs, now: Date, fired: Set<string>) {
  const mins = now.getHours() * 60 + now.getMinutes();
  return habits.filter((h) => {
    if (!h.remind || fired.has(h.id + key(now)) || !isDue(h, now) || isDone(logs, h, now)) return false;
    const [hh, mm] = h.remind.split(":").map(Number);
    const at = hh * 60 + mm;
    return mins >= at && mins < at + 60;
  });
}
