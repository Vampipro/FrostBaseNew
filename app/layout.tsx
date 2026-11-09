import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import { Background, Footer, Topbar } from "@/components/Chrome";

export const metadata: Metadata = { title: "FROSTBASE — чекер скамерів", description: "Перевір юзернейм або Telegram ID за базою скамерів" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" data-theme="frost">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/unbounded/400.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/unbounded/700.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/400.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/700.css" />
      </head>
      <body>
        <Providers>
          <Background />
          <Topbar />
          <div className="page-shell">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
