"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, useApp } from "@/components/Providers";
import ScammerCard from "@/components/ScammerCard";
import ScammerView from "@/components/ScammerView";
import Modal from "@/components/Modal";
import { tr } from "@/lib/i18n";

type Meta = { statuses: any[]; types: any[] };
const fmt = (n: number) => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function Home() {
  const { t, lang } = useApp();
  const [meta, setMeta] = useState<Meta>({ statuses: [], types: [] });
  const [stats, setStats] = useState<any>(null);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [type, setType] = useState("");
  const [sort, setSort] = useState("rel");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    api<Meta>("/api/meta").then((m) => m.statuses && setMeta(m));
    api("/api/stats?lite=1").then((s) => s.totals && setStats(s));
  }, []);

  const run = useCallback(async () => {
    const n = ++seq.current;
    setLoading(true);
    const p = new URLSearchParams({ q, statuses: sel.join(","), type, sort, page: String(page) });
    const r = await api("/api/search?" + p);
    if (n === seq.current) { setData(r.error ? { results: [], similar: [], total: 0, pages: 1, error: r.error } : r); setLoading(false); }
  }, [q, sel, type, sort, page]);
  useEffect(() => { run(); }, [run]);

  // живий пошук: через 0.45 с після останнього символу
  useEffect(() => {
    const id = setTimeout(() => {
      const v = input.trim();
      if (v !== q && (v.length === 0 || v.length >= 2)) { setPage(1); setQ(v); }
    }, 450);
    return () => clearTimeout(id);
  }, [input, q]);

  const submit = (v = input) => { setPage(1); setQ(v.trim()); setInput(v); };
  const reset = () => { setInput(""); setQ(""); setSel([]); setType(""); setSort("rel"); setPage(1); };
  const toggle = (k: string) => { setPage(1); setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]); };

  return (
    <main className="home">
      <section className="search-zone" id="search">
        <div className="panel search-panel">
          <form className="search-row" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <input id="queryInput" value={input} onChange={(e) => setInput(e.target.value)} maxLength={64} autoComplete="off" spellCheck={false} placeholder={t("search_ph")} />
            <button className="search-btn" type="submit"><span className="sb-ico">⌕</span><span>{t("search_btn")}</span></button>
          </form>
          <div className="filters-row">
            <div className="tags-wrap">
              {meta.statuses.map((s) => (
                <button key={s.id} className={"tag-chip" + (sel.includes(String(s.id)) ? " on" : "")} style={{ ["--tc" as any]: s.color }} title={s.description || ""} onClick={() => toggle(String(s.id))}>{tr(s, lang)}</button>
              ))}
              <button className={"tag-chip" + (sel.includes("pending") ? " on" : "")} style={{ ["--tc" as any]: "#ffc857" }} onClick={() => toggle("pending")}>{t("pending_status")}</button>
            </div>
            <div className="selects">
              <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="type">
                <option value="">{t("all_types")}</option>
                {meta.types.map((x) => <option key={x.id} value={x.id}>{tr(x, lang)}</option>)}
              </select>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="sort">
                {["rel", "new", "old", "likes", "views", "complaints"].map((k) => <option key={k} value={k}>{t("sort_" + k)}</option>)}
              </select>
            </div>
          </div>
          {(q || sel.length > 0 || type) && (
            <div className="results-meta"><b>{data?.total ?? 0}{data?.capped ? "+" : ""}</b> · <button className="link-btn" onClick={reset}>{t("reset")}</button></div>
          )}
        </div>

        {data?.similar?.length > 0 && (
          <>
            <h3 className="zone-title"><span className="zt-ico">≈</span><span>{t("similar")}</span><span className="count-badge">{data.similar.length}</span></h3>
            <div className="results-grid">{data.similar.map((s: any) => <ScammerCard key={s.id} s={s} pct={s.pct} onOpen={setOpenId} />)}</div>
          </>
        )}

        <h3 className="zone-title"><span className="zt-ico">▤</span><span>{t("results")}</span><span className="count-badge">{data?.total ?? 0}{data?.capped ? "+" : ""}</span></h3>
        <div className="results-grid" style={{ opacity: loading ? 0.55 : 1 }}>
          {data?.results?.map((s: any) => <ScammerCard key={s.id} s={s} onOpen={setOpenId} />)}
        </div>
        {data && data.results.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-ico">∅</div>
            <div className="empty-title">{data.error || t("empty_title")}</div>
            <div className="empty-sub">{t("empty_sub")}</div>
            <button className="btn ghost" onClick={reset}>{t("reset")}</button>
          </div>
        )}
        {data && data.pages > 1 && (
          <div className="pager">
            <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>{t("page")} {page} / {data.pages}</span>
            <button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        )}
      </section>

      <section className="hero">
        <div className="hero-text">
          <div className="sys-line">{t("hero_pre")}</div>
          <h1 className="glitch" data-text="FROSTBASE">FROSTBASE</h1>
          <p className="hero-sub">{t("hero_sub")}</p>
          {stats && (
            <div className="hero-stats">
              <div className="stat"><span className="stat-num">{fmt(stats.totals.scammers)}</span><span className="stat-label">{t("stat_scammers")}</span></div>
              <div className="stat"><span className="stat-num">{fmt(stats.totals.searches)}</span><span className="stat-label">{t("stat_searches")}</span></div>
              <div className="stat"><span className="stat-num">{fmt(stats.totals.views)}</span><span className="stat-label">{t("stat_views")}</span></div>
            </div>
          )}
        </div>
        <div className="hero-art"><div className="art-ring" /><div className="art-ring r2" /><svg className="logo-big"><use href="#logoSym" /></svg></div>
      </section>

      {stats?.topQueries?.length > 0 && (
        <section className="drops">
          <h3 className="zone-title"><span className="zt-ico">❄</span><span>{t("top_searches")}</span></h3>
          <div className="ex-chips">
            {stats.topQueries.map((x: any) => (
              <button key={x.query} className="ex-chip" onClick={() => { submit(x.query); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{x.query} · {x.count}</button>
            ))}
          </div>
        </section>
      )}

      {openId != null && <Modal wide onClose={() => setOpenId(null)}><ScammerView id={openId} /></Modal>}
    </main>
  );
}
