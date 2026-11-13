import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ok, fail, readBody, toInt, parseAmount } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["user", "moderator", "admin"] as const;
const RESERVED = /^(admin|administrator|moderator|mod|support|staff|system|root|frostbase|frost_base|owner|official|bot)/i;

export async function GET(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim().slice(0, 64);
  const page = Math.min(100_000, Math.max(1, Math.trunc(Number(sp.get("page"))) || 1));
  const pageSize = 50;
  const numericId = Number(q);
  const validId = Number.isInteger(numericId) && numericId > 0 && numericId <= 2_147_483_647;
  const where: any = q ? {
    OR: [
      { username: { contains: q, mode: "insensitive" } },
      ...(validId ? [{ id: numericId }] : []),
    ],
  } : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        username: true,
        role: true,
        image: true,
        banReason: true,
        isSponsor: true,
        donated: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return ok({ items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function PATCH(req: Request) {
  const me = await requireAdmin();
  if (!me) return fail("Немає доступу", 403);
  const b = await readBody(req);
  const id = toInt(b.id);
  if (!id) return fail("Не знайдено", 404);

  const current = await prisma.user.findUnique({ where: { id }, select: { id: true, username: true, role: true } });
  if (!current) return fail("Користувача не знайдено", 404);

  const data: any = {};

  if ("username" in b) {
    const username = String(b.username ?? "").trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return fail("Логін: 3–24 символи, лише латиниця, цифри та _");
    if (RESERVED.test(username)) return fail("Це ім'я зарезервоване, обери інше");
    const duplicate = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" }, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) return fail("Такий логін уже зайнятий", 409);
    data.username = username;
  }

  if ("role" in b) {
    if (!VALID_ROLES.includes(b.role)) return fail("Невірна роль");
    if (id === me.id && b.role !== "admin") return fail("Не можна понизити роль власного акаунта");
    if (current.role === "admin" && b.role !== "admin") {
      const admins = await prisma.user.count({ where: { role: "admin" } });
      if (admins <= 1) return fail("Не можна прибрати останнього адміністратора");
    }
    data.role = b.role;
  }

  if ("banReason" in b) {
    if (id === me.id && String(b.banReason ?? "").trim()) return fail("Не можна заблокувати самого себе");
    data.banReason = String(b.banReason ?? "").trim().slice(0, 200);
  }

  if ("image" in b) {
    const image = String(b.image ?? "").trim();
    if (image && (!/^https:\/\//i.test(image) || image.length > 500)) return fail("Аватар має бути HTTPS-посиланням (до 500 символів)");
    data.image = image;
  }

  if ("isSponsor" in b) {
    if (typeof b.isSponsor !== "boolean") return fail("Невірне значення статусу спонсора");
    data.isSponsor = b.isSponsor;
  }

  if ("donated" in b) {
    const donated = parseAmount(b.donated);
    if (donated === null || donated > 9_999_999_999.99) return fail("Некоректна сума донату");
    data.donated = donated.toFixed(2);
  }

  if ("password" in b && String(b.password ?? "")) {
    const password = String(b.password);
    if (password.length < 8 || Buffer.byteLength(password) > 72) return fail("Пароль: мінімум 8 символів (до 72 байт)");
    data.password = await bcrypt.hash(password, 11);
  }

  if (Object.keys(data).length === 0) return fail("Немає змін для збереження");
  try {
    const updated = await prisma.user.update({ where: { id }, data });
    return ok({ ok: true, user: { id: updated.id, username: updated.username, role: updated.role } });
  } catch {
    return fail("Не вдалося оновити користувача", 409);
  }
}

export async function DELETE(req: Request) {
  const me = await requireAdmin();
  if (!me) return fail("Немає доступу", 403);
  const id = toInt(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("Не знайдено", 404);
  if (id === me.id) return fail("Не можна видалити власний акаунт");

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, username: true } });
  if (!target) return fail("Користувача не знайдено", 404);
  if (target.role === "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    if (admins <= 1) return fail("Не можна видалити останнього адміністратора");
  }

  try {
    // User comments cascade; bot checks, submissions, appeals and logs remain while their user reference becomes null.
    await prisma.user.delete({ where: { id } });
    return ok({ ok: true });
  } catch {
    return fail("Не вдалося видалити користувача");
  }
}
