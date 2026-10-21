"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/use-t";
import { useMinka } from "@/store/minka";
import { Icon } from "./icon";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const NAV = [
  ["today", "/today", "sun"],
  ["areas", "/areas", "compass"],
  ["goals", "/goals", "flag"],
  ["habits", "/habits", "repeat"],
  ["tasks", "/tasks", "list-checks"],
  ["calendar", "/calendar", "calendar-days"],
  ["review", "/review", "clipboard-check"],
] as const;

export function useIsDark() {
  const theme = useMinka((s) => s.theme);
  const [sys, setSys] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const m = matchMedia("(prefers-color-scheme: dark)");
    const f = () => setSys(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return theme ? theme === "dark" : sys;
}

function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const reset = useMinka((s) => s.reset);
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [onClose]);
  const exportData = () => {
    const { started, lang, theme, areas, habits, goals, tasks, blocks, logs, reviews } = useMinka.getState();
    const blob = new Blob([JSON.stringify({ started, lang, theme, areas, habits, goals, tasks, blocks, logs, reviews }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `minka-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="menu" ref={ref} role="menu">
      <p>{t.localNote}</p>
      <button role="menuitem" onClick={exportData}><Icon name="download" />{t.exportData}</button>
      <button role="menuitem" className="danger" onClick={() => (armed ? reset() : setArmed(true))}>
        <Icon name="rotate-ccw" />{armed ? t.resetConfirm : t.reset}
      </button>
    </div>
  );
}

function Toggles({ compact }: { compact?: boolean }) {
  const { t, lang } = useT();
  const setLang = useMinka((s) => s.setLang);
  const setTheme = useMinka((s) => s.setTheme);
  const dark = useIsDark();
  const [menu, setMenu] = useState(false);
  const cls = compact ? "icon-btn" : "chip-btn";
  return (
    <div className="toggles" style={{ position: "relative" }}>
      <button className={cls} onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label="Language">
        <Icon name="languages" />{!compact && t.langBtn}
      </button>
      <button className={cls} onClick={() => setTheme(dark ? "light" : "dark")} aria-label={t.theme}>
        <Icon name={dark ? "sun" : "moon"} />{!compact && (dark ? t.light : t.dark)}
      </button>
      <button className={compact ? "icon-btn" : "chip-btn"} onClick={() => setMenu((m) => !m)} aria-label={t.settings} aria-expanded={menu}>
        <Icon name="settings" />
      </button>
      {menu && <SettingsMenu onClose={() => setMenu(false)} />}
    </div>
  );
}

function UserArea({ collapsed }: { collapsed: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const ar = lang === "ar";

  if (user) {
    return (
      <div className="side-user" title={user.email}>
        <Icon name="user-circle" />
        <span className="side-user-email">{user.email}</span>
        <button className="side-user-out" aria-label={ar ? "تسجيل خروج" : "Sign out"}
          onClick={async () => { await supabase.auth.signOut(); setUser(null); }}>
          <Icon name="log-out" />
        </button>
      </div>
    );
  }

  return (
    <button className="side-auth-btn" onClick={() => router.push("/auth")}>
      <Icon name="log-in" /><span>{ar ? "تسجيل الدخول" : "Sign in"}</span>
    </button>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, lang } = useT();
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "1";
  });

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  const nav = NAV.map(([k, href, icon]) => (
    <Link key={k} href={href} aria-current={path.startsWith(href) ? "page" : undefined} title={collapsed ? t.nav[k] : undefined}>
      <Icon name={icon} /><span>{t.nav[k]}</span>
    </Link>
  ));
  const mark = <div className="brand-mark">{lang === "ar" ? "م" : "M"}</div>;
  const collapseIcon = lang === "ar"
    ? (collapsed ? "chevron-left" : "chevron-right")
    : (collapsed ? "chevron-right" : "chevron-left");

  return (
    <div className={`app${collapsed ? " side-collapsed" : ""}`}>
      <aside className={`side${collapsed ? " collapsed" : ""}`}>
        <div className="brand">
          {mark}
          <div className="brand-text"><div className="brand-name">{t.brand}</div><div className="brand-sub">{t.tagline}</div></div>
        </div>
        <nav className="nav">{nav}</nav>
        <div className="side-foot">
          <UserArea collapsed={collapsed} />
          <Toggles compact={collapsed} />
          <button className="side-collapse-btn" onClick={toggleCollapsed} aria-label="Toggle sidebar">
            <Icon name={collapseIcon} />
          </button>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <header className="topbar">
          <div className="brand">{mark}<div className="brand-name">{t.brand}</div></div>
          <Toggles compact />
        </header>
        <main className="main"><div className="wrap">{children}</div></main>
      </div>
      <nav className="tabbar">{nav}</nav>
    </div>
  );
}
