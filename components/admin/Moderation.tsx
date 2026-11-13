"use client";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";
import { Badges, fmtDate } from "../ScammerCard";
import Modal from "../Modal";
import { uname, pickDesc } from "@/lib/name";
import { useTT } from "./tt";
import EvidenceGallery from "@/components/EvidenceGallery";

const EMPTY = { name: "", telegramUserId: "", description: "", descUa: "", descEn: "", typeId: "", statusIds: [] as number[], scamAmount: "", scamCurrency: "", scamDate: "", proofLink: "", screenshots: "", moderation: "approved", appealsDisabled: false, botCheck: false, checking: false, botReward: "", botSponsors: "", botUsage: "" };

function Editor({ item, statuses, types, onClose, onSaved }: { item: any | null; statuses: any[]; types: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast, lang } = useApp();
  const tt = useTT();
  const [f, setF] = useState<any>(() =>
    item
      ? { ...EMPTY, ...item, descUa: item.descriptionI18n?.ua ?? "", descEn: item.descriptionI18n?.en ?? "", botReward: item.rawBotReward ?? "", botSponsors: item.botSponsors ?? "", botUsage: item.botUsage ?? "", telegramUserId: item.telegramUserId ?? "", typeId: item.typeId ?? "", scamAmount: item.scamAmount ?? "", scamDate: item.scamDate ? String(item.scamDate).slice(0, 10) : "", screenshots: (item.screenshots || []).join("\n"), proofLink: item.proofLink ?? "" }
      : { ...EMPTY }
  );
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  // «Кілька мов» — необов'язково. Без галочки опис тільки російською (за замовчуванням)
  const [multi, setMulti] = useState<boolean>(() => !!(item?.descriptionI18n?.ua || item?.descriptionI18n?.en));
  const [nameHistory, setNameHistory] = useState<any[]>(item?.usernameHistory || []);
  const [historyDraft, setHistoryDraft] = useState("");
  const [historyBusy, setHistoryBusy] = useState(false);
  const isBot = !!f.botCheck;
  const save = async () => {
    const reward = [String(f.scamAmount).trim(), String(f.scamCurrency).trim()].filter(Boolean).join(" ");
    const body = {
      name: f.name, telegramUserId: String(f.telegramUserId), description: f.description, descriptionI18n: multi ? { ua: f.descUa, en: f.descEn } : {},
      botCheck: isBot, checking: isBot ? !!f.checking : false, botReward: isBot ? (reward || String(f.botReward || "")) : "", botSponsors: String(f.botSponsors), botUsage: String(f.botUsage),
      typeId: f.typeId || null, statusIds: f.statusIds,
      scamAmount: String(f.scamAmount), scamCurrency: f.scamCurrency, scamDate: f.scamDate, proofLink: f.proofLink,
      screenshots: f.screenshots.split("\n").map((x: string) => x.trim()).filter(Boolean), moderation: f.moderation, appealsDisabled: f.appealsDisabled,
    };
    const r = item ? await api("/api/admin/scammers", { method: "PATCH", body: { ...body, id: item.id } }) : await api("/api/admin/scammers", { body });
    if (r.error) return toast(r.error);
    toast(tt("Збережено", "Saved", "Сохранено"));
    onSaved();
    onClose();
  };
  const addHistory = async () => {
    if (!item?.id || historyBusy) return;
    setHistoryBusy(true);
    const r = await api("/api/admin/scammers/history", { body: { id: item.id, oldName: historyDraft } });
    setHistoryBusy(false);
    if (r.error) return toast(r.error);
    setHistoryDraft("");
    setNameHistory((rows) => [...rows, r]);
    toast(tt("Юзернейм додано до історії", "Username added to history", "Юзернейм добавлен в историю"));
  };
  const removeHistory = async (historyId: number) => {
    if (!item?.id || historyBusy) return;
    if (!window.confirm(tt("Видалити цей запис історії?", "Delete this history entry?", "Удалить эту запись истории?"))) return;
    setHistoryBusy(true);
    const r = await api(`/api/admin/scammers/history?id=${historyId}&scammerId=${item.id}`, { method: "DELETE" });
    setHistoryBusy(false);
    if (r.error) return toast(r.error);
    setNameHistory((rows) => rows.filter((x) => x.id !== historyId));
  };
  return (
    <Modal wide onClose={onClose}>
      <h3 className="zone-title" style={{ marginTop: 0 }}>{item ? `${tt("Редагувати", "Edit", "Редактировать")} #${item.id}` : tt("Новий запис", "New entry", "Новая запись")}</h3>
      <div className="row2">
        <label className="field"><span>{tt("Юзернейм", "Username", "Юзернейм")}</span><input value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className="field"><span>Telegram ID</span><input value={f.telegramUserId} onChange={(e) => set("telegramUserId", e.target.value.replace(/\D/g, ""))} /></label>
      </div>
      {item && (
        <section className="admin-name-history">
          <div className="admin-name-history-head">
            <div><b>{tt("Історія юзернеймів", "Username history", "История юзернеймов")}</b><small>{tt("Старі назви, які відомі модераторам", "Previous names known to moderators", "Старые имена, известные модераторам")}</small></div>
            <span>{nameHistory.length}</span>
          </div>
          <p className="admin-name-history-note">{tt("Історія може бути неповною або неточною: попередні юзернейми додаються модераторами вручну. Якщо змінив поточний username, спочатку збережи запис.", "History may be incomplete or inaccurate: previous usernames are entered manually by moderators. Save the current username before adding its previous names.", "История может быть неполной или неточной: прежние юзернеймы добавляются модераторами вручную. Если изменил текущий username, сначала сохрани запись.")}</p>
          <div className="admin-name-history-add">
            <input maxLength={64} value={historyDraft} onChange={(e) => setHistoryDraft(e.target.value)} placeholder={tt("Попередній юзернейм без @", "Previous username without @", "Прежний юзернейм без @")} />
            <button className="btn ghost" type="button" disabled={historyBusy || !historyDraft.trim()} onClick={addHistory}>{tt("Додати", "Add", "Добавить")}</button>
          </div>
          {nameHistory.length > 0 ? <div className="admin-name-history-list">{nameHistory.map((h) => (
            <div className="admin-name-history-row" key={h.id}>
              <span><b>@{h.oldName}</b><i>→</i><b>@{h.newName}</b><small>{fmtDate(h.createdAt, lang)}</small></span>
              <button className="link-btn danger-text" type="button" disabled={historyBusy} onClick={() => removeHistory(h.id)}>×</button>
            </div>
          ))}</div> : <div className="c-date">{tt("Історія поки порожня", "No history yet", "История пока пуста")}</div>}
        </section>
      )}
      <label className="field"><span>{tt("Теги (можна кілька)", "Tags (several allowed)", "Теги (можно несколько)")}</span>
        <div className="chips-sel">
          {statuses.map((s) => (
            <button type="button" key={s.id} className={"tag-chip" + (f.statusIds.includes(s.id) ? " on" : "")} style={{ ["--tc" as any]: s.color }}
              onClick={() => set("statusIds", f.statusIds.includes(s.id) ? f.statusIds.filter((x: number) => x !== s.id) : [...f.statusIds, s.id])}>{s.label}{s.hidden ? tt(" (прихов.)", " (hidden)", " (скрыт.)") : ""}</button>
          ))}
        </div>
      </label>
      <div className="row2">
        <label className="field"><span>{tt("Тип", "Type", "Тип")}</span>
          <select value={f.typeId} onChange={(e) => set("typeId", e.target.value)}><option value="">—</option>{types.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        </label>
        <label className="field"><span>{tt("Модерація", "Moderation", "Модерация")}</span>
          <select value={f.moderation} onChange={(e) => set("moderation", e.target.value)}><option value="pending">{tt("На модерації", "Under review", "На модерации")}</option><option value="approved">{tt("Схвалено", "Approved", "Одобрено")}</option><option value="rejected">{tt("Відхилено", "Rejected", "Отклонено")}</option></select>
        </label>
      </div>
      <label className="check"><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} /> {tt("Описи кількома мовами (необов'язково; без галочки — лише російською)", "Descriptions in several languages (optional; unchecked — Russian only)", "Описания на нескольких языках (необязательно; без галочки — только русский)")}</label>
      <label className="field"><span>{multi ? tt("Опис (RU)", "Description (RU)", "Описание (RU)") : tt("Опис (RU, за замовчуванням)", "Description (RU, default)", "Описание (RU, по умолчанию)")}</span><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
      {multi && (
        <>
          <label className="field"><span>{tt("Опис (UA)", "Description (UA)", "Описание (UA)")}</span><textarea rows={3} value={f.descUa} onChange={(e) => set("descUa", e.target.value)} placeholder={tt("Якщо порожньо — показується російський", "If empty, the Russian text is shown", "Если пусто — показывается русский")} /></label>
          <label className="field"><span>{tt("Опис (EN)", "Description (EN)", "Описание (EN)")}</span><textarea rows={3} value={f.descEn} onChange={(e) => set("descEn", e.target.value)} placeholder={tt("Якщо порожньо — показується російський", "If empty, the Russian text is shown", "Если пусто — показывается русский")} /></label>
        </>
      )}
      <label className="check"><input type="checkbox" checked={isBot} onChange={(e) => set("botCheck", e.target.checked)} /> {tt("Перевірка бота (нагорода, спонсори, використання)", "Bot check (reward, sponsors, usage)", "Проверка бота (награда, спонсоры, использование)")}</label>
      {isBot && <label className="check"><input type="checkbox" checked={!!f.checking} onChange={(e) => set("checking", e.target.checked)} /> {tt("Бот узятий модератором на перевірку", "Bot is being checked by a moderator", "Бот взят модератором на проверку")}</label>}
      {isBot && (
        <div className="row2">
          <label className="field"><span>{tt("Спонсорів", "Sponsors", "Спонсоров")}</span><input value={f.botSponsors} inputMode="numeric" maxLength={5} onChange={(e) => set("botSponsors", e.target.value.replace(/\D/g, ""))} /></label>
          <label className="field"><span>{tt("Використання (користувачів)", "Usage (users)", "Использование (пользователей)")}</span><input value={f.botUsage} inputMode="numeric" maxLength={9} onChange={(e) => set("botUsage", e.target.value.replace(/\D/g, ""))} /></label>
        </div>
      )}
      <div className="row3">
        <label className="field"><span>{isBot ? tt("Нагорода (сума)", "Reward (amount)", "Награда (сумма)") : tt("Сума", "Amount", "Сумма")}</span><input value={f.scamAmount} onChange={(e) => set("scamAmount", e.target.value)} /></label>
        <label className="field"><span>{tt("Валюта", "Currency", "Валюта")}</span><input value={f.scamCurrency} onChange={(e) => set("scamCurrency", e.target.value)} /></label>
        <label className="field"><span>{isBot ? tt("Дата останньої перевірки", "Date of the last check", "Дата последней проверки") : tt("Дата скаму", "Scam date", "Дата скама")}</span><input type="date" value={f.scamDate} onChange={(e) => set("scamDate", e.target.value)} /></label>
      </div>
      {isBot && <label className="field"><span>{tt("Нагорода (текст, старий формат; запасне поле)", "Reward (legacy text; fallback)", "Награда (текст, старый формат; запасное поле)")}</span><input maxLength={80} value={f.botReward} onChange={(e) => set("botReward", e.target.value)} /></label>}
      <label className="field"><span>{tt("Скріншоти — оригінал (посилання, по одному в рядок)", "Screenshots — original (links, one per line)", "Скриншоты — оригинал (ссылки, по одной в строке)")}</span><textarea rows={3} value={f.screenshots} onChange={(e) => set("screenshots", e.target.value)} /></label>
      <label className="field"><span>{tt("Докази — резервна копія (посилання)", "Evidence — backup copy (link)", "Доказательства — резервная копия (ссылка)")}</span><input value={f.proofLink} onChange={(e) => set("proofLink", e.target.value)} /></label>
      <label className="check"><input type="checkbox" checked={f.appealsDisabled} onChange={(e) => set("appealsDisabled", e.target.checked)} /> {tt("Заборонити апеляції для цього запису", "Disable appeals for this entry", "Запретить апелляции для этой записи")}</label>
      <div className="modal-actions" style={{ marginTop: 14 }}>
        <button className="btn" onClick={save}>{tt("Зберегти", "Save", "Сохранить")}</button>
        <button className="btn ghost" onClick={onClose}>{tt("Скасувати", "Cancel", "Отмена")}</button>
      </div>
    </Modal>
  );
}

export default function Moderation({ databaseMode = false }: { databaseMode?: boolean } = {}) {
  const { toast, lang } = useApp();
  const tt = useTT();
  const [status, setStatus] = useState(databaseMode ? "all" : "pending");
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState("desc");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusTagFilter, setStatusTagFilter] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null | undefined>(undefined); // undefined=закрито, null=новий

  const load = useCallback(async () => {
    const p = new URLSearchParams({ status, sort, dir, q, page: String(page) });
    if (typeFilter) p.set("typeId", typeFilter);
    if (statusTagFilter) p.set("statusId", statusTagFilter);
    if (databaseMode) p.set("similar", "0");
    setData(await api("/api/admin/moderation?" + p));
  }, [status, sort, dir, q, page, typeFilter, statusTagFilter, databaseMode]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api("/api/admin/dict?kind=statuses").then((r) => Array.isArray(r) && setStatuses(r));
    api("/api/admin/dict?kind=types").then((r) => Array.isArray(r) && setTypes(r));
  }, []);

  const act = async (id: number, action: string, extra: any = {}) => {
    const r = await api("/api/admin/scammer-action", { body: { id, action, ...extra } });
    if (r.error) return toast(r.error);
    toast(tt("Готово", "Done", "Готово"));
    load();
  };
  const del = async (id: number) => {
    if (!confirm(tt(`Видалити запис #${id} назавжди?`, `Delete entry #${id} permanently?`, `Удалить запись #${id} навсегда?`))) return;
    const r = await api("/api/admin/scammers?id=" + id, { method: "DELETE" });
    if (r.error) return toast(r.error);
    toast(tt("Запис видалено", "Entry deleted", "Запись удалена"));
    load();
  };
  const ban = async (ip: string) => {
    if (!ip || !confirm(tt(`Забанити IP ${ip}?`, `Ban IP ${ip}?`, `Забанить IP ${ip}?`))) return;
    const r = await api("/api/admin/bans", { body: { ip, reason: tt("Бан з модерації", "Banned from moderation", "Бан из модерации") } });
    toast(r.error || tt("IP забанено", "IP banned", "IP забанен"));
  };
  const mergePrompt = (id: number, dflt = "") => {
    const v = window.prompt(tt(`ID запису, з яким об'єднати #${id}:`, `ID of the entry to merge #${id} into:`, `ID записи, с которой объединить #${id}:`), dflt);
    if (v) act(id, "merge", { targetId: Number(v) });
  };

  return (
    <div>
      {databaseMode && <div className="scammer-db-heading"><div><h3>{tt("База скамерів", "Scammer database", "База скамеров")}</h3><p>{tt("Усі записи, уже внесені до бази. Тут можна редагувати будь-який запис або видалити його.", "All entries already stored in the database. Edit any record or delete it here.", "Все записи, уже внесённые в базу. Здесь можно редактировать любую запись или удалить её.")}</p></div><span>DATABASE</span></div>}
      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="pending">{tt("На модерації", "Under review", "На модерации")}</option><option value="approved">{tt("Схвалені", "Approved", "Одобренные")}</option><option value="rejected">{tt("Відхилені", "Rejected", "Отклонённые")}</option><option value="all">{tt("Усі", "All", "Все")}</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">{tt("За датою", "By date", "По дате")}</option><option value="likes">{tt("За лайками", "By likes", "По лайкам")}</option><option value="dislikes">{tt("За дизлайками", "By dislikes", "По дизлайкам")}</option>
          <option value="views">{tt("За переглядами", "By views", "По просмотрам")}</option><option value="searches">{tt("За пошуками", "By searches", "По поискам")}</option><option value="complaints">{tt("За кількістю скарг", "By number of reports", "По количеству жалоб")}</option><option value="name">{tt("За юзернеймом", "By username", "По юзернейму")}</option>
        </select>
        <select value={dir} onChange={(e) => setDir(e.target.value)}><option value="desc">{tt("↓ спадання", "↓ descending", "↓ убывание")}</option><option value="asc">{tt("↑ зростання", "↑ ascending", "↑ возрастание")}</option></select>
        <input placeholder={tt("Пошук: нік, ID або #id", "Search: name, ID or #id", "Поиск: ник, ID или #id")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        {databaseMode && <>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}><option value="">{tt("Усі типи", "All types", "Все типы")}</option>{types.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
          <select value={statusTagFilter} onChange={(e) => { setStatusTagFilter(e.target.value); setPage(1); }}><option value="">{tt("Усі теги", "All tags", "Все теги")}</option>{statuses.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        </>}
        <button className="btn add-btn" onClick={() => setEdit(null)}>{tt("+ Додати запис", "+ Add entry", "+ Добавить запись")}</button>
      </div>
      {!data ? <div className="empty-sub">{tt("Завантаження…", "Loading…", "Загрузка…")}</div> : data.error ? <div className="empty-sub">{data.error}</div> : (
        <>
          <div className="c-date">{tt("Знайдено", "Found", "Найдено")}: {data.total}</div>
          {data.items.map((s: any) => (
            <div className="panel admin-item" key={s.id}>
              <div className="admin-head">
                <b>#{s.id} {uname(s.name)}</b>{s.telegramUserId && <span className="c-id">ID {s.telegramUserId}</span>}
                <Badges s={s} />{s.type && <span className="mini-tag">{s.type.label}</span>}
                <span className="c-date">{fmtDate(s.submittedAt ?? s.createdAt, lang)}</span>
              </div>
              <div className="c-date">👍 {s.likeCount} · 😐 {s.neutralCount} · 👎 {s.dislikeCount} · 👁 {s.viewCount} · 🔍 {s.searchCount} · {tt("скарг", "reports", "жалоб")}: {s.complaints}{s.appealsDisabled ? ` · ${tt("апеляції заборонені", "appeals disabled", "апелляции запрещены")}` : ""}</div>
              {s.botCheck && <div className="c-bot"><span>🤖 {tt("Перевірка бота", "Bot check", "Проверка бота")}</span>{s.botReward && <span>🎁 {s.botReward}</span>}{s.botSponsors != null && <span>🤝 {s.botSponsors}</span>}{s.botUsage && <span>👥 {Number(s.botUsage).toLocaleString("ru-RU")}</span>}</div>}
              {s.similar?.length > 0 && (
                <div className="warn-box">
                  ⚠ {tt("Схожі записи в базі", "Similar entries in the database", "Похожие записи в базе")}:{" "}
                  {s.similar.map((x: any) => (
                    <span key={x.id} className="sim-link">#{x.id} {uname(x.name)} {x.exact ? tt("(точний збіг)", "(exact match)", "(точное совпадение)") : ""}<button className="link-btn" onClick={() => mergePrompt(s.id, String(x.id))}>{tt("об'єднати", "merge", "объединить")}</button></span>
                  ))}
                </div>
              )}
              {s.description && <p className="desc">{pickDesc(s, lang)}</p>}
              {s.screenshots.length > 0 && <EvidenceGallery items={s.screenshots} title={tt("Оригінальні докази", "Original evidence", "Оригинальные доказательства")} compact />}
              {s.proofLink && <EvidenceGallery items={[s.proofLink]} title={tt("Резервний доказ", "Backup evidence", "Резервное доказательство")} compact />}
              {s.submissions.map((x: any) => (
                <div className="c-date" key={x.id}>{tt("Заявка", "Submission", "Заявка")} #{x.id} · IP {x.ip || "—"} {x.ip && <button className="link-btn" onClick={() => ban(x.ip)}>{tt("бан IP", "ban IP", "бан IP")}</button>}{x.contactUsername && <> · {tt("зв'язок", "contact", "связь")}: @{x.contactUsername}</>}</div>
              ))}
              <div className="modal-actions" style={{ marginTop: 10 }}>
                {s.botCheck && s.moderation === "pending" && (s.checking
                  ? <button className="btn ghost" onClick={() => act(s.id, "uncheck")}>{tt("Зняти з перевірки", "Take off check", "Снять с проверки")}</button>
                  : <button className="btn ghost" onClick={() => act(s.id, "check")}>{tt("Перевіряю", "I'm checking", "Проверяю")}</button>)}
                {s.moderation !== "approved" && <button className="btn" onClick={() => act(s.id, "approve")}>{tt("Схвалити", "Approve", "Одобрить")}</button>}
                {s.moderation !== "rejected" && <button className="btn ghost danger" onClick={() => { const r = window.prompt(tt("Причина відхилення (необов'язково):", "Rejection reason (optional):", "Причина отклонения (необязательно):"), ""); if (r !== null) act(s.id, "reject", { reason: r }); }}>{tt("Відхилити", "Reject", "Отклонить")}</button>}
                <button className="btn ghost" onClick={() => setEdit(s)}>{tt("Редагувати", "Edit", "Редактировать")}</button>
                <button className="btn ghost" onClick={() => mergePrompt(s.id)}>{tt("Об'єднати", "Merge", "Объединить")}</button>
                <button className="btn ghost danger" onClick={() => del(s.id)}>{tt("Видалити", "Delete", "Удалить")}</button>
              </div>
            </div>
          ))}
          {data.items.length === 0 && <div className="empty-sub">{tt("Порожньо", "Empty", "Пусто")}</div>}
          <button className="add-block" onClick={() => setEdit(null)}>{tt("+ Додати запис", "+ Add entry", "+ Добавить запись")}</button>
          {data.pages > 1 && (
            <div className="pager"><button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button><span>{page} / {data.pages}</span><button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>→</button></div>
          )}
        </>
      )}
      {edit !== undefined && <Editor item={edit} statuses={statuses} types={types} onClose={() => setEdit(undefined)} onSaved={load} />}
    </div>
  );
}

export function ScammersDatabase() {
  return <Moderation databaseMode />;
}
