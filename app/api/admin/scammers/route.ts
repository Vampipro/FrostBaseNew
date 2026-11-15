import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";
import { replaceStatuses, scammerData, scammerDeleteOps } from "@/lib/admin-scammer";

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
  await prisma.$transaction(async (tx) => {
    if (data.name && data.name !== old.name) {
      await tx.scammerNameHistory.create({ data: { scammerId: id, oldName: old.name.replace(/^@+/, ""), newName: data.name } });
    }
    await tx.scammer.update({ where: { id }, data });
  });
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
  const exists = await prisma.scammer.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return fail("Запис уже видалено або не існує", 404);
  try {
    await prisma.$transaction(scammerDeleteOps(id));
  } catch (e: any) {
    console.error("scammer delete failed", id, e?.code, e?.message);
    return fail("Не вдалося видалити запис: " + (e?.code || "помилка бази даних"), 500);
  }
  // переконуємось, що запис справді зник
  if (await prisma.scammer.findUnique({ where: { id }, select: { id: true } })) return fail("Запис не видалився, спробуй ще раз", 500);
  return ok({ ok: true });
}
