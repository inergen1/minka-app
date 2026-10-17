"use client";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { addDays, fmt, num, parse, weekStart } from "@/lib/dates";
import { taskArea } from "@/lib/goals";
import { isDone, isDue, streak } from "@/lib/habits";
import { cvar, pct, today, useT } from "@/lib/use-t";
import { useMinka, useUI } from "@/store/minka";

export function ReviewView() {
  const { t, L, lang } = useT();
  const { habits, logs, tasks, goals, areas, reviews, setRating, saveReview } = useMinka();
  const toast = useUI((s) => s.showToast);
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState(["", "", ""]);
  const [top, setTop] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const d = today(), ws = weekStart(d);
  let wd = 0, wt = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(ws, i);
    if (day > d) break;
    habits.forEach((h) => { if (isDue(h, day)) { wt++; if (isDone(logs, h, day)) wd++; } });
  }
  const wins = habits.map((h) => [h, streak(logs, h, d)] as const).filter((x) => x[1] >= 7).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const doneT = tasks.filter((x) => x.done);

  const save = () => {
    saveReview({ notes, top, ratings: Object.fromEntries(areas.map((a) => [a.id, a.now])) });
    setSaved(true);
    toast(t.savedReview);
  };

  const steps = (
    <div className="steps">
      {t.steps.map((s, i) => (
        <span key={s} className={`step${i === step && !saved ? " on" : ""}${i < step || saved ? " done" : ""}`}>
          <i className="num">{i < step || saved ? "✓" : num(lang, i + 1)}</i>{s}
        </span>
      ))}
    </div>
  );

  const past = reviews.length > 0 && (
    <section className="panel">
      <div className="panel-head"><h2>{t.past}</h2></div>
      {reviews.slice(0, 6).map((r) => (
        <div key={r.week} className="past-review">
          <div style={{ fontWeight: 600 }} className="num">{fmt(lang, parse(r.week), { day: "numeric", month: "long", year: "numeric" })}</div>
          {r.notes.filter(Boolean).map((n, i) => <p key={i} className="small muted">{n}</p>)}
          <div className="chips" style={{ marginTop: 6 }}>
            {r.top.map((id) => { const x = tasks.find((y) => y.id === id); return x ? <span key={id} className="chip" style={cvar(taskArea(x, goals))} aria-pressed="true"><span className="dot" />{L(x.title)}</span> : null; })}
          </div>
        </div>
      ))}
    </section>
  );

  let body: React.ReactNode = null;
  if (saved) {
    body = (
      <section className="panel">
        <div className="insight"><Icon name="circle-check" /><div><div style={{ fontWeight: 600 }}>{t.savedReview}</div></div></div>
        <div style={{ marginTop: 14 }}><button className="btn" onClick={() => { setSaved(false); setStep(0); setTop([]); setNotes(["", "", ""]); }}>{t.newReview}</button></div>
      </section>
    );
  } else if (step === 0) {
    body = <>
      <div className="stats4">
        <div className="panel stat"><span className="stat-label">{t.habitRate}</span><span className="stat-value num">{pct(wt ? wd / wt : 0)}%</span></div>
        <div className="panel stat"><span className="stat-label">{t.tasksDone}</span><span className="stat-value num">{num(lang, doneT.length)}</span></div>
        <div className="panel stat"><span className="stat-label">{t.topStreak}</span><span className="stat-value num">{num(lang, wins[0]?.[1] ?? 0)}</span></div>
        <div className="panel stat"><span className="stat-label">{t.nav.goals}</span><span className="stat-value num">{num(lang, goals.filter((g) => !g.parent).length)}</span></div>
      </div>
      <section className="panel">
        <div className="panel-head"><h2>{t.wins}</h2></div>
        <div className="wins">
          {wins.length + doneT.length === 0 && <p className="empty">{t.noWins}</p>}
          {wins.map(([h, s]) => <div key={h.id} className="win" style={cvar(h.area)}><Icon name="flame" /><span style={{ flex: 1 }}>{L(h.name)}</span><b className="num">{t.days(s)}</b></div>)}
          {doneT.slice(-3).map((x) => <div key={x.id} className="win" style={cvar(taskArea(x, goals))}><Icon name="circle-check" /><span>{L(x.title)}</span></div>)}
        </div>
      </section>
    </>;
  } else if (step === 1) {
    body = (
      <section className="panel"><div className="rate-list">
        {areas.map((a) => (
          <div key={a.id} className="rate-item" style={cvar(a.id)}>
            <label htmlFor={`rr-${a.id}`}><span>{L(a.name)}</span><b>{num(lang, a.now)}</b></label>
            <input type="range" min={1} max={10} id={`rr-${a.id}`} value={a.now} onChange={(e) => setRating(a.id, +e.target.value)} />
          </div>
        ))}
      </div></section>
    );
  } else if (step === 2) {
    body = (
      <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {t.q.map((q, i) => (
          <div key={i} className="field"><label htmlFor={`q${i}`}>{q}</label>
            <textarea id={`q${i}`} placeholder={t.qp[i]} value={notes[i]} onChange={(e) => setNotes(notes.map((n, j) => (j === i ? e.target.value : n)))} /></div>
        ))}
      </section>
    );
  } else {
    const open = tasks.filter((x) => !x.done);
    body = (
      <section className="panel">
        <div className="panel-head"><h2>{t.pickTop}</h2><span className="muted small num">{t.picked(num(lang, top.length))}</span></div>
        <div className="pick-list">
          {open.map((x) => {
            const on = top.includes(x.id), g = goals.find((y) => y.id === x.goal);
            return (
              <button key={x.id} className="pick" style={cvar(taskArea(x, goals))} aria-pressed={on}
                onClick={() => setTop(on ? top.filter((y) => y !== x.id) : top.length < 3 ? [...top, x.id] : top)}>
                <span className={`cbox${on ? " on" : ""}`}>{on && <Icon name="check" />}</span>
                <div style={{ minWidth: 0 }}><div className="task-title">{L(x.title)}</div><div className="task-meta"><span className="dot" />{g ? L(g.title) : ""}</div></div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <>
      <header className="page-head"><div><h1 className="page-title">{t.nav.review}</h1><p className="page-sub">{t.reviewSub}</p></div></header>
      {steps}
      <div className="review-body">
        {body}
        {!saved && (
          <div className="review-nav">
            <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>{t.prev}</button>
            {step < 3 ? <button className="btn primary" onClick={() => setStep(step + 1)}>{t.next}</button>
              : <button className="btn primary" disabled={!top.length} onClick={save}>{t.finish}</button>}
          </div>
        )}
        {past}
      </div>
    </>
  );
}
