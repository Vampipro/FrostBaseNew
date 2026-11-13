"use client";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";
import { useTT } from "./tt";

const blank = (kind: string) => ({ id: 0, key: "", label: "", translations: { ua: "", en: "", ru: "" }, description: "", color: "#ef4444", textColor: "#ffffff", sortOrder: 10, hidden: false, showInForm: true, isDefault: false, _k: kind });

function Row({ kind, row, onDone }: { kind: string; row: any; onDone: () => void }) {
  const { toast } = useApp();
  const tt = useTT();
  const [f, setF] = useState<any>({ ...row, translations: { ua: "", en: "", ru: "", ...(row.translations || {}) } });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const tr = (l: string, v: string) => setF((p: any) => ({ ...p, translations: { ...p.translations, [l]: v } }));
  const isNew = !row.id;
  const save = async () => {
    const body: any = { key: f.key, label: f.label, translations: f.translations, sortOrder: Number(f.sortOrder), hidden: f.hidden };
    if (kind === "statuses") Object.assign(body, { description: f.description, color: f.color, textColor: f.textColor, showInForm: f.showInForm });
    const r = isNew ? await api("/api/admin/dict", { body: { ...body, kind } }) : await api("/api/admin/dict", { method: "PATCH", body: { ...body, kind, id: row.id } });
    if (r.error) return toast(r.error);
    toast(tt("Збережено", "Saved", "Сохранено"));
    onDone();
  };
  const del = async () => {
    if (!confirm(tt("Видалити? Для тегів зв'язки зі скамерами теж зникнуть. Краще сховати.", "Delete? For tags the links to scammers will disappear too. Better to hide it.", "Удалить? Для тегов связи со скамерами тоже исчезнут. Лучше скрыть."))) return;
    await api(`/api/admin/dict?kind=${kind}&id=${row.id}`, { method: "DELETE" });
    onDone();
  };
  return (
    <div className="panel admin-item">
      <div className="row3">
        <label className="field"><span>{tt("Ключ", "Key", "Ключ")}</span><input value={f.key} onChange={(e) => set("key", e.target.value)} /></label>
        <label className="field"><span>{tt("Назва (за замовч.)", "Name (default)", "Название (по умолч.)")}</span><input value={f.label} onChange={(e) => set("label", e.target.value)} /></label>
        <label className="field"><span>{tt("Порядок", "Order", "Порядок")}</span><input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></label>
      </div>
      <div className="row3">
        {["ua", "en", "ru"].map((l) => <label className="field" key={l}><span>{tt("Назва", "Name", "Название")} {l.toUpperCase()}</span><input value={f.translations[l]} onChange={(e) => tr(l, e.target.value)} /></label>)}
      </div>
      {kind === "statuses" && (
        <>
          <label className="field"><span>{tt("Опис (підказка)", "Description (tooltip)", "Описание (подсказка)")}</span><input value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
          <div className="row3">
            <label className="field"><span>{tt("Колір", "Color", "Цвет")}</span><input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} /></label>
            <label className="field"><span>{tt("Колір тексту", "Text color", "Цвет текста")}</span><input type="color" value={f.textColor} onChange={(e) => set("textColor", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={f.showInForm} onChange={(e) => set("showInForm", e.target.checked)} /> {tt("Показувати у формі скарги", "Show in the report form", "Показывать в форме жалобы")}</label>
          </div>
        </>
      )}
      <label className="check"><input type="checkbox" checked={f.hidden} onChange={(e) => set("hidden", e.target.checked)} /> {tt("Сховати", "Hide", "Скрыть")} {kind === "statuses" ? tt("(не показується на сайті)", "(not shown on the site)", "(не показывается на сайте)") : tt("з фільтра", "from the filter", "из фильтра")}</label>
      <div className="modal-actions" style={{ marginTop: 10 }}>
        <button className="btn" onClick={save}>{isNew ? tt("Створити", "Create", "Создать") : tt("Зберегти", "Save", "Сохранить")}</button>
        {!isNew && <button className="btn ghost danger" onClick={del}>{tt("Видалити", "Delete", "Удалить")}</button>}
      </div>
    </div>
  );
}

export default function Dict({ kind }: { kind: "statuses" | "types" }) {
  const tt = useTT();
  const [rows, setRows] = useState<any[] | null>(null);
  const [n, setN] = useState(0);
  const load = useCallback(async () => { const r = await api(`/api/admin/dict?kind=${kind}`); setRows(Array.isArray(r) ? r : []); setN((x) => x + 1); }, [kind]);
  useEffect(() => { load(); }, [load]);
  if (!rows) return <div className="empty-sub">{tt("Завантаження…", "Loading…", "Загрузка…")}</div>;
  return (
    <div>
      <h3 className="sub-title" style={{ marginTop: 0 }}>＋ {kind === "statuses" ? tt("Додати новий тег", "Add a new tag", "Добавить новый тег") : tt("Додати новий тип", "Add a new type", "Добавить новый тип")}</h3>
      <div className="add-panel"><Row key={"new" + n} kind={kind} row={blank(kind)} onDone={load} /></div>
      <h3 className="sub-title">{tt("Існуючі", "Existing", "Существующие")}</h3>
      {rows.map((r) => <Row key={r.id + "-" + n} kind={kind} row={r} onDone={load} />)}
    </div>
  );
}
