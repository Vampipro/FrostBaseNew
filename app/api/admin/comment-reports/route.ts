import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const rows = await prisma.commentReport.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { comment: { select: { id: true, content: true, hidden: true, scammerId: true, user: { select: { id: true, username: true } } } } },
  });
  return ok(rows);
}
