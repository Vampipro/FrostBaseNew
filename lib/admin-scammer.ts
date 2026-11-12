import { prisma } from "./db";
import { parseAmount, isHttpUrl } from "./http";
import { isTgId } from "./name";
import { clean } from "./name";

/** Перетворює тіло форми адмінки в дані для Prisma. Повертає {data} або {error}. */
export function scammerData(b: any): { data?: any; error?: string } {
  const d: any = {};
  const s = (v: unknown, max: number) => clean(v, max);
  if ("name" in b) {
    d.name = s(b.name, 64).replace(/^@+/, "");
    if (!d.name) return { error: "Ім'я не може бути порожнім" };
  }
  if ("telegramUserId" in b) {
    const t = s(b.telegramUserId, 20);
    if (t && !isTgId(t)) return { error: "Telegram ID — лише цифри" };
    d.telegramUserId = t ? BigInt(t) : null;
  }
  if ("description" in b) d.description = s(b.description, 4000);
  if ("descriptionI18n" in b) {
    const o = b.descriptionI18n && typeof b.descriptionI18n === "object" ? b.descriptionI18n : {};
    const v: Record<string, string> = {};
    for (const l of ["ua", "en"]) {
      const x = s(o[l], 4000);
      if (x) v[l] = x;
    }
    d.descriptionI18n = v;
  }
  if ("botCheck" in b) d.botCheck = !!b.botCheck;
  if ("botReward" in b) d.botReward = s(b.botReward, 80);
  if ("botUsage" in b) d.botUsage = s(b.botUsage, 60);
  if ("botSponsors" in b) {
    const raw = s(b.botSponsors, 6);
    const n = Number(raw);
    if (raw && (!Number.isInteger(n) || n < 0 || n > 100000)) return { error: "Кількість спонсорів: ціле число ≥ 0" };
    d.botSponsors = raw ? n : null;
  }
  if ("scamCurrency" in b) d.scamCurrency = s(b.scamCurrency, 24);
  if ("proofLink" in b) {
    d.proofLink = s(b.proofLink, 500);
    if (d.proofLink && !isHttpUrl(d.proofLink)) return { error: "Посилання на докази має бути http(s)" };
  }
  if ("scamAmount" in b) {
    const raw = s(b.scamAmount, 24);
    const n = parseAmount(raw);
    if (raw && n === null) return { error: "Сума має бути числом" };
    d.scamAmount = n;
  }
  if ("scamDate" in b) {
    const raw = s(b.scamDate, 40);
    const dt = raw ? new Date(raw) : null;
    if (dt && Number.isNaN(dt.getTime())) return { error: "Некоректна дата" };
    d.scamDate = dt;
  }
  if ("typeId" in b) d.typeId = b.typeId ? Number(b.typeId) || null : null;
  if ("appealsDisabled" in b) d.appealsDisabled = !!b.appealsDisabled;
  if ("moderation" in b) {
    if (!["pending", "approved", "rejected"].includes(b.moderation)) return { error: "Невірний статус модерації" };
    d.moderation = b.moderation;
  }
  if ("screenshots" in b) {
    const arr = Array.isArray(b.screenshots) ? b.screenshots.map((x: any) => String(x).trim()).filter(Boolean) : [];
    if (arr.some((x: string) => !isHttpUrl(x))) return { error: "Скріншоти мають бути http(s)-посиланнями" };
    d.screenshots = arr;
  }
  for (const f of ["likeCount", "neutralCount", "dislikeCount", "viewCount", "searchCount"]) {
    if (f in b) {
      const n = Number(b[f]);
      if (!Number.isInteger(n) || n < 0 || n > 1e9) return { error: `${f}: ціле число ≥ 0` };
      d[f] = n;
    }
  }
  return { data: d };
}

export async function replaceStatuses(scammerId: number, statusIds: number[]) {
  const ids = [...new Set(statusIds.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  await prisma.scammerStatusLink.deleteMany({ where: { scammerId } });
  if (ids.length) await prisma.scammerStatusLink.createMany({ data: ids.map((statusId) => ({ scammerId, statusId })), skipDuplicates: true });
}
