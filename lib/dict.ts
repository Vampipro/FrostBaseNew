export const dictModel = (kind: string) => (kind === "statuses" ? "scammerStatus" : kind === "types" ? "scammerType" : null);

const hex = /^#[0-9a-fA-F]{6}$/;

/** Поля довідників (статуси = теги, типи). */
export function dictData(kind: string, b: any, creating: boolean): { data?: any; error?: string } {
  const d: any = {};
  const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  if (creating || "key" in b) {
    d.key = s(b.key, 40).toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
    if (!d.key) return { error: "Вкажи ключ (латиницею)" };
  }
  if (creating || "label" in b) {
    d.label = s(b.label, 60);
    if (!d.label) return { error: "Вкажи назву" };
  }
  if ("translations" in b) {
    const t: Record<string, string> = {};
    for (const l of ["ua", "en", "ru"]) t[l] = s(b.translations?.[l], 60);
    d.translations = t;
  }
  if ("sortOrder" in b) d.sortOrder = Math.trunc(Number(b.sortOrder)) || 0;
  if ("hidden" in b) d.hidden = !!b.hidden;
  if (kind === "statuses") {
    if ("description" in b) d.description = s(b.description, 500);
    if ("color" in b) {
      if (!hex.test(b.color)) return { error: "Колір у форматі #rrggbb" };
      d.color = b.color;
    }
    if ("textColor" in b) {
      if (!hex.test(b.textColor)) return { error: "Колір тексту у форматі #rrggbb" };
      d.textColor = b.textColor;
    }
    if ("showInForm" in b) d.showInForm = !!b.showInForm;
    if ("isDefault" in b) d.isDefault = !!b.isDefault;
  }
  return { data: d };
}
