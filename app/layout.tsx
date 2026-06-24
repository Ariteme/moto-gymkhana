import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#07090f',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Israel Moto Gymkhana Leaderboard",
  description: "Live lap time leaderboard for Moto Gymkhana competitions in Israel. Track riders, maps, bikes and video runs.",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MotoGymkhana',
  },
  openGraph: {
    title: "Israel Moto Gymkhana Leaderboard",
    description: "Live lap time leaderboard for Moto Gymkhana competitions in Israel.",
    url: "https://moto-gymkhana.vercel.app",
    siteName: "Israel Moto Gymkhana",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
