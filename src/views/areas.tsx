"use client";
import { useState } from "react";
import { AreaIcon, Bar } from "@/components/bits";
import { Icon } from "@/components/icon";
import { num } from "@/lib/dates";
import { areaProgress } from "@/lib/goals";
import { ratingBefore } from "@/lib/ratings";
import { cvar, pct, today, useT } from "@/lib/use-t";
import type { Area } from "@/lib/types";
import { useMinka } from "@/store/minka";
import { GoalNode } from "./goals";
import { HabitListItem } from "./habits";

function Radar({ areas }: { areas: Area[] }) {
  const { t, L, lang } = useT();
  const N = areas.length, cx = 220, cy = 200, R = 130;
  const pt = (i: number, v: number) => {
    const ang = -Math.PI / 2 + ((i * 2 * Math.PI) / N) * (lang === "ar" ? -1 : 1);
    return [cx + Math.cos(ang) * R * v / 10, cy + Math.sin(ang) * R * v / 10];
  };
  const poly = (f: (a: Area) => number) => areas.map((a, i) => pt(i, f(a)).join(",")).join(" ");
  return (
    <svg className="radar" viewBox="0 0 440 400" role="img" aria-label={t.wheel}>
      {[2, 4, 6, 8, 10].map((r) => <polygon key={r} className="ring-l" points={areas.map((_, i) => pt(i, r).join(",")).join(" ")} />)}
      {areas.map((a, i) => { const [x, y] = pt(i, 10); return <line key={a.id} className="axis" x1={cx} y1={cy} x2={x} y2={y} />; })}
      {[5, 10].map((r) => <text key={r} className="tick" x={cx + 4} y={cy - R * r / 10 + 12}>{num(lang, r)}</text>)}
      <polygon className="p-before" points={poly((a) => a.before)} />
      <polygon className="p-now" points={poly((a) => a.now)} />
      {areas.map((a, i) => {
        const [x, y] = pt(i, a.now), [lx, ly] = pt(i, 11.6);
        const anchor = lx > cx + 8 ? "start" : lx < cx - 8 ? "end" : "middle";
        return (
          <g key={a.id}>
            <circle cx={x} cy={y} r="4.5" fill={`var(--a-${a.id})`} stroke="var(--surface)" strokeWidth="2" />
            <text x={lx} y={ly + 4} textAnchor={anchor}>{L(a.name)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function AreaDetail({ area: a, onBack }: { area: Area; onBack: () => void }) {
  const { t, L, lang } = useT();
  const { goals, habits, setRating, setVision } = useMinka();
  const gs = goals.filter((g) => !g.parent && g.area === a.id);
  const hs = habits.filter((h) => h.area === a.id);
  return (
    <>
      <div><button className="btn ghost" onClick={onBack}><Icon name={lang === "ar" ? "arrow-right" : "arrow-left"} />{t.back}</button></div>
      <section className="area-hero" style={cvar(a.id)}>
        <AreaIcon area={a.id} icon={a.icon} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title">{L(a.name)}</h1>
          <label className="small muted" htmlFor={`vision-${a.id}`}>{t.vision}</label>
          <textarea id={`vision-${a.id}`} className="vision-input" value={L(a.vision)} placeholder={t.visionPh} onChange={(e) => setVision(a.id, e.target.value)} />
        </div>
        <div className="panel" style={{ minWidth: "min(260px,100%)", ...cvar(a.id) }}>
          <label className="small muted" htmlFor={`rate-${a.id}`}>{t.rateNow}</label>
          <div className="range-row">
            <input type="range" min={1} max={10} id={`rate-${a.id}`} value={a.now} onChange={(e) => setRating(a.id, +e.target.value)} />
            <b className="rating num">{num(lang, a.now)}</b>
          </div>
          <div className="small muted">{t.before}: <span className="num">{num(lang, a.before)}</span></div>
        </div>
      </section>
      <div className="two-col">
        <section className="panel"><div className="panel-head"><h2>{t.nav.goals}</h2><span className="muted small num">{num(lang, gs.length)}</span></div>
          {gs.length ? gs.map((g) => <GoalNode key={g.id} goal={g} depth={0} />) : <p className="empty">—</p>}</section>
        <section className="panel"><div className="panel-head"><h2>{t.nav.habits}</h2><span className="muted small num">{num(lang, hs.length)}</span></div>
          {hs.length ? hs.map((h) => <HabitListItem key={h.id} habit={h} />) : <p className="empty">—</p>}</section>
      </div>
    </>
  );
}

export function AreasView() {
  const { t, L, lang } = useT();
  const { areas: stored, goals, tasks, habits, reviews } = useMinka();
  const [sel, setSel] = useState<string | null>(null);
  const areas = stored.map((a) => ({ ...a, before: ratingBefore(reviews, a.id, today(), a.before) }));
  const selected = areas.find((a) => a.id === sel);
  if (selected) return <AreaDetail area={selected} onBack={() => setSel(null)} />;
  const weak = [...areas].sort((a, b) => a.now - b.now)[0];
  const delta = weak.now - weak.before;
  return (
    <>
      <header className="page-head"><div><h1 className="page-title">{t.nav.areas}</h1><p className="page-sub">{t.areasSub}</p></div></header>
      <div className="areas-grid">
        <section className="panel radar-wrap">
          <div className="panel-head" style={{ width: "100%", marginBottom: 0 }}><h2>{t.wheel}</h2></div>
          <Radar areas={areas} />
          <div className="legend"><span><i style={{ background: "var(--accent)" }} />{t.now}</span><span><i style={{ background: "var(--gold)" }} />{t.before}</span></div>
          <div className="insight" style={cvar(weak.id)}>
            <AreaIcon area={weak.id} icon={weak.icon} />
            <div>
              <div className="small muted">{t.weakest}</div>
              <div style={{ fontWeight: 600 }}>{L(weak.name)} · <span className="num">{num(lang, weak.now)}/10</span></div>
              <p className="small muted">{t.weakTip((delta > 0 ? "+" : "") + num(lang, delta))}</p>
            </div>
          </div>
        </section>
        <section className="area-cards">
          {areas.map((a) => {
            const p = areaProgress(a.id, goals, tasks);
            return (
              <button key={a.id} className="area-card" style={cvar(a.id)} onClick={() => { setSel(a.id); scrollTo({ top: 0 }); }}>
                <div className="area-card-top"><AreaIcon area={a.id} icon={a.icon} /><span className="area-card-name">{L(a.name)}</span>
                  <span className="rating num">{num(lang, a.now)}<small>/10</small></span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Bar value={p} /><b className="small num">{pct(p)}%</b></div>
                <div className="area-card-foot">
                  <span className="num">{num(lang, goals.filter((g) => !g.parent && g.area === a.id).length)} {t.goalsN}</span><span>·</span>
                  <span className="num">{num(lang, habits.filter((h) => h.area === a.id).length)} {t.habitsN}</span>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </>
  );
}
