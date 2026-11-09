import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody, toInt } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { hit, isBanned, limited } from "@/lib/guard";

const FIELD: Record<string, "likeCount" | "neutralCount" | "dislikeCount"> = { like: "likeCount", neutral: "neutralCount", dislike: "dislikeCount" };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = toInt((await params).id);
  const { voteType } = await readBody(req);
  if (!id || !FIELD[voteType]) return fail("Невірний запит");
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  if (await limited("vote", ip, 30, 3600_000)) return fail("Забагато голосів. Спробуй пізніше.", 429);
  const sc = await prisma.scammer.findUnique({ where: { id }, select: { id: true, moderation: true } });
  if (!sc || sc.moderation === "rejected") return fail("Не знайдено", 404);

  const user = await currentUser();
  const voterId = user ? `user:${user.id}` : `ip:${ip}`;
  const existing = await prisma.vote.findUnique({ where: { scammerId_voterId: { scammerId: id, voterId } } });
  let myVote: string | null = voteType;

  await prisma.$transaction(async (tx) => {
    if (existing && existing.voteType === voteType) {
      await tx.vote.delete({ where: { id: existing.id } });
      await tx.scammer.update({ where: { id }, data: { [FIELD[voteType]]: { decrement: 1 } } });
      myVote = null;
    } else {
      if (existing) {
        await tx.vote.update({ where: { id: existing.id }, data: { voteType } });
        await tx.scammer.update({ where: { id }, data: { [FIELD[existing.voteType]]: { decrement: 1 }, [FIELD[voteType]]: { increment: 1 } } });
      } else {
        await tx.vote.create({ data: { scammerId: id, voteType, voterId } });
        await tx.scammer.update({ where: { id }, data: { [FIELD[voteType]]: { increment: 1 } } });
      }
    }
    for (const f of Object.values(FIELD)) await tx.scammer.updateMany({ where: { id, [f]: { lt: 0 } }, data: { [f]: 0 } });
  });
  await hit("vote", ip);
  const s = await prisma.scammer.findUnique({ where: { id }, select: { likeCount: true, neutralCount: true, dislikeCount: true } });
  return ok({ myVote, ...s });
}
