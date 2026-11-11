import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Коментарі, що чекають схвалення
export async function GET() {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const rows = await prisma.comment.findMany({
    where: { approved: false, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, content: true, createdAt: true, scammerId: true, user: { select: { username: true } } },
  });
  return ok(rows);
}

export async function PATCH(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const b = await readBody(req);
  const id = toInt(b.id);
  if (!id) return fail("Не знайдено", 404);
  const data: any = {};
  if ("approved" in b) data.approved = !!b.approved;
  if ("hidden" in b) data.hidden = !!b.hidden;
  await prisma.comment.update({ where: { id }, data }).catch(() => {});
  return ok({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (id) await prisma.comment.delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
