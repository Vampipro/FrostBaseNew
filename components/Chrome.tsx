"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp, api } from "./Providers";
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

export function Topbar() {
  const { lang, setLang, t, theme, toggleTheme, me, refreshMe } = useApp();
  const [open, setOpen] = useState(false);
  const staff = me && (me.role === "admin" || me.role === "moderator");
  return (
    <header className="topbar">
      <Link className="logo-wrap" href="/">
        <svg className="logo-svg"><use href="#logoSym" /></svg>
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
        <button className="theme-btn" onClick={toggleTheme} aria-label="theme" data-theme-icon={theme}>
          <span className="ico-frost">❄</span><span className="ico-neon">⚡</span>
        </button>
        {me ? (
          <>
            <span className="who">{me.username}</span>
            <button className="link-btn" onClick={async () => { await api("/api/auth/logout", { method: "POST", body: {} }); await refreshMe(); }}>{t("logout")}</button>
          </>
        ) : (
          <Link className="link-btn" href="/login">{t("login")}</Link>
        )}
        <button className="burger" aria-label="menu" onClick={() => setOpen(!open)}><span /><span /><span /></button>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="footer">
      <div className="f-left"><svg className="logo-svg small"><use href="#logoSym" /></svg><span>© {new Date().getFullYear()} FROSTBASE</span></div>
      <div className="f-note">{t("footer_note")}</div>
    </footer>
  );
}
