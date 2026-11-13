"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/components/Providers";
import Moderation from "@/components/admin/Moderation";
import Dict from "@/components/admin/Dict";
import BotChecks from "@/components/admin/BotChecks";
import { useTT } from "@/components/admin/tt";
import { Appeals, BansTab, Comments, SettingsTab, UsersTab } from "@/components/admin/Misc";

export default function AdminPage() {
  const tt = useTT();
  const [me, setMe] = useState<any | undefined>(undefined);
  const [tab, setTab] = useState("moderation");
  useEffect(() => { api("/api/auth/me").then((r) => setMe(r.user ?? null)); }, []);

  if (me === undefined) return <main className="page"><div className="empty-sub">…</div></main>;
  if (!me || !["admin", "moderator"].includes(me.role))
    return <main className="page"><div className="panel narrow"><h2 className="zone-title" style={{ marginTop: 0 }}>{tt("Немає доступу", "No access", "Нет доступа")}</h2><Link className="btn" href="/login">{tt("Увійти", "Log in", "Войти")}</Link></div></main>;
  const isAdmin = me.role === "admin";

  const TABS: { id: string; label: string; adminOnly?: boolean }[] = [
    { id: "moderation", label: tt("Модерація", "Moderation", "Модерация") },
    { id: "botchecks", label: tt("Перевірки ботів", "Bot checks", "Проверки ботов") },
    { id: "comments", label: tt("Скарги на коментарі", "Comment reports", "Жалобы на комментарии") },
    { id: "appeals", label: tt("Апеляції", "Appeals", "Апелляции") },
    { id: "statuses", label: tt("Теги", "Tags", "Теги"), adminOnly: true },
    { id: "types", label: tt("Типи", "Types", "Типы"), adminOnly: true },
    { id: "bans", label: tt("Бани IP", "IP bans", "Баны IP") },
    { id: "users", label: tt("Користувачі", "Users", "Пользователи"), adminOnly: true },
    { id: "settings", label: tt("Налаштування", "Settings", "Настройки"), adminOnly: true },
  ];

  return (
    <main className="page wide">
      <h2 className="zone-title"><span className="zt-ico">⚙</span><span>{tt("Адмін-панель", "Admin panel", "Админ-панель")}</span></h2>
      <div className="admin-tabs">
        {TABS.filter((x) => isAdmin || !x.adminOnly).map((x) => (
          <button key={x.id} className={"tag-chip" + (tab === x.id ? " on" : "")} onClick={() => setTab(x.id)}>{x.label}</button>
        ))}
      </div>
      {tab === "moderation" && <Moderation />}
      {tab === "botchecks" && <BotChecks />}
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
