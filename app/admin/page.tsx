"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/components/Providers";
import Moderation from "@/components/admin/Moderation";
import Dict from "@/components/admin/Dict";
import { Appeals, BansTab, Comments, SettingsTab, UsersTab } from "@/components/admin/Misc";

const TABS: { id: string; label: string; adminOnly?: boolean }[] = [
  { id: "moderation", label: "Модерація" },
  { id: "comments", label: "Жалоби на коментарі" },
  { id: "appeals", label: "Апеляції" },
  { id: "statuses", label: "Теги", adminOnly: true },
  { id: "types", label: "Типи", adminOnly: true },
  { id: "bans", label: "Бани IP" },
  { id: "users", label: "Користувачі", adminOnly: true },
  { id: "settings", label: "Налаштування", adminOnly: true },
];

export default function AdminPage() {
  const [me, setMe] = useState<any | undefined>(undefined);
  const [tab, setTab] = useState("moderation");
  useEffect(() => { api("/api/auth/me").then((r) => setMe(r.user ?? null)); }, []);

  if (me === undefined) return <main className="page"><div className="empty-sub">…</div></main>;
  if (!me || !["admin", "moderator"].includes(me.role))
    return <main className="page"><div className="panel narrow"><h2 className="zone-title" style={{ marginTop: 0 }}>Немає доступу</h2><Link className="btn" href="/login">Увійти</Link></div></main>;
  const isAdmin = me.role === "admin";

  return (
    <main className="page wide">
      <h2 className="zone-title"><span className="zt-ico">⚙</span><span>Адмін-панель</span></h2>
      <div className="admin-tabs">
        {TABS.filter((x) => isAdmin || !x.adminOnly).map((x) => (
          <button key={x.id} className={"tag-chip" + (tab === x.id ? " on" : "")} onClick={() => setTab(x.id)}>{x.label}</button>
        ))}
      </div>
      {tab === "moderation" && <Moderation />}
      {tab === "comments" && <Comments />}
      {tab === "appeals" && <Appeals />}
      {tab === "statuses" && isAdmin && <Dict kind="statuses" />}
      {tab === "types" && isAdmin && <Dict kind="types" />}
      {tab === "bans" && <BansTab isAdmin={isAdmin} />}
      {tab === "users" && <UsersTab isAdmin={isAdmin} />}
      {tab === "settings" && isAdmin && <SettingsTab />}
    </main>
  );
}
