"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { blocksOn } from "@/lib/blocks";
import { addDays, daysBetween, fmt, hijri, hijriDay, key, nowHour, num, parse, time, weekStart } from "@/lib/dates";
import { taskArea } from "@/lib/goals";
import { isDue } from "@/lib/habits";
import { cvar, today, useT } from "@/lib/use-t";
import { useMinka, useUI } from "@/store/minka";

const H0 = 5, H1 = 24, HP = 48;
type View = "day" | "week" | "month";

export function CalendarView() {
  const { t, L, lang } = useT();
  const { tasks, goals, blocks, habits, schedule, unschedule } = useMinka();
  const toast = useUI((s) => s.showToast);
  const [view, setView] = useState<View>("week");
  const [offset, setOffset] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const d0 = today();

  useEffect(() => { if (scroller.current) scroller.current.scrollTop = (7 - H0) * HP; }, [view]);

  const hourAt = (e: React.MouseEvent | React.DragEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.min(H1 - 1, H0 + Math.round(((e.clientY - r.top) / HP) * 2) / 2);
  };
  const place = (id: string, date: string, hour: number) => {
    schedule(id, date, hour);
    setPick(null);
    toast(`${t.scheduled} · ${time(lang, hour)}`);
  };

  let days: Date[] | null = null, label = "", hlabel = "";
  if (view === "week") {
    const ws = addDays(weekStart(d0), offset * 7);
    days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    label = `${fmt(lang, days[0], { day: "numeric", month: "short" })} – ${fmt(lang, days[6], { day: "numeric", month: "short", year: "numeric" })}`;
    hlabel = `${hijri(lang, days[0], { day: "numeric", month: "long" })} – ${hijri(lang, days[6], { day: "numeric", month: "long", year: "numeric" })}`;
  } else if (view === "day") {
    const d = addDays(d0, offset);
    days = [d];
    label = fmt(lang, d, { weekday: "long", day: "numeric", month: "long" });
    hlabel = hijri(lang, d, { day: "numeric", month: "long", year: "numeric" });
  } else {
    const m = new Date(d0.getFullYear(), d0.getMonth() + offset, 1);
    label = fmt(lang, m, { month: "long", year: "numeric" });
    hlabel = `${hijri(lang, m, { month: "long" })} – ${hijri(lang, new Date(m.getFullYear(), m.getMonth() + 1, 0), { month: "long", year: "numeric" })}`;
  }

  const unsched = tasks.filter((x) => !x.done && !blocks.some((b) => b.task === x.id));
  const pickT = tasks.find((x) => x.id === pick);
  const nh = nowHour();

  const timeGrid = (ds: Date[]) => (
    <div className="cal-scroll" ref={scroller}>
      <div className={`cal-grid${ds.length === 1 ? " single" : ""}`} style={{ "--days": ds.length } as React.CSSProperties}>
        <div className="cal-hd corner" />
        {ds.map((d) => (
          <div key={key(d)} className={`cal-hd${+d === +d0 ? " is-today" : ""}`}>
            <div className="dn">{fmt(lang, d, { weekday: ds.length === 1 ? "long" : "short" })}</div>
            <div className="dd num"><span>{fmt(lang, d, { day: "numeric" })}</span></div>
            <div className="hd num">{hijriDay(d)} {hijri(lang, d, { month: "short" })}</div>
            <span className="hb num">{t.habitsDue(num(lang, habits.filter((h) => isDue(h, d)).length))}</span>
          </div>
        ))}
        <div className="hours">{Array.from({ length: H1 - H0 }, (_, i) => <div key={i} className="hour-l">{i === 0 ? "" : time(lang, H0 + i)}</div>)}</div>
        {ds.map((d) => {
          const k = key(d), isT = +d === +d0;
          return (
            <div key={k} className={`day-col${isT ? " is-today" : ""}${pick ? " picking" : ""}${over === k ? " drop" : ""}`} style={{ height: (H1 - H0) * HP }}
              onClick={(e) => pick && !(e.target as HTMLElement).closest(".blk") && place(pick, k, hourAt(e))}
              onDragOver={(e) => { e.preventDefault(); setOver(k); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) place(id, k, hourAt(e)); }}>
              {blocksOn(blocks, d).filter((b) => b.s + b.d > H0).map((b) => {
                const top = (Math.max(b.s, H0) - H0) * HP, ht = Math.max(22, b.d * HP - 3);
                return (
                  <div key={b.id} className={`blk${b.task ? " task-blk" : ""}`} style={{ top, height: ht, ...cvar(b.area) }}
                    draggable={!!b.task} onDragStart={(e) => b.task && e.dataTransfer.setData("text/plain", b.task)}>
                    <b>{L(b.title)}</b>{ht > 34 && <span className="num">{time(lang, b.s)} – {time(lang, b.s + b.d)}</span>}
                    {b.task && <button className="x" onClick={() => unschedule(b.task!)} aria-label={t.unschedule}><Icon name="x" /></button>}
                  </div>
                );
              })}
              {isT && nh >= H0 && <div className="now-line" style={{ top: (nh - H0) * HP }} />}
            </div>
          );
        })}
      </div>
    </div>
  );

  const monthGrid = () => {
    const m = new Date(d0.getFullYear(), d0.getMonth() + offset, 1), start = weekStart(m);
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i === 35 && d.getMonth() !== m.getMonth()) break;
      const bl = blocksOn(blocks, d).filter((b) => !(b.dows && b.dows.length === 7));
      cells.push(
        <button key={i} className={`m-cell${d.getMonth() !== m.getMonth() ? " out" : ""}${+d === +d0 ? " is-today" : ""}`}
          onClick={() => { setView("day"); setOffset(daysBetween(d0, d)); }}>
          <div className="m-num"><b className="num">{fmt(lang, d, { day: "numeric" })}</b><small className="num">{hijriDay(d)}</small></div>
          {bl.slice(0, 2).map((b) => <span key={b.id} className="m-ev" style={cvar(b.area)}>{L(b.title)}</span>)}
          {bl.length > 2 && <span className="m-more num">{t.more2(num(lang, bl.length - 2))}</span>}
        </button>,
      );
    }
    return (
      <div className="month">
        {Array.from({ length: 7 }, (_, i) => <div key={i} className="m-hd">{fmt(lang, addDays(start, i), { weekday: "short" })}</div>)}
        {cells}
      </div>
    );
  };

  return (
    <>
      <header className="page-head"><div><h1 className="page-title">{t.nav.calendar}</h1><p className="page-sub">{t.calSub}</p></div></header>
      <div className="cal-bar">
        <button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous"><Icon name={lang === "ar" ? "chevron-right" : "chevron-left"} /></button>
        <button className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="Next"><Icon name={lang === "ar" ? "chevron-left" : "chevron-right"} /></button>
        <button className="btn" onClick={() => setOffset(0)}>{t.todayBtn}</button>
        <div className="range num">{label}<small>{hlabel}</small></div>
        <div className="seg" role="group">
          {(["day", "week", "month"] as const).map((v) => <button key={v} aria-pressed={view === v} onClick={() => { setView(v); setOffset(0); }}>{t[v]}</button>)}
        </div>
      </div>
      {pickT && (
        <div className="pick-banner"><Icon name="mouse-pointer-click" /><span style={{ flex: 1 }}>{t.pickFor} {L(pickT.title)}</span>
          <button className="btn ghost small" onClick={() => setPick(null)}>{t.cancel}</button></div>
      )}
      <div className="cal-layout">
        <section className="panel cal">{days ? timeGrid(days) : monthGrid()}</section>
        <aside className="panel">
          <div className="panel-head"><h2>{t.unsched}</h2><span className="muted small num">{num(lang, unsched.length)}</span></div>
          <p className="small muted" style={{ marginBottom: 12 }}>{t.dragHint}</p>
          <div className="unsched">
            {unsched.length ? unsched.map((x) => {
              const g = goals.find((y) => y.id === x.goal);
              return (
                <button key={x.id} className="u-task" draggable style={cvar(taskArea(x, goals))} aria-pressed={pick === x.id}
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", x.id); e.dataTransfer.effectAllowed = "move"; }}
                  onClick={() => { setPick(pick === x.id ? null : x.id); if (view === "month") setView("week"); }}>
                  <span className="grip"><Icon name="grip-vertical" /></span>
                  <div style={{ minWidth: 0 }}>
                    <div className="task-title">{L(x.title)}</div>
                    <div className="task-meta"><span className="dot" />{g ? L(g.title) : x.due ? fmt(lang, parse(x.due), { day: "numeric", month: "short" }) : ""}</div>
                  </div>
                </button>
              );
            }) : <p className="empty">{t.allSched}</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
