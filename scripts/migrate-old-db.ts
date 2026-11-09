/**
 * Міграція зі старої бази (string cuid id) в нову (числові id 1,2,3...).
 *
 * Стара база ТІЛЬКИ читається. Запуск:
 *   1) npx prisma db push && npm run db:seed        (створити таблиці в новій базі)
 *   2) npm run migrate:old                           (перша міграція у порожню базу)
 *      npm run migrate:old -- --wipe                 (очистити нову базу і перенести заново)
 *
 * Що переноситься: User, ScammerStatus, Scammer(+статуси, типи), Submission, Vote,
 * Comment, Appeal, SearchLog, BannedIp, ScammerNameHistory.
 * Що НЕ переноситься: ExpRule/ExpGrant, UserTag, Complaint, Bot* таблиці.
 * Звіт про проблемні значення — migration-report.json
 */
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();
const oldUrl = process.env.OLD_DATABASE_URL;
if (!oldUrl) {
  console.error("Задай OLD_DATABASE_URL у .env");
  process.exit(1);
}
const old = new Client({ connectionString: oldUrl });

const report: Record<string, any> = { counts: {}, issues: {} };
const issue = (k: string, v: any) => ((report.issues[k] ||= []).push(v));

type Row = Record<string, any>;
const q = async (sql: string): Promise<Row[]> => (await old.query(sql)).rows;
const tryQ = async (sql: string): Promise<Row[]> => {
  try {
    return await q(sql);
  } catch (e: any) {
    console.warn(`  (пропущено: ${e.message})`);
    return [];
  }
};

function chunks<T>(arr: T[], n = 1000): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function parseJsonArray(v: any): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  if (typeof v !== "string" || !v.trim()) return [];
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseTgId(v: any, ctx: string): bigint | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (/^\d{1,20}$/.test(s)) return BigInt(s);
  issue("telegramUserId_not_numeric", { ctx, value: s });
  return null;
}

function parseAmount(v: any, ctx: string): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  if (Number.isFinite(n)) return n;
  issue("amount_not_numeric", { ctx, value: s });
  return null;
}

function parseDate(v: any, ctx: string): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  issue("scamDate_unparsed", { ctx, value: s });
  return null;
}

function normalizeType(raw: string): { key: string; label: string } | null {
  const s = (raw || "").trim();
  if (!s) return null;
  const l = s.toLowerCase();
  if (["бот", "bot"].includes(l)) return { key: "bot", label: "Бот" };
  if (["человек", "людина", "human", "person"].includes(l)) return { key: "human", label: "Людина" };
  if (l === "nft") return { key: "nft", label: "NFT" };
  return { key: "custom-" + l.replace(/[^a-z0-9а-яіїєґ]+/gi, "-").slice(0, 40), label: s };
}

async function resetSeq(table: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"','id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), (SELECT MAX(id) IS NOT NULL FROM "${table}"))`
  );
}

async function main() {
  await old.connect();

  const wipe = process.argv.includes("--wipe");
  const [uc, sc] = await Promise.all([prisma.user.count(), prisma.scammer.count()]);
  if ((uc > 0 || sc > 0) && !wipe) {
    console.error("Нова база не порожня. Запусти з --wipe, якщо хочеш очистити й перенести заново.");
    process.exit(1);
  }
  if (wipe) {
    console.log("Очищаю нову базу (статуси, типи й налаштування лишаються)...");
    await prisma.$executeRawUnsafe(
      `TRUNCATE "Scammer","ScammerStatusLink","ScammerNameHistory","Submission","Vote","Comment","CommentReport","Appeal","SearchLog","BannedIp","RateLimit","User" RESTART IDENTITY CASCADE`
    );
  }

  // ---------- Статуси ----------
  console.log("Статуси...");
  const oldStatuses = await q(`SELECT * FROM "ScammerStatus" ORDER BY "sortOrder", "createdAt"`);
  const oldScammers = await q(`SELECT * FROM "Scammer" ORDER BY "createdAt", id`);
  const statusKeys = new Set<string>(oldStatuses.map((s) => s.key));
  for (const s of oldScammers) if (s.status && !statusKeys.has(s.status)) statusKeys.add(s.status);

  const statusIdByKey = new Map<string, number>();
  for (const s of oldStatuses) {
    const data = {
      label: s.label,
      description: s.description ?? "",
      color: s.color ?? "#ef4444",
      textColor: s.textColor ?? "#ffffff",
      sortOrder: s.sortOrder ?? 0,
      isDefault: !!s.isDefault,
      hidden: !!s.hidden,
    };
    const r = await prisma.scammerStatus.upsert({ where: { key: s.key }, update: data, create: { key: s.key, ...data } });
    statusIdByKey.set(s.key, r.id);
  }
  for (const key of statusKeys) {
    if (statusIdByKey.has(key)) continue;
    const r = await prisma.scammerStatus.upsert({ where: { key }, update: {}, create: { key, label: key } });
    statusIdByKey.set(key, r.id);
    issue("status_created_from_scammers", key);
  }
  // додаємо і статуси, які вже є в новій базі (seed)
  for (const s of await prisma.scammerStatus.findMany()) statusIdByKey.set(s.key, s.id);

  // ---------- Типи ----------
  console.log("Типи...");
  const typeIdByKey = new Map<string, number>();
  for (const t of await prisma.scammerType.findMany()) typeIdByKey.set(t.key, t.id);
  const typeIdForScammer = async (raw: string): Promise<number | null> => {
    const n = normalizeType(raw);
    if (!n) return null;
    if (!typeIdByKey.has(n.key)) {
      const r = await prisma.scammerType.create({ data: { key: n.key, label: n.label, sortOrder: 100 } });
      typeIdByKey.set(n.key, r.id);
    }
    return typeIdByKey.get(n.key)!;
  };

  // ---------- Користувачі ----------
  console.log("Користувачі...");
  const oldUsers = await q(`SELECT * FROM "User" ORDER BY "createdAt", id`);
  const userMap = new Map<string, number>();
  const userRows = oldUsers.map((u, i) => {
    userMap.set(u.id, i + 1);
    return {
      id: i + 1,
      username: u.username,
      password: u.password, // хеш лишається як є
      role: u.role ?? "user",
      image: u.image ?? "",
      banReason: u.banReason ?? "",
      isSponsor: !!u.isSponsor,
      donated: u.donated ?? 0,
      isPlaceholder: !!u.isPlaceholder,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  });
  for (const c of chunks(userRows)) await prisma.user.createMany({ data: c });
  await resetSeq("User");
  report.counts.users = userRows.length;

  // ---------- Скамери ----------
  console.log("Скамери...");
  const scammerMap = new Map<string, number>();
  const scammerRows: any[] = [];
  const linkRows: { scammerId: number; statusId: number }[] = [];
  for (let i = 0; i < oldScammers.length; i++) {
    const s = oldScammers[i];
    const id = i + 1;
    scammerMap.set(s.id, id);
    scammerRows.push({
      id,
      name: s.name,
      telegramUserId: parseTgId(s.telegramUserId, `scammer ${s.id}`),
      description: s.description ?? "",
      moderation: "approved",
      typeId: await typeIdForScammer(s.scammerType),
      scamDate: parseDate(s.scamDate, `scammer ${s.id}`),
      scamAmount: parseAmount(s.scamAmount, `scammer ${s.id}`),
      scamCurrency: s.scamCurrency ?? "",
      proofLink: s.proofLink ?? "",
      screenshots: parseJsonArray(s.screenshots),
      searchCount: s.searchCount ?? 0,
      likeCount: s.likeCount ?? 0,
      neutralCount: s.neutralCount ?? 0,
      dislikeCount: s.dislikeCount ?? 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
    const sid = s.status ? statusIdByKey.get(s.status) : undefined;
    if (sid) linkRows.push({ scammerId: id, statusId: sid });
  }

  // ---------- Подачі ----------
  console.log("Подачі...");
  const oldSubs = await q(`SELECT * FROM "Submission" ORDER BY "createdAt", id`);
  let nextScammerId = scammerRows.length + 1;
  const subRows: any[] = [];
  let subId = 1;
  let skippedSubs = 0;
  for (const s of oldSubs) {
    let scammerId = s.scammerId ? scammerMap.get(s.scammerId) : undefined;
    if (!scammerId) {
      if (s.status === "pending" || s.status === "revision") {
        // подача без скамера -> створюємо скамера зі статусом «на модерації»
        scammerId = nextScammerId++;
        scammerRows.push({
          id: scammerId,
          name: s.scammerName,
          telegramUserId: parseTgId(s.telegramUserId, `submission ${s.id}`),
          description: s.scammerData ?? "",
          moderation: "pending",
          submittedAt: s.createdAt,
          scamAmount: parseAmount(s.scamAmount, `submission ${s.id}`),
          scamCurrency: s.scamCurrency ?? "",
          screenshots: parseJsonArray(s.screenshots),
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        });
        const sid = statusIdByKey.get(s.scammerStatus || "scam");
        if (sid) linkRows.push({ scammerId, statusId: sid });
      } else {
        skippedSubs++;
        continue;
      }
    }
    subRows.push({
      id: subId++,
      scammerId,
      reporterId: s.userId ? userMap.get(s.userId) ?? null : null,
      ip: s.guestIp ?? "",
      description: s.scammerData ?? "",
      screenshots: parseJsonArray(s.screenshots),
      scamAmount: parseAmount(s.scamAmount, `submission ${s.id}`),
      scamCurrency: s.scamCurrency ?? "",
      status: s.status ?? "pending",
      revisionReason: s.revisionReason ?? "",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
  }
  if (skippedSubs) issue("submissions_skipped_no_scammer", skippedSubs);

  for (const c of chunks(scammerRows)) await prisma.scammer.createMany({ data: c });
  await resetSeq("Scammer");
  for (const c of chunks(linkRows)) await prisma.scammerStatusLink.createMany({ data: c, skipDuplicates: true });
  for (const c of chunks(subRows)) await prisma.submission.createMany({ data: c });
  await resetSeq("Submission");
  report.counts.scammers = scammerRows.length;
  report.counts.submissions = subRows.length;

  // ---------- Історія імен ----------
  const hist = await tryQ(`SELECT * FROM "ScammerNameHistory" ORDER BY "createdAt", id`);
  const histRows = hist
    .filter((h) => scammerMap.has(h.scammerId))
    .map((h, i) => ({ id: i + 1, scammerId: scammerMap.get(h.scammerId)!, oldName: h.oldName, newName: h.newName, createdAt: h.createdAt }));
  for (const c of chunks(histRows)) await prisma.scammerNameHistory.createMany({ data: c });
  await resetSeq("ScammerNameHistory");
  report.counts.nameHistory = histRows.length;

  // ---------- Голоси ----------
  console.log("Голоси...");
  const votes = await tryQ(`SELECT * FROM "Vote" ORDER BY "createdAt", id`);
  const voteRows = votes
    .filter((v) => scammerMap.has(v.scammerId))
    .map((v, i) => {
      let voterId: string = v.voterId;
      if (voterId.startsWith("user:")) {
        const nu = userMap.get(voterId.slice(5));
        voterId = nu ? `user:${nu}` : voterId; // якщо юзера нема — лишаємо як є
      }
      return { id: i + 1, scammerId: scammerMap.get(v.scammerId)!, voteType: v.voteType, voterId, createdAt: v.createdAt };
    });
  for (const c of chunks(voteRows)) await prisma.vote.createMany({ data: c, skipDuplicates: true });
  await resetSeq("Vote");
  report.counts.votes = voteRows.length;

  // ---------- Коментарі ----------
  console.log("Коментарі...");
  const comments = await tryQ(`SELECT * FROM "Comment" ORDER BY "createdAt", id`);
  const commentRows = comments
    .filter((c) => scammerMap.has(c.scammerId) && userMap.has(c.userId))
    .map((c, i) => ({
      id: i + 1,
      content: c.content,
      scammerId: scammerMap.get(c.scammerId)!,
      userId: userMap.get(c.userId)!,
      approved: !!c.approved,
      hidden: !!c.hidden,
      createdAt: c.createdAt,
    }));
  for (const c of chunks(commentRows)) await prisma.comment.createMany({ data: c });
  await resetSeq("Comment");
  report.counts.comments = commentRows.length;

  // ---------- Апеляції ----------
  const appeals = await tryQ(`SELECT * FROM "Appeal" ORDER BY "createdAt", id`);
  const appealRows = appeals
    .filter((a) => scammerMap.has(a.scammerId))
    .map((a, i) => ({
      id: i + 1,
      scammerId: scammerMap.get(a.scammerId)!,
      userId: a.userId ? userMap.get(a.userId) ?? null : null,
      description: a.description ?? "",
      screenshots: a.proofLink ? [a.proofLink] : [],
      status: a.status ?? "pending",
      createdAt: a.createdAt,
    }));
  for (const c of chunks(appealRows)) await prisma.appeal.createMany({ data: c });
  await resetSeq("Appeal");
  report.counts.appeals = appealRows.length;

  // ---------- Бани по IP ----------
  const banned = await tryQ(`SELECT * FROM "BannedIp" ORDER BY "createdAt", id`);
  const bannedRows = banned.map((b, i) => ({ id: i + 1, ip: b.ip, reason: b.reason ?? "", bannedBy: b.bannedBy ?? "", createdAt: b.createdAt }));
  for (const c of chunks(bannedRows)) await prisma.bannedIp.createMany({ data: c, skipDuplicates: true });
  await resetSeq("BannedIp");
  report.counts.bannedIps = bannedRows.length;

  // ---------- Логи пошуку (порціями) ----------
  console.log("Логи пошуку...");
  let offset = 0;
  let logId = 1;
  const PAGE = 5000;
  while (true) {
    const rows = await q(`SELECT * FROM "SearchLog" ORDER BY "createdAt", id LIMIT ${PAGE} OFFSET ${offset}`);
    if (!rows.length) break;
    const data = rows.map((r) => ({
      id: logId++,
      userId: r.userId ? userMap.get(r.userId) ?? null : null,
      scammerId: r.scammerId ? scammerMap.get(r.scammerId) ?? null : null,
      query: r.query,
      createdAt: r.createdAt,
    }));
    for (const c of chunks(data)) await prisma.searchLog.createMany({ data: c });
    offset += PAGE;
  }
  await resetSeq("SearchLog");
  report.counts.searchLogs = logId - 1;

  writeFileSync("migration-report.json", JSON.stringify(report, null, 2));
  console.log("Готово. Підсумок:", report.counts);
  const nIssues = Object.keys(report.issues).length;
  if (nIssues) console.log(`Є зауваження (${Object.keys(report.issues).join(", ")}) — дивись migration-report.json`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await old.end().catch(() => {});
    await prisma.$disconnect();
  });
