import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import AuthProvider from "@/components/AuthProvider";
import InAppBrowserDetector from "@/components/InAppBrowserDetector";
import Analytics from "@/components/Analytics";

const siteUrl = 'https://autopic.app';

export const metadata: Metadata = {
  // 기본 메타데이터
  title: {
    default: "AUTOPIC - AI 상품 이미지 생성 | 스마트스토어, 쿠팡 셀러 필수 도구",
    template: "%s | AUTOPIC",
  },
  description: "AI가 완성하는 커머스 사진의 새로운 기준. 상품 사진만 업로드하면 전문 스튜디오 퀄리티의 상품 이미지를 자동 생성합니다. 스마트스토어, 쿠팡, 11번가 셀러를 위한 AI 이미지 생성 서비스.",
  keywords: [
    "AI 상품 이미지",
    "상품 사진 생성",
    "AI 이미지 생성",
    "스마트스토어 상품사진",
    "쿠팡 상품이미지",
    "이커머스 사진",
    "상품 촬영 대행",
    "AI 모델 사진",
    "상품 배경 제거",
    "온라인 셀러 도구",
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
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  
  // 기타
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  
  // 네이버 웹마스터 도구 인증 (필요시 추가)
  verification: {
    google: '', // Google Search Console 인증 코드 (나중에 추가)
    // other: {
    //   'naver-site-verification': '', // 네이버 웹마스터 인증 코드
    // },
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
        
        <ToastProvider />
        <AuthProvider>
          {children}
          <InAppBrowserDetector />
        </AuthProvider>
      </body>
    </html>
  );
}
