import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, toInt } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { consume, isBanned } from "@/lib/guard";
import { clean } from "@/lib/name";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Увійди в акаунт, щоб коментувати", 401);
  const { scammerId, content } = await readBody(req);
  const id = toInt(scammerId);
  const text = typeof content === "string" ? clean(content, 1000) : "";
  if (!id || text.length < 2 || text.length > 1000) return fail("Коментар: 2–1000 символів");
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  const sc = await prisma.scammer.findUnique({ where: { id }, select: { moderation: true } });
  if ((text.match(/https?:\/\/|t\.me\/|www\./gi) || []).length > 2) return fail("Забагато посилань у коментарі");
  const same = await prisma.comment.findFirst({ where: { scammerId: id, userId: user.id, content: text, createdAt: { gt: new Date(Date.now() - 24 * 3600_000) } }, select: { id: true } });
  if (same) return fail("Такий коментар уже додано", 409);
  if (!sc || sc.moderation === "rejected") return fail("Не знайдено", 404);
  if (!(await consume("comment", ip, 10, 3600_000)) || !(await consume("comment-u", String(user.id), 20, 3600_000)))
    return fail("Забагато коментарів. Спробуй пізніше.", 429);
  const c = await prisma.comment.create({
    data: { content: text, scammerId: id, userId: user.id, approved: true },
    select: { id: true, content: true, createdAt: true, user: { select: { username: true, image: true } } },
  });
  return ok(c);
}
