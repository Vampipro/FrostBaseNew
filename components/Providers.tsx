"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { t as translate, type Lang } from "@/lib/i18n";

export type Me = { id: number; username: string; role: string } | null;
type Ctx = {
  lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string;
  theme: "frost" | "neon"; toggleTheme: () => void;
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
    return { error: "Мережева помилка" } as any;
  }
}

export default function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ua");
  const [theme, setTheme] = useState<"frost" | "neon">("frost");
  const [me, setMe] = useState<Me>(null);
  const [msg, setMsg] = useState("");
  const timer = useRef<any>(null);

  useEffect(() => {
    const l = localStorage.getItem("fb_lang") as Lang | null;
    if (l === "ua" || l === "en" || l === "ru") setLangState(l);
    const th = localStorage.getItem("fb_theme");
    if (th === "neon" || th === "frost") setTheme(th);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang === "ua" ? "uk" : lang;
  }, [theme, lang]);

  const refreshMe = useCallback(async () => {
    const r = await api<{ user: Me }>("/api/auth/me");
    setMe(r.user ?? null);
  }, []);
  useEffect(() => { refreshMe(); }, [refreshMe]);

  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2400);
  }, []);

  const value: Ctx = {
    lang,
    setLang: (l) => { setLangState(l); localStorage.setItem("fb_lang", l); },
    t: (k) => translate(lang, k),
    theme,
    toggleTheme: () => { const n = theme === "frost" ? "neon" : "frost"; setTheme(n); localStorage.setItem("fb_theme", n); },
    me, refreshMe, toast,
  };
  return (
    <C.Provider value={value}>
      {children}
      <div className={"toast" + (msg ? " show" : "")} role="status">{msg}</div>
    </C.Provider>
  );
}
