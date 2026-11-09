import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";
import { replaceStatuses, scammerData } from "@/lib/admin-scammer";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt((await params).id);
  if (!id) return fail("Не знайдено", 404);
  const b = await readBody(req);
  const { data, error } = scammerData(b);
  if (error || !data) return fail(error || "Помилка");
  const old = await prisma.scammer.findUnique({ where: { id }, select: { name: true } });
  if (!old) return fail("Не знайдено", 404);
  if (data.name && data.name !== old.name) await prisma.scammerNameHistory.create({ data: { scammerId: id, oldName: old.name, newName: data.name } });
  await prisma.scammer.update({ where: { id }, data });
  if (Array.isArray(b.statusIds)) await replaceStatuses(id, b.statusIds);
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt((await params).id);
  if (!id) return fail("Не знайдено", 404);
  await prisma.scammer.delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
