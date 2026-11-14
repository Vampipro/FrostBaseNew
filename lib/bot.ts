import { prisma } from "./db";
import { SCAMMER_TYPE_KEYS } from "./scammer-type";

const BOT_LABEL = /^(bot|bots|бот|боти|боты)$/i;
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

/** Find the canonical bot type. The legacy fallback keeps older/custom dictionaries working. */
export async function findBotType() {
  const canonical = await prisma.scammerType.findUnique({
    where: { key: SCAMMER_TYPE_KEYS.BOT },
    select: { id: true, key: true, label: true, translations: true },
  });
  if (canonical) return canonical;

  const types = await prisma.scammerType.findMany({
    select: { id: true, key: true, label: true, translations: true },
  });
  return (
    types.find((t) => BOT_LABEL.test(norm(t.key))) ??
    types.find((t) => BOT_LABEL.test(norm(t.label))) ??
    types.find((t) => Object.values((t.translations as Record<string, unknown>) || {}).some((v) => BOT_LABEL.test(norm(v)))) ??
    null
  );
}

export const VERDICTS = ["paid", "partial", "not_paid"] as const;
