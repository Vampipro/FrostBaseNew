import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt } from "@/lib/http";
import { requireStaff } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const id = toInt((await params).id);
  const { action } = await readBody(req);
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
