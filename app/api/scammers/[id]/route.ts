import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, toInt } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { hit, isBanned, limited } from "@/lib/guard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = toInt((await params).id);
  const user = await currentUser();
  if (!user) return fail("Увійди в акаунт, щоб коментувати", 401);
  const { content } = await readBody(req);
  const text = typeof content === "string" ? content.trim() : "";
  if (!id || text.length < 2 || text.length > 1000) return fail("Коментар: 2–1000 символів");
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  if (await limited("comment", ip, 10, 3600_000)) return fail("Забагато коментарів. Спробуй пізніше.", 429);
  const sc = await prisma.scammer.findUnique({ where: { id }, select: { moderation: true } });
  if (!sc || sc.moderation === "rejected") return fail("Не знайдено", 404);
  const c = await prisma.comment.create({
    data: { content: text, scammerId: id, userId: user.id, approved: true },
    select: { id: true, content: true, createdAt: true, user: { select: { username: true, image: true } } },
  });
  await hit("comment", ip);
  return ok(c);
}
