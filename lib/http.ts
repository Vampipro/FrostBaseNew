import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
export const fail = (error: string, status = 400) => ok({ error }, status);

const IP_RE = /^[0-9a-fA-F:.]{3,45}$/;
export function getIp(req: Request): string {
  const h = req.headers;
  const raw = h.get("x-vercel-forwarded-for") || h.get("x-real-ip") || h.get("x-forwarded-for") || "";
  const ip = raw.split(",")[0].trim();
  // сміття/надто довгі значення заголовка не потрапляють у БД і ключі rate-limit
  return IP_RE.test(ip) ? ip : "0.0.0.0";
}

export async function readBody<T = any>(req: Request): Promise<T> {
  try {
    if (Number(req.headers.get("content-length") || 0) > 200_000) return {} as T;
    const text = await req.text(); // chunked-тіла теж обмежуємо, а не лише content-length
    if (text.length > 200_000) return {} as T;
    const v = JSON.parse(text);
    return (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as T;
  } catch {
    return {} as T;
  }
}

export const toInt = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 2147483647 ? n : null;
};

export function okCached(data: unknown, seconds: number) {
  return new NextResponse(JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)), {
    headers: { "content-type": "application/json", "cache-control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}` },
  });
}

export const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export function normName(raw: string): string {
  return raw.trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "").replace(/^@/, "").trim();
}

export function parseAmount(v: unknown): number | null {
  const s = String(v ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 1e15 ? n : null;
}
