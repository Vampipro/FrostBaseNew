/** Прибирає ведучі "@" з імені, що прийшло з БД (щоб не було "@@name"). */
export const uname = (n: unknown) => String(n ?? "").replace(/^@+/, "");

/** Максимум для BigInt-колонки Postgres (int8). */
export const MAX_TG = BigInt("9223372036854775807");
export const isTgId = (s: string) => /^\d{1,19}$/.test(s) && BigInt(s) <= MAX_TG;

/** Чистить текст від керуючих і невидимих символів (bidi-підміна, zero-width), обрізає до max.
 *  \n, \t і ZWJ (потрібен для емодзі) залишаються. */
export const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g, "")
    .trim()
    .slice(0, max);

/** Опис картки мовою інтерфейсу; якщо перекладу немає — російський (за замовчуванням). */
export const pickDesc = (s: any, lang: string): string => {
  const t = s?.descriptionI18n;
  const v = lang === "ua" ? t?.ua : lang === "en" ? t?.en : "";
  return typeof v === "string" && v.trim() ? v : String(s?.description ?? "");
};
