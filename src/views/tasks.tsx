"use client";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { cvar, today, useT } from "@/lib/use-t";
import { useMinka, useUI } from "@/store/minka";
import type { Task } from "@/lib/types";
import { StatCard } from "@/components/stat-card";

type View = "table" | "list" | "board";

function useTaskStats() {
  const tasks = useMinka((s) => s.tasks);
  const d = today().toISOString().slice(0, 10);
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const dueToday = tasks.filter((t) => !t.done && t.due === d).length;
  const overdue = tasks.filter((t) => !t.done && t.due && t.due < d).length;
  return { total, done, dueToday, overdue, pct: total ? Math.round((done / total) * 100) : 0 };
}

// ── Table view ──────────────────────────────────────────────
function TableView({ tasks }: { tasks: Task[] }) {
  const { t, L, lang } = useT();
  const { goals, areas, toggleTask, removeTask } = useMinka();
  const edit = useUI((s) => s.openQuickAdd);
  const d = today().toISOString().slice(0, 10);

  return (
    <div className="tasks-table-wrap">
      <table className="tasks-table">
        <thead>
          <tr>
            <th style={{ width: 36 }} />
            <th>{lang === "ar" ? "المهمة" : "Task"}</th>
            <th>{lang === "ar" ? "الجانب" : "Area"}</th>
            <th>{lang === "ar" ? "الهدف" : "Goal"}</th>
            <th>{lang === "ar" ? "الاستحقاق" : "Due"}</th>
            <th style={{ width: 80 }}>{lang === "ar" ? "الحالة" : "Status"}</th>
            <th style={{ width: 64 }} />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const goal = goals.find((g) => g.id === task.goal);
            const areaId = task.area ?? goal?.area;
            const area = areas.find((a) => a.id === areaId);
            const overdue = !task.done && task.due && task.due < d;
            return (
              <tr key={task.id} className={task.done ? "row-done" : overdue ? "row-overdue" : ""} style={cvar(areaId ?? "")}>
                <td>
                  <button className={`task-check${task.done ? " checked" : ""}`} onClick={() => toggleTask(task.id)} aria-label={task.done ? "Mark undone" : "Mark done"}>
                    {task.done && <Icon name="check" />}
                  </button>
                </td>
                <td className="task-title-cell"><span>{L(task.title)}</span></td>
                <td>{area ? <span className="tag" style={cvar(areaId ?? "")}>{L(area.name)}</span> : "—"}</td>
                <td className="task-goal-cell">{goal ? <span className="small">{L(goal.title)}</span> : "—"}</td>
                <td className={`task-due-cell num small${overdue ? " overdue-text" : ""}`}>
                  {task.due ? task.due : "—"}
                </td>
                <td>
                  <span className={`status-chip ${task.done ? "done" : overdue ? "overdue" : "pending"}`}>
                    {task.done ? (lang === "ar" ? "منجز" : "Done") : overdue ? (lang === "ar" ? "متأخر" : "Late") : (lang === "ar" ? "معلق" : "Pending")}
                  </span>
                </td>
                <td>
                  <button className="icon-btn small" onClick={() => edit("task", task.id)} aria-label="Edit"><Icon name="pencil" /></button>
                  <button className="icon-btn small danger" onClick={() => removeTask(task.id)} aria-label="Delete"><Icon name="trash-2" /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── List view ────────────────────────────────────────────────
function ListView({ tasks }: { tasks: Task[] }) {
  const { L } = useT();
  const { goals, areas, toggleTask, removeTask } = useMinka();
  const edit = useUI((s) => s.openQuickAdd);
  const d = today().toISOString().slice(0, 10);

  // Group by area
  const grouped: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    const areaId = task.area ?? goals.find((g) => g.id === task.goal)?.area ?? "—";
    if (!grouped[areaId]) grouped[areaId] = [];
    grouped[areaId].push(task);
  });

  return (
    <div className="tasks-list">
      {Object.entries(grouped).map(([areaId, list]) => {
        const area = areas.find((a) => a.id === areaId);
        return (
          <div key={areaId} className="task-group">
            <div className="task-group-hd" style={cvar(areaId)}>
              <span className="dot" />{area ? L(area.name) : "—"}
            </div>
            {list.map((task) => {
              const overdue = !task.done && task.due && task.due < d;
              return (
                <div key={task.id} className={`task-list-row${task.done ? " done" : overdue ? " overdue" : ""}`} style={cvar(areaId)}>
                  <button className={`task-check${task.done ? " checked" : ""}`} onClick={() => toggleTask(task.id)}>
                    {task.done && <Icon name="check" />}
                  </button>
                  <div className="task-list-body">
                    <span className="task-list-title">{L(task.title)}</span>
                    {task.due && <span className={`task-list-due small${overdue ? " overdue-text" : ""}`}>{task.due}</span>}
                  </div>
                  <div className="task-list-actions">
                    <button className="icon-btn small" onClick={() => edit("task", task.id)}><Icon name="pencil" /></button>
                    <button className="icon-btn small danger" onClick={() => removeTask(task.id)}><Icon name="trash-2" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Board / Kanban view ──────────────────────────────────────
function BoardView({ tasks }: { tasks: Task[] }) {
  const { t, L, lang } = useT();
  const { goals, areas, toggleTask } = useMinka();
  const d = today().toISOString().slice(0, 10);

  const backlog = tasks.filter((t) => !t.done && (!t.due || t.due > d));
  const todayTasks = tasks.filter((t) => !t.done && t.due && t.due <= d);
  const done = tasks.filter((t) => t.done);

  const col = (title: string, items: Task[], cls: string) => (
    <div className={`board-col ${cls}`}>
      <div className="board-col-hd"><span>{title}</span><span className="board-count">{items.length}</span></div>
      <div className="board-cards">
        {items.map((task) => {
          const areaId = task.area ?? goals.find((g) => g.id === task.goal)?.area;
          const area = areas.find((a) => a.id === areaId);
          return (
            <div key={task.id} className="board-card" style={cvar(areaId ?? "")}>
              <div className="board-card-title">{L(task.title)}</div>
              <div className="board-card-foot">
                {area && <span className="tag" style={cvar(areaId ?? "")}>{L(area.name)}</span>}
                {task.due && <span className="board-card-due small">{task.due}</span>}
                <button className={`task-check small${task.done ? " checked" : ""}`} onClick={() => toggleTask(task.id)}>
                  {task.done && <Icon name="check" />}
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="board-empty">{lang === "ar" ? "لا مهام هنا" : "Nothing here"}</div>}
      </div>
    </div>
  );

  return (
    <div className="board-wrap">
      {col(t.backlogCol, backlog, "col-backlog")}
      {col(t.todayCol, todayTasks, "col-today")}
      {col(t.doneCol, done, "col-done")}
    </div>
  );
}

// ── Main TasksView ───────────────────────────────────────────
export function TasksView() {
  const { t, L, lang } = useT();
  const { tasks, areas, goals } = useMinka();
  const openAdd = useUI((s) => s.openQuickAdd);
  const [view, setView] = useState<View>("table");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const stats = useTaskStats();
  const d = today().toISOString().slice(0, 10);

  const filtered = tasks.filter((task) => {
    if (filter === "pending") return !task.done;
    if (filter === "done") return task.done;
    return true;
  }).filter((task) => {
    if (areaFilter === "all") return true;
    const aId = task.area ?? goals.find((g) => g.id === task.goal)?.area;
    return aId === areaFilter;
  });

  const ar = lang === "ar";

  return (
    <div className="page-tasks">
      <div className="page-hd">
        <div>
          <h1 className="page-title">{ar ? "المهام" : "Tasks"}</h1>
          <p className="page-sub">{ar ? "كل مهامك في مكان واحد — جدول، قائمة، أو لوحة كانبان." : "All your tasks in one place — table, list, or kanban board."}</p>
        </div>
        <button className="btn primary" onClick={() => openAdd("task")}><Icon name="plus" />{t.add}</button>
      </div>

      {/* Stats cards */}
      <div className="stat-cards">
        <StatCard icon="list-checks" label={ar ? "إجمالي المهام" : "Total tasks"} value={stats.total} color="var(--accent)" />
        <StatCard icon="circle-check-big" label={ar ? "مكتمل" : "Completed"} value={stats.done} sub={`${stats.pct}%`} color="var(--c-growth)" />
        <StatCard icon="calendar-clock" label={ar ? "مستحق اليوم" : "Due today"} value={stats.dueToday} color="var(--c-work)" />
        <StatCard icon="alarm-clock" label={ar ? "متأخر" : "Overdue"} value={stats.overdue} color="var(--danger)" />
      </div>

      {/* Controls */}
      <div className="view-bar">
        <div className="segmented">
          {(["table", "list", "board"] as View[]).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              <Icon name={v === "table" ? "table-2" : v === "list" ? "list" : "layout-dashboard"} />
              <span>{v === "table" ? (ar ? "جدول" : "Table") : v === "list" ? (ar ? "قائمة" : "List") : (ar ? "لوحة" : "Board")}</span>
            </button>
          ))}
        </div>
        <div className="tasks-filters">
          <select className="area-select" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} aria-label={t.area}>
            <option value="all">{t.allAreas}</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{L(a.name)}</option>)}
          </select>
          {(["all", "pending", "done"] as const).map((f) => (
            <button key={f} className={`chip-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? (ar ? "الكل" : "All") : f === "pending" ? (ar ? "معلق" : "Pending") : (ar ? "منجز" : "Done")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Icon name="inbox" /><p>{ar ? "لا مهام هنا." : "No tasks here."}</p></div>
      ) : view === "table" ? (
        <TableView tasks={filtered} />
      ) : view === "list" ? (
        <ListView tasks={filtered} />
      ) : (
        <BoardView tasks={filtered} />
      )}
    </div>
  );
}
