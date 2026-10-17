"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addDays, key } from "@/lib/dates";
import { today, useT } from "@/lib/use-t";
import type { Habit, Slot } from "@/lib/types";
import { useMinka, useUI } from "@/store/minka";
import { Icon } from "./icon";

const SLOTS: Slot[] = ["fajr", "morning", "dhuhr", "asr", "maghrib", "night", "anytime"];
const AREA_ICON: Record<string, string> = { faith: "moon-star", spirit: "sparkles", health: "heart-pulse", work: "target", wealth: "receipt", family: "phone", growth: "book", leisure: "feather" };

export function QuickAdd() {
  const { t, L } = useT();
  const router = useRouter();
  const tab = useUI((s) => s.quickAdd)!;
  const open = useUI((s) => s.openQuickAdd);
  const close = useUI((s) => s.closeQuickAdd);
  const toast = useUI((s) => s.showToast);
  const { areas, goals, addHabit, addGoal, addTask } = useMinka();
  const [days, setDays] = useState([6, 0, 1, 2, 3, 4, 5]);
  const [kind, setKind] = useState<Habit["type"]>("check");
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
    const f = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [tab, close]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const name = s("name");
    if (!name) return nameRef.current?.focus();
    const title = { ar: name, en: name };
    if (tab === "habit") {
      const area = s("area");
      addHabit({
        area, slot: s("slot") as Slot, icon: AREA_ICON[area] ?? "circle-dot", name: title, type: kind,
        target: kind === "check" ? undefined : Math.max(1, Number(s("target")) || 1),
        unit: kind === "duration" ? { ar: "دقيقة", en: "min" } : kind === "count" ? { ar: s("unit"), en: s("unit") } : undefined,
        freq: days.length === 7 ? { kind: "daily" } : { kind: "days", days: [...days] },
        goal: s("goal") || null,
      });
      router.push("/habits");
    } else if (tab === "goal") {
      const parent = s("parent") || undefined;
      const m = Number(s("metric"));
      addGoal({
        parent, area: parent ? goals.find((g) => g.id === parent)!.area : s("area"), horizon: s("horizon") as "year",
        start: key(today()), due: s("due") || key(addDays(today(), 90)), title,
        why: s("why") ? { ar: s("why"), en: s("why") } : null,
        metric: m > 0 ? { cur: 0, target: m, unit: { ar: s("unit"), en: s("unit") } } : undefined,
      });
      router.push("/goals");
    } else {
      const goal = s("goal") || null;
      addTask({ goal, area: goal ? undefined : s("area"), title, done: false, due: s("due") || undefined });
    }
    close();
    toast(t.added);
  };

  const areaSel = (
    <div className="field"><label htmlFor="f-area">{t.area}</label>
      <select id="f-area" name="area">{areas.map((a) => <option key={a.id} value={a.id}>{L(a.name)}</option>)}</select></div>
  );
  const goalOpts = [<option key="" value="">{t.none}</option>, ...goals.map((g) => <option key={g.id} value={g.id}>{g.parent ? "— " : ""}{L(g.title)}</option>)];

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="qa-title" key={tab}>
        <div className="modal-head">
          <h2 id="qa-title">{t.qa}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label={t.cancel}><Icon name="x" /></button>
        </div>
        <div className="seg" role="group">
          {(["habit", "goal", "task"] as const).map((x) => (
            <button type="button" key={x} aria-pressed={tab === x} onClick={() => open(x)}>{t[x]}</button>
          ))}
        </div>
        <div className="form-grid">
          <div className="field full"><label htmlFor="f-name">{t.name}</label>
            <input id="f-name" name="name" ref={nameRef} required placeholder={tab === "habit" ? t.phHabit : tab === "goal" ? t.phGoal : t.phTask} /></div>
          {tab === "habit" && <>
            {areaSel}
            <div className="field"><label htmlFor="f-slot">{t.slot}</label>
              <select id="f-slot" name="slot">{SLOTS.map((k) => <option key={k} value={k}>{t.slots[k]}</option>)}</select></div>
            <div className="field"><label htmlFor="f-kind">{t.kind}</label>
              <select id="f-kind" value={kind} onChange={(e) => setKind(e.target.value as Habit["type"])}>
                <option value="check">{t.check}</option><option value="count">{t.count}</option><option value="duration">{t.duration}</option>
              </select></div>
            {kind !== "check" && <div className="field"><label htmlFor="f-target">{t.targetV}</label><input id="f-target" name="target" type="number" min="1" defaultValue={kind === "duration" ? 15 : 3} /></div>}
            {kind === "count" && <div className="field"><label htmlFor="f-unit">{t.unit}</label><input id="f-unit" name="unit" /></div>}
            <div className="field full"><label>{t.freq}</label>
              <div className="daypick">{[6, 0, 1, 2, 3, 4, 5].map((d) => (
                <button type="button" key={d} aria-pressed={days.includes(d)}
                  onClick={() => setDays((ds) => (ds.includes(d) ? (ds.length > 1 ? ds.filter((x) => x !== d) : ds) : [...ds, d]))}>
                  {t.weekdaysShort[d]}
                </button>))}</div></div>
            <div className="field full"><label htmlFor="f-goal">{t.linkGoal}</label><select id="f-goal" name="goal">{goalOpts}</select></div>
          </>}
          {tab === "goal" && <>
            {areaSel}
            <div className="field"><label htmlFor="f-parent">{t.parent}</label><select id="f-parent" name="parent">{goalOpts}</select></div>
            <div className="field full"><label htmlFor="f-why">{t.whyQ}</label><textarea id="f-why" name="why" /></div>
            <div className="field"><label htmlFor="f-horizon">{t.horizonL}</label>
              <select id="f-horizon" name="horizon" defaultValue="quarter">{(["year", "quarter", "month"] as const).map((h) => <option key={h} value={h}>{t.horizon[h]}</option>)}</select></div>
            <div className="field"><label htmlFor="f-due">{t.dueDate}</label><input id="f-due" name="due" type="date" defaultValue={key(addDays(today(), 90))} /></div>
            <div className="field"><label htmlFor="f-metric">{t.metricT}</label><input id="f-metric" name="metric" type="number" min="1" placeholder="10" /></div>
            <div className="field"><label htmlFor="f-unit">{t.unit}</label><input id="f-unit" name="unit" /></div>
          </>}
          {tab === "task" && <>
            <div className="field"><label htmlFor="f-goal">{t.linkGoal}</label><select id="f-goal" name="goal">{goalOpts}</select></div>
            {areaSel}
            <div className="field"><label htmlFor="f-due">{t.dueDate}</label><input id="f-due" name="due" type="date" defaultValue={key(today())} /></div>
          </>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn ghost" onClick={close}>{t.cancel}</button>
          <button type="submit" className="btn primary">{t.save}</button>
        </div>
      </form>
    </div>
  );
}
