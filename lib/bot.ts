import { prisma } from "./db";

const BOT = /^(bot|bots|бот|боти|боты)$/i;
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

/** Тип «Бот» у словнику: шукаємо за key, потім за назвою/перекладами (key може бути і кирилицею). */
export async function findBotType() {
  const types = await prisma.scammerType.findMany({ select: { id: true, key: true, label: true, translations: true } });
  return (
    types.find((t) => BOT.test(norm(t.key))) ??
    types.find((t) => BOT.test(norm(t.label))) ??
    types.find((t) => Object.values((t.translations as Record<string, unknown>) || {}).some((v) => BOT.test(norm(v)))) ??
    null
  );
}

export const VERDICTS = ["paid", "partial", "not_paid"] as const;
