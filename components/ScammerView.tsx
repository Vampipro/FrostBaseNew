"use client";
import { useCallback, useEffect, useState } from "react";
import { api, useApp } from "./Providers";
import { Badges, avatarGrad, fmtDate } from "./ScammerCard";
import { tr } from "@/lib/i18n";
import Link from "next/link";
import { safeHref } from "@/lib/url";
import { uname, pickDesc } from "@/lib/name";

export default function ScammerView({ id }: { id: number }) {
  const { t, lang, theme, me, toast } = useApp();
  const [s, setS] = useState<any>(null);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [showAppeal, setShowAppeal] = useState(false);
  const [ap, setAp] = useState({ description: "", shots: "", website: "" });
  const [showCheck, setShowCheck] = useState(false);
  const [ck, setCk] = useState({ verdict: "paid", shots: "", comment: "", website: "" });

  const load = useCallback(async () => {
    const r = await api("/api/scammer?id=" + id);
    if (r.error) setErr(r.error); else setS(r);
  }, [id]);
  useEffect(() => { setS(null); setErr(""); load(); }, [load]);

  if (err) return <div className="empty-sub">{t("not_found")}</div>;
  if (!s) return <div className="empty-sub">{t("loading")}</div>;

  const desc = pickDesc(s, lang);
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

  const sendCheck = async () => {
    const r = await api("/api/bot-checks", { body: { scammerId: id, verdict: ck.verdict, screenshots: ck.shots.split("\n").map((x) => x.trim()).filter(Boolean), comment: ck.comment, website: ck.website } });
    if (r.error) return toast(r.error);
    toast(t("check_sent"));
    setShowCheck(false);
    setCk({ verdict: "paid", shots: "", comment: "", website: "" });
    setS({ ...s, myCheckPending: true });
  };
  const canCheck = !!s.botCheck && s.moderation === "pending";
  const tgOk = /^[A-Za-z0-9_]{3,64}$/.test(uname(s.name));
  const VERD: Record<string, string> = { paid: t("v_paid"), partial: t("v_partial"), not_paid: t("v_not_paid") };
  const shotLinks = (arr: string[]) => (
    <ul className="links">
      {arr.map((u: string, i: number) => <li key={i}><a href={safeHref(u)} target="_blank" rel="noopener noreferrer nofollow">#{i + 1} {u.replace(/^https?:\/\//, "").slice(0, 48)}</a></li>)}
    </ul>
  );

  const cells: [string, string | number][] = [
    [t("m_id"), s.telegramUserId ?? "—"],
    [t("m_type"), s.type ? tr(s.type, lang) : "—"],
    ...((s.botCheck
      ? [[t("m_reward"), s.botReward || "—"], [t("m_sponsors"), s.botSponsors ?? "—"], [t("m_usage"), s.botUsage ? Number(s.botUsage).toLocaleString("ru-RU") : "—"]]
      : [[t("m_amount"), s.scamAmount ? `${Number(s.scamAmount)} ${s.scamCurrency}` : "—"]]) as [string, string | number][]),
    s.botCheck
      ? [t("m_last_check"), s.scamDate ? fmtDate(s.scamDate, lang) : "—"]
      : [t("m_date"), s.scamDate ? fmtDate(s.scamDate, lang) : fmtDate(s.submittedAt ?? s.createdAt, lang)],
    s.botCheck ? [t("m_checks"), s.botChecks?.length ?? 0] : [t("m_complaints"), s.complaints],
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
      {desc && <><h4 className="sub-title">{t("m_desc")}</h4><p className="desc">{desc}</p></>}
      {(s.screenshots.length > 0 || s.proofLink) && (
        <>
          {s.screenshots.length > 0 && s.proofLink ? (
            <>
              <h4 className="sub-title">{t("m_shots_orig")}</h4>
              {shotLinks(s.screenshots)}
              <h4 className="sub-title">{t("m_shots_reserve")}</h4>
              {shotLinks([s.proofLink])}
            </>
          ) : (
            <>
              <h4 className="sub-title">{t("m_proofs")}</h4>
              {shotLinks(s.screenshots.length > 0 ? s.screenshots : [s.proofLink])}
            </>
          )}
        </>
      )}
      <div className="vote-row">
        {(["like", "neutral", "dislike"] as const).map((k) => (
          <button key={k} className={"btn ghost" + (s.myVote === k ? " on" : "")} onClick={() => vote(k)}>
            {k === "like" ? "👍" : k === "neutral" ? "😐" : "👎"} {t(k)} · {s[k + "Count"]}
          </button>
        ))}
      </div>
      <div className="act-grid">
        <button className="btn" onClick={() => copy(uname(s.name))}>{t("copy_user")}</button>
        {tgOk && <a className="btn ghost" href={"https://t.me/" + encodeURIComponent(uname(s.name))} target="_blank" rel="noopener noreferrer">{t("open_tg")}</a>}
        {s.telegramUserId && <button className="btn ghost" onClick={() => copy(s.telegramUserId)}>{t("copy_id")}</button>}
        {canCheck && !s.myCheckPending && <button className="btn ghost full" onClick={() => setShowCheck(!showCheck)}>{t("check_btn")}</button>}
        {s.appealAllowed && <button className="btn ghost full" onClick={() => setShowAppeal(!showAppeal)}>{t("appeal")}</button>}
      </div>
      {canCheck && s.myCheckPending && <div className="c-date" style={{ marginTop: 10 }}>{t("check_wait")}</div>}

      {showCheck && canCheck && (
        <div className="form-card inner">
          <h4 className="sub-title">{t("check_title")}</h4>
          {me ? (
            <>
              <label className="field"><span>{t("check_verdict")}</span>
                <select value={ck.verdict} onChange={(e) => setCk({ ...ck, verdict: e.target.value })}>
                  <option value="paid">{t("v_paid")}</option><option value="partial">{t("v_partial")}</option><option value="not_paid">{t("v_not_paid")}</option>
                </select>
              </label>
              <label className="field"><span>{t("check_shots")} *</span><textarea rows={3} value={ck.shots} onChange={(e) => setCk({ ...ck, shots: e.target.value })} placeholder="https://..." /></label>
              <label className="field"><span>{t("check_comment")}</span><textarea rows={2} maxLength={500} value={ck.comment} onChange={(e) => setCk({ ...ck, comment: e.target.value })} /></label>
              <input className="hp" tabIndex={-1} autoComplete="off" value={ck.website} onChange={(e) => setCk({ ...ck, website: e.target.value })} aria-hidden="true" />
              <button className="btn" onClick={sendCheck}>{t("send")}</button>
            </>
          ) : (
            <Link className="link-btn" href="/login">{t("check_login")}</Link>
          )}
        </div>
      )}

      {showAppeal && (
        <div className="form-card inner">
          <h4 className="sub-title">{t("appeal_title")}</h4>
          <label className="field"><span>{t("appeal_desc")}</span><textarea rows={4} value={ap.description} onChange={(e) => setAp({ ...ap, description: e.target.value })} /></label>
          <label className="field"><span>{t("appeal_shots")}</span><textarea rows={3} value={ap.shots} onChange={(e) => setAp({ ...ap, shots: e.target.value })} /></label>
          <input className="hp" tabIndex={-1} autoComplete="off" value={ap.website} onChange={(e) => setAp({ ...ap, website: e.target.value })} aria-hidden="true" />
          <button className="btn" onClick={sendAppeal}>{t("send")}</button>
        </div>
      )}

      {s.botCheck && (
        <>
          <h4 className="sub-title">{t("checks")} ({s.botChecks?.length ?? 0})</h4>
          {(s.botChecks ?? []).length === 0 && <div className="c-date">{t("no_checks")}</div>}
          {(s.botChecks ?? []).map((c: any) => (
            <div className="check-item" key={c.id}>
              <div className="comment-head"><span className={"verdict v-" + c.verdict}>{VERD[c.verdict] ?? c.verdict}</span><b>{c.user?.username ?? "—"}</b><span>{fmtDate(c.createdAt, lang)}</span></div>
              {c.comment && <div>{c.comment}</div>}
              {shotLinks(c.screenshots)}
            </div>
          ))}
        </>
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
