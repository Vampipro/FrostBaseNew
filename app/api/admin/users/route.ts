import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  const rows = await prisma.user.findMany({
    where: q ? { username: { contains: q, mode: "insensitive" } } : {},
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: { id: true, username: true, role: true, banReason: true, createdAt: true },
  });
  return ok(rows);
}

export async function PATCH(req: Request) {
  const me = await requireAdmin();
  if (!me) return fail("Немає доступу", 403);
  const b = await readBody(req);
  const id = toInt(b.id);
  if (!id) return fail("Не знайдено", 404);
  const data: any = {};
  if ("role" in b) {
    if (!["user", "moderator", "admin"].includes(b.role)) return fail("Невірна роль");
    if (id === me.id && b.role !== "admin") return fail("Не можна понизити самого себе");
    data.role = b.role;
  }
  if ("banReason" in b) {
    if (id === me.id) return fail("Не можна заблокувати самого себе");
    data.banReason = String(b.banReason ?? "").trim().slice(0, 200);
  }
  await prisma.user.update({ where: { id }, data }).catch(() => {});
  return ok({ ok: true });
}
