"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";
import { fmtDate } from "../ScammerCard";
import EvidenceGallery from "@/components/EvidenceGallery";
import { uname } from "@/lib/name";
import { useTT } from "./tt";

export default function BotChecks() {
  const { toast, lang } = useApp();
  const tt = useTT();
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<any[] | null>(null);
  const load = useCallback(async () => { const r = await api("/api/admin/bot-checks?status=" + status); setRows(Array.isArray(r) ? r : []); }, [status]);
  useEffect(() => { load(); }, [load]);
  const VERD: Record<string, string> = { paid: tt("Виплатив", "Paid out", "Выплатил"), partial: tt("Частково", "Partially", "Частично"), not_paid: tt("Не виплатив", "Did not pay", "Не выплатил") };
  const set = async (id: number, s: string) => { const r = await api("/api/admin/bot-checks", { method: "PATCH", body: { id, status: s } }); toast(r.error || tt("Готово", "Done", "Готово")); load(); };
  const del = async (id: number) => { if (!confirm(tt("Видалити перевірку?", "Delete this check?", "Удалить проверку?"))) return; await api("/api/admin/bot-checks?id=" + id, { method: "DELETE" }); load(); };
  return (
    <div>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">{tt("Нові", "New", "Новые")}</option><option value="approved">{tt("Схвалені", "Approved", "Одобренные")}</option><option value="rejected">{tt("Відхилені", "Rejected", "Отклонённые")}</option><option value="all">{tt("Усі", "All", "Все")}</option>
        </select>
      </div>
      <div className="c-date">{tt("Схвалення перевірки не змінює статус бота автоматично — статус виставляєте ви у вкладці «Модерація».", "Approving a check does not change the bot's status automatically — set the status yourself in the Moderation tab.", "Одобрение проверки не меняет статус бота автоматически — статус выставляете вы во вкладке «Модерация».")}</div>
      {!rows ? <div className="empty-sub">{tt("Завантаження…", "Loading…", "Загрузка…")}</div> : rows.length === 0 ? <div className="empty-sub">{tt("Порожньо", "Empty", "Пусто")}</div> : rows.map((c) => (
        <div className="panel admin-item" key={c.id}>
          <div className="admin-head">
            <span className={"verdict v-" + c.verdict}>{VERD[c.verdict] ?? c.verdict}</span>
            <Link className="link-btn" href={"/s/" + c.scammer.id} target="_blank">{uname(c.scammer.name)} (#{c.scammer.id})</Link>
            <span className="c-date">{fmtDate(c.createdAt, lang)} · {c.user?.username ?? "—"} · IP {c.ip || "—"} · {c.status}</span>
          </div>
          {c.comment && <p className="desc">{c.comment}</p>}
          {c.screenshots.length > 0 && <EvidenceGallery items={c.screenshots} compact />}
          <div className="modal-actions">
            {c.status !== "approved" && <button className="btn" onClick={() => set(c.id, "approved")}>{tt("Схвалити", "Approve", "Одобрить")}</button>}
            {c.status !== "rejected" && <button className="btn ghost" onClick={() => set(c.id, "rejected")}>{tt("Відхилити", "Reject", "Отклонить")}</button>}
            <button className="btn ghost danger" onClick={() => del(c.id)}>{tt("Видалити", "Delete", "Удалить")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
