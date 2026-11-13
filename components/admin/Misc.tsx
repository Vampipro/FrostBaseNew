"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";
import { fmtDate } from "../ScammerCard";
import { safeHref } from "@/lib/url";
import { uname } from "@/lib/name";
import { useTT } from "./tt";

export function Comments() {
  const { toast, lang } = useApp();
  const tt = useTT();
  const [reports, setReports] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([api("/api/admin/comment-reports"), api("/api/admin/comments")]);
    setReports(Array.isArray(a) ? a : []);
    setPending(Array.isArray(b) ? b : []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const done = tt("Готово", "Done", "Готово");
  const rep = async (id: number, action: string) => { const r = await api("/api/admin/comment-reports", { method: "PATCH", body: { id, action } }); toast(r.error || done); load(); };
  const cm = async (id: number, body: any) => { await api("/api/admin/comments", { method: "PATCH", body: { ...body, id } }); load(); };
  return (
    <div>
      <h3 className="sub-title" style={{ marginTop: 0 }}>{tt("Скарги на коментарі", "Comment reports", "Жалобы на комментарии")} ({reports.length})</h3>
      {reports.length === 0 && <div className="c-date">{tt("Немає нових скарг", "No new reports", "Нет новых жалоб")}</div>}
      {reports.map((r) => (
        <div className="panel admin-item" key={r.id}>
          <div className="c-date">{fmtDate(r.createdAt, lang)} · IP {r.ip || "—"} · {tt("автор коментаря", "comment author", "автор комментария")}: <b>{r.comment.user.username}</b> · {tt("запис", "entry", "запись")} <Link className="link-btn" href={"/s/" + r.comment.scammerId} target="_blank">#{r.comment.scammerId}</Link></div>
          <p className="desc">{r.comment.content}</p>
          {r.reason && <div className="c-date">{tt("Причина", "Reason", "Причина")}: {r.reason}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={() => rep(r.id, "hide")}>{tt("Сховати коментар", "Hide comment", "Скрыть комментарий")}</button>
            <button className="btn ghost" onClick={() => rep(r.id, "dismiss")}>{tt("Відхилити скаргу", "Dismiss report", "Отклонить жалобу")}</button>
          </div>
        </div>
      ))}
      <h3 className="sub-title">{tt("Очікують схвалення", "Awaiting approval", "Ожидают одобрения")} ({pending.length})</h3>
      {pending.map((c) => (
        <div className="panel admin-item" key={c.id}>
          <div className="c-date">{fmtDate(c.createdAt, lang)} · {c.user.username} · {tt("запис", "entry", "запись")} #{c.scammerId}</div>
          <p className="desc">{c.content}</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => cm(c.id, { approved: true })}>{tt("Схвалити", "Approve", "Одобрить")}</button>
            <button className="btn ghost danger" onClick={() => cm(c.id, { hidden: true })}>{tt("Сховати", "Hide", "Скрыть")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Appeals() {
  const { toast, lang } = useApp();
  const tt = useTT();
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => { const r = await api("/api/admin/appeals?status=" + status); setRows(Array.isArray(r) ? r : []); }, [status]);
  useEffect(() => { load(); }, [load]);
  const set = async (id: number, s: string) => { const r = await api("/api/admin/appeals", { method: "PATCH", body: { id, status: s } }); toast(r.error || tt("Готово", "Done", "Готово")); load(); };
  return (
    <div>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">{tt("Нові", "New", "Новые")}</option><option value="accepted">{tt("Прийняті", "Accepted", "Принятые")}</option><option value="rejected">{tt("Відхилені", "Rejected", "Отклонённые")}</option><option value="banned">{tt("Забанені", "Banned", "Забаненные")}</option><option value="all">{tt("Усі", "All", "Все")}</option>
        </select>
      </div>
      {rows.length === 0 && <div className="empty-sub">{tt("Порожньо", "Empty", "Пусто")}</div>}
      {rows.map((a) => (
        <div className="panel admin-item" key={a.id}>
          <div className="admin-head"><b>{tt("Апеляція", "Appeal", "Апелляция")} #{a.id}</b><Link className="link-btn" href={"/s/" + a.scammer.id} target="_blank">{uname(a.scammer.name)} (#{a.scammer.id})</Link><span className="c-date">{fmtDate(a.createdAt, lang)} · {a.user?.username ?? tt("гість", "guest", "гость")} · IP {a.ip || "—"} · {a.status}</span></div>
          <p className="desc">{a.description}</p>
          {a.screenshots.length > 0 && <ul className="links">{a.screenshots.map((u: string, i: number) => <li key={i}><a href={safeHref(u)} target="_blank" rel="noopener noreferrer nofollow">{u.slice(0, 70)}</a></li>)}</ul>}
          <div className="modal-actions">
            <button className="btn" onClick={() => set(a.id, "accepted")}>{tt("Прийняти", "Accept", "Принять")}</button>
            <button className="btn ghost" onClick={() => set(a.id, "rejected")}>{tt("Відхилити", "Reject", "Отклонить")}</button>
            <button className="btn ghost danger" onClick={() => set(a.id, "banned")}>{tt("Відхилити + бан IP", "Reject + ban IP", "Отклонить + бан IP")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsTab() {
  const { toast } = useApp();
  const tt = useTT();
  const [s, setS] = useState<any>(null);
  useEffect(() => { api("/api/admin/settings").then((r) => r.limits && setS({ ...r, instruction: { ua: "", en: "", ru: "", ...r.instruction } })); }, []);
  if (!s) return <div className="empty-sub">{tt("Завантаження…", "Loading…", "Загрузка…")}</div>;
  const save = async () => { const r = await api("/api/admin/settings", { method: "PUT", body: s }); toast(r.error || tt("Збережено", "Saved", "Сохранено")); };
  return (
    <div className="panel form-card">
      <h3 className="sub-title" style={{ marginTop: 0 }}>{tt("Інструкція у формі скарги", "Instruction in the report form", "Инструкция в форме жалобы")}</h3>
      {["ua", "en", "ru"].map((l) => (
        <label className="field" key={l}><span>{l.toUpperCase()}</span><textarea rows={5} value={s.instruction[l]} onChange={(e) => setS({ ...s, instruction: { ...s.instruction, [l]: e.target.value } })} /></label>
      ))}
      <h3 className="sub-title">{tt("Антиспам", "Anti-spam", "Антиспам")}</h3>
      <div className="row2">
        <label className="field"><span>{tt("Заявок з одного IP", "Submissions per IP", "Заявок с одного IP")}</span><input type="number" min={1} value={s.limits.submissionsPerIp} onChange={(e) => setS({ ...s, limits: { ...s.limits, submissionsPerIp: e.target.value } })} /></label>
        <label className="field"><span>{tt("За скільки годин", "Within how many hours", "За сколько часов")}</span><input type="number" min={1} value={s.limits.submissionsWindowHours} onChange={(e) => setS({ ...s, limits: { ...s.limits, submissionsWindowHours: e.target.value } })} /></label>
      </div>
      <label className="check"><input type="checkbox" checked={s.appealsEnabled} onChange={(e) => setS({ ...s, appealsEnabled: e.target.checked })} /> {tt("Апеляції увімкнені (глобально)", "Appeals enabled (globally)", "Апелляции включены (глобально)")}</label>
      <div style={{ marginTop: 14 }}><button className="btn" onClick={save}>{tt("Зберегти", "Save", "Сохранить")}</button></div>
    </div>
  );
}

export function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useApp();
  const tt = useTT();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => { const r = await api("/api/admin/users?q=" + encodeURIComponent(q)); setRows(Array.isArray(r) ? r : []); }, [q]);
  useEffect(() => { if (isAdmin) load(); }, [load, isAdmin]);
  if (!isAdmin) return <div className="empty-sub">{tt("Лише для адміна", "Admins only", "Только для админа")}</div>;
  const patch = async (id: number, body: any) => { const r = await api("/api/admin/users", { method: "PATCH", body: { ...body, id } }); toast(r.error || tt("Готово", "Done", "Готово")); load(); };
  return (
    <div>
      <div className="toolbar"><input placeholder={tt("Пошук користувача", "Search users", "Поиск пользователя")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {rows.map((u) => (
        <div className="panel admin-item" key={u.id}>
          <div className="admin-head">
            <b>#{u.id} {u.username}</b>
            <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select>
            <span className="c-date">{fmtDate(u.createdAt)}</span>
            {u.banReason
              ? <><span className="st-badge st-pending">{tt("бан", "ban", "бан")}: {u.banReason}</span><button className="link-btn" onClick={() => patch(u.id, { banReason: "" })}>{tt("розбанити", "unban", "разбанить")}</button></>
              : <button className="link-btn" onClick={() => { const r = window.prompt(tt("Причина блокування:", "Reason for the ban:", "Причина блокировки:"), ""); if (r) patch(u.id, { banReason: r }); }}>{tt("заблокувати", "ban", "заблокировать")}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BansTab({ isAdmin }: { isAdmin: boolean }) {
  const { toast, lang } = useApp();
  const tt = useTT();
  const [rows, setRows] = useState<any[]>([]);
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const load = useCallback(async () => { const r = await api("/api/admin/bans"); setRows(Array.isArray(r) ? r : []); }, []);
  useEffect(() => { load(); }, [load]);
  const add = async () => { const r = await api("/api/admin/bans", { body: { ip, reason } }); if (r.error) return toast(r.error); setIp(""); setReason(""); load(); };
  const del = async (id: number) => { await api("/api/admin/bans?id=" + id, { method: "DELETE" }); load(); };
  return (
    <div>
      <div className="toolbar">
        <input placeholder="IP" value={ip} onChange={(e) => setIp(e.target.value)} />
        <input placeholder={tt("Причина", "Reason", "Причина")} value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="btn" onClick={add}>{tt("Забанити", "Ban", "Забанить")}</button>
      </div>
      {rows.map((b) => (
        <div className="panel admin-item" key={b.id}>
          <div className="admin-head"><b>{b.ip}</b><span className="c-date">{b.reason || "—"} · {b.bannedBy || "—"} · {fmtDate(b.createdAt, lang)}</span>{isAdmin && <button className="link-btn" onClick={() => del(b.id)}>{tt("розбанити", "unban", "разбанить")}</button>}</div>
        </div>
      ))}
      {rows.length === 0 && <div className="empty-sub">{tt("Бан-лист порожній", "The ban list is empty", "Бан-лист пуст")}</div>}
    </div>
  );
}
