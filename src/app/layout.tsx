import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";
import { AppFrame } from "@/components/app-frame";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({ variable: "--font-plex", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const kufi = Reem_Kufi({ variable: "--font-kufi", subsets: ["arabic", "latin"], weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Minka · منكا",
  description: "Plan your life areas, goals and daily habits — خطّط جوانب حياتك وأهدافك وعاداتك.",
  appleWebApp: { capable: true, title: "Minka", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F4F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0C1310" },
  ],
};

// Applies the saved language and theme before first paint so there is no flash.
const boot = `try{var s=JSON.parse(localStorage.getItem("minka")||"{}").state||{};var r=document.documentElement;var l=s.lang||"ar";r.lang=l;r.dir=l==="ar"?"rtl":"ltr";if(s.theme)r.setAttribute("data-theme",s.theme)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${kufi.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
