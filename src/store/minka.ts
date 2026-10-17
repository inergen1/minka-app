"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { key, sod, weekStart } from "@/lib/dates";
import { nextValue, value } from "@/lib/habits";
import { blankAreas, sampleData } from "@/lib/seed";
import type { Area, Block, Goal, Habit, Lang, Logs, Review, Task } from "@/lib/types";

const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

interface Data {
  started: boolean;
  lang: Lang;
  theme: "light" | "dark" | null;
  areas: Area[];
  habits: Habit[];
  goals: Goal[];
  tasks: Task[];
  blocks: Block[];
  logs: Logs;
  reviews: Review[];
}

interface Actions {
  start: (mode: "sample" | "blank") => void;
  reset: () => void;
  setLang: (l: Lang) => void;
  setTheme: (t: "light" | "dark") => void;
  hitHabit: (id: string, d?: Date) => void;
  toggleTask: (id: string) => void;
  setRating: (area: string, v: number) => void;
  setVision: (area: string, text: string) => void;
  addHabit: (h: Omit<Habit, "id">) => string;
  removeHabit: (id: string) => void;
  addGoal: (g: Omit<Goal, "id">) => string;
  updateMetric: (id: string, cur: number) => void;
  removeGoal: (id: string) => void;
  addTask: (t: Omit<Task, "id">) => string;
  schedule: (taskId: string, date: string, hour: number) => void;
  unschedule: (taskId: string) => void;
  saveReview: (r: Omit<Review, "week">) => void;
}

const empty: Data = { started: false, lang: "ar", theme: null, areas: [], habits: [], goals: [], tasks: [], blocks: [], logs: {}, reviews: [] };

export const useMinka = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...empty,
      start: (mode) => {
        const base = mode === "sample" ? sampleData(sod(new Date())) : { areas: blankAreas(), habits: [], goals: [], tasks: [], blocks: [], logs: {} };
        set({ ...base, reviews: [], started: true });
      },
      reset: () => set({ ...empty, lang: get().lang, theme: get().theme }),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      hitHabit: (id, d = new Date()) => {
        const { habits, logs } = get();
        const h = habits.find((x) => x.id === id);
        if (!h) return;
        const nv = nextValue(h, value(logs, h, d));
        set({ logs: { ...logs, [id]: { ...logs[id], [key(d)]: nv } } });
      },
      toggleTask: (id) => set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }),
      setRating: (area, v) => set({ areas: get().areas.map((a) => (a.id === area ? { ...a, now: v } : a)) }),
      setVision: (area, text) =>
        set({ areas: get().areas.map((a) => (a.id === area ? { ...a, vision: { ar: text, en: text } } : a)) }),
      addHabit: (h) => {
        const id = uid("h");
        set({ habits: [...get().habits, { ...h, id }], logs: { ...get().logs, [id]: {} } });
        return id;
      },
      removeHabit: (id) => {
        const logs = { ...get().logs };
        delete logs[id];
        set({ habits: get().habits.filter((h) => h.id !== id), logs });
      },
      addGoal: (g) => {
        const id = uid("g");
        set({ goals: [...get().goals, { ...g, id }] });
        return id;
      },
      updateMetric: (id, cur) =>
        set({ goals: get().goals.map((g) => (g.id === id && g.metric ? { ...g, metric: { ...g.metric, cur: Math.max(0, cur) } } : g)) }),
      removeGoal: (id) => {
        const { goals, tasks, habits, blocks } = get();
        const gone = new Set<string>();
        const walk = (gid: string) => { gone.add(gid); goals.filter((g) => g.parent === gid).forEach((g) => walk(g.id)); };
        walk(id);
        const goneTasks = new Set(tasks.filter((t) => t.goal && gone.has(t.goal)).map((t) => t.id));
        set({
          goals: goals.filter((g) => !gone.has(g.id)),
          tasks: tasks.filter((t) => !goneTasks.has(t.id)),
          blocks: blocks.filter((b) => !b.task || !goneTasks.has(b.task)),
          habits: habits.map((h) => (h.goal && gone.has(h.goal) ? { ...h, goal: null } : h)),
        });
      },
      addTask: (t) => {
        const id = uid("t");
        set({ tasks: [...get().tasks, { ...t, id }] });
        return id;
      },
      schedule: (taskId, date, hour) => {
        const { tasks, goals, blocks } = get();
        const t = tasks.find((x) => x.id === taskId);
        if (!t) return;
        const area = t.area ?? goals.find((g) => g.id === t.goal)?.area ?? "work";
        set({ blocks: [...blocks.filter((b) => b.task !== taskId), { id: uid("b"), date, s: hour, d: 1, area, title: t.title, task: taskId }] });
      },
      unschedule: (taskId) => set({ blocks: get().blocks.filter((b) => b.task !== taskId) }),
      saveReview: (r) => {
        const week = key(weekStart(new Date()));
        set({ reviews: [{ ...r, week }, ...get().reviews.filter((x) => x.week !== week)] });
      },
    }),
    { name: "minka", version: 1 },
  ),
);

/** Non-persisted UI state shared across screens. */
interface UI {
  quickAdd: null | "habit" | "goal" | "task";
  toast: string | null;
  habitSel: string | null;
  selectHabit: (id: string) => void;
  openQuickAdd: (tab?: "habit" | "goal" | "task") => void;
  closeQuickAdd: () => void;
  showToast: (msg: string) => void;
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export const useUI = create<UI>()((set) => ({
  quickAdd: null,
  toast: null,
  habitSel: null,
  selectHabit: (habitSel) => set({ habitSel }),
  openQuickAdd: (tab = "habit") => set({ quickAdd: tab }),
  closeQuickAdd: () => set({ quickAdd: null }),
  showToast: (toast) => {
    clearTimeout(toastTimer);
    set({ toast });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
}));
