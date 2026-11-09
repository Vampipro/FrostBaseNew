import { prisma } from "@/lib/db";
import { ok, fail, readBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { dictModel, dictData } from "@/lib/dict";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const m = dictModel((await params).kind);
  if (!m) return fail("Не знайдено", 404);
  const rows = await (prisma as any)[m].findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return ok(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const kind = (await params).kind;
  const m = dictModel(kind);
  if (!m) return fail("Не знайдено", 404);
  const { data, error } = dictData(kind, await readBody(req), true);
  if (error || !data) return fail(error || "Помилка");
  try {
    return ok(await (prisma as any)[m].create({ data }));
  } catch {
    return fail("Такий ключ уже існує", 409);
  }
}
