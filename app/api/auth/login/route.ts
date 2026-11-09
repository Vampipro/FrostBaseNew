import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody } from "@/lib/http";
import { createSession } from "@/lib/auth";
import { hit, isBanned, limited } from "@/lib/guard";

export async function POST(req: Request) {
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  if (await limited("login", ip, 10, 15 * 60_000)) return fail("Забагато спроб входу. Зачекай 15 хвилин.", 429);
  await hit("login", ip);
  const { username, password } = await readBody(req);
  if (typeof username !== "string" || typeof password !== "string") return fail("Невірний логін або пароль", 401);
  const user = await prisma.user.findFirst({ where: { username: { equals: username.trim(), mode: "insensitive" } } });
  let valid = false;
  if (user) {
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch {
      valid = false;
    }
  }
  if (!user || !valid) return fail("Невірний логін або пароль", 401);
  if (user.banReason) return fail("Акаунт заблоковано: " + user.banReason, 403);
  await createSession(user.id);
  return ok({ user: { id: user.id, username: user.username, role: user.role } });
}
