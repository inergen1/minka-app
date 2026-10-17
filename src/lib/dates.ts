import type { Lang } from "./types";

export const DAY = 864e5;
export const sod = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parse = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
/** Weeks start on Saturday. */
export const weekStart = (d: Date) => { const x = sod(d); return addDays(x, -((x.getDay() + 1) % 7)); };
export const daysBetween = (a: Date, b: Date) => Math.round((sod(b).getTime() - sod(a).getTime()) / DAY);

const loc = (lang: Lang) => (lang === "ar" ? "ar-u-nu-latn" : "en-GB");
export const fmt = (lang: Lang, d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc(lang), o).format(d);
export const hijri = (lang: Lang, d: Date, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(lang === "ar" ? "ar-u-ca-islamic-umalqura-nu-latn" : "en-u-ca-islamic-umalqura", o).format(d);
export const hijriDay = (d: Date) => new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric" }).format(d);
export const num = (lang: Lang, x: number) => new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 1 }).format(x);
export const time = (lang: Lang, h: number) => {
  const d = new Date(2000, 0, 1, Math.floor(h), Math.round((h % 1) * 60));
  return fmt(lang, d, { hour: "numeric", minute: "2-digit" });
};
export const nowHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
