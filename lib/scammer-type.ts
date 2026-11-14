/** Canonical keys stored in ScammerType.key. Keep these values stable. */
export const SCAMMER_TYPE_KEYS = {
  HUMAN: "human",
  BOT: "bot",
  NFT: "nft",
} as const;

export type ScammerTypeKey = (typeof SCAMMER_TYPE_KEYS)[keyof typeof SCAMMER_TYPE_KEYS];
