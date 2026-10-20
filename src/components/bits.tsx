"use client";
import { useState } from "react";
import { key, num, time } from "@/lib/dates";
import { taskArea } from "@/lib/goals";
import { isDone, isDue, streak, target, value } from "@/lib/habits";
import { cvar, pct, today, useT } from "@/lib/use-t";
import type { Habit, Task } from "@/lib/types";
import { useMinka, useUI } from "@/store/minka";
import { Icon } from "./icon";

export function Bar({ value: v }: { value: number }) {
  return <div className="bar"><span style={{ width: `${pct(v)}%` }} /></div>;
}

export function Ring({ value: v, size = 86, label }: { value: number; size?: number; label: string }) {
  const r = size / 2 - 5, C = 2 * Math.PI * r;
  return (
    <div className="prog-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} />
        <circle className="val" cx={size / 2} cy={size / 2} r={r} strokeDasharray={C} strokeDashoffset={C * (1 - v)} />
      </svg>
      <b className="num">{label}</b>
    </div>
  );
}

export function AreaIcon({ area, icon, size = 38 }: { area: string; icon: string; size?: number }) {
  return (
    <span className="area-ico" style={{ ...cvar(area), width: size, height: size, borderRadius: size > 40 ? 14 : 10 }}>
      <Icon name={icon} />
    </span>
  );
}

export function HabitButton({ habit: h }: { habit: Habit }) {
  const { t, L, lang } = useT();
  const logs = useMinka((s) => s.logs);
  const habits = useMinka((s) => s.habits);
  const hit = useMinka((s) => s.hitHabit);
  const toast = useUI((s) => s.showToast);
  const [pop, setPop] = useState(0);
  const d = today(), v = value(logs, h, d), T0 = target(h), done = v >= T0, p = Math.min(1, v / T0), C = 2 * Math.PI * 19;
  const onClick = () => {
    const due = habits.filter((x) => isDue(x, d));
    const before = due.every((x) => isDone(logs, x, d));
    hit(h.id);
    const after = useMinka.getState().logs;
    if (isDone(after, h, d)) setPop((n) => n + 1);
    if (!before && due.every((x) => isDone(after, x, d))) toast(t.allDone);
  };
  return (
    <button key={pop} className={`hbtn${done ? " done" : ""}${pop ? " pop" : ""}`} style={cvar(h.area)} onClick={onClick} aria-label={L(h.name)} aria-pressed={done}>
      <svg className="prog" viewBox="0 0 44 44">
        <circle className="t" cx="22" cy="22" r="19" />
        <circle className="v" cx="22" cy="22" r="19" strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
      </svg>
      {done ? <Icon name="check" /> : h.type === "check" ? null : <span className="lbl">{h.type === "duration" ? num(lang, v) : `${num(lang, v)}/${num(lang, T0)}`}</span>}
    </button>
  );
}

export function FlameCount({ n }: { n: number }) {
  const { lang } = useT();
  if (!n) return null;
  return <span className="flame"><Icon name="flame" /><span className="num">{num(lang, n)}</span></span>;
}

export function HabitRow({ habit: h }: { habit: Habit }) {
  const { t, L, lang } = useT();
  const logs = useMinka((s) => s.logs);
  const areas = useMinka((s) => s.areas);
  const area = areas.find((a) => a.id === h.area);
  const d = today();
  return (
    <div className={`habit${isDone(logs, h, d) ? " is-done" : ""}`} style={cvar(h.area)}>
      <AreaIcon area={h.area} icon={h.icon} size={34} />
      <div className="habit-main">
        <div className="habit-name">{L(h.name)}</div>
        <div className="habit-meta">
          <span>{L(area?.name)}</span>
          {h.type !== "check" && <span className="num">{t.target}: {num(lang, target(h))} {L(h.unit)}</span>}
          <FlameCount n={streak(logs, h, d)} />
        </div>
      </div>
      <HabitButton habit={h} />
    </div>
  );
}

export function TaskRow({ task: x }: { task: Task }) {
  const { t, L, lang } = useT();
  const goals = useMinka((s) => s.goals);
  const areas = useMinka((s) => s.areas);
  const blocks = useMinka((s) => s.blocks);
  const toggle = useMinka((s) => s.toggleTask);
  const edit = useUI((s) => s.openQuickAdd);
  const g = goals.find((y) => y.id === x.goal);
  const a = taskArea(x, goals);
  const sch = blocks.find((b) => b.task === x.id);
  return (
    <div className={`task${x.done ? " on" : ""}`} style={cvar(a)}>
      <button className={`cbox${x.done ? " on" : ""}`} onClick={() => toggle(x.id)} aria-pressed={x.done} aria-label={L(x.title)}>
        {x.done && <Icon name="check" />}
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="task-title">{L(x.title)}</div>
        <div className="task-meta">
          <span className="dot" />
          {g ? L(g.title) : L(areas.find((y) => y.id === a)?.name)}
          {sch && <> · <span className="num">{sch.date === key(today()) ? "" : sch.date + " "}{time(lang, sch.s)}</span></>}
        </div>
      </div>
      <button className="icon-btn task-edit" onClick={() => edit("task", x.id)} aria-label={t.edit}><Icon name="pencil" /></button>
    </div>
  );
}
