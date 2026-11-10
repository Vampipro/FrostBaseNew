import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { dictModel, dictData } from "@/lib/dict";

export async function PATCH(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const { kind, id: rawId } = await params;
  const m = dictModel(kind);
  const id = toInt(rawId);
  if (!m || !id) return fail("Не знайдено", 404);
  const { data, error } = dictData(kind, await readBody(req), false);
  if (error || !data) return fail(error || "Помилка");
  try {
    return ok(await (prisma as any)[m].update({ where: { id }, data }));
  } catch {
    return fail("Не вдалося зберегти (можливо, ключ зайнятий)", 409);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const { kind, id: rawId } = await params;
  const m = dictModel(kind);
  const id = toInt(rawId);
  if (!m || !id) return fail("Не знайдено", 404);
  await (prisma as any)[m].delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
