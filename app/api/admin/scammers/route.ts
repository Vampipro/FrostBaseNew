import { prisma } from "@/lib/db";
import { ok, fail, readBody } from "@/lib/http";
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
