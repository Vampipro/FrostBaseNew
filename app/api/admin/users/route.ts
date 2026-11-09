import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/http";
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
