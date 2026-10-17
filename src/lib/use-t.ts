"use client";
import { useMinka } from "@/store/minka";
import { DICT } from "./i18n";
import type { Text } from "./types";

export function useT() {
  const lang = useMinka((s) => s.lang);
  const t = DICT[lang];
  const L = (o?: Text | null) => (o ? o[lang] || o.ar || o.en : "");
  return { t, L, lang };
}

/** Stable "today" for a render pass. */
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const cvar = (area: string) => ({ "--c": `var(--a-${area})` }) as React.CSSProperties;
export const pct = (x: number) => Math.round(x * 100);
