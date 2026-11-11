import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, normName, parseAmount, isHttpUrl } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { consume, getLimits, isBanned } from "@/lib/guard";

export async function POST(req: Request) {
  const b = await readBody(req);
  if (b.website) return ok({ ok: true }); // honeypot: боти бачать «успіх»
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const username = normName(str(b.username, 64));
  const tg = str(b.telegramId, 20).replace(/\s/g, "");
  if (!username && !tg) return fail("Вкажи юзернейм або Telegram ID");
  if (tg && !/^\d{1,19}$/.test(tg)) return fail("Telegram ID має складатися лише з цифр");
  if (username && !/^[A-Za-z0-9_]{3,64}$/.test(username)) return fail("Юзернейм: латиниця, цифри та _ (мін. 3 символи)");

  const statusId = Number(b.statusId);
  const status = Number.isInteger(statusId) ? await prisma.scammerStatus.findUnique({ where: { id: statusId } }) : null;
  if (!status || status.hidden || !status.showInForm) return fail("Обери тег зі списку");

  const shots: string[] = Array.isArray(b.screenshots) ? b.screenshots.map((s: any) => String(s).trim()).filter(Boolean) : [];
  if (shots.length < 1) return fail("Додай хоча б одне посилання на скріншот");
  if (shots.length > 10 || shots.some((s) => s.length > 500 || !isHttpUrl(s))) return fail("Скріншоти: до 10 коректних посилань http(s)");

  const wantContact = b.wantContact === true;
  const contact = normName(str(b.contactUsername, 64));
  if (wantContact && !/^[A-Za-z0-9_]{3,64}$/.test(contact)) return fail("Вкажи свій юзернейм для зв'язку");

  const amountRaw = str(b.scamAmount, 24);
  const amount = parseAmount(amountRaw);
  if (amountRaw && amount === null) return fail("Сума має бути числом");

  const limits = await getLimits();
  const windowMs = limits.submissionsWindowHours * 3600_000;

  const dupWhere: any[] = [];
  if (username) dupWhere.push({ scammer: { name: { equals: username, mode: "insensitive" } } });
  if (tg) dupWhere.push({ scammer: { telegramUserId: BigInt(tg) } });
  const dup = await prisma.submission.findFirst({ where: { ip, createdAt: { gt: new Date(Date.now() - 24 * 3600_000) }, OR: dupWhere } });
  if (dup) return fail("Ти вже подавав заявку на цього користувача", 409);

  if (!(await consume("submission", ip, limits.submissionsPerIp, windowMs)))
    return fail(`Ліміт: не більше ${limits.submissionsPerIp} заявок з одного IP за ${limits.submissionsWindowHours} год.`, 429);

  const user = await currentUser();
  const now = new Date();
  const created = await prisma.$transaction(async (tx) => {
    const sc = await tx.scammer.create({
      data: {
        name: username || tg,
        telegramUserId: tg ? BigInt(tg) : null,
        description: str(b.description, 2000),
        moderation: "pending",
        submittedAt: now,
        scamAmount: amount,
        scamCurrency: str(b.scamCurrency, 24),
        screenshots: shots,
        statuses: { create: [{ statusId: status.id }] },
      },
    });
    await tx.submission.create({
      data: {
        scammerId: sc.id,
        reporterId: user?.id ?? null,
        ip,
        contactUsername: wantContact ? contact : "",
        description: str(b.description, 2000),
        screenshots: shots,
        scamAmount: amount,
        scamCurrency: str(b.scamCurrency, 24),
      },
    });
    return sc;
  });
  return ok({ ok: true, id: created.id });
}
