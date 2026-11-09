import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const rows = await prisma.appeal.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { scammer: { select: { id: true, name: true } }, user: { select: { username: true } } },
  });
  return ok(rows);
}
