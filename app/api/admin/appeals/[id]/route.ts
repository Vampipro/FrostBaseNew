import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  if (!staff) return fail("Немає доступу", 403);
  const id = toInt((await params).id);
  const { status } = await readBody(req);
  if (!id || !["pending", "accepted", "rejected", "banned"].includes(status)) return fail("Невірний запит");
  const a = await prisma.appeal.update({ where: { id }, data: { status } }).catch(() => null);
  if (!a) return fail("Не знайдено", 404);
  if (status === "banned" && a.ip) {
    await prisma.bannedIp.upsert({ where: { ip: a.ip }, update: {}, create: { ip: a.ip, reason: "Спам в апеляціях", bannedBy: staff.username } });
  }
  return ok({ ok: true });
}
