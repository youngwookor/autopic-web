'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, X, AlertTriangle } from 'lucide-react';

export default function InAppBrowserDetector() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [browserName, setBrowserName] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    
    // 인앱 브라우저 감지
    const inAppBrowsers = [
      { pattern: /kakaotalk/i, name: '카카오톡' },
      { pattern: /naver\(/i, name: '네이버' },
      { pattern: /instagram/i, name: '인스타그램' },
      { pattern: /fbav/i, name: '페이스북' },
      { pattern: /fb_iab/i, name: '페이스북' },
      { pattern: /line\//i, name: '라인' },
      { pattern: /twitter/i, name: '트위터' },
      { pattern: /wv\)/i, name: '인앱' }, // WebView
    ];

    for (const browser of inAppBrowsers) {
      if (browser.pattern.test(ua)) {
        setIsInAppBrowser(true);
        setBrowserName(browser.name);
        break;
      }
    }
  }, []);

  // 외부 브라우저로 열기
  const openInExternalBrowser = () => {
    const currentUrl = window.location.href;
    
    // Android
    if (/android/i.test(navigator.userAgent)) {
      // Intent를 사용해서 Chrome으로 열기 시도
      window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
      
      // 실패 시 일반 브라우저로 폴백
      setTimeout(() => {
        window.open(currentUrl, '_system');
      }, 500);
    } 
    // iOS
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      // iOS에서는 Safari로 열기 어려움, 복사 안내
      navigator.clipboard.writeText(currentUrl);
      alert('링크가 복사되었습니다. Safari에서 붙여넣기하여 접속해주세요.');
    }
    // 기타
    else {
      window.open(currentUrl, '_blank');
    }
  };

  if (!isInAppBrowser || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] p-4 bg-gradient-to-t from-black/90 to-black/70 backdrop-blur-sm animate-slide-up">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-yellow-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-900 mb-1">
                {browserName} 앱에서 접속 중
              </h3>
              <p className="text-sm text-zinc-500 mb-3">
                로그인 및 일부 기능이 제한될 수 있어요. 
                <span className="font-medium text-zinc-700"> Chrome 또는 Safari</span>에서 접속하시면 모든 기능을 이용할 수 있습니다.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={openInExternalBrowser}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#87D039] text-black rounded-xl font-bold text-sm hover:bg-[#9AE045] transition"
                >
                  <ExternalLink size={16} />
                  외부 브라우저로 열기
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-2.5 text-zinc-400 hover:text-zinc-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
