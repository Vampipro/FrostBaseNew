"use client";
import { useEffect, useState } from "react";
import { api, useApp } from "@/components/Providers";
import { tr } from "@/lib/i18n";

const EMPTY = { username: "", telegramId: "", statusId: "", shots: "", description: "", scamAmount: "", scamCurrency: "", wantContact: false, contactUsername: "", website: "", botReward: "", botSponsors: "", botUsage: "" };

export default function ReportPage() {
  const { t, lang, toast } = useApp();
  const [meta, setMeta] = useState<any>(null);
  const [tab, setTab] = useState<"report" | "bot">("report");
  const [f, setF] = useState({ ...EMPTY });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const isBot = tab === "bot";

  useEffect(() => { api("/api/meta").then((m) => m.statuses && setMeta(m)); }, []);
  const statuses = (meta?.statuses ?? []).filter((s: any) => s.showInForm);
  const ins = meta?.instruction ?? {};
  const instruction = ins[lang] || ins.ru || ins.ua || ins.en || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const shots = f.shots.split("\n").map((x) => x.trim()).filter(Boolean);
    const common = { username: f.username, screenshots: shots, description: f.description, wantContact: f.wantContact, contactUsername: f.contactUsername, website: f.website };
    const r = await api("/api/submissions", {
      body: isBot
        ? { ...common, kind: "bot", botReward: f.botReward, botSponsors: f.botSponsors, botUsage: f.botUsage }
        : { ...common, telegramId: f.telegramId, statusId: Number(f.statusId), scamAmount: f.scamAmount, scamCurrency: f.scamCurrency },
    });
    setBusy(false);
    if (r.error) return toast(r.error);
    setDone(true);
  };

  if (done) return (
    <main className="page"><div className="panel narrow"><h2 className="zone-title">✓ {t(isBot ? "r_bot_title" : "r_title")}</h2><p className="desc">{t("r_ok")}</p><button className="btn" onClick={() => { setDone(false); setF({ ...EMPTY }); }}>{t("report_again")}</button></div></main>
  );

  return (
    <main className="page">
      <form className="panel narrow form-card" onSubmit={submit}>
        <div className="seg-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!isBot} className={"btn ghost" + (!isBot ? " on" : "")} onClick={() => setTab("report")}>{t("r_tab_report")}</button>
          <button type="button" role="tab" aria-selected={isBot} className={"btn ghost" + (isBot ? " on" : "")} onClick={() => setTab("bot")}>🤖 {t("r_tab_bot")}</button>
        </div>
        <h2 className="zone-title" style={{ marginTop: 0 }}>{t(isBot ? "r_bot_title" : "r_title")}</h2>

        {isBot ? (
          <>
            <div className="hint">{t("r_bot_hint")}</div>
            <label className="field"><span>{t("r_bot_username")} *</span><input required value={f.username} onChange={(e) => set("username", e.target.value)} maxLength={64} placeholder="@example_bot" /></label>
            <label className="field"><span>{t("r_bot_reward")} *</span><input required value={f.botReward} onChange={(e) => set("botReward", e.target.value)} maxLength={80} placeholder={t("r_bot_reward_ph")} /></label>
            <div className="row2">
              <label className="field"><span>{t("r_bot_sponsors")} *</span><input required value={f.botSponsors} onChange={(e) => set("botSponsors", e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={5} placeholder="3" /></label>
              <label className="field"><span>{t("r_bot_usage")} *</span><input required value={f.botUsage} onChange={(e) => set("botUsage", e.target.value)} maxLength={60} placeholder={t("r_bot_usage_ph")} /></label>
            </div>
            <label className="field"><span>{t("r_bot_desc")}</span><textarea rows={3} maxLength={2000} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
            <label className="field"><span>{t("r_shots")}</span><textarea rows={3} value={f.shots} onChange={(e) => set("shots", e.target.value)} placeholder="https://t.me/..." /></label>
          </>
        ) : (
          <>
            {instruction && <div className="instruction"><b>{t("r_instruction")}</b><pre>{instruction}</pre></div>}
            <div className="row2">
              <label className="field"><span>{t("r_username")}</span><input value={f.username} onChange={(e) => set("username", e.target.value)} maxLength={64} placeholder="@username" /></label>
              <label className="field"><span>{t("r_id")}</span><input value={f.telegramId} onChange={(e) => set("telegramId", e.target.value.replace(/\D/g, ""))} maxLength={19} inputMode="numeric" placeholder="123456789" /></label>
            </div>
            <div className="hint">{t("r_one_required")}</div>
            <label className="field"><span>{t("r_tag")} *</span>
              <select required value={f.statusId} onChange={(e) => set("statusId", e.target.value)}>
                <option value="">—</option>
                {statuses.map((s: any) => <option key={s.id} value={s.id}>{tr(s, lang)}</option>)}
              </select>
            </label>
            <label className="field"><span>{t("r_shots")} *</span><textarea required rows={4} value={f.shots} onChange={(e) => set("shots", e.target.value)} placeholder="https://t.me/..." /></label>
            <label className="field"><span>{t("r_desc")}</span><textarea rows={4} maxLength={2000} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
            <div className="row2">
              <label className="field"><span>{t("r_amount")}</span><input value={f.scamAmount} onChange={(e) => set("scamAmount", e.target.value)} inputMode="decimal" maxLength={24} /></label>
              <label className="field"><span>{t("r_currency")}</span><input value={f.scamCurrency} onChange={(e) => set("scamCurrency", e.target.value)} maxLength={24} placeholder="TON / USDT / ₴" /></label>
            </div>
          </>
        )}

        <label className="check"><input type="checkbox" checked={f.wantContact} onChange={(e) => set("wantContact", e.target.checked)} /> {t("r_contact")}</label>
        {f.wantContact && (
          <label className="field"><span>{t("r_contact_user")} *</span><input required value={f.contactUsername} onChange={(e) => set("contactUsername", e.target.value)} maxLength={64} placeholder="@username" /></label>
        )}
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => set("website", e.target.value)} />
        <div className="hint">{t("r_limit")}{meta?.limits?.submissionsPerIp ?? 3} / {meta?.limits?.submissionsWindowHours ?? 24}h</div>
        <button className="btn" type="submit" disabled={busy}>{t("r_submit")}</button>
      </form>
    </main>
  );
}
