import type { Metadata } from "next";
import { DM_Mono, Inter_Tight } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const title = "TrueCost";
const description =
  "know the real price before it lands. estimated duty, vat and shipping for orders to egypt.";

export const metadata: Metadata = {
  metadataBase: new URL("https://truecost-credosis.vercel.app"),
  title,
  description,
  openGraph: { title, description, url: "/", siteName: title, locale: "en_US", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmMono.variable} ${interTight.variable}`}>
      <body className="bg-paper text-ink font-mono antialiased">
        <div className="flex min-h-dvh flex-col px-[5%]">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
