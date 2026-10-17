import { describe, expect, it } from "vitest";
import { areaProgress, progress } from "./goals";
import type { Goal, Task } from "./types";

const g = (id: string, extra: Partial<Goal> = {}): Goal => ({
  id, area: "work", horizon: "year", start: "2026-01-01", due: "2026-12-31", title: { ar: id, en: id }, ...extra,
});
const t = (id: string, goal: string, done: boolean): Task => ({ id, goal, done, title: { ar: id, en: id } });

describe("progress", () => {
  it("uses the metric when present", () => {
    expect(progress(g("a", { metric: { cur: 3, target: 4, unit: { ar: "", en: "" } } }), [], [])).toBe(0.75);
  });
  it("caps metrics at 100%", () => {
    expect(progress(g("a", { metric: { cur: 9, target: 4, unit: { ar: "", en: "" } } }), [], [])).toBe(1);
  });
  it("rolls up sub-goals and tasks recursively", () => {
    const goals = [g("root"), g("sub", { parent: "root" })];
    const tasks = [t("1", "sub", true), t("2", "sub", false), t("3", "root", true)];
    // sub = 0.5, root = avg(0.5, 1) = 0.75
    expect(progress(goals[0], goals, tasks)).toBe(0.75);
  });
  it("is zero for an empty goal", () => {
    expect(progress(g("x"), [], [])).toBe(0);
  });
});

describe("areaProgress", () => {
  it("averages top-level goals in the area only", () => {
    const goals = [
      g("a", { metric: { cur: 1, target: 2, unit: { ar: "", en: "" } } }),
      g("b", { metric: { cur: 2, target: 2, unit: { ar: "", en: "" } } }),
      g("c", { parent: "a", metric: { cur: 0, target: 1, unit: { ar: "", en: "" } } }),
      g("d", { area: "health" }),
    ];
    expect(areaProgress("work", goals, [])).toBe(0.75);
  });
});
