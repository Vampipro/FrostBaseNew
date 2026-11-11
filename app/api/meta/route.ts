import { prisma } from "@/lib/db";
import { okCached } from "@/lib/http";
import { getSetting, getLimits } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const [statuses, types, instruction, appealsEnabled, limits] = await Promise.all([
    prisma.scammerStatus.findMany({ where: { hidden: false }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.scammerType.findMany({ where: { hidden: false }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    getSetting<Record<string, string>>("submission_instruction", {}),
    getSetting<boolean>("appeals_enabled", true),
    getLimits(),
  ]);
  return okCached({ statuses, types, instruction, appealsEnabled, limits }, 15);
}
