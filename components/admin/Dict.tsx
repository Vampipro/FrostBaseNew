"use client";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "../Providers";

const blank = (kind: string) => ({ id: 0, key: "", label: "", translations: { ua: "", en: "", ru: "" }, description: "", color: "#ef4444", textColor: "#ffffff", sortOrder: 10, hidden: false, showInForm: true, isDefault: false, _k: kind });

function Row({ kind, row, onDone }: { kind: string; row: any; onDone: () => void }) {
  const { toast } = useApp();
  const [f, setF] = useState<any>({ ...row, translations: { ua: "", en: "", ru: "", ...(row.translations || {}) } });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const tr = (l: string, v: string) => setF((p: any) => ({ ...p, translations: { ...p.translations, [l]: v } }));
  const isNew = !row.id;
  const save = async () => {
    const body: any = { key: f.key, label: f.label, translations: f.translations, sortOrder: Number(f.sortOrder), hidden: f.hidden };
    if (kind === "statuses") Object.assign(body, { description: f.description, color: f.color, textColor: f.textColor, showInForm: f.showInForm });
    const r = isNew ? await api(`/api/admin/dict/${kind}`, { body }) : await api(`/api/admin/dict/${kind}/${row.id}`, { method: "PATCH", body });
    if (r.error) return toast(r.error);
    toast("Збережено");
    onDone();
  };
  const del = async () => {
    if (!confirm("Видалити? Для тегів зв'язки зі скамерами теж зникнуть. Краще сховати.")) return;
    await api(`/api/admin/dict/${kind}/${row.id}`, { method: "DELETE" });
    onDone();
  };
  return (
    <div className="panel admin-item">
      <div className="row3">
        <label className="field"><span>Ключ</span><input value={f.key} onChange={(e) => set("key", e.target.value)} /></label>
        <label className="field"><span>Назва (за замовч.)</span><input value={f.label} onChange={(e) => set("label", e.target.value)} /></label>
        <label className="field"><span>Порядок</span><input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></label>
      </div>
      <div className="row3">
        {["ua", "en", "ru"].map((l) => <label className="field" key={l}><span>Назва {l.toUpperCase()}</span><input value={f.translations[l]} onChange={(e) => tr(l, e.target.value)} /></label>)}
      </div>
      {kind === "statuses" && (
        <>
          <label className="field"><span>Опис (підказка)</span><input value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
          <div className="row3">
            <label className="field"><span>Колір</span><input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} /></label>
            <label className="field"><span>Колір тексту</span><input type="color" value={f.textColor} onChange={(e) => set("textColor", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={f.showInForm} onChange={(e) => set("showInForm", e.target.checked)} /> Показувати у формі жалоби</label>
          </div>
        </>
      )}
      <label className="check"><input type="checkbox" checked={f.hidden} onChange={(e) => set("hidden", e.target.checked)} /> Сховати {kind === "statuses" ? "(не показується на сайті)" : "з фільтра"}</label>
      <div className="modal-actions" style={{ marginTop: 10 }}>
        <button className="btn" onClick={save}>{isNew ? "Створити" : "Зберегти"}</button>
        {!isNew && <button className="btn ghost danger" onClick={del}>Видалити</button>}
      </div>
    </div>
  );
}

export default function Dict({ kind }: { kind: "statuses" | "types" }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [n, setN] = useState(0);
  const load = useCallback(async () => { const r = await api(`/api/admin/dict/${kind}`); setRows(Array.isArray(r) ? r : []); setN((x) => x + 1); }, [kind]);
  useEffect(() => { load(); }, [load]);
  if (!rows) return <div className="empty-sub">Завантаження…</div>;
  return (
    <div>
      <h3 className="sub-title" style={{ marginTop: 0 }}>＋ Додати {kind === "statuses" ? "новий тег" : "новий тип"}</h3>
      <div className="add-panel"><Row key={"new" + n} kind={kind} row={blank(kind)} onDone={load} /></div>
      <h3 className="sub-title">Існуючі</h3>
      {rows.map((r) => <Row key={r.id + "-" + n} kind={kind} row={r} onDone={load} />)}
    </div>
  );
}
