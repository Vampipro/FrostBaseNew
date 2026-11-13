import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, toInt, isHttpUrl } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { consume, isBanned } from "@/lib/guard";
import { clean } from "@/lib/name";
import { VERDICTS } from "@/lib/bot";

// Користувач залишає вердикт + скріншоти перевірки бота. Видно лише після схвалення персоналом.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Лише для зареєстрованих користувачів", 401);
  const b = await readBody(req);
  if (b.website) return ok({ ok: true }); // honeypot
  const scammerId = toInt(b.scammerId);
  if (!scammerId) return fail("Не знайдено", 404);
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);

  const verdict = typeof b.verdict === "string" ? b.verdict : "";
  if (!(VERDICTS as readonly string[]).includes(verdict)) return fail("Обери вердикт");
  const shots: string[] = Array.isArray(b.screenshots) ? b.screenshots.map((s: any) => String(s).trim()).filter(Boolean) : [];
  if (shots.length < 1) return fail("Додай хоча б одне посилання на скріншот");
  if (shots.length > 5 || shots.some((s) => s.length > 500 || !isHttpUrl(s))) return fail("Скріншоти: до 5 коректних посилань http(s)");
  const comment = typeof b.comment === "string" ? clean(b.comment, 500) : "";

  const sc = await prisma.scammer.findUnique({ where: { id: scammerId }, select: { botCheck: true, moderation: true } });
  if (!sc || !sc.botCheck) return fail("Не знайдено", 404);
  if (sc.moderation !== "pending") return fail("Перевірка для цього бота вже завершена", 409);
  const dup = await prisma.botCheck.findFirst({ where: { scammerId, userId: user.id, status: "pending" }, select: { id: true } });
  if (dup) return fail("Твоя перевірка вже очікує схвалення", 409);
  if (!(await consume("botcheck-u", String(user.id), 5, 3600_000)) || !(await consume("botcheck", ip, 10, 3600_000)))
    return fail("Забагато перевірок. Спробуй пізніше.", 429);

  await prisma.botCheck.create({ data: { scammerId, userId: user.id, verdict, screenshots: shots, comment, ip } });
  return ok({ ok: true });
}
