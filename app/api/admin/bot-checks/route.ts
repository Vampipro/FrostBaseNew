import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const rows = await prisma.botCheck.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { username: true } }, scammer: { select: { id: true, name: true, moderation: true, checking: true } } },
  });
  return ok(rows);
}

export async function PATCH(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const { id: raw, status } = await readBody(req);
  const id = toInt(raw);
  if (!id || !["approved", "rejected", "pending"].includes(status)) return fail("Некоректні дані");
  await prisma.botCheck.update({ where: { id }, data: { status } }).catch(() => null);
  return ok({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("Некоректні дані");
  await prisma.botCheck.delete({ where: { id } }).catch(() => null);
  return ok({ ok: true });
}
