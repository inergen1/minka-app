"use client";
import Link from "next/link";
import { AreaIcon, Bar, HabitRow, Ring, TaskRow } from "@/components/bits";
import { Icon } from "@/components/icon";
import { blocksOn } from "@/lib/blocks";
import { addDays, daysBetween, fmt, hijri, key, nowHour, num, parse, time, weekStart } from "@/lib/dates";
import { progress } from "@/lib/goals";
import { isDone, isDue, streak } from "@/lib/habits";
import { cvar, pct, today, useT } from "@/lib/use-t";
import type { Slot } from "@/lib/types";
import { useMinka, useUI } from "@/store/minka";

const SLOTS: [Slot, string][] = [["fajr", "sunrise"], ["morning", "sun"], ["dhuhr", "sun-medium"], ["asr", "cloud-sun"], ["maghrib", "sunset"], ["night", "moon"], ["anytime", "clock"]];

export function TodayView() {
  const { t, L, lang } = useT();
  const { habits, logs, tasks, goals, blocks, areas, reviews } = useMinka();
  const openQA = useUI((s) => s.openQuickAdd);
  const d = today(), k = key(d);
  const due = habits.filter((h) => isDue(h, d));
  const doneN = due.filter((h) => isDone(logs, h, d)).length;
  const p = due.length ? doneN / due.length : 0;
  const top = habits.map((h) => [h, streak(logs, h, d)] as const).sort((a, b) => b[1] - a[1])[0];
  const tToday = tasks.filter((x) => x.due === k || blocks.some((b) => b.task === x.id && b.date === k));
  const ws = weekStart(d);
  let wd = 0, wt = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(ws, i);
    if (day > d) break;
    habits.forEach((h) => { if (isDue(h, day)) { wt++; if (isDone(logs, h, day)) wd++; } });
  }
  const bl = blocksOn(blocks, d), nh = nowHour();
  const nextG = goals.filter((g) => !g.parent && progress(g, goals, tasks) < 1).sort((a, b) => a.due.localeCompare(b.due))[0];
  const nextArea = nextG && areas.find((a) => a.id === nextG.area);
  const priorities = reviews[0]?.top.map((id) => tasks.find((x) => x.id === id)).filter((x) => x && !x.done) ?? [];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{fmt(lang, d, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="page-title">{new Date().getHours() < 12 ? t.morning : t.evening}</h1>
          <p className="hijri"><Icon name="moon-star" />{hijri(lang, d, { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <button className="btn primary" onClick={() => openQA("habit")}><Icon name="plus" />{t.add}</button>
      </header>

      <section className="summary">
        <div className="panel sum-ring">
          <Ring value={p} label={`${pct(p)}%`} />
          <div><div className="stat-label">{t.habitsToday}</div><div className="stat-value num">{t.doneOf(num(lang, doneN), num(lang, due.length))}</div></div>
        </div>
        <div className="panel stat"><span className="stat-label">{t.topStreak}</span>
          <span className="stat-value"><span className="num">{num(lang, top?.[1] ?? 0)}</span> <small>{top && top[1] ? L(top[0].name) : ""}</small></span></div>
        <div className="panel stat"><span className="stat-label">{t.tasksToday}</span>
          <span className="stat-value num">{num(lang, tToday.filter((x) => x.done).length)}<small> / {num(lang, tToday.length)}</small></span></div>
        <div className="panel stat"><span className="stat-label">{t.weekRate}</span><span className="stat-value num">{pct(wt ? wd / wt : 0)}%</span></div>
      </section>

      <div className="today-grid">
        <section className="panel">
          <div className="panel-head"><h2>{t.habitsToday}</h2><span className="muted small num">{t.doneOf(num(lang, doneN), num(lang, due.length))}</span></div>
          {due.length === 0 && <p className="empty">{t.noHabits}</p>}
          {SLOTS.map(([sl, icon]) => {
            const hs = due.filter((h) => h.slot === sl);
            if (!hs.length) return null;
            return (
              <div className="slot" key={sl}>
                <div className="slot-title"><Icon name={icon} />{t.slots[sl]}</div>
                {hs.map((h) => <HabitRow key={h.id} habit={h} />)}
              </div>
            );
          })}
        </section>

        <div className="today-side">
          {priorities.length > 0 && (
            <section className="panel"><div className="panel-head"><h2>{t.priorities}</h2></div>
              {priorities.map((x) => <TaskRow key={x!.id} task={x!} />)}</section>
          )}
          <section className="panel">
            <div className="panel-head"><h2>{t.tasksToday}</h2></div>
            {tToday.length ? tToday.map((x) => <TaskRow key={x.id} task={x} />) : <p className="empty">{t.noTasks}</p>}
          </section>
          <section className="panel">
            <div className="panel-head"><h2>{t.schedToday}</h2>
              <Link className="btn ghost small" href="/calendar" aria-label={t.nav.calendar}><Icon name={lang === "ar" ? "arrow-left" : "arrow-right"} /></Link></div>
            {bl.length ? (
              <div className="mini-tl">
                {bl.map((b) => (
                  <div className="tl-item" key={b.id}>
                    <span className="tl-time">{time(lang, b.s)}</span>
                    <div className={`tl-card${nh >= b.s && nh < b.s + b.d ? " now" : ""}`} style={cvar(b.area)}>
                      {L(b.title)}<span className="num">{time(lang, b.s)} – {time(lang, b.s + b.d)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="empty">{t.noBlocks}</p>}
          </section>
          <section className="panel focus-goal" style={nextG ? cvar(nextG.area) : undefined}>
            <div className="panel-head"><h2>{t.nextGoal}</h2>
              {nextArea && <span className="chip" style={cvar(nextArea.id)} aria-pressed="true">{L(nextArea.name)}</span>}</div>
            {nextG ? <>
              <div className="goal-title">{L(nextG.title)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <Bar value={progress(nextG, goals, tasks)} /><b className="num small">{pct(progress(nextG, goals, tasks))}%</b></div>
              <p className="muted small" style={{ marginTop: 6 }}>
                {t.due} {fmt(lang, parse(nextG.due), { day: "numeric", month: "long", year: "numeric" })} · {t.days(Math.max(0, daysBetween(d, parse(nextG.due))))} {t.left}</p>
              {nextG.why && L(nextG.why) && <p className="why"><Icon name="quote" /><span>{L(nextG.why)}</span></p>}
            </> : <div className="insight"><AreaIcon area="faith" icon="flag" /><p className="small">{t.noGoalSoon}</p></div>}
          </section>
        </div>
      </div>
    </>
  );
}
