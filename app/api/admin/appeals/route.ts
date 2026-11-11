import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const rows = await prisma.appeal.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { scammer: { select: { id: true, name: true } }, user: { select: { username: true } } },
  });
  return ok(rows);
}

export async function PATCH(req: Request) {
  const staff = await requireStaff();
  if (!staff) return fail("Немає доступу", 403);
  const { id: rawId, status } = await readBody(req);
  const id = toInt(rawId);
  if (!id || !["pending", "accepted", "rejected", "banned"].includes(status)) return fail("Невірний запит");
  const a = await prisma.appeal.update({ where: { id }, data: { status } }).catch(() => null);
  if (!a) return fail("Не знайдено", 404);
  if (status === "banned" && a.ip) {
    await prisma.bannedIp.upsert({ where: { ip: a.ip }, update: {}, create: { ip: a.ip, reason: "Спам в апеляціях", bannedBy: staff.username } });
  }
  return ok({ ok: true });
}
