"use client";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";
import { Badges, fmtDate } from "../ScammerCard";
import Modal from "../Modal";
import { safeHref } from "@/lib/url";
import { uname, pickDesc } from "@/lib/name";

const EMPTY = { name: "", telegramUserId: "", description: "", typeId: "", statusIds: [] as number[], scamAmount: "", scamCurrency: "", scamDate: "", proofLink: "", screenshots: "", moderation: "approved", appealsDisabled: false, descUa: "", descEn: "", botCheck: false, botReward: "", botSponsors: "", botUsage: "", likeCount: 0, neutralCount: 0, dislikeCount: 0, viewCount: 0, searchCount: 0 };

function Editor({ item, statuses, types, onClose, onSaved }: { item: any | null; statuses: any[]; types: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp();
  const [f, setF] = useState<any>(() =>
    item ? { ...EMPTY, ...item, descUa: item.descriptionI18n?.ua ?? "", descEn: item.descriptionI18n?.en ?? "", botSponsors: item.botSponsors ?? "", telegramUserId: item.telegramUserId ?? "", typeId: item.typeId ?? "", scamAmount: item.scamAmount ?? "", scamDate: item.scamDate ? String(item.scamDate).slice(0, 10) : "", screenshots: (item.screenshots || []).join("\n") } : { ...EMPTY }
  );
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  // «Кілька мов» — необов'язково. Без галочки опис тільки російською (за замовчуванням)
  const [multi, setMulti] = useState<boolean>(() => !!(item?.descriptionI18n?.ua || item?.descriptionI18n?.en));
  const num = (k: string, label: string) => (
    <label className="field"><span>{label}</span><input type="number" min={0} value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
  );
  const save = async () => {
    const body = {
      name: f.name, telegramUserId: String(f.telegramUserId), description: f.description, descriptionI18n: multi ? { ua: f.descUa, en: f.descEn } : {}, botCheck: !!f.botCheck, botReward: f.botReward, botSponsors: String(f.botSponsors), botUsage: f.botUsage, typeId: f.typeId || null, statusIds: f.statusIds,
      scamAmount: String(f.scamAmount), scamCurrency: f.scamCurrency, scamDate: f.scamDate, proofLink: f.proofLink,
      screenshots: f.screenshots.split("\n").map((x: string) => x.trim()).filter(Boolean), moderation: f.moderation, appealsDisabled: f.appealsDisabled,
      likeCount: Number(f.likeCount), neutralCount: Number(f.neutralCount), dislikeCount: Number(f.dislikeCount), viewCount: Number(f.viewCount), searchCount: Number(f.searchCount),
    };
    const r = item ? await api("/api/admin/scammers", { method: "PATCH", body: { ...body, id: item.id } }) : await api("/api/admin/scammers", { body });
    if (r.error) return toast(r.error);
    toast("Збережено");
    onSaved();
    onClose();
  };
  return (
    <Modal wide onClose={onClose}>
        <h3 className="zone-title" style={{ marginTop: 0 }}>{item ? `Редагувати #${item.id}` : "Новий запис"}</h3>
        <div className="row2">
          <label className="field"><span>Юзернейм</span><input value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className="field"><span>Telegram ID</span><input value={f.telegramUserId} onChange={(e) => set("telegramUserId", e.target.value.replace(/\D/g, ""))} /></label>
        </div>
        <label className="field"><span>Теги (можна кілька)</span>
          <div className="chips-sel">
            {statuses.map((s) => (
              <button type="button" key={s.id} className={"tag-chip" + (f.statusIds.includes(s.id) ? " on" : "")} style={{ ["--tc" as any]: s.color }}
                onClick={() => set("statusIds", f.statusIds.includes(s.id) ? f.statusIds.filter((x: number) => x !== s.id) : [...f.statusIds, s.id])}>{s.label}{s.hidden ? " (прихов.)" : ""}</button>
            ))}
          </div>
        </label>
        <div className="row2">
          <label className="field"><span>Тип</span>
            <select value={f.typeId} onChange={(e) => set("typeId", e.target.value)}><option value="">—</option>{types.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
          </label>
          <label className="field"><span>Модерація</span>
            <select value={f.moderation} onChange={(e) => set("moderation", e.target.value)}><option value="pending">На модерації</option><option value="approved">Прийнято</option><option value="rejected">Відхилено</option></select>
          </label>
        </div>
        <label className="check"><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} /> Описи кількома мовами (необов'язково; без галочки — лише російською)</label>
        <label className="field"><span>{multi ? "Опис (RU)" : "Опис (RU, за замовчуванням)"}</span><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
        {multi && (
          <>
            <label className="field"><span>Опис (UA)</span><textarea rows={3} value={f.descUa} onChange={(e) => set("descUa", e.target.value)} placeholder="Якщо порожньо — показується російський" /></label>
            <label className="field"><span>Опис (EN)</span><textarea rows={3} value={f.descEn} onChange={(e) => set("descEn", e.target.value)} placeholder="If empty, the Russian text is shown" /></label>
          </>
        )}
        <label className="check"><input type="checkbox" checked={!!f.botCheck} onChange={(e) => set("botCheck", e.target.checked)} /> Перевірка бота (показувати нагороду, спонсорів і використання)</label>
        {f.botCheck && (
          <div className="row3">
            <label className="field"><span>Нагорода</span><input value={f.botReward} maxLength={80} onChange={(e) => set("botReward", e.target.value)} /></label>
            <label className="field"><span>Спонсорів</span><input value={f.botSponsors} inputMode="numeric" maxLength={5} onChange={(e) => set("botSponsors", e.target.value.replace(/\D/g, ""))} /></label>
            <label className="field"><span>Використання</span><input value={f.botUsage} maxLength={60} onChange={(e) => set("botUsage", e.target.value)} /></label>
          </div>
        )}
        <div className="row3">
          <label className="field"><span>Сума</span><input value={f.scamAmount} onChange={(e) => set("scamAmount", e.target.value)} /></label>
          <label className="field"><span>Валюта</span><input value={f.scamCurrency} onChange={(e) => set("scamCurrency", e.target.value)} /></label>
          <label className="field"><span>Дата скаму</span><input type="date" value={f.scamDate} onChange={(e) => set("scamDate", e.target.value)} /></label>
        </div>
        <label className="field"><span>Скріншоти (посилання, по одному в рядок)</span><textarea rows={3} value={f.screenshots} onChange={(e) => set("screenshots", e.target.value)} /></label>
        <label className="field"><span>Посилання на доказ</span><input value={f.proofLink} onChange={(e) => set("proofLink", e.target.value)} /></label>
        <div className="row3">{num("likeCount", "Лайки (скам)")}{num("neutralCount", "Нейтрал")}{num("dislikeCount", "Дизлайки")}</div>
        <div className="row2">{num("viewCount", "Перегляди")}{num("searchCount", "Пошуки")}</div>
        <label className="check"><input type="checkbox" checked={f.appealsDisabled} onChange={(e) => set("appealsDisabled", e.target.checked)} /> Заборонити апеляції для цього запису</label>
        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn" onClick={save}>Зберегти</button>
          <button className="btn ghost" onClick={onClose}>Скасувати</button>
        </div>
    </Modal>
  );
}

export default function Moderation() {
  const { toast, lang } = useApp();
  const [status, setStatus] = useState("pending");
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState("desc");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null | undefined>(undefined); // undefined=закрито, null=новий

  const load = useCallback(async () => {
    const p = new URLSearchParams({ status, sort, dir, q, page: String(page) });
    setData(await api("/api/admin/moderation?" + p));
  }, [status, sort, dir, q, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api("/api/admin/dict?kind=statuses").then((r) => Array.isArray(r) && setStatuses(r));
    api("/api/admin/dict?kind=types").then((r) => Array.isArray(r) && setTypes(r));
  }, []);

  const act = async (id: number, action: string, extra: any = {}) => {
    const r = await api("/api/admin/scammer-action", { body: { id, action, ...extra } });
    if (r.error) return toast(r.error);
    toast("Готово");
    load();
  };
  const del = async (id: number) => {
    if (!confirm(`Видалити запис #${id} остаточно?`)) return;
    await api("/api/admin/scammers?id=" + id, { method: "DELETE" });
    load();
  };
  const ban = async (ip: string) => {
    if (!ip || !confirm(`Забанити IP ${ip}?`)) return;
    const r = await api("/api/admin/bans", { body: { ip, reason: "Спам у жалобах" } });
    toast(r.error || "IP забанено");
  };

  return (
    <div>
      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="pending">На модерації</option><option value="approved">Прийняті</option><option value="rejected">Відхилені</option><option value="all">Усі</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">За датою</option><option value="likes">За лайками</option><option value="dislikes">За дизлайками</option>
          <option value="views">За переглядами</option><option value="searches">За пошуками</option><option value="complaints">За кількістю жалоб</option>
        </select>
        <select value={dir} onChange={(e) => setDir(e.target.value)}><option value="desc">↓ спадання</option><option value="asc">↑ зростання</option></select>
        <input placeholder="Пошук: юз, ID або #id" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button className="btn add-btn" onClick={() => setEdit(null)}>+ Додати запис</button>
      </div>
      {!data ? <div className="empty-sub">Завантаження…</div> : data.error ? <div className="empty-sub">{data.error}</div> : (
        <>
          <div className="c-date">Знайдено: {data.total}</div>
          {data.items.map((s: any) => (
            <div className="panel admin-item" key={s.id}>
              <div className="admin-head">
                <b>#{s.id} {uname(s.name)}</b>{s.telegramUserId && <span className="c-id">ID {s.telegramUserId}</span>}
                <Badges s={s} />{s.type && <span className="mini-tag">{s.type.label}</span>}
                <span className="c-date">{fmtDate(s.submittedAt ?? s.createdAt, lang)}</span>
              </div>
              <div className="c-date">👍 {s.likeCount} · 😐 {s.neutralCount} · 👎 {s.dislikeCount} · 👁 {s.viewCount} · 🔍 {s.searchCount} · жалоб: {s.complaints}{s.appealsDisabled ? " · апеляції заборонені" : ""}</div>
              {s.similar?.length > 0 && (
                <div className="warn-box">
                  ⚠ Уже є схожі записи:{" "}
                  {s.similar.map((x: any) => (
                    <span key={x.id} className="sim-link">#{x.id} {uname(x.name)} {x.exact ? "(точний збіг)" : ""}<button className="link-btn" onClick={() => { const t = window.prompt(`Об'єднати #${s.id} з #${x.id}? Введи ID цілі:`, String(x.id)); if (t) act(s.id, "merge", { targetId: Number(t) }); }}>об'єднати</button></span>
                  ))}
                </div>
              )}
              {s.botCheck && <div className="c-bot"><span>🤖 Перевірка бота</span>{s.botReward && <span>🎁 {s.botReward}</span>}{s.botSponsors != null && <span>🤝 {s.botSponsors}</span>}{s.botUsage && <span>👥 {s.botUsage}</span>}</div>}
              {s.description && <p className="desc">{pickDesc(s, lang)}</p>}
              {s.screenshots.length > 0 && <ul className="links">{s.screenshots.map((u: string, i: number) => <li key={i}><a href={safeHref(u)} target="_blank" rel="noopener noreferrer nofollow">{u.slice(0, 70)}</a></li>)}</ul>}
              {s.submissions.map((x: any) => (
                <div className="c-date" key={x.id}>жалоба #{x.id} · IP {x.ip || "—"} {x.ip && <button className="link-btn" onClick={() => ban(x.ip)}>бан IP</button>}{x.contactUsername && <> · зв'язок: @{x.contactUsername}</>}</div>
              ))}
              <div className="modal-actions" style={{ marginTop: 10 }}>
                {s.moderation !== "approved" && <button className="btn" onClick={() => act(s.id, "approve")}>Прийняти</button>}
                {s.moderation !== "rejected" && <button className="btn ghost danger" onClick={() => { const r = window.prompt("Причина відхилення (необов'язково):", ""); if (r !== null) act(s.id, "reject", { reason: r }); }}>Відхилити</button>}
                <button className="btn ghost" onClick={() => setEdit(s)}>Редагувати</button>
                <button className="btn ghost" onClick={() => { const t = window.prompt("ID запису, з яким об'єднати:", ""); if (t) act(s.id, "merge", { targetId: Number(t) }); }}>Об'єднати</button>
                <button className="btn ghost danger" onClick={() => del(s.id)}>Видалити</button>
              </div>
            </div>
          ))}
          {data.items.length === 0 && <div className="empty-sub">Порожньо</div>}
          <button className="add-block" onClick={() => setEdit(null)}>+ Додати запис</button>
          {data.pages > 1 && (
            <div className="pager"><button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button><span>{page} / {data.pages}</span><button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>›</button></div>
          )}
        </>
      )}
      {edit !== undefined && <Editor item={edit} statuses={statuses} types={types} onClose={() => setEdit(undefined)} onSaved={load} />}
    </div>
  );
}
