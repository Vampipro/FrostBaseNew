/** Прибирає ведучі "@" з імені, що прийшло з БД (щоб не було "@@name"). */
export const uname = (n: unknown) => String(n ?? "").replace(/^@+/, "");

/** Максимум для BigInt-колонки Postgres (int8). */
export const MAX_TG = BigInt("9223372036854775807");
export const isTgId = (s: string) => /^\d{1,19}$/.test(s) && BigInt(s) <= MAX_TG;
