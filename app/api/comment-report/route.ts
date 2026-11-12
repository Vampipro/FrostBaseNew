import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, toInt } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { consume, isBanned } from "@/lib/guard";
import { clean } from "@/lib/name";

export async function POST(req: Request) {
  const { commentId: raw, reason } = await readBody(req);
  const commentId = toInt(raw);
  if (!commentId) return fail("Не знайдено", 404);
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } });
  if (!c) return fail("Не знайдено", 404);
  const dup = await prisma.commentReport.findFirst({ where: { commentId, ip, status: "pending" } });
  if (dup) return fail("Ти вже скаржився на цей коментар", 409);
  if (!(await consume("report", ip, 10, 3600_000))) return fail("Забагато скарг. Спробуй пізніше.", 429);
  const user = await currentUser();
  await prisma.commentReport.create({
    data: { commentId, ip, reporterId: user?.id ?? null, reason: typeof reason === "string" ? clean(reason, 300) : "" },
  });
  return ok({ ok: true });
}
