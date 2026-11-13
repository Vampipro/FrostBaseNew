"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";
import { fmtDate } from "../ScammerCard";
import EvidenceGallery from "@/components/EvidenceGallery";
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
          {a.screenshots.length > 0 && <EvidenceGallery items={a.screenshots} compact />}
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
  const [debouncedQ, setDebouncedQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);
  const load = useCallback(async () => {
    const r = await api(`/api/admin/users?q=${encodeURIComponent(debouncedQ)}&page=${page}`);
    setRows(Array.isArray(r.items) ? r.items : []);
    setTotal(Number(r.total) || 0);
    setPages(Number(r.pages) || 1);
  }, [debouncedQ, page]);
  useEffect(() => { if (isAdmin) load(); }, [load, isAdmin]);

  if (!isAdmin) return <div className="empty-sub">{tt("Лише для адміна", "Admins only", "Только для админа")}</div>;

  const beginEdit = (u: any) => {
    setEditingId(u.id);
    setDraft({
      username: u.username || "",
      role: u.role || "user",
      image: u.image || "",
      isSponsor: !!u.isSponsor,
      donated: String(u.donated ?? "0"),
      banReason: u.banReason || "",
    });
  };

  const save = async (id: number) => {
    if (saving || !draft) return;
    setSaving(true);
    const r = await api("/api/admin/users", { method: "PATCH", body: { ...draft, id } });
    setSaving(false);
    if (r.error) return toast(r.error);
    toast(tt("Дані користувача оновлено", "User updated", "Данные пользователя обновлены"));
    setEditingId(null);
    setDraft(null);
    load();
  };

  const remove = async (u: any) => {
    const confirmed = window.confirm(tt(
      `Видалити користувача @${u.username} назавжди? Його коментарі будуть видалені, а перевірки й заявки залишаться без прив’язки до акаунта.`,
      `Permanently delete @${u.username}? Their comments will be deleted; checks and submissions will remain without the account link.`,
      `Удалить пользователя @${u.username} навсегда? Его комментарии будут удалены, а проверки и заявки останутся без привязки к аккаунту.`,
    ));
    if (!confirmed || deletingId !== null) return;
    setDeletingId(u.id);
    const r = await api(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (r.error) return toast(r.error);
    toast(tt("Користувача видалено", "User deleted", "Пользователь удалён"));
    if (editingId === u.id) { setEditingId(null); setDraft(null); }
    load();
  };

  return (
    <div className="users-manager">
      <div className="users-toolbar">
        <label className="users-search"><span>⌕</span><input placeholder={tt("Пошук за логіном або ID…", "Search by username or ID…", "Поиск по логину или ID…")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></label>
        <span className="users-total">{tt("Знайдено", "Found", "Найдено")}: <b>{total}</b></span>
      </div>
      {rows.length === 0 ? <div className="empty-sub">{tt("Користувачів не знайдено", "No users found", "Пользователи не найдены")}</div> : rows.map((u) => (
        <article className={`panel user-admin-card${editingId === u.id ? " is-editing" : ""}`} key={u.id}>
          <div className="user-admin-head">
            <div className="user-admin-avatar">{u.image ? <img src={u.image} alt="" loading="lazy" /> : (u.username?.[0] || "?").toUpperCase()}</div>
            <div className="user-admin-identity">
              <b>#{u.id} @{u.username}</b>
              <span>{tt("Створений", "Created", "Создан")}: {fmtDate(u.createdAt)}</span>
            </div>
            <div className="user-admin-badges">
              <span className={`user-role role-${u.role}`}>{u.role}</span>
              {u.isSponsor && <span className="user-sponsor">✦ {tt("Спонсор", "Sponsor", "Спонсор")}</span>}
              {u.banReason && <span className="user-banned">{tt("Заблокований", "Banned", "Заблокирован")}</span>}
            </div>
            <div className="user-admin-actions">
              <button className="btn ghost" onClick={() => editingId === u.id ? (setEditingId(null), setDraft(null)) : beginEdit(u)}>{editingId === u.id ? tt("Закрити", "Close", "Закрыть") : tt("Редагувати", "Edit", "Редактировать")}</button>
              <button className="btn ghost danger" disabled={deletingId === u.id} onClick={() => remove(u)}>{deletingId === u.id ? "…" : tt("Видалити", "Delete", "Удалить")}</button>
            </div>
          </div>
          <div className="user-admin-meta">
            <span>{tt("Донати", "Donated", "Донаты")}: <b>{Number(u.donated || 0).toFixed(2)}</b></span>
            {u.banReason && <span>{tt("Причина", "Reason", "Причина")}: {u.banReason}</span>}
          </div>
          {editingId === u.id && draft && (
            <div className="user-editor">
              <div className="users-form-grid">
                <label className="field"><span>{tt("Логін", "Username", "Логин")}</span><input maxLength={24} value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} /></label>
                <label className="field"><span>{tt("Роль", "Role", "Роль")}</span><select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></label>
                <label className="field"><span>{tt("Донат", "Donated", "Донат")}</span><input type="number" min="0" max="9999999999.99" step="0.01" value={draft.donated} onChange={(e) => setDraft({ ...draft, donated: e.target.value })} /></label>
                <label className="field users-field-wide"><span>{tt("Посилання на аватар (HTTPS)", "Avatar URL (HTTPS)", "Ссылка на аватар (HTTPS)")}</span><input maxLength={500} placeholder="https://…" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} /></label>
                <label className="field users-field-wide"><span>{tt("Причина блокування (порожньо = розблокувати)", "Ban reason (empty = unban)", "Причина блокировки (пусто = разблокировать)")}</span><input maxLength={200} value={draft.banReason} onChange={(e) => setDraft({ ...draft, banReason: e.target.value })} /></label>
              </div>
              <label className="check"><input type="checkbox" checked={draft.isSponsor} onChange={(e) => setDraft({ ...draft, isSponsor: e.target.checked })} /> {tt("Статус спонсора", "Sponsor status", "Статус спонсора")}</label>
              <div className="modal-actions"><button className="btn" disabled={saving} onClick={() => save(u.id)}>{saving ? tt("Збереження…", "Saving…", "Сохранение…") : tt("Зберегти зміни", "Save changes", "Сохранить изменения")}</button><button className="btn ghost" disabled={saving} onClick={() => { setEditingId(null); setDraft(null); }}>{tt("Скасувати", "Cancel", "Отмена")}</button></div>
            </div>
          )}
        </article>
      ))}
      {pages > 1 && <div className="pager users-pager"><button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</button><span>{page} / {pages}</span><button className="btn ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>→</button></div>}
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
