import "@fontsource/unbounded/400.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import { Background, Footer, Topbar } from "@/components/Chrome";

export const metadata: Metadata = { title: "FROSTBASE — чекер скамеров", description: "Проверь юзернейм или Telegram ID по базе скамеров" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#050d1a" };

// Виконується до першого малювання: тема, ефекти й мова без «миготіння»
const INIT = `try{var d=document.documentElement,s=JSON.parse(localStorage.getItem('fb_settings')||'null'),rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!s){var o=localStorage.getItem('fb_theme');s={theme:o==='neon'?'neon':'frost',bg:!rm,grid:true,scan:!rm,anim:!rm,glow:true}}
d.dataset.theme=s.theme||'frost';d.dataset.bg=s.bg===false?'off':'on';d.dataset.grid=s.grid===false?'off':'on';d.dataset.scan=s.scan===false?'off':'on';d.dataset.anim=s.anim===false?'off':'on';d.dataset.glow=s.glow===false?'off':'on';
var n=navigator,mq=function(q){return window.matchMedia&&matchMedia(q).matches},weak=mq('(max-width: 820px)')||mq('(pointer: coarse)')||rm||(n.connection&&n.connection.saveData===true)||(n.hardwareConcurrency||8)<=2||(n.deviceMemory||8)<=2;
d.dataset.lite=(s.liteSet?!!s.lite:(!!s.liteFps||weak))?'on':'off';
var l=localStorage.getItem('fb_lang')||'ru';d.lang=l==='ua'?'uk':l}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-theme="frost" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INIT }} />
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
