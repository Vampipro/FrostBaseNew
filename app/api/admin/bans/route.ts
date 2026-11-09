import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireAdmin, requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  return ok(await prisma.bannedIp.findMany({ orderBy: { createdAt: "desc" }, take: 200 }));
}

export async function POST(req: Request) {
  const me = await requireStaff();
  if (!me) return fail("Немає доступу", 403);
  const { ip, reason } = await readBody(req);
  const v = String(ip ?? "").trim();
  if (!/^[0-9a-fA-F:.]{3,45}$/.test(v)) return fail("Некоректний IP");
  await prisma.bannedIp.upsert({ where: { ip: v }, update: { reason: String(reason ?? "").slice(0, 200) }, create: { ip: v, reason: String(reason ?? "").slice(0, 200), bannedBy: me.username } });
  return ok({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (id) await prisma.bannedIp.delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
