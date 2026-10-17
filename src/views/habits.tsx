"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { AreaIcon, Bar, FlameCount, HabitButton } from "@/components/bits";
import { Icon } from "@/components/icon";
import { addDays, DAY, fmt, key, num, weekStart } from "@/lib/dates";
import { progress } from "@/lib/goals";
import { bestStreak, isDone, isDue, rate, streak, target, totalDone, value } from "@/lib/habits";
import { cvar, pct, today, useT } from "@/lib/use-t";
import type { Habit } from "@/lib/types";
import { useMinka, useUI } from "@/store/minka";

export function HabitListItem({ habit: h, selected }: { habit: Habit; selected?: boolean }) {
  const { t, L } = useT();
  const logs = useMinka((s) => s.logs);
  const select = useUI((s) => s.selectHabit);
  const router = useRouter();
  const path = usePathname();
  const d = today();
  return (
    <button className="h-item" style={cvar(h.area)} aria-current={selected ? "true" : undefined}
      onClick={() => {
        select(h.id);
        if (!path.startsWith("/habits")) router.push("/habits");
        else if (matchMedia("(max-width:900px)").matches) document.getElementById("habit-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}>
      <AreaIcon area={h.area} icon={h.icon} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="habit-name">{L(h.name)}</div>
        <div className="habit-meta"><span>{t.slots[h.slot]}</span><FlameCount n={streak(logs, h, d)} /></div>
      </div>
      <div className="week-dots" title={t.last7}>
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(d, i - 6);
          return <i key={i} className={!isDue(h, day) ? "off" : isDone(logs, h, day) ? "on" : ""} />;
        })}
      </div>
    </button>
  );
}

function Heatmap({ habit: h }: { habit: Habit }) {
  const { t, lang } = useT();
  const logs = useMinka((s) => s.logs);
  const d = today(), start = addDays(weekStart(d), -52 * 7), end = addDays(weekStart(d), 6);
  const cells: React.ReactNode[] = [], months: React.ReactNode[] = [];
  for (let x = new Date(start); x <= end; x = addDays(x, 1)) {
    const idx = Math.round((x.getTime() - start.getTime()) / DAY);
    if (idx % 7 === 0) months.push(<span key={idx}>{x.getDate() <= 7 ? fmt(lang, x, { month: "short" }) : ""}</span>);
    if (x > d) { cells.push(<i key={idx} className="na" />); continue; }
    const v = value(logs, h, x), T0 = target(h);
    let c = !isDue(h, x) ? "na" : v >= T0 ? "l3" : v > 0 ? (v / T0 >= 0.5 ? "l2" : "l1") : "";
    if (+x === +d) c += " today";
    cells.push(<i key={idx} className={c} title={key(x)} />);
  }
  return (
    <>
      <div className="heat"><div className="heat-inner"><div className="heat-months">{months}</div><div className="heat-grid">{cells}</div></div></div>
      <div className="heat-legend"><span>{t.less}</span>
        <i style={{ background: "var(--surface-2)" }} /><i style={{ background: "color-mix(in srgb,var(--c) 30%,var(--surface-2))" }} />
        <i style={{ background: "color-mix(in srgb,var(--c) 62%,var(--surface-2))" }} /><i style={{ background: "var(--c)" }} /><span>{t.more}</span></div>
    </>
  );
}

function HabitDetail({ habit: h }: { habit: Habit }) {
  const { t, L, lang } = useT();
  const { logs, areas, goals, tasks, removeHabit } = useMinka();
  const [armed, setArmed] = useState(false);
  const edit = useUI((s) => s.openQuickAdd);
  const d = today();
  const g = goals.find((x) => x.id === h.goal);
  const freq = h.freq?.kind === "days" ? h.freq.days.map((x) => t.weekdaysShort[x]).join(lang === "ar" ? "، " : ", ") : t.daily;
  const stats: [string, string][] = [
    [t.cur, num(lang, streak(logs, h, d))], [t.best, num(lang, bestStreak(logs, h, d))],
    [t.rate30, `${pct(rate(logs, h, d, 30))}%`], [t.total, num(lang, totalDone(logs, h))],
  ];
  return (
    <section className="panel" id="habit-detail" style={cvar(h.area)}>
      <div className="detail-head">
        <AreaIcon area={h.area} icon={h.icon} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{L(h.name)}</h2>
          <div className="habit-meta"><span>{L(areas.find((a) => a.id === h.area)?.name)}</span><span>{t.slots[h.slot]}</span><span>{freq}</span><span>{h.quit ? t.quitH : t.buildH}</span></div>
        </div>
        <HabitButton habit={h} />
      </div>
      <div className="stats4">{stats.map(([l, v]) => <div className="stat-box" key={l}><div className="stat-label">{l}</div><div className="stat-value num">{v}</div></div>)}</div>
      <div className="panel-head" style={{ marginTop: 20 }}><h2>{t.year}</h2></div>
      <Heatmap habit={h} />
      {g && (
        <div className="insight" style={{ marginTop: 16, ...cvar(g.area) }}>
          <Icon name="flag" />
          <div style={{ flex: 1 }}>
            <div className="small muted">{t.serves}</div>
            <div style={{ fontWeight: 600 }}>{L(g.title)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}><Bar value={progress(g, goals, tasks)} /><b className="small num">{pct(progress(g, goals, tasks))}%</b></div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn ghost small" onClick={() => edit("habit", h.id)}><Icon name="pencil" />{t.edit}</button>
        <button className="btn ghost small" style={{ color: "var(--danger)" }} onClick={() => (armed ? removeHabit(h.id) : setArmed(true))} onBlur={() => setArmed(false)}>
          <Icon name="trash" />{armed ? t.confirmDelete : t.archive}
        </button>
      </div>
    </section>
  );
}

export function HabitsView() {
  const { t } = useT();
  const habits = useMinka((s) => s.habits);
  const sel = useUI((s) => s.habitSel);
  const openQA = useUI((s) => s.openQuickAdd);
  const h = habits.find((x) => x.id === sel) ?? habits[0];
  return (
    <>
      <header className="page-head">
        <div><h1 className="page-title">{t.nav.habits}</h1><p className="page-sub">{t.habitsSub}</p></div>
        <button className="btn primary" onClick={() => openQA("habit")}><Icon name="plus" />{t.habit}</button>
      </header>
      {h ? (
        <div className="habits-layout">
          <section className="panel"><div className="h-list">{habits.map((x) => <HabitListItem key={x.id} habit={x} selected={x.id === h.id} />)}</div></section>
          <HabitDetail habit={h} />
        </div>
      ) : <p className="empty">{t.noHabitsList}</p>}
    </>
  );
}
