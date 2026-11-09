import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return fail("Немає доступу", 403);
  const id = toInt((await params).id);
  const b = await readBody(req);
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
