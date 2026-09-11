import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RE:DAY",
  description: "현실적인 직무의 하루를 안전하게 시뮬레이션합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
