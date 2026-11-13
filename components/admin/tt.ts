"use client";
import { useApp } from "../Providers";

/** Переклад адмінки: tt("українською", "English", "по-русски") — мова береться з перемикача UA/EN/RU. */
export function useTT() {
  const { lang } = useApp();
  return (ua: string, en: string, ru: string) => (lang === "en" ? en : lang === "ru" ? ru : ua);
}
