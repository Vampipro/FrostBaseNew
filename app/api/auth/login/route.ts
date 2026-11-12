import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ok, fail, getIp, readBody } from "@/lib/http";
import { createSession } from "@/lib/auth";
import { consume, isBanned } from "@/lib/guard";

// Фіктивний хеш: порівнюємо навіть коли користувача нема, щоб не видавати існування логіна за часом відповіді
const DUMMY = "$2b$11$/Zq6fi43QwGal63Pn6Wfj.f4pv63xJdVK9kk/WzaUY88FZBJORvS.";

export async function POST(req: Request) {
  const ip = getIp(req);
  if (await isBanned(ip)) return fail("Доступ заборонено", 403);
  const { username, password } = await readBody(req);
  if (typeof username !== "string" || typeof password !== "string" || username.length > 40 || password.length > 100) return fail("Невірний логін або пароль", 401);
  const uKey = username.trim().toLowerCase() + "|" + ip;
  // спроба записується ДО перевірки пароля — паралельні запити не обходять ліміт.
  // Окремий ключ «логін+IP»: чужий IP не може заблокувати акаунт жертви.
  const name = username.trim().toLowerCase();
  const W = 15 * 60_000;
  if (!(await consume("login", ip, 20, W)) || !(await consume("login-u", uKey, 5, W)) || !(await consume("login-g", name, 300, 3600_000)))
    return fail("Забагато спроб входу. Зачекай 15 хвилин.", 429);
  const user = await prisma.user.findFirst({ where: { username: { equals: username.trim(), mode: "insensitive" } } });
  let valid = false;
  try {
    valid = await bcrypt.compare(password, user?.password && user.password.startsWith("$2") ? user.password : DUMMY);
  } catch {
    valid = false;
  }
  if (!user || !valid || !user.password.startsWith("$2")) {
    return fail("Невірний логін або пароль", 401);
  }
  await prisma.rateLimit.deleteMany({ where: { action: "login-u", key: uKey } }); // успішний вхід скидає лічильник
  if (user.banReason) return fail("Акаунт заблоковано: " + user.banReason, 403);
  await createSession(user.id);
  return ok({ user: { id: user.id, username: user.username, role: user.role } });
}
