import type { Metadata } from "next";
import { DM_Mono, Inter_Tight } from "next/font/google";
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

export const metadata: Metadata = {
  title: "TrueCost",
  description:
    "know the real price before it lands. estimated duty, vat and shipping for orders to egypt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmMono.variable} ${interTight.variable}`}>
      <body className="bg-paper text-ink font-mono antialiased">{children}</body>
    </html>
  );
}
