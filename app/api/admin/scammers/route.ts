import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";
import { replaceStatuses, scammerData } from "@/lib/admin-scammer";

export async function POST(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const b = await readBody(req);
  const { data, error } = scammerData({ moderation: "approved", ...b });
  if (error || !data) return fail(error || "Помилка");
  if (!data.name) return fail("Вкажи ім'я");
  const sc = await prisma.scammer.create({ data });
  await replaceStatuses(sc.id, Array.isArray(b.statusIds) ? b.statusIds : []);
  return ok({ id: sc.id });
}

export async function PATCH(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const b = await readBody(req);
  const id = toInt(b.id);
  if (!id) return fail("Не знайдено", 404);
  const { data, error } = scammerData(b);
  if (error || !data) return fail(error || "Помилка");
  const old = await prisma.scammer.findUnique({ where: { id }, select: { name: true } });
  if (!old) return fail("Не знайдено", 404);
  if (data.name && data.name !== old.name) await prisma.scammerNameHistory.create({ data: { scammerId: id, oldName: old.name, newName: data.name } });
  await prisma.scammer.update({ where: { id }, data });
  if (Array.isArray(b.statusIds)) await replaceStatuses(id, b.statusIds);
  // змінили модерацію в редакторі — синхронізуємо жалоби цього запису
  if (data.moderation === "approved" || data.moderation === "rejected") {
    await prisma.submission.updateMany({
      where: { scammerId: id, status: { in: ["pending", "revision"] } },
      data: { status: data.moderation },
    });
  }
  return ok({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("Не знайдено", 404);
  await prisma.scammer.delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
