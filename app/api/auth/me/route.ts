import { ok } from "@/lib/http";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await currentUser();
  return ok({ user: u ? { id: u.id, username: u.username, role: u.role } : null });
}
