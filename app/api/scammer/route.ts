import { prisma } from "@/lib/db";
import { ok, fail, getIp, toInt } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { getSetting } from "@/lib/guard";
import { memOnce } from "@/lib/mem";
import { cardInclude, toCard } from "@/lib/dto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("Не знайдено", 404);
  const s = await prisma.scammer.findFirst({ where: { id, moderation: { in: ["approved", "pending"] } }, include: cardInclude });
  if (!s) return fail("Не знайдено", 404);
  const ip = getIp(req);
  if (memOnce(`v:${id}:${ip}`, 10 * 60_000)) {
    prisma.scammer.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
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
    prisma.vote.findFirst({ where: { scammerId: id, voterId: { in: user ? [`user:${user.id}`, `ip:${ip}`] : [`ip:${ip}`] } }, orderBy: { voterId: "desc" } }),
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
