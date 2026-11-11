"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp, api, type Theme } from "./Providers";
import { LANGS } from "@/lib/i18n";
import { SVG_BG, SVG_DEFS } from "@/lib/svgs";

export function Background() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: SVG_DEFS }} />
      <div dangerouslySetInnerHTML={{ __html: SVG_BG }} />
      <div className="bg-veil" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}

function SettingsPanel() {
  const { t, settings, setSetting, resetSettings } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", click); document.removeEventListener("keydown", key); };
  }, [open]);
  const themes: Theme[] = ["frost", "neon", "light"];
  const toggles: ["bg" | "grid" | "scan" | "anim" | "glow", string][] = [["bg", "set_bg"], ["grid", "set_grid"], ["scan", "set_scan"], ["anim", "set_anim"], ["glow", "set_glow"]];
  return (
    <div className="settings-wrap" ref={ref}>
      <button className="theme-btn" aria-label={t("settings")} aria-expanded={open} title={t("settings")} onClick={() => setOpen(!open)}>⚙</button>
      {open && (
        <div className="settings-pop" role="dialog" aria-label={t("settings")}>
          <h4>{t("set_theme")}</h4>
          <div className="lang-seg theme-seg">
            {themes.map((th) => <button key={th} className={settings.theme === th ? "on" : ""} onClick={() => setSetting("theme", th)}>{t("th_" + th)}</button>)}
          </div>
          <label className="sw"><span>{t("set_lite")}</span><input type="checkbox" checked={settings.lite} onChange={(e) => setSetting("lite", e.target.checked)} /></label>
          {toggles.map(([k, label]) => (
            <label className="sw" key={k}><span>{t(label)}</span><input type="checkbox" checked={settings[k]} onChange={(e) => setSetting(k, e.target.checked)} /></label>
          ))}
          <div className="settings-actions">
            <button className="btn ghost sm" onClick={resetSettings}>{t("set_reset")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const { lang, setLang, t, me, refreshMe } = useApp();
  const [open, setOpen] = useState(false);
  const staff = me && (me.role === "admin" || me.role === "moderator");
  return (
    <header className="topbar">
      <Link className="logo-wrap" href="/">
        <img className="logo-img" src="/logo-128.png" width={42} height={42} alt="FROSTBASE" decoding="async" />
        <span className="brand">FROST<span className="brand-accent">BASE</span></span>
      </Link>
      <nav className={"main-nav" + (open ? " open" : "")} onClick={() => setOpen(false)}>
        <Link href="/">{t("nav_search")}</Link>
        <Link href="/report">{t("nav_report")}</Link>
        <Link href="/stats">{t("nav_stats")}</Link>
        {staff && <Link href="/admin">{t("nav_admin")}</Link>}
      </nav>
      <div className="controls">
        <div className="lang-seg" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l} className={l === lang ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
        <SettingsPanel />
        {me ? (
          <>
            <span className="who">{me.username}</span>
            <button className="link-btn" onClick={async () => { await api("/api/auth/logout", { method: "POST", body: {} }); await refreshMe(); }}>{t("logout")}</button>
          </>
        ) : (
          <Link className="link-btn" href="/login">{t("login")}</Link>
        )}
        <button className="burger" aria-label="menu" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="footer">
      <div className="f-left"><img className="logo-img small" src="/logo-128.png" width={26} height={26} alt="" decoding="async" /><span>© {new Date().getFullYear()} FROSTBASE</span></div>
      <div className="f-note">{t("footer_note")}</div>
    </footer>
  );
}
