import { ok } from "@/lib/http";
import { destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  return ok({ ok: true });
}
