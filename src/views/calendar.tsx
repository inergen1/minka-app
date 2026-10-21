"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { blocksOn } from "@/lib/blocks";
import { addDays, daysBetween, fmt, hijri, hijriDay, key, nowHour, num, parse, time, weekStart } from "@/lib/dates";
import { taskArea } from "@/lib/goals";
import { isDue } from "@/lib/habits";
import { scheduleBlockReminder } from "@/lib/notify";
import { cvar, today, useT } from "@/lib/use-t";
import { useMinka, useUI } from "@/store/minka";
import type { Block, Task } from "@/lib/types";

const H0 = 5, H1 = 24, HP = 48;
type CalView = "day" | "week" | "month" | "list" | "kanban";
type Filter = "all" | "habits" | "goals" | "tasks";

// ---------- New Event Popover (click empty slot) ----------
function NewEventPopover({ date, hour, x, y, onClose }: { date: string; hour: number; x: number; y: number; onClose: () => void }) {
  const { t, lang } = useT();
  const { addTask, schedule } = useMinka();
  const toast = useUI((s) => s.showToast);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onClose]);

  const submit = () => {
    const v = title.trim();
    if (!v) { onClose(); return; }
    const id = addTask({ title: { ar: v, en: v }, done: false });
    schedule(id, date, hour);
    toast(`${t.scheduled} · ${time(lang, hour)}`);
    onClose();
  };

  const top = Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 600) - 140);
  const left = Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 800) - 260);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="new-event-pop" style={{ top, left }} onClick={(e) => e.stopPropagation()}>
        <div className="new-event-time num">{time(lang, hour)}</div>
        <input ref={inputRef} className="new-event-input" value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
          placeholder={t.phTask} />
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button className="btn primary small" style={{ flex: 1 }} onClick={submit}><Icon name="plus" />{t.add}</button>
          <button className="btn ghost small" onClick={onClose}><Icon name="x" /></button>
        </div>
      </div>
    </div>
  );
}

// ---------- Event detail modal ----------
function EventModal({ block, onClose }: { block: Block; onClose: () => void }) {
  const { t, L, lang } = useT();
  const { tasks, goals, toggleTask, removeBlock, unschedule, moveBlock } = useMinka();
  const openQA = useUI((s) => s.openQuickAdd);
  const task = block.task ? tasks.find((x) => x.id === block.task) : null;
  const [armed, setArmed] = useState(false);

  const handleDone = () => {
    if (task) toggleTask(task.id);
  };

  const handleDelete = () => {
    if (armed) {
      if (block.task) unschedule(block.task);
      else removeBlock(block.id);
      onClose();
    } else setArmed(true);
  };

  const isDone = task?.done ?? false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box event-modal" style={cvar(block.area)} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="dot" />
          <h3 style={{ flex: 1 }}>{L(block.title)}</h3>
          <button className="icon-btn" onClick={onClose} aria-label={t.cancel}><Icon name="x" /></button>
        </div>
        <div className="event-meta num">
          <Icon name="clock" />
          <span>{time(lang, block.s)} – {time(lang, block.s + block.d)}</span>
          {block.date && <span className="muted">· {fmt(lang, parse(block.date), { weekday: "short", day: "numeric", month: "short" })}</span>}
        </div>
        {task && (
          <button className={`event-done-btn${isDone ? " done" : ""}`} onClick={handleDone}>
            <span className="chk-box">{isDone && <Icon name="check" />}</span>
            <span>{isDone ? t.markUndone : t.markDone}</span>
          </button>
        )}
        <div className="event-actions">
          {task && (
            <button className="btn ghost small" onClick={() => { openQA("task", task.id); onClose(); }}>
              <Icon name="pencil" />{t.edit}
            </button>
          )}
          <button className="btn ghost small" style={{ color: "var(--danger)" }} onClick={handleDelete} onBlur={() => setArmed(false)}>
            <Icon name="trash" />{armed ? t.confirmDelete : t.unschedule}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- List view ----------
function ListView({ filter, offset, areaFilter }: { filter: Filter; offset: number; areaFilter: string }) {
  const { t, L, lang } = useT();
  const { tasks, goals, habits, blocks, toggleTask } = useMinka();
  const d0 = today();

  // Show 14 days from offset
  const days = Array.from({ length: 14 }, (_, i) => addDays(d0, i + offset * 7));

  return (
    <div className="cal-list">
      {days.map((d) => {
        const k = key(d);
        const isT = +d === +d0;
        let dayBlocks = filter === "habits" ? [] : blocksOn(blocks, d);
        if (filter === "tasks") dayBlocks = dayBlocks.filter((b) => !!b.task);
        if (areaFilter !== "all") dayBlocks = dayBlocks.filter((b) => b.area === areaFilter);
        const dueHabits = (filter !== "tasks" && filter !== "goals")
          ? habits.filter((h) => isDue(h, d) && (areaFilter === "all" || h.area === areaFilter))
          : [];
        const dueTodayTasks = (filter !== "habits" && filter !== "goals")
          ? tasks.filter((tx) => !tx.done && tx.due === k && !blocks.some((b) => b.task === tx.id) && (areaFilter === "all" || taskArea(tx, goals) === areaFilter))
          : [];

        if (dayBlocks.length === 0 && dueHabits.length === 0 && dueTodayTasks.length === 0) return null;
        return (
          <div key={k} className="cal-list-day">
            <div className={`list-day-hd${isT ? " is-today" : ""}`}>
              <b>{fmt(lang, d, { weekday: "long", day: "numeric", month: "long" })}</b>
              <small className="num">{hijriDay(d)} {hijri(lang, d, { month: "short" })}</small>
            </div>
            {dueHabits.length > 0 && (
              <div className="list-habits-row">
                {dueHabits.map((h) => (
                  <span key={h.id} className="list-habit-chip" style={cvar(h.area)}>
                    <span className="dot" />{L(h.name)}
                  </span>
                ))}
              </div>
            )}
            {dueTodayTasks.map((tx) => (
              <div key={tx.id} className="list-item list-item-due" style={cvar(taskArea(tx, goals))}>
                <div className="list-item-color" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-item-title">{L(tx.title)}</div>
                  <div className="list-item-meta num">{t.dueChip}</div>
                </div>
                <button className={`list-done-btn${tx.done ? " on" : ""}`} onClick={() => toggleTask(tx.id)} aria-label={tx.done ? t.markUndone : t.markDone}>
                  {tx.done ? <Icon name="check-circle" /> : <Icon name="circle" />}
                </button>
              </div>
            ))}
            {dayBlocks.map((b) => {
              const task = b.task ? tasks.find((x) => x.id === b.task) : null;
              return (
                <div key={b.id} className={`list-item${task?.done ? " done" : ""}`} style={cvar(b.area)}>
                  <div className="list-item-color" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="list-item-title">{L(b.title)}</div>
                    <div className="list-item-meta num">{time(lang, b.s)} – {time(lang, b.s + b.d)}</div>
                  </div>
                  {task && (
                    <button className={`list-done-btn${task.done ? " on" : ""}`} onClick={() => toggleTask(task.id)} aria-label={task.done ? t.markUndone : t.markDone}>
                      {task.done ? <Icon name="check-circle" /> : <Icon name="circle" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Kanban view ----------
function KanbanView({ filter, areaFilter }: { filter: Filter; areaFilter: string }) {
  const { t, L, lang } = useT();
  const { tasks, goals, habits, blocks, toggleTask, schedule, unschedule } = useMinka();
  const d0 = today(), k0 = key(d0);
  const toast = useUI((s) => s.showToast);
  const openQA = useUI((s) => s.openQuickAdd);

  const todayBlocks = blocksOn(blocks, d0);
  const scheduledTodayIds = new Set(todayBlocks.map((b) => b.task).filter(Boolean));

  const allTasks = filter === "habits" || filter === "goals" ? [] : tasks.filter((x) => areaFilter === "all" || taskArea(x, goals) === areaFilter);
  const backlog = allTasks.filter((x) => !x.done && !scheduledTodayIds.has(x.id));
  const todayTasks = allTasks.filter((x) => !x.done && scheduledTodayIds.has(x.id));
  const doneTasks = allTasks.filter((x) => x.done).slice(0, 10);
  const todayHabits = filter !== "tasks" && filter !== "goals"
    ? habits.filter((h) => isDue(h, d0) && (areaFilter === "all" || h.area === areaFilter))
    : [];

  const handleDrop = (e: React.DragEvent, col: "today" | "backlog") => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    if (col === "today") {
      schedule(id, k0, 9);
      toast(`${t.scheduled}`);
    } else {
      unschedule(id);
    }
  };

  const TaskCard = ({ task: x }: { task: Task }) => {
    const g = goals.find((y) => y.id === x.goal);
    return (
      <div className="kan-card" style={cvar(taskArea(x, goals))} draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", x.id)}>
        <div className="kan-card-row">
          <button className={`kan-check${x.done ? " on" : ""}`} onClick={() => toggleTask(x.id)} aria-label={x.done ? t.markUndone : t.markDone}>
            {x.done ? <Icon name="check-circle" /> : <Icon name="circle" />}
          </button>
          <span className="kan-title">{L(x.title)}</span>
          <button className="icon-btn small" onClick={() => openQA("task", x.id)} aria-label={t.edit}><Icon name="pencil" /></button>
        </div>
        {g && <div className="kan-meta"><span className="dot" />{L(g.title)}</div>}
      </div>
    );
  };

  return (
    <div className="cal-kanban">
      {/* Backlog */}
      <div className="kan-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, "backlog")}>
        <div className="kan-col-hd"><span>{t.backlogCol}</span><span className="num muted">{num(lang, backlog.length)}</span></div>
        {backlog.map((x) => <TaskCard key={x.id} task={x} />)}
        {backlog.length === 0 && <p className="kan-empty">{t.allSched}</p>}
      </div>
      {/* Today */}
      <div className="kan-col today" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, "today")}>
        <div className="kan-col-hd"><span>{t.todayCol}</span><span className="num muted">{num(lang, todayTasks.length + todayHabits.length)}</span></div>
        {todayHabits.map((h) => (
          <div key={h.id} className="kan-card habit-card" style={cvar(h.area)}>
            <span className="dot" /><span className="kan-title">{L(h.name)}</span>
          </div>
        ))}
        {todayTasks.map((x) => <TaskCard key={x.id} task={x} />)}
        {todayTasks.length === 0 && todayHabits.length === 0 && <p className="kan-empty muted">—</p>}
      </div>
      {/* Done */}
      <div className="kan-col done-col">
        <div className="kan-col-hd"><span>{t.doneCol}</span><span className="num muted">{num(lang, doneTasks.length)}</span></div>
        {doneTasks.map((x) => <TaskCard key={x.id} task={x} />)}
        {doneTasks.length === 0 && <p className="kan-empty muted">—</p>}
      </div>
    </div>
  );
}

// ---------- Main CalendarView ----------
export function CalendarView() {
  const { t, L, lang } = useT();
  const { tasks, goals, habits, blocks, areas, schedule, unschedule, moveBlock, toggleTask, addTask } = useMinka();
  const toast = useUI((s) => s.showToast);
  const openQA = useUI((s) => s.openQuickAdd);
  const [view, setView] = useState<CalView>("week");
  const [offset, setOffset] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [selBlock, setSelBlock] = useState<Block | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [clickSlot, setClickSlot] = useState<{ date: string; hour: number; x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const d0 = today();

  useEffect(() => {
    if (scroller.current && (view === "day" || view === "week")) {
      scroller.current.scrollTop = (7 - H0) * HP;
    }
  }, [view]);

  const hourAt = (e: React.MouseEvent | React.DragEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.min(H1 - 1, H0 + Math.round(((e.clientY - r.top) / HP) * 2) / 2);
  };

  const place = (id: string, date: string, hour: number) => {
    schedule(id, date, hour);
    setPick(null);
    toast(`${t.scheduled} · ${time(lang, hour)}`);
    const b = blocks.find((x) => x.task === id);
    if (b) scheduleBlockReminder(b.id, L(b.title), date, hour);
  };

  const placeBlock = (blockId: string, date: string, hour: number) => {
    moveBlock(blockId, date, hour);
    setDraggingBlock(null);
    toast(t.moveBlock);
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
  } else if (view === "month") {
    const m = new Date(d0.getFullYear(), d0.getMonth() + offset, 1);
    label = fmt(lang, m, { month: "long", year: "numeric" });
    hlabel = `${hijri(lang, m, { month: "long" })} – ${hijri(lang, new Date(m.getFullYear(), m.getMonth() + 1, 0), { month: "long", year: "numeric" })}`;
  } else {
    label = fmt(lang, d0, { month: "long", year: "numeric" });
    hlabel = hijri(lang, d0, { month: "long", year: "numeric" });
  }

  // Filter blocks for display
  const visibleBlocks = (d: Date) => {
    let bl = blocksOn(blocks, d);
    if (filter === "habits") bl = [];
    else if (filter === "tasks") bl = bl.filter((b) => !!b.task);
    else if (filter === "goals") bl = bl.filter((b) => {
      const task = b.task ? tasks.find((x) => x.id === b.task) : null;
      return task?.goal != null;
    });
    if (areaFilter !== "all") bl = bl.filter((b) => b.area === areaFilter);
    return bl;
  };

  // Tasks with due date on this day that have no scheduled block
  const dueTasks = (d: Date) => {
    if (filter === "habits" || filter === "goals") return [];
    const k = key(d);
    return tasks.filter((tx) =>
      !tx.done && tx.due === k && !blocks.some((b) => b.task === tx.id) &&
      (areaFilter === "all" || taskArea(tx, goals) === areaFilter)
    );
  };

  // Habits due on a day (for display in headers)
  const dayHabits = (d: Date) => {
    if (filter === "tasks" || filter === "goals") return [];
    return habits.filter((h) => isDue(h, d) && (areaFilter === "all" || h.area === areaFilter));
  };

  const unsched = tasks.filter((x) => !x.done && !blocks.some((b) => b.task === x.id));
  const pickT = tasks.find((x) => x.id === pick);
  const nh = nowHour();

  const timeGrid = (ds: Date[]) => (
    <div className="cal-scroll" ref={scroller}>
      <div className={`cal-grid${ds.length === 1 ? " single" : ""}`} style={{ "--days": ds.length } as React.CSSProperties}>
        <div className="cal-hd corner" />
        {ds.map((d) => {
          const k = key(d);
          const habs = dayHabits(d);
          const due = dueTasks(d);
          return (
            <div key={k} className={`cal-hd${+d === +d0 ? " is-today" : ""}`}>
              <div className="dn">{fmt(lang, d, { weekday: ds.length === 1 ? "long" : "short" })}</div>
              <div className="dd num"><span>{fmt(lang, d, { day: "numeric" })}</span></div>
              <div className="hd num">{hijriDay(d)} {hijri(lang, d, { month: "short" })}</div>
              {habs.length > 0 && (
                filter === "habits"
                  ? <div className="hd-chips">{habs.map((h) => <span key={h.id} className="hd-chip" style={{ background: `color-mix(in srgb,var(--c-${h.area}) 16%,transparent)`, color: `var(--c-${h.area})` }}>{L(h.name)}</span>)}</div>
                  : <span className="hb num">{t.habitsDue(num(lang, habs.length))}</span>
              )}
              {due.length > 0 && (
                <div className="hd-due-chips">{due.map((tx) => (
                  <button key={tx.id} className="hd-due-chip" style={{ background: `color-mix(in srgb,var(--c-${taskArea(tx, goals)}) 16%,transparent)`, color: `var(--c-${taskArea(tx, goals)})` }}
                    onClick={(e) => { e.stopPropagation(); openQA("task", tx.id); }}>
                    {L(tx.title)}
                  </button>
                ))}</div>
              )}
            </div>
          );
        })}
        <div className="hours">{Array.from({ length: H1 - H0 }, (_, i) => <div key={i} className="hour-l">{i === 0 ? "" : time(lang, H0 + i)}</div>)}</div>
        {ds.map((d) => {
          const k = key(d), isT = +d === +d0;
          const dayBlocks = visibleBlocks(d);
          return (
            <div key={k} className={`day-col${isT ? " is-today" : ""}${pick ? " picking" : ""}${over === k ? " drop" : ""}`}
              style={{ height: (H1 - H0) * HP }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest(".blk")) return;
                if (pick) { place(pick, k, hourAt(e)); return; }
                setClickSlot({ date: k, hour: hourAt(e), x: e.clientX, y: e.clientY });
              }}
              onDragOver={(e) => { e.preventDefault(); setOver(k); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
              onDrop={(e) => {
                e.preventDefault(); setOver(null);
                const data = e.dataTransfer.getData("text/plain");
                if (!data) return;
                const h = hourAt(e);
                if (data.startsWith("blk:")) {
                  placeBlock(data.slice(4), k, h);
                } else {
                  place(data, k, h);
                }
              }}>
              {dayBlocks.map((b) => {
                const top = (Math.max(b.s, H0) - H0) * HP, ht = Math.max(22, b.d * HP - 3);
                const task = b.task ? tasks.find((x) => x.id === b.task) : null;
                const isDone = task?.done ?? false;
                return (
                  <div key={b.id}
                    className={`blk${b.task ? " task-blk" : ""}${isDone ? " blk-done" : ""}`}
                    style={{ top, height: ht, ...cvar(b.area) }}
                    draggable
                    onDragStart={(e) => {
                      if (b.task) {
                        e.dataTransfer.setData("text/plain", b.task);
                      } else {
                        e.dataTransfer.setData("text/plain", "blk:" + b.id);
                      }
                      setDraggingBlock(b.id);
                    }}
                    onDragEnd={() => setDraggingBlock(null)}
                    onClick={(e) => { e.stopPropagation(); setSelBlock(b); }}>
                    {task && (
                      <button className="blk-done-btn" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                        aria-label={isDone ? t.markUndone : t.markDone}>
                        {isDone ? <Icon name="check-circle" /> : <Icon name="circle" />}
                      </button>
                    )}
                    <b>{L(b.title)}</b>
                    {ht > 34 && <span className="num">{time(lang, b.s)} – {time(lang, b.s + b.d)}</span>}
                    {b.task && <button className="x" onClick={(e) => { e.stopPropagation(); unschedule(b.task!); }} aria-label={t.unschedule}><Icon name="x" /></button>}
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
      const bl = visibleBlocks(d).filter((b) => !(b.dows && b.dows.length === 7));
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

      {/* Top bar: navigation + view switcher */}
      <div className="cal-bar">
        <button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous"><Icon name={lang === "ar" ? "chevron-right" : "chevron-left"} /></button>
        <button className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="Next"><Icon name={lang === "ar" ? "chevron-left" : "chevron-right"} /></button>
        <button className="btn" onClick={() => setOffset(0)}>{t.todayBtn}</button>
        <div className="range num">{label}<small>{hlabel}</small></div>
        <div className="seg" role="group">
          {(["day", "week", "month", "listView", "kanban"] as const).map((v) => {
            const label = v === "listView" ? t.listView : v === "kanban" ? t.kanban : t[v as "day" | "week" | "month"];
            const active = v === "listView" ? view === "list" : v === "kanban" ? view === "kanban" : view === v;
            return (
              <button key={v} aria-pressed={active} onClick={() => {
                if (v === "listView") { setView("list"); setOffset(0); }
                else if (v === "kanban") { setView("kanban"); setOffset(0); }
                else { setView(v as CalView); setOffset(0); }
              }}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* Filter bar: type chips + area dropdown + add button */}
      <div className="cal-filters">
        {(["all", "habits", "goals", "tasks"] as const).map((f) => {
          const labels = { all: t.filterAll, habits: t.filterHabits, goals: t.filterGoals, tasks: t.filterTasks };
          return (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {labels[f]}
            </button>
          );
        })}
        <select className="area-select" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} aria-label={t.area}>
          <option value="all">{t.allAreas}</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{L(a.name)}</option>)}
        </select>
        <button className="btn primary small cal-add-btn" onClick={() => openQA("task")}><Icon name="plus" />{t.add}</button>
      </div>

      {pickT && (
        <div className="pick-banner"><Icon name="mouse-pointer-click" /><span style={{ flex: 1 }}>{t.pickFor} {L(pickT.title)}</span>
          <button className="btn ghost small" onClick={() => setPick(null)}>{t.cancel}</button></div>
      )}

      {/* Content */}
      {view === "list" ? (
        <div className="cal-list-layout">
          <ListView filter={filter} offset={offset} areaFilter={areaFilter} />
          <aside className="panel">
            <div className="panel-head"><h2>{t.unsched}</h2><span className="muted small num">{num(lang, unsched.length)}</span></div>
            <p className="small muted" style={{ marginBottom: 12 }}>{t.dragHint}</p>
            <UnschedSidebar tasks={unsched} goals={goals} pick={pick} setPick={setPick} setView={setView} />
          </aside>
        </div>
      ) : view === "kanban" ? (
        <KanbanView filter={filter} areaFilter={areaFilter} />
      ) : (
        <div className="cal-layout">
          <section className="panel cal">{days ? timeGrid(days) : monthGrid()}</section>
          <aside className="panel">
            <div className="panel-head"><h2>{t.unsched}</h2><span className="muted small num">{num(lang, unsched.length)}</span></div>
            <p className="small muted" style={{ marginBottom: 12 }}>{t.dragHint}</p>
            <UnschedSidebar tasks={unsched} goals={goals} pick={pick} setPick={setPick} setView={setView} />
          </aside>
        </div>
      )}

      {selBlock && <EventModal block={selBlock} onClose={() => setSelBlock(null)} />}
      {clickSlot && <NewEventPopover {...clickSlot} onClose={() => setClickSlot(null)} />}
    </>
  );
}

import type { Goal as GoalType } from "@/lib/types";

function UnschedSidebar({ tasks, goals, pick, setPick, setView }: {
  tasks: Task[]; goals: GoalType[]; pick: string | null;
  setPick: (id: string | null) => void; setView: (v: CalView) => void;
}) {
  const { t, L, lang } = useT();
  return (
    <div className="unsched">
      {tasks.length ? tasks.map((x) => {
        const g = goals.find((y) => y.id === x.goal);
        return (
          <button key={x.id} className="u-task" draggable style={cvar(taskArea(x, goals))} aria-pressed={pick === x.id}
            onDragStart={(e) => { e.dataTransfer.setData("text/plain", x.id); e.dataTransfer.effectAllowed = "move"; }}
            onClick={() => { setPick(pick === x.id ? null : x.id); if (window.innerWidth > 900) setView("week"); }}>
            <span className="grip"><Icon name="grip-vertical" /></span>
            <div style={{ minWidth: 0 }}>
              <div className="task-title">{L(x.title)}</div>
              <div className="task-meta"><span className="dot" />{g ? L(g.title) : x.due ? fmt(lang, parse(x.due), { day: "numeric", month: "short" }) : ""}</div>
            </div>
          </button>
        );
      }) : <p className="empty">{t.allSched}</p>}
    </div>
  );
}
