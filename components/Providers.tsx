"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { t as translate, type Lang } from "@/lib/i18n";

export type Theme = "frost" | "neon" | "light";
export type Settings = { theme: Theme; bg: boolean; grid: boolean; scan: boolean; anim: boolean; glow: boolean };
export const DEFAULT_SETTINGS: Settings = { theme: "frost", bg: true, grid: true, scan: true, anim: true, glow: true };

export type Me = { id: number; username: string; role: string } | null;
type Ctx = {
  lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string;
  theme: Theme;
  settings: Settings; setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void; lite: () => void; resetSettings: () => void;
  me: Me; refreshMe: () => Promise<void>; toast: (msg: string) => void;
};
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export async function api<T = any>(url: string, opts?: { method?: string; body?: unknown }): Promise<T & { error?: string }> {
  try {
    const r = await fetch(url, {
      method: opts?.method || (opts?.body ? "POST" : "GET"),
      headers: opts?.body ? { "content-type": "application/json" } : undefined,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });
    return await r.json();
  } catch {
    return { error: "Сетевая ошибка / Мережева помилка" } as any;
  }
}

function applySettings(s: Settings) {
  const d = document.documentElement.dataset;
  d.theme = s.theme;
  d.bg = s.bg ? "on" : "off";
  d.grid = s.grid ? "on" : "off";
  d.scan = s.scan ? "on" : "off";
  d.anim = s.anim ? "on" : "off";
  d.glow = s.glow ? "on" : "off";
}

export default function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const [msg, setMsg] = useState("");
  const timer = useRef<any>(null);

  useEffect(() => {
    const l = localStorage.getItem("fb_lang");
    if (l === "ua" || l === "en" || l === "ru") setLangState(l);
    try {
      const raw = localStorage.getItem("fb_settings");
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      else {
        const old = localStorage.getItem("fb_theme");
        const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        setSettings({ ...DEFAULT_SETTINGS, theme: old === "neon" ? "neon" : "frost", ...(rm ? { bg: false, scan: false, anim: false } : {}) });
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    applySettings(settings);
    localStorage.setItem("fb_settings", JSON.stringify(settings));
  }, [settings, loaded]);
  useEffect(() => { document.documentElement.lang = lang === "ua" ? "uk" : lang; }, [lang]);

  const refreshMe = useCallback(async () => {
    const r = await api<{ user: Me }>("/api/auth/me");
    setMe(r.user ?? null);
  }, []);
  useEffect(() => { refreshMe(); }, [refreshMe]);

  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2600);
  }, []);

  const value: Ctx = {
    lang,
    setLang: (l) => { setLangState(l); localStorage.setItem("fb_lang", l); },
    t: (k) => translate(lang, k),
    theme: settings.theme,
    settings,
    setSetting: (k, v) => setSettings((p) => ({ ...p, [k]: v })),
    lite: () => setSettings((p) => ({ ...p, bg: false, grid: false, scan: false, anim: false, glow: false })),
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
    me, refreshMe, toast,
  };
  return (
    <C.Provider value={value}>
      {children}
      <div className={"toast" + (msg ? " show" : "")} role="status">{msg}</div>
    </C.Provider>
  );
}
