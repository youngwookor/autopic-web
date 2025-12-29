import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import AuthProvider from "@/components/AuthProvider";
import InAppBrowserDetector from "@/components/InAppBrowserDetector";
import Analytics from "@/components/Analytics";
import ChannelTalk from "@/components/ChannelTalk";

const siteUrl = 'https://autopic.app';

export const metadata: Metadata = {
  // 기본 메타데이터
  title: {
    default: "AUTOPIC - AI 상품 이미지 생성 | 스마트스토어, 쿠팡 셀러 필수 도구",
    template: "%s | AUTOPIC",
  },
  description: "AI가 완성하는 커머스 사진의 새로운 기준. 상품 사진만 업로드하면 전문 스튜디오 퀄리티의 상품 이미지를 자동 생성합니다. 스마트스토어, 쿠팡, 11번가 셀러를 위한 AI 이미지 생성 서비스.",
  keywords: [
    // 핵심 키워드
    "AI 이미지 생성",
    "이미지 생성",
    "AI 상품 이미지",
    "상품 사진 생성",
    // 촬영 관련
    "상품 촬영",
    "이미지 촬영",
    "상품 촬영 대행",
    "상품 사진 촬영",
    "모델 촬영",
    "착용샷 촬영",
    // 셀러 타겟
    "스마트스토어 상품사진",
    "쿠팡 상품이미지",
    "11번가 상품사진",
    "온라인 셀러 도구",
    "이커머스 사진",
    // 기능 관련
    "AI 모델 사진",
    "AI 착용샷",
    "상품 배경 제거",
    "배경 합성",
    "누끼 따기",
    // 브랜드
    "AUTOPIC",
    "오토픽",
  ],
  authors: [{ name: "AUTOPIC" }],
  creator: "AUTOPIC",
  publisher: "AUTOPIC",
  
  // 로봇 설정
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // 오픈그래프 (Facebook, 카카오톡 등)
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'AUTOPIC',
    title: 'AUTOPIC - AI 상품 이미지 생성',
    description: 'AI가 완성하는 커머스 사진의 새로운 기준. 상품 사진만 업로드하면 전문 스튜디오 퀄리티의 상품 이미지를 자동 생성합니다.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'AUTOPIC - AI 상품 이미지 생성 서비스',
      },
    ],
  },
  
  // 트위터 카드
  twitter: {
    card: 'summary_large_image',
    title: 'AUTOPIC - AI 상품 이미지 생성',
    description: 'AI가 완성하는 커머스 사진의 새로운 기준',
    images: [`${siteUrl}/og-image.png`],
  },
  
  // 아이콘
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  
  // 기타
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  
  // 검색엔진 인증
  verification: {
    google: '3U3dm8-xCE4YimUny6Z6TiHuWzLrIBxvPLPJfvVJCWw', // Google Search Console
    other: {
      'naver-site-verification': 'df63440260208b39e4221ed10d0ba64dba4c2c8c', // 네이버 서치어드바이저
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#87D039" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AUTOPIC" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" 
          rel="stylesheet" 
        />
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'AUTOPIC',
              description: 'AI 상품 이미지 생성 서비스',
              url: siteUrl,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'KRW',
                description: '무료 체험 크레딧 제공',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '100',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        {/* Analytics (GA4 + Meta Pixel) */}
        <Analytics />
        
        {/* 채널톡 채팅 위젯 */}
        <ChannelTalk />
        
        <ToastProvider />
        <AuthProvider>
          {children}
          <InAppBrowserDetector />
        </AuthProvider>
      </body>
    </html>
  );
}
