import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody } from "@/lib/http";
import { createSession } from "@/lib/auth";
import { consume, isBanned } from "@/lib/guard";

// імена, якими можна видавати себе за персонал
const RESERVED = /^(admin|administrator|moderator|mod|support|staff|system|root|frostbase|frost_base|owner|official|bot)/i;

export async function POST(req: Request) {
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  const { username, password } = await readBody(req);
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,24}$/.test(username)) return fail("Логін: 3–24 символи, лише латиниця, цифри та _");
  if (RESERVED.test(username)) return fail("Це ім'я зарезервоване, обери інше");
  // bcrypt бере лише перші 72 БАЙТИ — рахуємо байти, а не символи
  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72) return fail("Пароль: мінімум 8 символів (до 72 байт)");
  if (!(await consume("register", ip, 5, 3600_000))) return fail("Забагато реєстрацій з цього IP. Спробуй пізніше.", 429);
  const exists = await prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });
  if (exists) return fail("Такий логін уже зайнятий", 409);
  try {
    const user = await prisma.user.create({ data: { username, password: await bcrypt.hash(password, 11) } });
    await createSession(user.id);
    return ok({ user: { id: user.id, username: user.username, role: user.role } });
  } catch {
    return fail("Такий логін уже зайнятий", 409);
  }
}
