"use client";
import Link from "next/link";
import { useApp } from "@/components/Providers";

export default function NotFound() {
  const { t } = useApp();
  return (
    <main className="page"><div className="empty-state"><div className="empty-ico">404</div><div className="empty-title">{t("nf_title")}</div><Link className="btn" href="/">{t("home")}</Link></div></main>
  );
}
