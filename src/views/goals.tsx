"use client";
import { useState } from "react";
import { TaskRow } from "@/components/bits";
import { Icon } from "@/components/icon";
import { fmt, num, parse } from "@/lib/dates";
import { progress } from "@/lib/goals";
import { cvar, pct, today, useT } from "@/lib/use-t";
import type { Goal } from "@/lib/types";
import { useMinka, useUI } from "@/store/minka";

// ---------- GoalNode (tree view - unchanged) ----------
export function GoalNode({ goal: g, depth, defaultOpen = false }: { goal: Goal; depth: number; defaultOpen?: boolean }) {
  const { t, L, lang } = useT();
  const { goals, tasks, areas, updateMetric, removeGoal } = useMinka();
  const [open, setOpen] = useState(defaultOpen);
  const [armed, setArmed] = useState(false);
  const edit = useUI((s) => s.openQuickAdd);
  const ks = goals.filter((x) => x.parent === g.id), ts = tasks.filter((x) => x.goal === g.id);
  const p = progress(g, goals, tasks);
  const area = areas.find((a) => a.id === g.area);
  return (
    <div className={`goal${depth === 0 ? " top" : ""}`} style={cvar(g.area)}>
      <div className="goal-row">
        <button className="chev" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={L(g.title)}><Icon name="chevron-right" /></button>
        <span className="dot" />
        <div className="goal-main">
          <div className="goal-title">{L(g.title)}</div>
          <div className="goal-meta">
            <span className="tag">{L(area?.name)}</span>
            <span>{t.horizon[g.horizon]}</span>
            <span className="num">{t.due} {fmt(lang, parse(g.due), { month: "short", year: "numeric" })}</span>
            {g.metric ? <span className="num">{num(lang, g.metric.cur)} / {num(lang, g.metric.target)} {L(g.metric.unit)}</span>
              : (ks.length > 0 || ts.length > 0) && (
                <span className="num">
                  {ks.length > 0 && `${num(lang, ks.length)} ${t.subgoals}`}{ks.length > 0 && ts.length > 0 && " · "}
                  {ts.length > 0 && `${num(lang, ts.filter((x) => x.done).length)}/${num(lang, ts.length)} ${t.tasks}`}
                </span>)}
          </div>
        </div>
        <div className="goal-prog"><div className="bar"><span style={{ width: `${pct(p)}%` }} /></div><b>{pct(p)}%</b></div>
      </div>
      {open && <>
        {g.why && L(g.why) && <p className="goal-why"><Icon name="quote" /><span>{L(g.why)}</span></p>}
        <div className="goal-actions">
          {g.metric && (
            <span className="metric-edit small">
              <label htmlFor={`m-${g.id}`}>{t.updateMetric}</label>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => updateMetric(g.id, g.metric!.cur - 1)} aria-label="-1"><Icon name="minus" /></button>
              <input id={`m-${g.id}`} type="number" step="0.5" className="num" value={g.metric.cur} onChange={(e) => updateMetric(g.id, Number(e.target.value))} />
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => updateMetric(g.id, g.metric!.cur + 1)} aria-label="+1"><Icon name="plus" /></button>
            </span>
          )}
          <button className="btn ghost small" onClick={() => edit("goal", g.id)}><Icon name="pencil" />{t.edit}</button>
          <button className="btn ghost small" style={{ color: "var(--danger)" }} onClick={() => (armed ? removeGoal(g.id) : setArmed(true))} onBlur={() => setArmed(false)}>
            <Icon name="trash" />{armed ? t.confirmDelete : t.deleteGoal}
          </button>
        </div>
        {(ks.length > 0 || ts.length > 0) && (
          <div className="goal-kids">
            {ks.map((k) => <GoalNode key={k.id} goal={k} depth={depth + 1} />)}
            {ts.map((x) => <TaskRow key={x.id} task={x} />)}
          </div>
        )}
      </>}
    </div>
  );
}

// ---------- Gantt ----------
function Gantt({ goals }: { goals: Goal[] }) {
  const { L, lang } = useT();
  const all = useMinka((s) => s.goals), tasks = useMinka((s) => s.tasks);
  const d = today(), y = d.getFullYear(), y0 = new Date(y, 0, 1).getTime(), span = new Date(y + 1, 0, 1).getTime() - y0;
  const pos = (x: Date) => Math.max(0, Math.min(1, (x.getTime() - y0) / span)) * 100;
  return (
    <section className="panel gantt">
      <div className="gantt-inner">
        <div className="g-head"><div className="g-label muted num">{num(lang, y)}</div>
          <div className="g-months">{Array.from({ length: 12 }, (_, i) => <span key={i}>{fmt(lang, new Date(y, i, 1), { month: "short" })}</span>)}</div></div>
        {goals.map((g) => {
          const a = pos(parse(g.start)), b = pos(parse(g.due)), p = progress(g, all, tasks);
          return (
            <div className="g-row" key={g.id} style={cvar(g.area)}>
              <div className="g-label"><span className="dot" /><span>{L(g.title)}</span></div>
              <div className="g-track">
                <div className="g-bar" style={{ insetInlineStart: `${a}%`, width: `${Math.max(2, b - a)}%` }}><span style={{ width: `${pct(p)}%` }} /><b>{pct(p)}%</b></div>
                <div className="g-today" style={{ insetInlineStart: `${pos(d)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- List view ----------
function GoalCard({ goal: g }: { goal: Goal }) {
  const { t, L, lang } = useT();
  const { goals, tasks, areas, updateMetric, removeGoal } = useMinka();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const edit = useUI((s) => s.openQuickAdd);
  const p = progress(g, goals, tasks);
  const area = areas.find((a) => a.id === g.area);
  const children = goals.filter((x) => x.parent === g.id);
  const ts = tasks.filter((x) => x.goal === g.id);

  return (
    <div className="goal-card" style={cvar(g.area)}>
      <button className="goal-card-hd" onClick={() => setOpen(!open)}>
        <span className={`chev-icon${open ? " open" : ""}`}><Icon name="chevron-right" /></span>
        <span className="dot" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="goal-title">{L(g.title)}</div>
          <div className="goal-meta">
            <span className="tag">{L(area?.name)}</span>
            <span>{t.horizon[g.horizon]}</span>
            <span className="num">{t.due} {fmt(lang, parse(g.due), { month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <div className="goal-prog-sm"><div className="bar"><span style={{ width: `${pct(p)}%` }} /></div><b className="num">{pct(p)}%</b></div>
      </button>
      {open && (
        <div className="goal-card-body">
          {g.why && L(g.why) && <p className="goal-why"><Icon name="quote" /><span>{L(g.why)}</span></p>}
          {g.metric && (
            <div className="metric-edit small" style={{ marginBottom: 8 }}>
              <label htmlFor={`mc-${g.id}`}>{t.updateMetric}: {num(lang, g.metric.cur)} / {num(lang, g.metric.target)} {L(g.metric.unit)}</label>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => updateMetric(g.id, g.metric!.cur - 1)} aria-label="-1"><Icon name="minus" /></button>
                <input id={`mc-${g.id}`} type="number" step="0.5" className="num" style={{ width: 60, textAlign: "center" }} value={g.metric.cur} onChange={(e) => updateMetric(g.id, Number(e.target.value))} />
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => updateMetric(g.id, g.metric!.cur + 1)} aria-label="+1"><Icon name="plus" /></button>
              </div>
            </div>
          )}
          {(children.length > 0 || ts.length > 0) && (
            <div style={{ marginBottom: 8 }}>
              {children.map((c) => <GoalCard key={c.id} goal={c} />)}
              {ts.map((x) => <TaskRow key={x.id} task={x} />)}
            </div>
          )}
          <div className="goal-actions" style={{ margin: 0, paddingTop: 8 }}>
            <button className="btn ghost small" onClick={() => edit("goal", g.id)}><Icon name="pencil" />{t.edit}</button>
            <button className="btn ghost small" style={{ color: "var(--danger)" }} onClick={() => (armed ? removeGoal(g.id) : setArmed(true))} onBlur={() => setArmed(false)}>
              <Icon name="trash" />{armed ? t.confirmDelete : t.deleteGoal}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalListView({ goals }: { goals: Goal[] }) {
  return (
    <div className="goals-list-view">
      {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
    </div>
  );
}

// ---------- Kanban (by horizon) ----------
function GoalKanban({ goals: filtered }: { goals: Goal[] }) {
  const { t, L, lang } = useT();
  const { goals: allGoals, tasks, updateGoal } = useMinka();
  const edit = useUI((s) => s.openQuickAdd);
  const horizons: Array<Goal["horizon"]> = ["year", "quarter", "month"];
  const labels = { year: t.colYear, quarter: t.colQuarter, month: t.colMonth };

  const handleDrop = (e: React.DragEvent, horizon: Goal["horizon"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) updateGoal(id, { horizon });
  };

  return (
    <div className="cal-kanban goals-kanban">
      {horizons.map((h) => {
        const col = filtered.filter((g) => g.horizon === h);
        return (
          <div key={h} className="kan-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, h)}>
            <div className="kan-col-hd"><span>{labels[h]}</span><span className="num muted">{num(lang, col.length)}</span></div>
            {col.map((g) => {
              const p = progress(g, allGoals, tasks);
              return (
                <div key={g.id} className="kan-card goal-kan-card" style={cvar(g.area)} draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", g.id)}>
                  <div className="kan-card-row">
                    <span className="dot" />
                    <span className="kan-title" style={{ flex: 1 }}>{L(g.title)}</span>
                    <button className="icon-btn small" onClick={() => edit("goal", g.id)} aria-label={t.edit}><Icon name="pencil" /></button>
                  </div>
                  <div className="goal-prog-sm" style={{ marginTop: 6 }}><div className="bar"><span style={{ width: `${pct(p)}%` }} /></div><b className="num">{pct(p)}%</b></div>
                  <div className="kan-meta">{fmt(lang, parse(g.due), { month: "short", year: "numeric" })}</div>
                </div>
              );
            })}
            {col.length === 0 && <p className="kan-empty muted">—</p>}
          </div>
        );
      })}
    </div>
  );
}

// ---------- GoalsView ----------
export function GoalsView() {
  const { t, L } = useT();
  const { goals, areas } = useMinka();
  const openQA = useUI((s) => s.openQuickAdd);
  const [view, setView] = useState<"tree" | "timeline" | "list" | "kanban">("tree");
  const [area, setArea] = useState("all");
  const gs = goals.filter((g) => !g.parent && (area === "all" || g.area === area));
  return (
    <>
      <header className="page-head">
        <div><h1 className="page-title">{t.nav.goals}</h1><p className="page-sub">{t.goalsSub}</p></div>
        <button className="btn primary" onClick={() => openQA("goal")}><Icon name="plus" />{t.goal}</button>
      </header>
      <div className="toolbar">
        <div className="chips">
          <button className="chip" aria-pressed={area === "all"} onClick={() => setArea("all")}>{t.all}</button>
          {areas.map((a) => (
            <button key={a.id} className="chip" style={cvar(a.id)} aria-pressed={area === a.id} onClick={() => setArea(a.id)}><span className="dot" />{L(a.name)}</button>
          ))}
        </div>
        <div className="seg" role="group">
          <button aria-pressed={view === "tree"} onClick={() => setView("tree")}>{t.tree}</button>
          <button aria-pressed={view === "timeline"} onClick={() => setView("timeline")}>{t.timeline}</button>
          <button aria-pressed={view === "list"} onClick={() => setView("list")}>{t.goalsList}</button>
          <button aria-pressed={view === "kanban"} onClick={() => setView("kanban")}>{t.goalsKanban}</button>
        </div>
      </div>
      {gs.length === 0 ? <p className="empty">{t.noGoalSoon}</p>
        : view === "tree" ? <div>{gs.map((g, i) => <GoalNode key={g.id} goal={g} depth={0} defaultOpen={i < 2} />)}</div>
        : view === "timeline" ? <Gantt goals={gs} />
        : view === "list" ? <GoalListView goals={gs} />
        : <GoalKanban goals={gs} />}
    </>
  );
}
