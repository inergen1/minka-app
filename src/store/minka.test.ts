import { describe, expect, it } from "vitest";
import { useMinka } from "./minka";

describe("task editing", () => {
  it("keeps the scheduled block in step and removes it with the task", () => {
    const s = useMinka.getState();
    s.start("blank");
    const id = s.addTask({ area: "health", title: { ar: "أ", en: "A" }, done: false });
    useMinka.getState().schedule(id, "2026-10-18", 9);
    useMinka.getState().updateTask(id, { title: { ar: "ب", en: "B" }, area: "work" });
    const b = useMinka.getState().blocks.find((x) => x.task === id)!;
    expect(b.title.en).toBe("B");
    expect(b.area).toBe("work");
    useMinka.getState().removeTask(id);
    expect(useMinka.getState().tasks.some((x) => x.id === id)).toBe(false);
    expect(useMinka.getState().blocks.some((x) => x.task === id)).toBe(false);
  });
});
