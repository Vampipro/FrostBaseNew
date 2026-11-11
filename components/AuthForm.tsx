"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, useApp } from "./Providers";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t, refreshMe, toast, me } = useApp();
  const router = useRouter();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  // уже залогінений — форма не потрібна, одразу на головну
  useEffect(() => { if (me) router.replace("/"); }, [me, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await api("/api/auth/" + mode, { body: { username: u, password: p } });
    if (r.error) { setBusy(false); return toast(r.error); }
    await refreshMe();
    // повне перезавантаження надійніше за router.push: сесійна кука вже встановлена, стан чистий
    window.location.assign("/");
  };
  return (
    <main className="page">
      <form className="panel narrow form-card small" onSubmit={submit}>
        <h2 className="zone-title" style={{ marginTop: 0 }}>{t(isLogin ? "auth_login_title" : "auth_reg_title")}</h2>
        <label className="field"><span>{t("username")}</span><input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required /></label>
        <label className="field"><span>{t("password")}</span><input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} required /></label>
        <button className="btn" type="submit" disabled={busy}>{t(isLogin ? "login" : "register")}</button>
        <div className="hint" style={{ marginTop: 14 }}>
          {t(isLogin ? "no_account" : "have_account")} <Link className="link-btn" href={isLogin ? "/register" : "/login"}>{t(isLogin ? "register" : "login")}</Link>
        </div>
      </form>
    </main>
  );
}
