import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
export const fail = (error: string, status = 400) => ok({ error }, status);

export function getIp(req: Request): string {
  const h = req.headers;
  const direct = h.get("x-vercel-forwarded-for") || h.get("x-real-ip");
  if (direct) return direct.split(",")[0].trim();
  const xf = h.get("x-forwarded-for");
  return xf ? xf.split(",")[0].trim() : "0.0.0.0";
}

export async function readBody<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export const toInt = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

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
