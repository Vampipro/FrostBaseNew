"use client";
import { useState } from "react";
import { api, useApp } from "../Providers";
import { useTT } from "./tt";

type L = "ru" | "ua" | "en";
export type Trio = Record<L, string>;
const ORDER: L[] = ["ru", "ua", "en"];

/** AI-переклад між RU/UA/EN. Заповнює поля, нічого не зберігає — адмін правит і тисне «Зберегти». */
export default function AiTranslate({ values, onFill, kind = "desc" }: { values: Trio; onFill: (patch: Partial<Trio>) => void; kind?: "desc" | "label" }) {
  const { toast } = useApp();
  const tt = useTT();
  const [from, setFrom] = useState<"auto" | L>("auto");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    const src = from === "auto" ? ORDER.find((l) => values[l].trim()) : from;
    const text = src ? values[src].trim() : "";
    if (!text) return toast(tt("Спочатку впиши текст", "Type some text first", "Сначала впиши текст"));
    setBusy(true);
    const r = await api("/api/admin/translate", { body: { text, from, kind }, timeoutMs: 60_000 });
    setBusy(false);
    if (r.error) return toast(r.error);
    const det: L = r.detected;
    const patch: Partial<Trio> = {};
    const overwrite: L[] = [];
    for (const l of ORDER) {
      const next = l === det ? text : String(r[l] ?? "");
      if (!next) continue;
      const cur = values[l].trim();
      if (cur && cur !== next) overwrite.push(l);
      patch[l] = next;
    }
    if (overwrite.length && !window.confirm(tt(
      `Замінити вже заповнені поля (${overwrite.map((x) => x.toUpperCase()).join(", ")}) перекладом?`,
      `Replace already filled fields (${overwrite.map((x) => x.toUpperCase()).join(", ")}) with the translation?`,
      `Заменить уже заполненные поля (${overwrite.map((x) => x.toUpperCase()).join(", ")}) переводом?`,
    ))) return;
    onFill(patch);
    toast(tt("Готово. Перевір переклад і збережи", "Done. Check the translation and save", "Готово. Проверь перевод и сохрани"));
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "6px 0 10px" }}>
      <select value={from} onChange={(e) => setFrom(e.target.value as any)} style={{ maxWidth: 170 }} aria-label={tt("Мова оригіналу", "Source language", "Язык оригинала")}>
        <option value="auto">{tt("Мова: авто", "Language: auto", "Язык: авто")}</option>
        <option value="ru">{tt("З російської", "From Russian", "С русского")}</option>
        <option value="ua">{tt("З української", "From Ukrainian", "С украинского")}</option>
        <option value="en">{tt("З англійської", "From English", "С английского")}</option>
      </select>
      <button type="button" className="btn ghost" disabled={busy} onClick={run}>
        {busy ? tt("Перекладаю…", "Translating…", "Перевожу…") : tt("✨ AI-переклад", "✨ AI translate", "✨ AI-перевод")}
      </button>
    </div>
  );
}
