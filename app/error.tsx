"use client";
import { useApp } from "@/components/Providers";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useApp();
  return (
    <main className="page"><div className="empty-state"><div className="empty-ico">!</div><div className="empty-title">{t("err_title")}</div><button className="btn" onClick={reset}>{t("retry")}</button></div></main>
  );
}
