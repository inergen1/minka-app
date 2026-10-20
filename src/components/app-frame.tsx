"use client";
import { useEffect, useSyncExternalStore } from "react";
import { key } from "@/lib/dates";
import { dueReminders } from "@/lib/habits";
import { DICT } from "@/lib/i18n";
import { useT } from "@/lib/use-t";
import { useMinka, useUI } from "@/store/minka";
import { QuickAdd } from "./quick-add";
import { Shell } from "./shell";

const noop = () => () => {};

function Welcome() {
  const { t, lang } = useT();
  const start = useMinka((s) => s.start);
  const setLang = useMinka((s) => s.setLang);
  return (
    <div className="welcome">
      <div className="welcome-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="brand-mark">{lang === "ar" ? "م" : "M"}</div>
          <button className="chip-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{t.langBtn}</button>
        </div>
        <div>
          <h1 className="welcome-title">{t.welcomeTitle}</h1>
          <p className="page-sub" style={{ fontSize: 17 }}>{t.welcomeSub}</p>
        </div>
        <div className="welcome-opts">
          <button className="welcome-opt primary" onClick={() => start("sample")}><b>{t.startSample}</b><span className="small muted">{t.startSampleSub}</span></button>
          <button className="welcome-opt" onClick={() => start("blank")}><b>{t.startBlank}</b><span className="small muted">{t.startBlankSub}</span></button>
        </div>
        <p className="small muted">{t.localNote}</p>
      </div>
    </div>
  );
}

function Toast() {
  const msg = useUI((s) => s.toast);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

/** Renders only in the browser: all data is local, so there is nothing meaningful to server-render. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const started = useMinka((s) => s.started);
  const lang = useMinka((s) => s.lang);
  const theme = useMinka((s) => s.theme);
  const qa = useUI((s) => s.quickAdd);
  useEffect(() => {
    const r = document.documentElement;
    r.lang = lang;
    r.dir = lang === "ar" ? "rtl" : "ltr";
    if (theme) r.setAttribute("data-theme", theme);
    else r.removeAttribute("data-theme");
  }, [lang, theme]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
  }, []);
  useEffect(() => {
    if (!started || !("Notification" in window)) return;
    // Reminders fire while the app is open (no push server; data is local).
    const fired = new Set<string>();
    const tick = async () => {
      if (Notification.permission !== "granted") return;
      const { habits, logs, lang } = useMinka.getState();
      const now = new Date();
      for (const h of dueReminders(habits, logs, now, fired)) {
        fired.add(h.id + key(now));
        const body = h.name[lang] || h.name.ar, reg = await navigator.serviceWorker?.getRegistration();
        if (reg) reg.showNotification(DICT[lang].brand, { body, tag: h.id, icon: "/icon-192.png" });
        else new Notification(DICT[lang].brand, { body, tag: h.id, icon: "/icon-192.png" });
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [started]);
  if (!mounted) return null;
  if (!started) return <Welcome />;
  return (
    <>
      <Shell>{children}</Shell>
      {qa && <QuickAdd />}
      <Toast />
    </>
  );
}
