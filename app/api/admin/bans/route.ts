import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { isIP } from "node:net";

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
  if (!isIP(v)) return fail("Некоректний IP");
  // «0.0.0.0» — це IP-заглушка для запитів без заголовка, бан зачепить усіх; локальні адреси теж не баним
  if (v === "0.0.0.0" || v === "::" || v === "::1" || /^(127\.|10\.|192\.168\.|169\.254\.)/.test(v)) return fail("Цю адресу банити не можна");
  await prisma.bannedIp.upsert({ where: { ip: v }, update: { reason: String(reason ?? "").slice(0, 200) }, create: { ip: v, reason: String(reason ?? "").slice(0, 200), bannedBy: me.username } });
  return ok({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (id) await prisma.bannedIp.delete({ where: { id } }).catch(() => {});
  return ok({ ok: true });
}
