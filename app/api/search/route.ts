import { prisma } from "@/lib/db";
import { ok, fail, getIp, normName } from "@/lib/http";
import { consume, simScore } from "@/lib/guard";
import { memLimit } from "@/lib/mem";
import { cardInclude, toCard } from "@/lib/dto";
import { isTgId } from "@/lib/name";

export const dynamic = "force-dynamic";
const PAGE = 24;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const ip = getIp(req);
  if (!memLimit("search:" + ip, 60, 60_000)) return fail("Забагато запитів. Зачекай хвилину.", 429);

  const q = normName((sp.get("q") || "").slice(0, 64));
  const tokens = (sp.get("statuses") || "").split(",").filter(Boolean);
  const statusIds = tokens.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const wantPending = tokens.includes("pending");
  const typeId = Number(sp.get("type")) || undefined;
  const sort = sp.get("sort") || "rel";
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const base: any[] = [{ moderation: { in: ["approved", "pending"] } }];
  if (typeId) base.push({ typeId });
  if (tokens.length) {
    const or: any[] = [];
    if (statusIds.length) or.push({ statuses: { some: { statusId: { in: statusIds } } } });
    if (wantPending) or.push({ moderation: "pending" });
    base.push({ OR: or });
  }
  const and = [...base];
  const isNum = isTgId(q);
  if (q) {
    const or: any[] = [{ name: { contains: q, mode: "insensitive" } }];
    if (isNum) or.push({ telegramUserId: BigInt(q) });
    and.push({ OR: or });
  }

  const rows = await prisma.scammer.findMany({ where: { AND: and }, include: cardInclude, take: 300, orderBy: { createdAt: "desc" } });
  const ql = q.toLowerCase();
  const isExact = (r: any) => !!q && (r.name.toLowerCase() === ql || r.telegramUserId?.toString() === q);
  const date = (r: any) => new Date(r.submittedAt ?? r.createdAt).getTime();
  rows.sort((a: any, b: any) => {
    if (sort === "new") return date(b) - date(a);
    if (sort === "old") return date(a) - date(b);
    if (sort === "likes") return b.likeCount - a.likeCount;
    if (sort === "views") return b.viewCount - a.viewCount;
    if (sort === "complaints") return b._count.submissions - a._count.submissions;
    return Number(isExact(b)) - Number(isExact(a)) || b.searchCount - a.searchCount || b.likeCount - a.likeCount || date(b) - date(a);
  });

  const exactIds = rows.filter(isExact).map((r: any) => r.id);
  if (q && page === 1) {
    // не накручуємо лічильники: один і той самий запит з одного IP враховується раз на 10 хв
    if (await consume("s:" + ql.slice(0, 40), ip, 1, 10 * 60_000)) {
      await prisma.searchLog.create({ data: { query: ql, scammerId: exactIds[0] ?? null } });
      if (exactIds.length) await prisma.scammer.updateMany({ where: { id: { in: exactIds } }, data: { searchCount: { increment: 1 } } });
    }
  }

  let similar: any[] = [];
  if (q.length >= 3 && !isNum) {
    const direct = new Set(rows.map((r: any) => r.id));
    const cand = await prisma.scammer.findMany({
      where: { AND: [...base, { OR: [{ name: { startsWith: q.slice(0, 2), mode: "insensitive" } }, { name: { contains: q.slice(0, 3), mode: "insensitive" } }] }] },
      include: cardInclude,
      take: 400,
    });
    similar = cand
      .filter((c: any) => !direct.has(c.id))
      .map((c: any) => ({ c, s: simScore(ql, c.name.toLowerCase()) }))
      .filter((x) => x.s >= 0.55)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => ({ ...toCard(x.c), pct: Math.round(x.s * 100) }));
  }

  const total = rows.length;
  return ok({
    q,
    total,
    capped: rows.length >= 300,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE)),
    results: rows.slice((page - 1) * PAGE, page * PAGE).map(toCard),
    similar,
  });
}
