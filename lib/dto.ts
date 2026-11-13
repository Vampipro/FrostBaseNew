export const cardInclude = {
  statuses: { include: { status: true } },
  type: true,
  _count: { select: { submissions: true, comments: true } },
} as const;

export function toCard(s: any) {
  return {
    id: s.id,
    name: String(s.name ?? "").replace(/^@+/, ""),
    telegramUserId: s.telegramUserId?.toString() ?? null,
    moderation: s.moderation,
    submittedAt: s.submittedAt,
    createdAt: s.createdAt,
    scamAmount: s.scamAmount?.toString() ?? null,
    scamCurrency: s.scamCurrency,
    botCheck: !!s.botCheck,
    // нагорода бота = сума + валюта; старе текстове поле — запасний варіант для вже створених записів
    botReward: s.botCheck ? [s.scamAmount?.toString(), s.scamCurrency].filter(Boolean).join(" ") || s.botReward || "" : "",
    checking: !!s.checking,
    botSponsors: s.botSponsors ?? null,
    botUsage: s.botUsage ?? "",
    likeCount: s.likeCount,
    neutralCount: s.neutralCount,
    dislikeCount: s.dislikeCount,
    viewCount: s.viewCount,
    searchCount: s.searchCount,
    complaints: s._count?.submissions ?? 0,
    type: s.type ? { id: s.type.id, key: s.type.key, label: s.type.label, translations: s.type.translations } : null,
    statuses: (s.statuses ?? [])
      .map((l: any) => l.status)
      .filter((st: any) => !st.hidden)
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((st: any) => ({ id: st.id, key: st.key, label: st.label, translations: st.translations, color: st.color, textColor: st.textColor, description: st.description })),
  };
}
