"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

function useCountUp(to: number, duration = 700) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    prev.current = to;
    if (start === to) return;
    const t0 = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + (to - start) * ease));
      if (p < 1) raf = requestAnimationFrame(step);
      else setVal(to);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return val;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  sub?: string;
  color?: string;
  progress?: number; // 0-100
}

export function StatCard({ icon, label, value, sub, color = "var(--accent)", progress }: StatCardProps) {
  const animated = useCountUp(value);
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: color + "22", color }}>
        <Icon name={icon} />
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{animated}<span className="stat-card-sub">{sub}</span></div>
        <div className="stat-card-label">{label}</div>
      </div>
      {progress !== undefined && (
        <div className="stat-card-bar">
          <div className="stat-card-bar-fill" style={{ width: `${progress}%`, background: color }} />
        </div>
      )}
    </div>
  );
}
