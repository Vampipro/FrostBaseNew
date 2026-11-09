"use client";
import { useEffect, useState } from "react";
import { api, useApp } from "@/components/Providers";
import { tr } from "@/lib/i18n";

export default function ReportPage() {
  const { t, lang, toast } = useApp();
  const [meta, setMeta] = useState<any>(null);
  const [f, setF] = useState({ username: "", telegramId: "", statusId: "", shots: "", description: "", scamAmount: "", scamCurrency: "", wantContact: false, contactUsername: "", website: "" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => { api("/api/meta").then((m) => m.statuses && setMeta(m)); }, []);
  const statuses = (meta?.statuses ?? []).filter((s: any) => s.showInForm);
  const instruction = meta?.instruction?.[lang] || meta?.instruction?.ua || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await api("/api/submissions", {
      body: {
        username: f.username, telegramId: f.telegramId, statusId: Number(f.statusId),
        screenshots: f.shots.split("\n").map((x) => x.trim()).filter(Boolean),
        description: f.description, scamAmount: f.scamAmount, scamCurrency: f.scamCurrency,
        wantContact: f.wantContact, contactUsername: f.contactUsername, website: f.website,
      },
    });
    setBusy(false);
    if (r.error) return toast(r.error);
    setDone(true);
  };

  if (done) return (
    <main className="page"><div className="panel narrow"><h2 className="zone-title">✓ {t("r_title")}</h2><p className="desc">{t("r_ok")}</p></div></main>
  );

  return (
    <main className="page">
      <form className="panel narrow form-card" onSubmit={submit}>
        <h2 className="zone-title" style={{ marginTop: 0 }}>{t("r_title")}</h2>
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
