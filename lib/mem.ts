// Легкі обмеження в пам'яті інстансу (без запитів до БД) + кеш на короткий час.
const buckets = new Map<string, number[]>();

export function memLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => t > now - windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.length || v[v.length - 1] < now - 3_600_000) buckets.delete(k);
  }
  return true;
}
/** true лише перший раз за ttl */
export const memOnce = (key: string, ttlMs: number) => memLimit("once:" + key, 1, ttlMs);

const store = new Map<string, { exp: number; v: unknown }>();
export async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const c = store.get(key);
  if (c && c.exp > Date.now()) return c.v as T;
  const v = await fn();
  store.set(key, { exp: Date.now() + ttlMs, v });
  return v;
}
