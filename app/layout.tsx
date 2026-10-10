import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "潜能坐标 · 找到属于你的发挥方式",
  description: "50个真实生活场景，探索10个内在倾向。看见你的优势组合，让下一步有迹可循。",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
