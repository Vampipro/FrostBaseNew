"use client";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "./Providers";
import { Badges, avatarGrad, fmtDate } from "./ScammerCard";
import { tr } from "@/lib/i18n";
import Link from "next/link";
import { safeHref } from "@/lib/url";
import { uname } from "@/lib/name";

export default function ScammerView({ id }: { id: number }) {
  const { t, lang, theme, me, toast } = useApp();
  const [s, setS] = useState<any>(null);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [showAppeal, setShowAppeal] = useState(false);
  const [ap, setAp] = useState({ description: "", shots: "", website: "" });

  const load = useCallback(async () => {
    const r = await api("/api/scammer?id=" + id);
    if (r.error) setErr(r.error); else setS(r);
  }, [id]);
  useEffect(() => { setS(null); setErr(""); load(); }, [load]);

  if (err) return <div className="empty-sub">{t("not_found")}</div>;
  if (!s) return <div className="empty-sub">{t("loading")}</div>;

  const copy = (v: string) => navigator.clipboard?.writeText(v).then(() => toast(t("copied")));
  const vote = async (voteType: string) => {
    const r = await api("/api/vote", { body: { id, voteType } });
    if (r.error) return toast(r.error);
    setS({ ...s, myVote: r.myVote, likeCount: r.likeCount, neutralCount: r.neutralCount, dislikeCount: r.dislikeCount });
  };
  const addComment = async () => {
    const r = await api("/api/comments", { body: { scammerId: id, content: text } });
    if (r.error) return toast(r.error);
    setText("");
    setS({ ...s, comments: [r, ...s.comments] });
  };
  const report = async (cid: number) => {
    const r = await api("/api/comment-report", { body: { commentId: cid, reason: "" } });
    toast(r.error || t("reported"));
  };
  const sendAppeal = async () => {
    const r = await api("/api/appeals", { body: { scammerId: id, description: ap.description, screenshots: ap.shots.split("\n").map((x) => x.trim()).filter(Boolean), website: ap.website } });
    if (r.error) return toast(r.error);
    toast(t("appeal_sent"));
    setShowAppeal(false);
    setAp({ description: "", shots: "", website: "" });
  };

  const cells: [string, string | number][] = [
    [t("m_id"), s.telegramUserId ?? "—"],
    [t("m_type"), s.type ? tr(s.type, lang) : "—"],
    [t("m_amount"), s.scamAmount ? `${Number(s.scamAmount)} ${s.scamCurrency}` : "—"],
    [t("m_date"), s.scamDate ? fmtDate(s.scamDate, lang) : fmtDate(s.submittedAt ?? s.createdAt, lang)],
    [t("m_complaints"), s.complaints],
    [t("m_views"), s.viewCount],
  ];

  return (
    <div>
      <div className="modal-head">
        <div className="avatar big" style={{ background: avatarGrad(uname(s.name), theme) }}>{uname(s.name)[0]?.toUpperCase()}</div>
        <div>
          <div className="m-user">{uname(s.name)}</div>
          <div className="m-tags"><Badges s={s} /></div>
        </div>
      </div>
      <div className="modal-grid">
        {cells.map(([k, v]) => (
          <div className="m-cell" key={k}><div className="m-k">{k}</div><div className="m-v">{v}</div></div>
        ))}
      </div>
      {s.description && <><h4 className="sub-title">{t("m_desc")}</h4><p className="desc">{s.description}</p></>}
      {(s.screenshots.length > 0 || s.proofLink) && (
        <>
          <h4 className="sub-title">{t("m_proofs")}</h4>
          <ul className="links">
            {s.proofLink && <li><a href={safeHref(s.proofLink)} target="_blank" rel="noopener noreferrer nofollow">{t("m_proof_link")}</a></li>}
            {s.screenshots.map((u: string, i: number) => (
              <li key={i}><a href={safeHref(u)} target="_blank" rel="noopener noreferrer nofollow">#{i + 1} {u.replace(/^https?:\/\//, "").slice(0, 48)}</a></li>
            ))}
          </ul>
        </>
      )}
      <div className="vote-row">
        {(["like", "neutral", "dislike"] as const).map((k) => (
          <button key={k} className={"btn ghost" + (s.myVote === k ? " on" : "")} onClick={() => vote(k)}>
            {k === "like" ? "👍" : k === "neutral" ? "😐" : "👎"} {t(k)} · {s[k + "Count"]}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={() => copy(uname(s.name))}>{t("copy_user")}</button>
        {s.telegramUserId && <button className="btn ghost" onClick={() => copy(s.telegramUserId)}>{t("copy_id")}</button>}
        {/^[A-Za-z0-9_]{3,64}$/.test(uname(s.name)) && <a className="btn ghost" href={"https://t.me/" + encodeURIComponent(uname(s.name))} target="_blank" rel="noopener noreferrer">{t("open_tg")}</a>}
        {s.appealAllowed && <button className="btn ghost" onClick={() => setShowAppeal(!showAppeal)}>{t("appeal")}</button>}
        <Link className="btn ghost" href={"/s/" + s.id}>#{s.id}</Link>
      </div>

      {showAppeal && (
        <div className="form-card inner">
          <h4 className="sub-title">{t("appeal_title")}</h4>
          <label className="field"><span>{t("appeal_desc")}</span><textarea rows={4} value={ap.description} onChange={(e) => setAp({ ...ap, description: e.target.value })} /></label>
          <label className="field"><span>{t("appeal_shots")}</span><textarea rows={3} value={ap.shots} onChange={(e) => setAp({ ...ap, shots: e.target.value })} /></label>
          <input className="hp" tabIndex={-1} autoComplete="off" value={ap.website} onChange={(e) => setAp({ ...ap, website: e.target.value })} aria-hidden="true" />
          <button className="btn" onClick={sendAppeal}>{t("send")}</button>
        </div>
      )}

      <h4 className="sub-title">{t("comments")} ({s.comments.length})</h4>
      {me ? (
        <div className="comment-form">
          <textarea rows={2} maxLength={1000} placeholder={t("comment_ph")} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn" onClick={addComment}>{t("send")}</button>
        </div>
      ) : (
        <Link className="link-btn" href="/login">{t("login_to_comment")}</Link>
      )}
      {s.comments.length === 0 && <div className="c-date" style={{ marginTop: 10 }}>{t("no_comments")}</div>}
      {s.comments.map((c: any) => (
        <div className="comment" key={c.id}>
          <div className="comment-head"><b>{c.user.username}</b><span>{fmtDate(c.createdAt, lang)}</span><button className="link-btn" onClick={() => report(c.id)}>{t("report_comment")}</button></div>
          <div>{c.content}</div>
        </div>
      ))}
    </div>
  );
}
