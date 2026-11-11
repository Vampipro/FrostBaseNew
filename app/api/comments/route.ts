import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, toInt } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { consume, isBanned } from "@/lib/guard";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Увійди в акаунт, щоб коментувати", 401);
  const { scammerId, content } = await readBody(req);
  const id = toInt(scammerId);
  const text = typeof content === "string" ? content.trim() : "";
  if (!id || text.length < 2 || text.length > 1000) return fail("Коментар: 2–1000 символів");
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  const sc = await prisma.scammer.findUnique({ where: { id }, select: { moderation: true } });
  if (!sc || sc.moderation === "rejected") return fail("Не знайдено", 404);
  if (!(await consume("comment", ip, 10, 3600_000)) || !(await consume("comment-u", String(user.id), 20, 3600_000)))
    return fail("Забагато коментарів. Спробуй пізніше.", 429);
  const c = await prisma.comment.create({
    data: { content: text, scammerId: id, userId: user.id, approved: true },
    select: { id: true, content: true, createdAt: true, user: { select: { username: true, image: true } } },
  });
  return ok(c);
}
