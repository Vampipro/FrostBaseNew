import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody } from "@/lib/http";
import { createSession } from "@/lib/auth";
import { hit, isBanned, limited } from "@/lib/guard";

export async function POST(req: Request) {
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  if (await limited("register", ip, 5, 3600_000)) return fail("Забагато реєстрацій з цього IP. Спробуй пізніше.", 429);
  const { username, password } = await readBody(req);
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,24}$/.test(username)) return fail("Логін: 3–24 символи, лише латиниця, цифри та _");
  if (typeof password !== "string" || password.length < 6 || password.length > 72) return fail("Пароль: 6–72 символи");
  const exists = await prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });
  if (exists) return fail("Такий логін уже зайнятий", 409);
  const user = await prisma.user.create({ data: { username, password: await bcrypt.hash(password, 11) } });
  await hit("register", ip);
  await createSession(user.id);
  return ok({ user: { id: user.id, username: user.username, role: user.role } });
}
