import type { Goal, Task } from "./types";

/** Numeric goals use current/target; others average their sub-goals and tasks (task = 0 or 1). */
export function progress(g: Goal, goals: Goal[], tasks: Task[]): number {
  if (g.metric) return Math.min(1, g.metric.cur / g.metric.target);
  const parts = [
    ...goals.filter((x) => x.parent === g.id).map((x) => progress(x, goals, tasks)),
    ...tasks.filter((t) => t.goal === g.id).map((t) => (t.done ? 1 : 0)),
  ];
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
}

export function areaProgress(area: string, goals: Goal[], tasks: Task[]) {
  const top = goals.filter((g) => !g.parent && g.area === area);
  return top.length ? top.reduce((a, g) => a + progress(g, goals, tasks), 0) / top.length : 0;
}

export const taskArea = (t: Task, goals: Goal[]) =>
  t.area ?? goals.find((g) => g.id === t.goal)?.area ?? "work";
