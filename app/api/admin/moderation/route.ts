import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requireStaff } from "@/lib/auth";
import { cardInclude, toCard } from "@/lib/dto";
import { isTgId } from "@/lib/name";

export const dynamic = "force-dynamic";
const PAGE = 30;

export async function GET(req: Request) {
  if (!(await requireStaff())) return fail("Немає доступу", 403);
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") || "pending";
  const sort = sp.get("sort") || "date";
  const dir = sp.get("dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const q = (sp.get("q") || "").trim().replace(/^@/, "");

  const and: any[] = [];
  if (status !== "all") and.push({ moderation: status });
  if (q) {
    const or: any[] = [{ name: { contains: q, mode: "insensitive" } }];
    if (/^\d{1,19}$/.test(q)) or.push(...(isTgId(q) ? [{ telegramUserId: BigInt(q) }] : []), { id: Number(q) <= 2147483647 ? Number(q) : -1 });
    and.push({ OR: or });
  }
  const orderBy: any =
    sort === "likes" ? { likeCount: dir } :
    sort === "dislikes" ? { dislikeCount: dir } :
    sort === "views" ? { viewCount: dir } :
    sort === "searches" ? { searchCount: dir } :
    sort === "complaints" ? { submissions: { _count: dir } } :
    { createdAt: dir };

  const where = and.length ? { AND: and } : {};
  const [total, rows] = await Promise.all([
    prisma.scammer.count({ where }),
    prisma.scammer.findMany({
      where, orderBy: [orderBy, { id: "desc" }], skip: (page - 1) * PAGE, take: PAGE,
      include: { ...cardInclude, submissions: { orderBy: { createdAt: "desc" }, take: 3 } },
    }),
  ]);

  const items = await Promise.all(
    rows.map(async (r: any) => {
      let similar: any[] = [];
      if (r.moderation === "pending") {
        const or: any[] = [{ name: { equals: r.name, mode: "insensitive" } }];
        if (r.name.length >= 4) or.push({ name: { contains: r.name, mode: "insensitive" } });
        if (r.telegramUserId) or.push({ telegramUserId: r.telegramUserId });
        const found = await prisma.scammer.findMany({
          where: { id: { not: r.id }, moderation: { in: ["approved", "pending"] }, OR: or },
          select: { id: true, name: true, telegramUserId: true, moderation: true },
          take: 5,
        });
        similar = found.map((f) => ({
          ...f,
          telegramUserId: f.telegramUserId?.toString() ?? null,
          exact: f.name.toLowerCase() === r.name.toLowerCase() || (!!r.telegramUserId && f.telegramUserId === r.telegramUserId),
        }));
      }
      return {
        ...toCard(r),
        description: r.description,
        descriptionI18n: r.descriptionI18n ?? {},
        screenshots: r.screenshots,
        proofLink: r.proofLink,
        scamDate: r.scamDate,
        appealsDisabled: r.appealsDisabled,
        typeId: r.typeId,
        neutralCount: r.neutralCount,
        statusIds: r.statuses.map((l: any) => l.statusId),
        submissions: r.submissions.map((s: any) => ({ id: s.id, ip: s.ip, contactUsername: s.contactUsername, createdAt: s.createdAt, status: s.status })),
        similar,
      };
    })
  );
  return ok({ total, page, pages: Math.max(1, Math.ceil(total / PAGE)), items });
}
