import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "AUTOPIC - AI 상품 이미지 생성",
  description: "AI가 완성하는 커머스 사진의 새로운 기준",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased">
        <ToastProvider />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
