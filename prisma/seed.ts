import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Типи (фільтр у пошуку)
  const types = [
    { key: "human", label: "Людина", translations: { ua: "Людина", en: "Human", ru: "Человек" }, sortOrder: 1 },
    { key: "bot", label: "Бот", translations: { ua: "Бот", en: "Bot", ru: "Бот" }, sortOrder: 2 },
    { key: "nft", label: "NFT", translations: { ua: "NFT", en: "NFT", ru: "NFT" }, sortOrder: 3 },
  ];
  for (const t of types) {
    await prisma.scammerType.upsert({ where: { key: t.key }, update: {}, create: t });
  }

  // Базові статуси (старі зі старої бази перезапишуться скриптом міграції за key)
  const statuses = [
    { key: "scam", label: "СКАМ", color: "#ef4444", sortOrder: 1, isDefault: true, translations: { ua: "СКАМ", en: "SCAM", ru: "СКАМ" } },
    { key: "verified", label: "Перевірений", color: "#22c55e", sortOrder: 2, translations: { ua: "Перевірений", en: "Verified", ru: "Проверен" } },
    { key: "not_in_db", label: "Немає в базі", color: "#64748b", sortOrder: 3, translations: { ua: "Немає в базі", en: "Not in DB", ru: "Нет в базе" } },
  ];
  for (const s of statuses) {
    await prisma.scammerStatus.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  // Налаштування
  await prisma.setting.upsert({
    where: { key: "submission_instruction" },
    update: {},
    create: {
      key: "submission_instruction",
      value: {
        ua: "1. Закинь скріншот у офіційний чат бази @wocmf або створи публічний ТГК/чат і кинь туди.\n2. Затисни повідомлення зі скріншотом і скопіюй посилання.\n3. Встав посилання у форму.",
        en: "",
        ru: "",
      },
    },
  });
  await prisma.setting.upsert({
    where: { key: "appeals_enabled" },
    update: {},
    create: { key: "appeals_enabled", value: true },
  });
  await prisma.setting.upsert({
    where: { key: "limits" },
    update: {},
    create: { key: "limits", value: { submissionsPerIp: 3, submissionsWindowHours: 24 } },
  });

  console.log("Seed готовий");
}

main().finally(() => prisma.$disconnect());
