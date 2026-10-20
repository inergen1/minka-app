"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addDays, key } from "@/lib/dates";
import { today, useT } from "@/lib/use-t";
import type { Habit, Slot } from "@/lib/types";
import { useMinka, useUI } from "@/store/minka";
import { ICON_CHOICES, Icon } from "./icon";

const SLOTS: Slot[] = ["fajr", "morning", "dhuhr", "asr", "maghrib", "night", "anytime"];
const AREA_ICON: Record<string, string> = { faith: "moon-star", spirit: "sparkles", health: "heart-pulse", work: "target", wealth: "receipt", family: "phone", growth: "book", leisure: "feather" };

export function QuickAdd() {
  const { t, L, lang } = useT();
  const router = useRouter();
  const tab = useUI((s) => s.quickAdd)!;
  const editId = useUI((s) => s.editId);
  const open = useUI((s) => s.openQuickAdd);
  const close = useUI((s) => s.closeQuickAdd);
  const toast = useUI((s) => s.showToast);
  const { areas, habits, goals, tasks, addHabit, addGoal, addTask, updateHabit, updateGoal, updateTask, removeTask } = useMinka();
  const eh = tab === "habit" ? habits.find((h) => h.id === editId) : undefined;
  const eg = tab === "goal" ? goals.find((g) => g.id === editId) : undefined;
  const et = tab === "task" ? tasks.find((x) => x.id === editId) : undefined;
  const editing = !!(eh || eg || et);
  const [armed, setArmed] = useState(false);
  const [days, setDays] = useState(eh?.freq?.kind === "days" ? eh.freq.days : [6, 0, 1, 2, 3, 4, 5]);
  const [kind, setKind] = useState<Habit["type"]>(eh?.type ?? "check");
  const [icon, setIcon] = useState<string | null>(eh?.icon ?? null);
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
    // When editing, only the current language's text changes.
    const txt = (v: string, old?: { ar: string; en: string } | null) => (old ? { ...old, [lang]: v } : { ar: v, en: v });
    const title = txt(name, eh?.name ?? eg?.title ?? et?.title);
    let note = editing ? t.saved : t.added;
    if (tab === "habit") {
      const area = s("area");
      const h = {
        area, slot: s("slot") as Slot, icon: icon ?? AREA_ICON[area] ?? "circle-dot", name: title, type: kind,
        target: kind === "check" ? undefined : Math.max(1, Number(s("target")) || 1),
        unit: kind === "duration" ? { ar: "دقيقة", en: "min" } : kind === "count" ? txt(s("unit"), eh?.unit) : undefined,
        freq: days.length === 7 ? { kind: "daily" as const } : { kind: "days" as const, days: [...days] },
        goal: s("goal") || null,
        remind: s("remind") || undefined,
      };
      if (h.remind && "Notification" in window) {
        if (Notification.permission === "default") Notification.requestPermission();
        else if (Notification.permission === "denied") note = t.remindOff;
      }
      if (eh) updateHabit(eh.id, h);
      else { addHabit(h); router.push("/habits"); }
    } else if (tab === "goal") {
      const parent = s("parent") || undefined;
      const m = Number(s("metric"));
      const g = {
        parent, area: parent ? goals.find((x) => x.id === parent)!.area : s("area"), horizon: s("horizon") as "year",
        start: eg?.start ?? key(today()), due: s("due") || key(addDays(today(), 90)), title,
        why: s("why") ? txt(s("why"), eg?.why) : null,
        metric: m > 0 ? { cur: eg?.metric?.cur ?? 0, target: m, unit: txt(s("unit"), eg?.metric?.unit) } : undefined,
      };
      if (eg) updateGoal(eg.id, g);
      else { addGoal(g); router.push("/goals"); }
    } else {
      const goal = s("goal") || null;
      const x = { goal, area: goal ? undefined : s("area"), title, due: s("due") || undefined };
      if (et) updateTask(et.id, x);
      else addTask({ ...x, done: false });
    }
    close();
    toast(note);
  };

  const areaSel = (
    <div className="field"><label htmlFor="f-area">{t.area}</label>
      <select id="f-area" name="area" defaultValue={eh?.area ?? eg?.area ?? (et && !et.goal ? et.area : undefined)}>{areas.map((a) => <option key={a.id} value={a.id}>{L(a.name)}</option>)}</select></div>
  );
  // A goal cannot become its own parent or a child of its sub-goals.
  const blocked = new Set<string>();
  if (eg) { const walk = (id: string) => { blocked.add(id); goals.filter((g) => g.parent === id).forEach((g) => walk(g.id)); }; walk(eg.id); }
  const goalOpts = [<option key="" value="">{t.none}</option>, ...goals.filter((g) => !blocked.has(g.id)).map((g) => <option key={g.id} value={g.id}>{g.parent ? "— " : ""}{L(g.title)}</option>)];

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="qa-title" key={tab}>
        <div className="modal-head">
          <h2 id="qa-title">{editing ? t.editTitle : t.qa}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label={t.cancel}><Icon name="x" /></button>
        </div>
        {!editing && <div className="seg" role="group">
          {(["habit", "goal", "task"] as const).map((x) => (
            <button type="button" key={x} aria-pressed={tab === x} onClick={() => open(x)}>{t[x]}</button>
          ))}
        </div>}
        <div className="form-grid">
          <div className="field full"><label htmlFor="f-name">{t.name}</label>
            <input id="f-name" name="name" ref={nameRef} required defaultValue={L(eh?.name ?? eg?.title ?? et?.title)} placeholder={tab === "habit" ? t.phHabit : tab === "goal" ? t.phGoal : t.phTask} /></div>
          {tab === "habit" && <>
            {areaSel}
            <div className="field"><label htmlFor="f-slot">{t.slot}</label>
              <select id="f-slot" name="slot" defaultValue={eh?.slot}>{SLOTS.map((k) => <option key={k} value={k}>{t.slots[k]}</option>)}</select></div>
            <div className="field"><label htmlFor="f-kind">{t.kind}</label>
              <select id="f-kind" value={kind} onChange={(e) => setKind(e.target.value as Habit["type"])}>
                <option value="check">{t.check}</option><option value="count">{t.count}</option><option value="duration">{t.duration}</option>
              </select></div>
            {kind !== "check" && <div className="field"><label htmlFor="f-target">{t.targetV}</label><input id="f-target" name="target" type="number" min="1" defaultValue={eh?.target ?? (kind === "duration" ? 15 : 3)} /></div>}
            {kind === "count" && <div className="field"><label htmlFor="f-unit">{t.unit}</label><input id="f-unit" name="unit" defaultValue={L(eh?.unit)} /></div>}
            <div className="field full"><label>{t.icon}</label>
              <div className="daypick">{ICON_CHOICES.map((ic) => (
                <button type="button" key={ic} aria-label={ic} aria-pressed={icon === ic} onClick={() => setIcon(ic)}><Icon name={ic} /></button>))}</div></div>
            <div className="field full"><label>{t.freq}</label>
              <div className="daypick">{[6, 0, 1, 2, 3, 4, 5].map((d) => (
                <button type="button" key={d} aria-pressed={days.includes(d)}
                  onClick={() => setDays((ds) => (ds.includes(d) ? (ds.length > 1 ? ds.filter((x) => x !== d) : ds) : [...ds, d]))}>
                  {t.weekdaysShort[d]}
                </button>))}</div></div>
            <div className="field"><label htmlFor="f-goal">{t.linkGoal}</label><select id="f-goal" name="goal" defaultValue={eh?.goal ?? ""}>{goalOpts}</select></div>
            <div className="field"><label htmlFor="f-remind">{t.remind}</label><input id="f-remind" name="remind" type="time" defaultValue={eh?.remind} /></div>
          </>}
          {tab === "goal" && <>
            {areaSel}
            <div className="field"><label htmlFor="f-parent">{t.parent}</label><select id="f-parent" name="parent" defaultValue={eg?.parent ?? ""}>{goalOpts}</select></div>
            <div className="field full"><label htmlFor="f-why">{t.whyQ}</label><textarea id="f-why" name="why" defaultValue={L(eg?.why)} /></div>
            <div className="field"><label htmlFor="f-horizon">{t.horizonL}</label>
              <select id="f-horizon" name="horizon" defaultValue={eg?.horizon ?? "quarter"}>{(["year", "quarter", "month"] as const).map((h) => <option key={h} value={h}>{t.horizon[h]}</option>)}</select></div>
            <div className="field"><label htmlFor="f-due">{t.dueDate}</label><input id="f-due" name="due" type="date" defaultValue={eg?.due ?? key(addDays(today(), 90))} /></div>
            <div className="field"><label htmlFor="f-metric">{t.metricT}</label><input id="f-metric" name="metric" type="number" min="1" placeholder="10" defaultValue={eg?.metric?.target} /></div>
            <div className="field"><label htmlFor="f-unit">{t.unit}</label><input id="f-unit" name="unit" defaultValue={L(eg?.metric?.unit)} /></div>
          </>}
          {tab === "task" && <>
            <div className="field"><label htmlFor="f-goal">{t.linkGoal}</label><select id="f-goal" name="goal" defaultValue={et?.goal ?? ""}>{goalOpts}</select></div>
            {areaSel}
            <div className="field"><label htmlFor="f-due">{t.dueDate}</label><input id="f-due" name="due" type="date" defaultValue={et ? et.due ?? "" : key(today())} /></div>
          </>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {et && <button type="button" className="btn ghost" style={{ color: "var(--danger)", marginInlineEnd: "auto" }}
            onClick={() => { if (!armed) return setArmed(true); removeTask(et.id); close(); }} onBlur={() => setArmed(false)}>
            <Icon name="trash" />{armed ? t.confirmDelete : t.deleteTask}</button>}
          <button type="button" className="btn ghost" onClick={close}>{t.cancel}</button>
          <button type="submit" className="btn primary">{t.save}</button>
        </div>
      </form>
    </div>
  );
}
