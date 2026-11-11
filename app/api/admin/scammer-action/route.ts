import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const { id: rawId, action, targetId, reason } = await readBody(req);
  const id = toInt(rawId);
  const sc = id ? await prisma.scammer.findUnique({ where: { id } }) : null;
  if (!sc) return fail("Не знайдено", 404);

  if (action === "approve") {
    await prisma.$transaction([
      prisma.scammer.update({ where: { id: sc.id }, data: { moderation: "approved" } }),
      prisma.submission.updateMany({ where: { scammerId: sc.id, status: { in: ["pending", "revision"] } }, data: { status: "approved" } }),
    ]);
    return ok({ ok: true });
  }
  if (action === "reject") {
    await prisma.$transaction([
      prisma.scammer.update({ where: { id: sc.id }, data: { moderation: "rejected" } }),
      prisma.submission.updateMany({ where: { scammerId: sc.id, status: { in: ["pending", "revision"] } }, data: { status: "rejected", revisionReason: String(reason ?? "").slice(0, 300) } }),
    ]);
    return ok({ ok: true });
  }
  if (action === "merge") {
    const tid = toInt(targetId);
    if (!tid || tid === sc.id) return fail("Вкажи коректний ID запису, з яким об'єднати");
    const target = await prisma.scammer.findUnique({ where: { id: tid } });
    if (!target) return fail("Цільовий запис не знайдено", 404);
    const shots = [...new Set([...target.screenshots, ...sc.screenshots])];
    await prisma.$transaction([
      prisma.submission.updateMany({ where: { scammerId: sc.id }, data: { scammerId: tid, status: "approved" } }),
      prisma.scammer.update({
        where: { id: tid },
        data: { screenshots: shots, telegramUserId: target.telegramUserId ?? sc.telegramUserId, description: target.description || sc.description },
      }),
      prisma.comment.updateMany({ where: { scammerId: sc.id }, data: { scammerId: tid } }),
      prisma.scammer.delete({ where: { id: sc.id } }),
    ]);
    return ok({ ok: true, mergedInto: tid });
  }
  return fail("Невідома дія");
}
