import { describe, expect, it } from "vitest";
import { addDays, key, weekStart } from "./dates";
import { bestStreak, dueReminders, isDue, nextValue, rate, streak } from "./habits";
import type { Habit, Logs } from "./types";

const today = new Date(2026, 9, 18); // Sunday
const daily: Habit = { id: "h", area: "faith", slot: "fajr", icon: "sun", name: { ar: "", en: "" }, type: "check" };
const tueFri: Habit = { ...daily, id: "p", freq: { kind: "days", days: [2, 5] } };
const logsFor = (id: string, offsets: number[]): Logs => ({ [id]: Object.fromEntries(offsets.map((o) => [key(addDays(today, o)), 1])) });

describe("weekStart", () => {
  it("starts weeks on Saturday", () => {
    expect(key(weekStart(today))).toBe("2026-10-17");
    expect(key(weekStart(new Date(2026, 9, 17)))).toBe("2026-10-17");
    expect(key(weekStart(new Date(2026, 9, 23)))).toBe("2026-10-17");
  });
});

describe("isDue", () => {
  it("handles daily and specific weekdays", () => {
    expect(isDue(daily, today)).toBe(true);
    expect(isDue(tueFri, today)).toBe(false);
    expect(isDue(tueFri, new Date(2026, 9, 20))).toBe(true);
  });
});

describe("streak", () => {
  it("counts back from today when done", () => {
    expect(streak(logsFor("h", [0, -1, -2, -4]), daily, today)).toBe(3);
  });
  it("starts from yesterday while today is still open", () => {
    expect(streak(logsFor("h", [-1, -2]), daily, today)).toBe(2);
  });
  it("skips days the habit is not due", () => {
    // Fri 16 and Tue 13 done; Fri 9 missed
    expect(streak(logsFor("p", [-2, -5]), tueFri, today)).toBe(2);
  });
  it("is zero with no history", () => {
    expect(streak({}, daily, today)).toBe(0);
  });
});

describe("bestStreak and rate", () => {
  it("finds the longest run", () => {
    expect(bestStreak(logsFor("h", [-10, -9, -8, -7, -3, -2]), daily, today)).toBe(4);
  });
  it("ignores an unfinished today in the rate", () => {
    expect(rate(logsFor("h", [-1, -2]), daily, today, 3)).toBe(1);
    expect(rate(logsFor("h", [-1]), daily, today, 3)).toBe(0.5);
  });
});

describe("nextValue", () => {
  it("toggles checks, counts up, steps durations and resets when full", () => {
    expect(nextValue(daily, 0)).toBe(1);
    expect(nextValue(daily, 1)).toBe(0);
    const count: Habit = { ...daily, type: "count", target: 3 };
    expect(nextValue(count, 2)).toBe(3);
    expect(nextValue(count, 3)).toBe(0);
    const dur: Habit = { ...daily, type: "duration", target: 30 };
    expect(nextValue(dur, 0)).toBe(10);
    expect(nextValue(dur, 25)).toBe(30);
  });
});

describe("dueReminders", () => {
  const h: Habit = { ...daily, remind: "07:30" };
  const at = (hh: number, mm: number) => new Date(2026, 9, 18, hh, mm);
  it("fires within the hour after the reminder time only", () => {
    expect(dueReminders([h], {}, at(7, 29), new Set())).toHaveLength(0);
    expect(dueReminders([h], {}, at(7, 30), new Set())).toHaveLength(1);
    expect(dueReminders([h], {}, at(8, 30), new Set())).toHaveLength(0);
  });
  it("skips habits already done, already reminded, or not due today", () => {
    expect(dueReminders([h], logsFor("h", [0]), at(7, 45), new Set())).toHaveLength(0);
    expect(dueReminders([h], {}, at(7, 45), new Set(["h" + key(today)]))).toHaveLength(0);
    expect(dueReminders([{ ...tueFri, remind: "07:30" }], {}, at(7, 45), new Set())).toHaveLength(0);
  });
});
