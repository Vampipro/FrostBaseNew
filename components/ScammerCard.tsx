"use client";
import { useApp } from "./Providers";
import { tr } from "@/lib/i18n";
import { uname } from "@/lib/name";

export const fmtDate = (d: string | Date | null | undefined, lang = "uk") =>
  d ? new Date(d).toLocaleDateString(lang === "ua" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-GB") : "";

export function avatarGrad(str: string, theme: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
  const hue = ((theme === "neon" ? 285 : theme === "light" ? 205 : 185) + (h % 70)) % 360;
  return `linear-gradient(135deg, hsl(${hue},85%,72%), hsl(${(hue + 45) % 360},80%,45%))`;
}

export function Badges({ s }: { s: any }) {
  const { t, lang } = useApp();
  return (
    <>
      {s.botCheck && <span className="st-badge st-bot">🤖 {t("bot_check")}</span>}
      {s.moderation === "pending" && (s.botCheck && s.checking
        ? <span className="st-badge st-checking" title={fmtDate(s.submittedAt ?? s.createdAt, lang)}>{t("bot_checking")}</span>
        : <span className="st-badge st-pending" title={fmtDate(s.submittedAt ?? s.createdAt, lang)}>{t("pending_status")}</span>)}
      {s.statuses.map((st: any) => (
        <span key={st.id} className="st-badge" title={st.description || ""} style={{ background: st.color, color: st.textColor, borderColor: st.color }}>
          {tr(st, lang)}
        </span>
      ))}
    </>
  );
}

export default function ScammerCard({ s, pct, onOpen }: { s: any; pct?: number; onOpen: (id: number) => void }) {
  const { t, lang, theme, toast } = useApp();
  const copy = (e: React.MouseEvent, v: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(v).then(() => toast(t("copied")));
  };
  return (
    <article className={"card" + (pct != null ? " sim-card" : "")} onClick={() => onOpen(s.id)} style={{ cursor: "pointer" }}>
      <div className="card-top">
        <div className="avatar" style={{ background: avatarGrad(uname(s.name), theme) }}>{uname(s.name)[0]?.toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div className="c-user">{uname(s.name)}</div>
          {s.telegramUserId && <div className="c-id">ID: {s.telegramUserId}<button className="copy-id" title="copy" onClick={(e) => copy(e, s.telegramUserId)}>⧉</button></div>}
        </div>
        {pct != null && <span className="sim-ring" style={{ background: `conic-gradient(var(--acc) ${pct * 3.6}deg, rgba(255,255,255,.08) 0)` }}><i>{pct}%</i></span>}
      </div>
      <div className="c-tags">
        <Badges s={s} />
        {s.type && <span className="mini-tag">{tr(s.type, lang)}</span>}
      </div>
      {s.botCheck && (
        <div className="c-bot">
          {s.botReward && <span title={t("m_reward")}>🎁 {s.botReward}</span>}
          {s.botSponsors != null && <span title={t("m_sponsors")}>🤝 {s.botSponsors}</span>}
          {s.botUsage && <span title={t("m_usage")}>👥 {Number(s.botUsage).toLocaleString("ru-RU")}</span>}
        </div>
      )}
      {s.moderation === "pending" && <div className="c-date" style={{ marginTop: 8 }}>{t("pending_since")} {fmtDate(s.submittedAt ?? s.createdAt, lang)}</div>}
      <div className="c-foot">
        <span className="c-price">👍 {s.likeCount} · 👎 {s.dislikeCount}</span>
        <span className="c-date">{s.complaints} {t("complaints")}</span>
        <button className="c-btn" onClick={(e) => { e.stopPropagation(); onOpen(s.id); }}>{t("details")}</button>
      </div>
    </article>
  );
}
