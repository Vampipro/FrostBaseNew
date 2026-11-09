import { prisma } from "./db";

export async function hits(action: string, key: string, windowMs: number) {
  return prisma.rateLimit.count({ where: { action, key, createdAt: { gt: new Date(Date.now() - windowMs) } } });
}
export async function limited(action: string, key: string, max: number, windowMs: number) {
  return (await hits(action, key, windowMs)) >= max;
}
export async function hit(action: string, key: string) {
  await prisma.rateLimit.create({ data: { action, key } });
  if (Math.random() < 0.02) {
    prisma.rateLimit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 864e5) } } }).catch(() => {});
  }
}
export async function isBanned(ip: string) {
  return !!(await prisma.bannedIp.findUnique({ where: { ip } }));
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s ? (s.value as T) : fallback;
}
export async function setSetting(key: string, value: any) {
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export type Limits = { submissionsPerIp: number; submissionsWindowHours: number };
export const getLimits = async (): Promise<Limits> => ({
  submissionsPerIp: 3,
  submissionsWindowHours: 24,
  ...(await getSetting<Partial<Limits>>("limits", {})),
});

export function lev(a: string, b: string) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
export function simScore(q: string, u: string) {
  let s = 1 - lev(q, u) / Math.max(q.length, u.length);
  if (u.startsWith(q) || q.startsWith(u)) s += 0.18;
  if (u.endsWith(q) || q.endsWith(u)) s += 0.08;
  return Math.min(s, 0.99);
}
