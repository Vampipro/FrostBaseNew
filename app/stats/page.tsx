"use client";
import { useEffect, useState } from "react";
import { api, useApp } from "@/components/Providers";
import ScammerCard, { avatarGrad } from "@/components/ScammerCard";
import ScammerView from "@/components/ScammerView";
import Modal from "@/components/Modal";
import { tr } from "@/lib/i18n";
import { uname } from "@/lib/name";

const fmt = (n: number) => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function StatsPage() {
  const { t, lang, theme } = useApp();
  const [s, setS] = useState<any>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => { api("/api/stats").then((r) => r.totals && setS(r)); }, []);
  if (!s) return <main className="page"><div className="empty-sub">{t("loading")}</div></main>;

  const T = s.totals;
  const cards: [string, number][] = [
    [t("st_scammers"), T.scammers], [t("st_pending"), T.pending], [t("st_subs"), T.submissions], [t("stat_views"), T.views],
    [t("stat_searches"), T.searches], [t("st_today"), T.searchesToday], [t("st_7d"), T.searches7d], [t("st_users"), T.users], [t("st_comments"), T.comments],
  ];
  const max = Math.max(1, ...s.perDay.map((d: any) => d.count));
  const react = [["👍", T.likes], ["😐", T.neutral], ["👎", T.dislikes]] as const;
  const reactMax = Math.max(1, T.likes, T.neutral, T.dislikes);
  const bars = (rows: any[]) => {
    const m = Math.max(1, ...rows.map((r) => r.count));
    return rows.map((r) => (
      <div className="bar-row" key={r.id}>
        <span className="bar-k">{tr(r, lang)}</span>
        <div className="bar"><i style={{ width: (r.count / m) * 100 + "%", background: r.color || "var(--acc)" }} /></div>
        <b>{fmt(r.count)}</b>
      </div>
    ));
  };
  const MEDAL = ["🥇", "🥈", "🥉"];
  // Лідерборд: місце/медаль, аватар, ім'я, шкала відносно лідера і значення
  const board = (title: string, rows: any[], metric: string, icon: string) => {
    const m = Math.max(1, ...rows.map((r) => Number(r[metric]) || 0));
    return (
      <div className="panel lb-panel">
        <h3 className="sub-title" style={{ marginTop: 0 }}>{title}</h3>
        <ol className="lb">
          {rows.map((r, i) => (
            <li key={r.id}>
              <button className={"lb-row" + (i < 3 ? " top top" + (i + 1) : "")} onClick={() => setOpenId(r.id)}>
                <span className="lb-pos">{i < 3 ? MEDAL[i] : i + 1}</span>
                <span className="lb-av" style={{ background: avatarGrad(uname(r.name), theme) }}>{uname(r.name)[0]?.toUpperCase()}</span>
                <span className="lb-main">
                  <b className="lb-name">{uname(r.name)}</b>
                  <span className="lb-bar"><i style={{ width: Math.max(4, ((Number(r[metric]) || 0) / m) * 100) + "%" }} /></span>
                </span>
                <span className="lb-val">{icon} {fmt(Number(r[metric]) || 0)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    );
  };
  const queryBoard = (rows: any[]) => {
    const m = Math.max(1, ...rows.map((r) => Number(r.count) || 0));
    return (
      <div className="panel lb-panel">
        <h3 className="sub-title" style={{ marginTop: 0 }}>{t("st_top_queries")}</h3>
        <ol className="lb">
          {rows.map((x, i) => (
            <li key={x.query}>
              <div className={"lb-row static" + (i < 3 ? " top top" + (i + 1) : "")}>
                <span className="lb-pos">{i < 3 ? MEDAL[i] : i + 1}</span>
                <span className="lb-main">
                  <b className="lb-name">{x.query}</b>
                  <span className="lb-bar"><i style={{ width: Math.max(4, (Number(x.count) / m) * 100) + "%" }} /></span>
                </span>
                <span className="lb-val">🔍 {fmt(Number(x.count) || 0)}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <main className="page">
      <h2 className="zone-title"><span className="zt-ico">▥</span><span>{t("st_title")}</span></h2>
      <div className="stat-grid">
        {cards.map(([k, v]) => <div className="panel stat-card" key={k}><span className="stat-num">{fmt(v)}</span><span className="stat-label">{k}</span></div>)}
      </div>

      <div className="two-col">
        <div className="panel">
          <h3 className="sub-title" style={{ marginTop: 0 }}>{t("st_reactions")}</h3>
          {react.map(([e, n]) => (
            <div className="bar-row" key={e}><span className="bar-k">{e}</span><div className="bar"><i style={{ width: (n / reactMax) * 100 + "%" }} /></div><b>{fmt(n)}</b></div>
          ))}
          <h3 className="sub-title">{t("st_by_type")}</h3>
          {bars(s.byType)}
        </div>
        <div className="panel">
          <h3 className="sub-title" style={{ marginTop: 0 }}>{t("st_by_status")}</h3>
          {bars(s.byStatus)}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 className="sub-title" style={{ marginTop: 0 }}>{t("st_per_day")}</h3>
        <div className="chart">
          {s.perDay.map((d: any) => (
            <div className="col" key={d.day} title={`${new Date(d.day).toLocaleDateString()}: ${d.count}`}><i style={{ height: (d.count / max) * 100 + "%" }} /><small>{new Date(d.day).getDate()}</small></div>
          ))}
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 16 }}>
        {board(t("st_top_searched"), s.topSearched, "searchCount", "🔍")}
        {board(t("st_top_viewed"), s.topViewed, "viewCount", "👁")}
        {board(t("st_top_liked"), s.topLiked, "likeCount", "👍")}
        {queryBoard(s.topQueries)}
      </div>

      <h3 className="zone-title"><span className="zt-ico">❄</span><span>{t("st_latest")}</span></h3>
      <div className="results-grid">{s.latest.map((x: any) => <ScammerCard key={x.id} s={x} onOpen={setOpenId} />)}</div>

      {openId != null && <Modal wide onClose={() => setOpenId(null)}><ScammerView id={openId} /></Modal>}
    </main>
  );
}
