import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Коментарі, що чекають схвалення (старі несхвалені)
export async function GET() {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const rows = await prisma.comment.findMany({
    where: { approved: false, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, content: true, createdAt: true, scammerId: true, user: { select: { username: true } } },
  });
  return ok(rows);
}
