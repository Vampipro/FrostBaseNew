import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cardInclude, toCard } from "@/lib/dto";
import { memo } from "@/lib/mem";

export const dynamic = "force-dynamic";

async function compute() {
  const day = 864e5;
  const now = Date.now();
  const vis = { moderation: { in: ["approved", "pending"] } };
  const [approved, pending, submissions, sums, searchesTotal, searchesToday, searches7d, comments, users, appealsPending, byStatusRaw, byTypeRaw, statuses, types, topSearched, topViewed, topLiked, topQueriesRaw, perDay, latest, reportsPending] =
    await Promise.all([
      prisma.scammer.count({ where: { moderation: "approved" } }),
      prisma.scammer.count({ where: { moderation: "pending" } }),
      prisma.submission.count(),
      prisma.scammer.aggregate({ where: vis, _sum: { viewCount: true, searchCount: true, likeCount: true, neutralCount: true, dislikeCount: true } }),
      prisma.searchLog.count(),
      prisma.searchLog.count({ where: { createdAt: { gt: new Date(now - day) } } }),
      prisma.searchLog.count({ where: { createdAt: { gt: new Date(now - 7 * day) } } }),
      prisma.comment.count({ where: { approved: true, hidden: false } }),
      prisma.user.count(),
      prisma.appeal.count({ where: { status: "pending" } }),
      prisma.scammerStatusLink.groupBy({ by: ["statusId"], _count: { _all: true } }),
      prisma.scammer.groupBy({ by: ["typeId"], where: vis, _count: { _all: true } }),
      prisma.scammerStatus.findMany({ where: { hidden: false }, orderBy: { sortOrder: "asc" } }),
      prisma.scammerType.findMany({ where: { hidden: false }, orderBy: { sortOrder: "asc" } }),
      prisma.scammer.findMany({ where: vis, orderBy: { searchCount: "desc" }, take: 10, include: cardInclude }),
      prisma.scammer.findMany({ where: vis, orderBy: { viewCount: "desc" }, take: 10, include: cardInclude }),
      prisma.scammer.findMany({ where: vis, orderBy: { likeCount: "desc" }, take: 10, include: cardInclude }),
      prisma.searchLog.groupBy({ by: ["query"], where: { createdAt: { gt: new Date(now - 30 * day) } }, _count: { _all: true }, orderBy: { _count: { query: "desc" } }, take: 15 }),
      prisma.$queryRaw<{ d: Date; c: number }[]>`SELECT date_trunc('day', "createdAt") AS d, count(*)::int AS c FROM "SearchLog" WHERE "createdAt" > now() - interval '14 days' GROUP BY 1 ORDER BY 1`,
      prisma.scammer.findMany({ where: { moderation: "approved" }, orderBy: { createdAt: "desc" }, take: 8, include: cardInclude }),
      prisma.commentReport.count({ where: { status: "pending" } }),
    ]);

  const statusCount = new Map(byStatusRaw.map((r) => [r.statusId, r._count._all]));
  const typeCount = new Map(byTypeRaw.map((r) => [r.typeId, r._count._all]));
  const data = {
    totals: {
      scammers: approved, pending, submissions, users, comments, appealsPending, reportsPending,
      views: sums._sum.viewCount ?? 0,
      searches: Math.max(searchesTotal, sums._sum.searchCount ?? 0),
      searchesToday, searches7d,
      likes: sums._sum.likeCount ?? 0, neutral: sums._sum.neutralCount ?? 0, dislikes: sums._sum.dislikeCount ?? 0,
    },
    byStatus: statuses.map((s) => ({ id: s.id, label: s.label, translations: s.translations, color: s.color, count: statusCount.get(s.id) ?? 0 })),
    byType: types.map((t) => ({ id: t.id, label: t.label, translations: t.translations, count: typeCount.get(t.id) ?? 0 })),
    topSearched: topSearched.map(toCard),
    topViewed: topViewed.map(toCard),
    topLiked: topLiked.map(toCard),
    topQueries: topQueriesRaw.map((r) => ({ query: r.query, count: r._count._all })),
    perDay: Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now - (13 - i) * day);
      const key = d.toISOString().slice(0, 10);
      const hit = perDay.find((r) => new Date(r.d).toISOString().slice(0, 10) === key);
      return { day: key, count: hit ? Number(hit.c) : 0 };
    }),
    latest: latest.map(toCard),
  };
  return data;
}

export async function GET(req: Request) {
  const data = await memo("stats", 60_000, compute);
  const lite = new URL(req.url).searchParams.get("lite");
  const body = lite ? { totals: data.totals, topQueries: data.topQueries } : data;
  return new NextResponse(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
