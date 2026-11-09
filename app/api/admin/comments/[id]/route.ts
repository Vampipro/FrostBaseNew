import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt((await params).id);
  const b = await readBody(req);
  if (!id) return fail("Не знайдено", 404);
  const data: any = {};
  if ("approved" in b) data.approved = !!b.approved;
  if ("hidden" in b) data.hidden = !!b.hidden;
  await prisma.comment.update({ where: { id }, data }).catch(() => {});
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt((await params).id);
  if (id) await prisma.comment.delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
