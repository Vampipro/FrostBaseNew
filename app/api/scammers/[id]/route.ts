import { prisma } from "@/lib/db";
import { ok, fail, getIp, toInt } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { getSetting, hit, limited } from "@/lib/guard";
import { cardInclude, toCard } from "@/lib/dto";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = toInt((await params).id);
  if (!id) return fail("Не знайдено", 404);
  const s = await prisma.scammer.findFirst({ where: { id, moderation: { in: ["approved", "pending"] } }, include: cardInclude });
  if (!s) return fail("Не знайдено", 404);
  const ip = getIp(req);
  const k = "v:" + id;
  if (!(await limited(k, ip, 1, 10 * 60_000))) {
    await hit(k, ip);
    await prisma.scammer.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    s.viewCount += 1;
  }
  const user = await currentUser();
  const [comments, vote, appealsEnabled] = await Promise.all([
    prisma.comment.findMany({
      where: { scammerId: id, approved: true, hidden: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, content: true, createdAt: true, user: { select: { username: true, image: true } } },
    }),
    prisma.vote.findUnique({ where: { scammerId_voterId: { scammerId: id, voterId: user ? `user:${user.id}` : `ip:${ip}` } } }),
    getSetting<boolean>("appeals_enabled", true),
  ]);
  return ok({
    ...toCard(s),
    description: s.description,
    screenshots: s.screenshots,
    proofLink: s.proofLink,
    scamDate: s.scamDate,
    comments,
    myVote: vote?.voteType ?? null,
    appealAllowed: appealsEnabled && !s.appealsDisabled,
  });
}
