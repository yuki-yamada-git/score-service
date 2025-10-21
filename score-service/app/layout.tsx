import type { Metadata } from "next";
import { Geist, Geist_Mono } from "geist/font";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Score Service | 連携設定",
  description:
    "Backlog と OpenAI の連携に必要なプロジェクト情報や API キーを管理するためのセットアップ画面です。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
