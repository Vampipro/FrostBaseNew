import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
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

export async function PATCH(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const { id: rawId, action } = await readBody(req);
  const id = toInt(rawId);
  const r = id ? await prisma.commentReport.findUnique({ where: { id } }) : null;
  if (!r) return fail("Не знайдено", 404);
  if (action === "hide") {
    await prisma.$transaction([
      prisma.comment.update({ where: { id: r.commentId }, data: { hidden: true } }),
      prisma.commentReport.updateMany({ where: { commentId: r.commentId, status: "pending" }, data: { status: "resolved" } }),
    ]);
  } else if (action === "dismiss") {
    await prisma.commentReport.update({ where: { id: r.id }, data: { status: "dismissed" } });
  } else return fail("Невідома дія");
  return ok({ ok: true });
}
