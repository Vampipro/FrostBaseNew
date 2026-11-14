import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { dictModel, dictData } from "@/lib/dict";

export const dynamic = "force-dynamic";

// GET ?kind=statuses|types — список; POST {kind,...} — створити; PATCH {kind,id,...} — змінити; DELETE ?kind=&id= — видалити
export async function GET(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const m = dictModel(new URL(req.url).searchParams.get("kind") || "");
  if (!m) return fail("Не знайдено", 404);
  return ok(await (prisma as any)[m].findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const b = await readBody(req);
  const m = dictModel(String(b.kind));
  if (!m) return fail("Не знайдено", 404);
  const { data, error } = dictData(String(b.kind), b, true);
  if (error || !data) return fail(error || "Помилка");
  try {
    return ok(await (prisma as any)[m].create({ data }));
  } catch {
    return fail("Такий ключ уже існує", 409);
  }
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const b = await readBody(req);
  const m = dictModel(String(b.kind));
  const id = toInt(b.id);
  if (!m || !id) return fail("Не знайдено", 404);
  const { data, error } = dictData(String(b.kind), b, false);
  if (error || !data) return fail(error || "Помилка");
  try {
    return ok(await (prisma as any)[m].update({ where: { id }, data }));
  } catch {
    return fail("Не вдалося зберегти (можливо, ключ зайнятий)", 409);
  }
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const sp = new URL(req.url).searchParams;
  const m = dictModel(sp.get("kind") || "");
  const id = toInt(sp.get("id"));
  if (!m || !id) return fail("Не знайдено", 404);
  await (prisma as any)[m].delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
