import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";
import { clean } from "@/lib/name";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("Не знайдено", 404);
  const exists = await prisma.scammer.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return fail("Запис не знайдено", 404);
  const rows = await prisma.scammerNameHistory.findMany({
    where: { scammerId: id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, oldName: true, newName: true, createdAt: true },
  });
  return ok(rows);
}

export async function POST(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const body = await readBody(req);
  const id = toInt(body.id);
  const oldName = clean(body.oldName, 64).replace(/^@+/, "");
  if (!id) return fail("Не знайдено", 404);
  if (!oldName) return fail("Вкажи попередній юзернейм");

  const scammer = await prisma.scammer.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!scammer) return fail("Запис не знайдено", 404);
  if (oldName.toLowerCase() === scammer.name.toLowerCase()) return fail("Цей юзернейм уже є поточним");

  const duplicate = await prisma.scammerNameHistory.findFirst({
    where: { scammerId: id, oldName: { equals: oldName, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return fail("Такий юзернейм уже є в історії");

  const row = await prisma.scammerNameHistory.create({
    data: { scammerId: id, oldName, newName: scammer.name.replace(/^@+/, "") },
    select: { id: true, oldName: true, newName: true, createdAt: true },
  });
  return ok(row);
}

export async function DELETE(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const sp = new URL(req.url).searchParams;
  const historyId = toInt(sp.get("id"));
  const scammerId = toInt(sp.get("scammerId"));
  if (!historyId || !scammerId) return fail("Не знайдено", 404);
  const deleted = await prisma.scammerNameHistory.deleteMany({ where: { id: historyId, scammerId } });
  if (!deleted.count) return fail("Запис історії не знайдено", 404);
  return ok({ ok: true });
}
