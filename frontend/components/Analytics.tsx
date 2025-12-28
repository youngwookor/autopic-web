'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-VHXGWCP479';
const META_PIXEL_ID = '1582328272789967';
// 네이버 검색광고 - 검토 완료 후 아래 주석 해제
// const NAVER_ACCOUNT_ID = 's_XXXXXXXXXX'; // 프리미엄 로그 분석에서 확인

export default function Analytics() {
  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>

      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* 네이버 검색광고 프리미엄 로그 분석 - 검토 완료 후 아래 주석 해제 */}
      {/*
      <Script id="naver-wcs" strategy="afterInteractive">
        {`
          if (!wcs_add) var wcs_add = {};
          wcs_add["wa"] = "${NAVER_ACCOUNT_ID}";
          if (!_nasa) var _nasa = {};
          if (window.wcs) {
            wcs.inflow();
            wcs_do(_nasa);
          }
        `}
      </Script>
      <Script 
        src="//wcs.naver.net/wcslog.js" 
        strategy="afterInteractive"
      />
      */}
    </>
  );
}

// GA4 이벤트 전송 함수
export const sendGAEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Meta Pixel 이벤트 전송 함수
export const sendMetaEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

// TypeScript 타입 선언
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    fbq: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
