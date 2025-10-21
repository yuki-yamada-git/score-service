import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
