"use client";

import { useApp } from "@/components/Providers";

type EvidenceGalleryProps = {
  items: string[];
  title?: string;
  compact?: boolean;
};

type EvidenceInfo = {
  href: string;
  host: string;
  kind: "telegram" | "image" | "link";
  embed?: string;
  pathLabel: string;
};

function inspectEvidence(raw: string): EvidenceInfo | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);
    const isTelegram = host === "t.me" || host === "telegram.me";
    let embed: string | undefined;
    const channelIndex = parts[0] === "s" ? 1 : 0;
    const messageIndex = channelIndex + 1;
    const channel = parts[channelIndex] || "";
    const messageId = parts[messageIndex] || "";

    // Public Telegram post links can be embedded. Private /c/ and invite links stay as safe external cards.
    if (isTelegram && channel.toLowerCase() !== "c" && /^[A-Za-z][A-Za-z0-9_]{2,63}$/.test(channel) && /^\d+$/.test(messageId)) {
      embed = `https://t.me/${encodeURIComponent(channel)}/${messageId}?embed=1&mode=tme`;
    }

    const isImage = /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(url.pathname);
    const pathLabel = (url.pathname + url.search).replace(/\/+$/, "") || "/";
    return {
      href: url.toString(),
      host,
      kind: embed ? "telegram" : isImage ? "image" : "link",
      embed,
      pathLabel: pathLabel.length > 66 ? `${pathLabel.slice(0, 63)}…` : pathLabel,
    };
  } catch {
    return null;
  }
}

export default function EvidenceGallery({ items, title, compact = false }: EvidenceGalleryProps) {
  const { lang } = useApp();
  const labels = lang === "en"
    ? { openImage: "Open original", openTelegram: "Open in Telegram", open: "Open source", telegram: "TELEGRAM POST", image: "IMAGE FILE", link: "EXTERNAL LINK" }
    : lang === "ru"
      ? { openImage: "Открыть оригинал", openTelegram: "Открыть в Telegram", open: "Открыть источник", telegram: "ПОСТ TELEGRAM", image: "ФАЙЛ ИЗОБРАЖЕНИЯ", link: "ВНЕШНЯЯ ССЫЛКА" }
      : { openImage: "Відкрити оригінал", openTelegram: "Відкрити в Telegram", open: "Відкрити джерело", telegram: "ДОПИС TELEGRAM", image: "ФАЙЛ ЗОБРАЖЕННЯ", link: "ЗОВНІШНЄ ПОСИЛАННЯ" };
  const entries = (items || []).map(inspectEvidence).filter((x): x is EvidenceInfo => Boolean(x));
  if (entries.length === 0) return null;

  return (
    <section className={`evidence-section${compact ? " is-compact" : ""}`}>
      {title && <h4 className="sub-title">{title}</h4>}
      <div className="evidence-grid">
        {entries.map((entry, index) => (
          <article className={`evidence-card evidence-${entry.kind}`} key={`${entry.href}-${index}`}>
            <div className="evidence-topline">
              <span className="evidence-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="evidence-source">
                {entry.kind === "telegram" ? labels.telegram : entry.kind === "image" ? labels.image : labels.link}
              </span>
            </div>

            {entry.kind === "image" ? (
              <a className="evidence-image-preview" href={entry.href} target="_blank" rel="noopener noreferrer nofollow">
                {/* External evidence URLs are user-supplied; plain img avoids remote image optimization requests. */}
                <img src={entry.href} alt={`Evidence ${index + 1}`} loading="lazy" referrerPolicy="no-referrer" />
                <span className="evidence-image-hint">↗ {labels.openImage}</span>
              </a>
            ) : entry.kind === "telegram" && entry.embed ? (
              <div className="evidence-embed-wrap">
                <iframe
                  src={entry.embed}
                  title={`Telegram evidence ${index + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  allow="clipboard-write; encrypted-media; picture-in-picture"
                />
              </div>
            ) : (
              <div className="evidence-link-preview">
                <span className="evidence-link-icon" aria-hidden="true">↗</span>
                <b>{entry.host}</b>
                <code>{entry.pathLabel}</code>
              </div>
            )}

            <div className="evidence-footer">
              <span>{entry.host}</span>
              <a href={entry.href} target="_blank" rel="noopener noreferrer nofollow">
                {entry.kind === "telegram" ? `${labels.openTelegram} ↗` : `${labels.open} ↗`}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
