"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";
import { fmtDate } from "../ScammerCard";

export function Comments() {
  const { toast, lang } = useApp();
  const [reports, setReports] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([api("/api/admin/comment-reports"), api("/api/admin/comments")]);
    setReports(Array.isArray(a) ? a : []);
    setPending(Array.isArray(b) ? b : []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const rep = async (id: number, action: string) => { const r = await api("/api/admin/comment-reports/" + id, { method: "PATCH", body: { action } }); toast(r.error || "Готово"); load(); };
  const cm = async (id: number, body: any) => { await api("/api/admin/comments/" + id, { method: "PATCH", body }); load(); };
  return (
    <div>
      <h3 className="sub-title" style={{ marginTop: 0 }}>Скарги на коментарі ({reports.length})</h3>
      {reports.length === 0 && <div className="c-date">Немає нових скарг</div>}
      {reports.map((r) => (
        <div className="panel admin-item" key={r.id}>
          <div className="c-date">{fmtDate(r.createdAt, lang)} · IP {r.ip || "—"} · автор коментаря: <b>{r.comment.user.username}</b> · запис <Link className="link-btn" href={"/s/" + r.comment.scammerId} target="_blank">#{r.comment.scammerId}</Link></div>
          <p className="desc">{r.comment.content}</p>
          {r.reason && <div className="c-date">Причина: {r.reason}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={() => rep(r.id, "hide")}>Сховати коментар</button>
            <button className="btn ghost" onClick={() => rep(r.id, "dismiss")}>Відхилити скаргу</button>
          </div>
        </div>
      ))}
      <h3 className="sub-title">Очікують схвалення ({pending.length})</h3>
      {pending.map((c) => (
        <div className="panel admin-item" key={c.id}>
          <div className="c-date">{fmtDate(c.createdAt, lang)} · {c.user.username} · запис #{c.scammerId}</div>
          <p className="desc">{c.content}</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => cm(c.id, { approved: true })}>Схвалити</button>
            <button className="btn ghost danger" onClick={() => cm(c.id, { hidden: true })}>Сховати</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Appeals() {
  const { toast, lang } = useApp();
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => { const r = await api("/api/admin/appeals?status=" + status); setRows(Array.isArray(r) ? r : []); }, [status]);
  useEffect(() => { load(); }, [load]);
  const set = async (id: number, s: string) => { const r = await api("/api/admin/appeals/" + id, { method: "PATCH", body: { status: s } }); toast(r.error || "Готово"); load(); };
  return (
    <div>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Нові</option><option value="accepted">Прийняті</option><option value="rejected">Відхилені</option><option value="banned">Забанені</option><option value="all">Усі</option>
        </select>
      </div>
      {rows.length === 0 && <div className="empty-sub">Порожньо</div>}
      {rows.map((a) => (
        <div className="panel admin-item" key={a.id}>
          <div className="admin-head"><b>Апеляція #{a.id}</b><Link className="link-btn" href={"/s/" + a.scammer.id} target="_blank">@{a.scammer.name} (#{a.scammer.id})</Link><span className="c-date">{fmtDate(a.createdAt, lang)} · {a.user?.username ?? "гість"} · IP {a.ip || "—"} · {a.status}</span></div>
          <p className="desc">{a.description}</p>
          {a.screenshots.length > 0 && <ul className="links">{a.screenshots.map((u: string, i: number) => <li key={i}><a href={u} target="_blank" rel="noopener noreferrer nofollow">{u.slice(0, 70)}</a></li>)}</ul>}
          <div className="modal-actions">
            <button className="btn" onClick={() => set(a.id, "accepted")}>Прийняти</button>
            <button className="btn ghost" onClick={() => set(a.id, "rejected")}>Відхилити</button>
            <button className="btn ghost danger" onClick={() => set(a.id, "banned")}>Відхилити + бан IP</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsTab() {
  const { toast } = useApp();
  const [s, setS] = useState<any>(null);
  useEffect(() => { api("/api/admin/settings").then((r) => r.limits && setS({ ...r, instruction: { ua: "", en: "", ru: "", ...r.instruction } })); }, []);
  if (!s) return <div className="empty-sub">Завантаження…</div>;
  const save = async () => { const r = await api("/api/admin/settings", { method: "PUT", body: s }); toast(r.error || "Збережено"); };
  return (
    <div className="panel form-card">
      <h3 className="sub-title" style={{ marginTop: 0 }}>Інструкція у формі жалоби</h3>
      {["ua", "en", "ru"].map((l) => (
        <label className="field" key={l}><span>{l.toUpperCase()}</span><textarea rows={5} value={s.instruction[l]} onChange={(e) => setS({ ...s, instruction: { ...s.instruction, [l]: e.target.value } })} /></label>
      ))}
      <h3 className="sub-title">Антиспам</h3>
      <div className="row2">
        <label className="field"><span>Заявок з одного IP</span><input type="number" min={1} value={s.limits.submissionsPerIp} onChange={(e) => setS({ ...s, limits: { ...s.limits, submissionsPerIp: e.target.value } })} /></label>
        <label className="field"><span>За скільки годин</span><input type="number" min={1} value={s.limits.submissionsWindowHours} onChange={(e) => setS({ ...s, limits: { ...s.limits, submissionsWindowHours: e.target.value } })} /></label>
      </div>
      <label className="check"><input type="checkbox" checked={s.appealsEnabled} onChange={(e) => setS({ ...s, appealsEnabled: e.target.checked })} /> Апеляції увімкнені (глобально)</label>
      <div style={{ marginTop: 14 }}><button className="btn" onClick={save}>Зберегти</button></div>
    </div>
  );
}

export function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useApp();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => { const r = await api("/api/admin/users?q=" + encodeURIComponent(q)); setRows(Array.isArray(r) ? r : []); }, [q]);
  useEffect(() => { if (isAdmin) load(); }, [load, isAdmin]);
  if (!isAdmin) return <div className="empty-sub">Лише для адміна</div>;
  const patch = async (id: number, body: any) => { const r = await api("/api/admin/users/" + id, { method: "PATCH", body }); toast(r.error || "Готово"); load(); };
  return (
    <div>
      <div className="toolbar"><input placeholder="Пошук користувача" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {rows.map((u) => (
        <div className="panel admin-item" key={u.id}>
          <div className="admin-head">
            <b>#{u.id} {u.username}</b>
            <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select>
            <span className="c-date">{fmtDate(u.createdAt)}</span>
            {u.banReason
              ? <><span className="st-badge st-pending">бан: {u.banReason}</span><button className="link-btn" onClick={() => patch(u.id, { banReason: "" })}>розбанити</button></>
              : <button className="link-btn" onClick={() => { const r = window.prompt("Причина блокування:", ""); if (r) patch(u.id, { banReason: r }); }}>заблокувати</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BansTab({ isAdmin }: { isAdmin: boolean }) {
  const { toast, lang } = useApp();
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
        <input placeholder="Причина" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="btn" onClick={add}>Забанити</button>
      </div>
      {rows.map((b) => (
        <div className="panel admin-item" key={b.id}>
          <div className="admin-head"><b>{b.ip}</b><span className="c-date">{b.reason || "—"} · {b.bannedBy || "—"} · {fmtDate(b.createdAt, lang)}</span>{isAdmin && <button className="link-btn" onClick={() => del(b.id)}>розбанити</button>}</div>
        </div>
      ))}
      {rows.length === 0 && <div className="empty-sub">Бан-лист порожній</div>}
    </div>
  );
}
