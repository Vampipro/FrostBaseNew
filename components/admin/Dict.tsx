"use client";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { api, useApp } from "../Providers";
import { useTT } from "./tt";

const blank = (kind: string) => ({
  id: 0,
  key: "",
  label: "",
  translations: { ua: "", en: "", ru: "" },
  description: "",
  color: "#ef4444",
  textColor: "#ffffff",
  sortOrder: 10,
  hidden: false,
  showInForm: true,
  _k: kind,
});

type DictKind = "statuses" | "types";
type DictRow = ReturnType<typeof blank> & Record<string, any>;

type EditorProps = {
  kind: DictKind;
  row: DictRow;
  onDone: () => void;
  variant?: "panel" | "inline";
};

function EditorRow({ kind, row, onDone, variant = "panel" }: EditorProps) {
  const { toast } = useApp();
  const tt = useTT();
  const [f, setF] = useState<any>(() => ({ ...row, translations: { ua: "", en: "", ru: "", ...(row.translations || {}) } }));
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const tr = (l: string, v: string) => setF((p: any) => ({ ...p, translations: { ...p.translations, [l]: v } }));
  const isNew = !row.id;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const body: any = {
      key: f.key,
      label: f.label,
      translations: f.translations,
      sortOrder: Number(f.sortOrder),
      hidden: f.hidden,
    };
    if (kind === "statuses") {
      Object.assign(body, {
        description: f.description,
        color: f.color,
        textColor: f.textColor,
        showInForm: f.showInForm,
      });
    }
    const r = isNew
      ? await api("/api/admin/dict", { body: { ...body, kind } })
      : await api("/api/admin/dict", { method: "PATCH", body: { ...body, kind, id: row.id } });
    setSaving(false);
    if (r.error) return toast(r.error);
    toast(tt("Збережено", "Saved", "Сохранено"));
    onDone();
  };

  const del = async () => {
    if (saving) return;
    if (!confirm(tt(
      "Видалити? Для тегів зв'язки зі скамерами теж зникнуть. Краще сховати.",
      "Delete? Tag links to entries will also be removed. Hiding is safer.",
      "Удалить? Связи тегов со скамерами тоже исчезнут. Лучше скрыть.",
    ))) return;
    setSaving(true);
    const r = await api(`/api/admin/dict?kind=${kind}&id=${row.id}`, { method: "DELETE" });
    setSaving(false);
    if (r.error) return toast(r.error);
    onDone();
  };

  return (
    <div className={variant === "panel" ? "panel admin-item dict-editor" : "dict-editor dict-editor-inline"}>
      <div className="dict-form-section">
        <div className="dict-form-heading">
          <span className="dict-form-index">01</span>
          <div>
            <b>{tt("Основне", "Basics", "Основное")}</b>
            <small>{tt("Системний ключ, назва та порядок показу", "System key, label and display order", "Системный ключ, название и порядок отображения")}</small>
          </div>
        </div>
        <div className="dict-fields dict-fields-3">
          <label className="field"><span>{tt("Ключ", "Key", "Ключ")}</span><input value={f.key} onChange={(e) => set("key", e.target.value)} placeholder="example_tag" /></label>
          <label className="field"><span>{tt("Назва за замовчуванням", "Default name", "Название по умолчанию")}</span><input value={f.label} onChange={(e) => set("label", e.target.value)} /></label>
          <label className="field"><span>{tt("Порядок", "Order", "Порядок")}</span><input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></label>
        </div>
      </div>

      <div className="dict-form-section">
        <div className="dict-form-heading">
          <span className="dict-form-index">02</span>
          <div>
            <b>{tt("Переклади", "Translations", "Переводы")}</b>
            <small>{tt("Окремі назви для кожної мови сайту", "Names used for each site language", "Отдельные названия для каждого языка сайта")}</small>
          </div>
        </div>
        <div className="dict-fields dict-fields-3">
          {(["ua", "en", "ru"] as const).map((l) => (
            <label className="field" key={l}>
              <span><i className={`dict-lang dict-lang-${l}`}>{l.toUpperCase()}</i> {tt("Назва", "Label", "Название")}</span>
              <input value={f.translations[l]} onChange={(e) => tr(l, e.target.value)} placeholder={f.label || f.key} />
            </label>
          ))}
        </div>
      </div>

      {kind === "statuses" && (
        <div className="dict-form-section">
          <div className="dict-form-heading">
            <span className="dict-form-index">03</span>
            <div>
              <b>{tt("Вигляд і поведінка", "Appearance and behavior", "Внешний вид и поведение")}</b>
              <small>{tt("Налаштування кольору та місць відображення тегу", "Color and where this tag is displayed", "Настройки цвета и мест отображения тега")}</small>
            </div>
          </div>
          <label className="field"><span>{tt("Опис-підказка", "Tooltip description", "Описание-подсказка")}</span><input value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
          <div className="dict-color-row">
            <label className="field dict-color-field"><span>{tt("Колір тегу", "Tag color", "Цвет тега")}</span><input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} /></label>
            <label className="field dict-color-field"><span>{tt("Колір тексту", "Text color", "Цвет текста")}</span><input type="color" value={f.textColor} onChange={(e) => set("textColor", e.target.value)} /></label>
            <div className="dict-live-preview">
              <small>{tt("Попередній перегляд", "Live preview", "Предпросмотр")}</small>
              <span style={{ "--dict-color": f.color, "--dict-text": f.textColor } as CSSProperties}>{f.translations.ua || f.label || f.key || tt("Новий тег", "New tag", "Новый тег")}</span>
            </div>
          </div>
          <div className="dict-switches">
            <label className="check"><input type="checkbox" checked={f.showInForm} onChange={(e) => set("showInForm", e.target.checked)} /> {tt("Показувати у формі скарги", "Show in the report form", "Показывать в форме жалобы")}</label>
          </div>
        </div>
      )}

      <div className="dict-form-footer">
        <label className="check"><input type="checkbox" checked={f.hidden} onChange={(e) => set("hidden", e.target.checked)} /> {tt("Приховати", "Hide", "Скрыть")} {kind === "statuses" ? tt("на сайті", "on the site", "на сайте") : tt("у фільтрі", "from filters", "в фильтре")}</label>
        <div className="modal-actions">
          <button className="btn" onClick={save} disabled={saving}>{saving ? tt("Збереження…", "Saving…", "Сохранение…") : isNew ? tt("＋ Створити", "＋ Create", "＋ Создать") : tt("Зберегти зміни", "Save changes", "Сохранить изменения")}</button>
          {!isNew && <button className="btn ghost danger" onClick={del} disabled={saving}>{tt("Видалити", "Delete", "Удалить")}</button>}
        </div>
      </div>
    </div>
  );
}

function DictCard({ kind, row, onDone }: { kind: DictKind; row: DictRow; onDone: () => void }) {
  const tt = useTT();
  const [editing, setEditing] = useState(false);
  const color = row.color || "#5fd9ff";
  const previewStyle = {
    "--dict-color": color,
    "--dict-text": row.textColor || "#ffffff",
  } as CSSProperties;
  const translations = row.translations || {};

  return (
    <article className={`dict-card${row.hidden ? " is-hidden" : ""}${editing ? " is-editing" : ""}`}>
      <div className="dict-card-main">
        <div className="dict-card-title-row">
          <span className="dict-order">{String(row.sortOrder ?? 0).padStart(2, "0")}</span>
          <div className="dict-card-title">
            {kind === "statuses" ? <span className="dict-card-preview" style={previewStyle}>{row.label || row.key}</span> : <b>{row.label || row.key}</b>}
            <code>{row.key}</code>
          </div>
          <button className={`dict-edit-btn${editing ? " on" : ""}`} onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            {editing ? tt("Згорнути", "Close", "Свернуть") : tt("Редагувати", "Edit", "Редактировать")}
            <span aria-hidden="true">{editing ? "−" : "＋"}</span>
          </button>
        </div>
        <div className="dict-card-languages">
          <span><i className="dict-lang dict-lang-ua">UA</i>{translations.ua || row.label || "—"}</span>
          <span><i className="dict-lang dict-lang-en">EN</i>{translations.en || "—"}</span>
          <span><i className="dict-lang dict-lang-ru">RU</i>{translations.ru || "—"}</span>
        </div>
        <div className="dict-card-flags">
          {row.hidden && <span className="dict-flag is-muted">{tt("Прихований", "Hidden", "Скрыт")}</span>}
          {!row.hidden && <span className="dict-flag is-active">{tt("Активний", "Active", "Активен")}</span>}
          {kind === "statuses" && row.showInForm && <span className="dict-flag">{tt("У формі скарги", "In report form", "В форме жалобы")}</span>}
        </div>
      </div>
      {editing && <EditorRow kind={kind} row={row} variant="inline" onDone={() => { setEditing(false); onDone(); }} />}
    </article>
  );
}

export default function Dict({ kind }: { kind: DictKind }) {
  const tt = useTT();
  const [rows, setRows] = useState<DictRow[] | null>(null);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    const r = await api(`/api/admin/dict?kind=${kind}`);
    setRows(Array.isArray(r) ? r : []);
    setRevision((x) => x + 1);
  }, [kind]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLocaleLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.key, r.label, r.translations?.ua, r.translations?.en, r.translations?.ru]
      .some((v) => String(v ?? "").toLocaleLowerCase().includes(q)));
  }, [rows, query]);

  if (!rows) return <div className="empty-sub">{tt("Завантаження…", "Loading…", "Загрузка…")}</div>;

  const isStatus = kind === "statuses";
  return (
    <div className="dict-manager">
      <section className="dict-create-section">
        <div className="dict-section-heading">
          <div>
            <span className="dict-overline">{tt("КЕРУВАННЯ ДОВІДНИКОМ", "DIRECTORY MANAGER", "УПРАВЛЕНИЕ СПРАВОЧНИКОМ")}</span>
            <h3>{isStatus ? tt("Створити тег", "Create a tag", "Создать тег") : tt("Створити тип", "Create a type", "Создать тип")}</h3>
            <p>{isStatus
              ? tt("Додай новий тег і налаштуй його колір, переклади та відображення.", "Add a tag and configure its color, translations and visibility.", "Добавь тег и настрой его цвет, переводы и отображение.")
              : tt("Додай новий тип запису та назви для всіх мов.", "Add an entry type and its labels for every language.", "Добавь новый тип записи и названия для всех языков.")}</p>
          </div>
          <span className="dict-section-icon" aria-hidden="true">{isStatus ? "◈" : "◇"}</span>
        </div>
        <EditorRow key={`new-${kind}-${revision}`} kind={kind} row={blank(kind) as DictRow} onDone={load} />
      </section>

      <section className="dict-list-section">
        <div className="dict-list-heading">
          <div>
            <span className="dict-overline">{tt("СТРУКТУРА ТА ПОРЯДОК", "STRUCTURE AND ORDER", "СТРУКТУРА И ПОРЯДОК")}</span>
            <h3>{isStatus ? tt("Наявні теги", "Existing tags", "Существующие теги") : tt("Наявні типи", "Existing types", "Существующие типы")} <span className="dict-count">{rows.length}</span></h3>
          </div>
          <label className="dict-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tt("Пошук за назвою або ключем…", "Search name or key…", "Поиск по названию или ключу…")} /></label>
        </div>
        {filtered.length > 0 ? (
          <div className="dict-grid">
            {filtered.map((r) => <DictCard key={`${r.id}-${revision}`} kind={kind} row={r} onDone={load} />)}
          </div>
        ) : (
          <div className="dict-empty">{query ? tt("Нічого не знайдено. Спробуй інший запит.", "No matches. Try another search.", "Ничего не найдено. Попробуй другой запрос.") : tt("Поки що записів немає.", "There are no entries yet.", "Пока записей нет.")}</div>
        )}
      </section>
    </div>
  );
}
