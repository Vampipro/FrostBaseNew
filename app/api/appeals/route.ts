import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, toInt, isHttpUrl } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { consume, getSetting, isBanned } from "@/lib/guard";
import { clean } from "@/lib/name";

export async function POST(req: Request) {
  const { scammerId: raw, description, screenshots, website } = await readBody(req);
  const scammerId = toInt(raw);
  if (!scammerId) return fail("Не знайдено", 404);
  if (website) return ok({ ok: true }); // honeypot
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  const text = typeof description === "string" ? clean(description, 3000) : "";
  if (text.length < 10 || text.length > 2000) return fail("Опис: 10–2000 символів");
  const shots: string[] = Array.isArray(screenshots) ? screenshots.map((s: any) => String(s).trim()).filter(Boolean) : [];
  if (shots.length > 10 || shots.some((s) => s.length > 500 || !isHttpUrl(s))) return fail("Скріншоти: до 10 коректних посилань http(s)");
  const [enabled, sc] = await Promise.all([
    getSetting<boolean>("appeals_enabled", true),
    prisma.scammer.findUnique({ where: { id: scammerId }, select: { appealsDisabled: true, moderation: true } }),
  ]);
  if (!sc || sc.moderation === "rejected") return fail("Не знайдено", 404);
  if (!enabled || sc.appealsDisabled) return fail("Подача апеляції для цього запису недоступна", 403);
  if (!(await consume("appeal", ip, 3, 24 * 3600_000))) return fail("Ліміт апеляцій з цього IP вичерпано. Спробуй завтра.", 429);
  const user = await currentUser();
  await prisma.appeal.create({ data: { scammerId, userId: user?.id ?? null, ip, description: text, screenshots: shots } });
  return ok({ ok: true });
}
