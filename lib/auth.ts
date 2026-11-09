import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "fb_session";
const key = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET не задано у змінних оточення Vercel");
  return new TextEncoder().encode(secret || "dev-only-secret");
};

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const u = await prisma.user.findUnique({
      where: { id: Number(payload.uid) },
      select: { id: true, username: true, role: true, image: true, banReason: true },
    });
    if (!u || u.banReason) return null;
    return u;
  } catch {
    return null;
  }
}

export async function requireStaff() {
  const u = await currentUser();
  return u && (u.role === "admin" || u.role === "moderator") ? u : null;
}
export async function requireAdmin() {
  const u = await currentUser();
  return u && u.role === "admin" ? u : null;
}
