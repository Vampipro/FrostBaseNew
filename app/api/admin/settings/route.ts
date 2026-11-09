import { ok, fail, readBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { getSetting, getLimits, setSetting } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const [instruction, appealsEnabled, limits] = await Promise.all([
    getSetting<Record<string, string>>("submission_instruction", {}),
    getSetting<boolean>("appeals_enabled", true),
    getLimits(),
  ]);
  return ok({ instruction, appealsEnabled, limits });
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return fail("Немає доступу", 403);
  const b = await readBody(req);
  if (b.instruction) {
    const v: Record<string, string> = {};
    for (const l of ["ua", "en", "ru"]) v[l] = String(b.instruction[l] ?? "").slice(0, 3000);
    await setSetting("submission_instruction", v);
  }
  if ("appealsEnabled" in b) await setSetting("appeals_enabled", !!b.appealsEnabled);
  if (b.limits) {
    const n = Math.trunc(Number(b.limits.submissionsPerIp));
    const h = Math.trunc(Number(b.limits.submissionsWindowHours));
    if (n >= 1 && n <= 100 && h >= 1 && h <= 8760) await setSetting("limits", { submissionsPerIp: n, submissionsWindowHours: h });
    else return fail("Ліміти: 1–100 заявок, 1–8760 годин");
  }
  return ok({ ok: true });
}
