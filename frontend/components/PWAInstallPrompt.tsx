'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Smartphone, Sparkles, Zap } from 'lucide-react';

// 조리개 로고
const AutoPicLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m14.31 8 5.74 9.94" />
    <path d="M9.69 8h11.48" />
    <path d="m7.38 12 5.74-9.94" />
    <path d="M9.69 16 3.95 6.06" />
    <path d="M14.31 16H2.83" />
    <path d="m16.62 12-5.74 9.94" />
  </svg>
);

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 서버 사이드 렌더링 방지
    if (typeof window === 'undefined') return;

    // 이미 PWA로 실행 중인지 확인 (standalone 모드)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      console.log('PWA: Already running in standalone mode');
      return;
    }

    // PC에서는 표시하지 않음
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      return;
    }

    // 닫기 후 7일간 표시하지 않음
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        console.log(`PWA: Dismissed ${daysDiff} days ago, waiting...`);
        return;
      }
    }

    // iOS 감지
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // iOS는 beforeinstallprompt 이벤트가 없으므로 바로 표시
    if (isIOSDevice) {
      // Safari에서만 표시 (다른 브라우저에서는 PWA 설치 불가)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        setTimeout(() => {
          setShowPrompt(true);
          setTimeout(() => setIsVisible(true), 50);
        }, 3000); // 3초 후 표시
      }
      return;
    }

    // Android: beforeinstallprompt 이벤트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('PWA: beforeinstallprompt event fired');
      
      // 3초 후 팝업 표시
      setTimeout(() => {
        setShowPrompt(true);
        setTimeout(() => setIsVisible(true), 50);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 이미 설치된 경우 감지
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 설치 버튼 클릭
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('PWA: User choice:', outcome);
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('PWA: Install error:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  // 닫기 버튼 클릭
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowPrompt(false);
      localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
    }, 300);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[400] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[401] transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="mx-3 mb-3 bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 상단 그라데이션 바 */}
          <div className="h-1 bg-gradient-to-r from-[#87D039] via-violet-500 to-[#87D039]" />
          
          {/* 닫기 버튼 */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          <div className="p-6 pt-5">
            {/* 앱 정보 */}
            <div className="flex items-center gap-4 mb-5">
              {/* 앱 아이콘 */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl flex items-center justify-center shadow-lg">
                  <AutoPicLogo className="w-8 h-8 text-[#87D039]" />
                </div>
                {/* 빛나는 효과 */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#87D039] rounded-full flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900">AUTOPIC 앱 설치</h3>
                <p className="text-sm text-zinc-500">홈 화면에서 빠르게 접속하세요</p>
              </div>
            </div>

            {/* 기능 하이라이트 */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <div className="w-8 h-8 bg-[#87D039]/10 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                  <Zap size={16} className="text-[#87D039]" />
                </div>
                <p className="text-[10px] font-medium text-zinc-600">빠른 실행</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                  <Smartphone size={16} className="text-violet-600" />
                </div>
                <p className="text-[10px] font-medium text-zinc-600">앱처럼 사용</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                  <Download size={16} className="text-blue-600" />
                </div>
                <p className="text-[10px] font-medium text-zinc-600">설치 무료</p>
              </div>
            </div>

            {isIOS ? (
              /* iOS 안내 */
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 rounded-2xl p-4">
                  <p className="text-sm font-medium text-zinc-800 mb-3">Safari에서 홈 화면에 추가하기</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-zinc-400">1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600">하단의</span>
                        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Share size={14} className="text-white" />
                        </div>
                        <span className="text-sm text-zinc-600">공유 버튼 탭</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-zinc-400">2</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-zinc-200 rounded-lg flex items-center justify-center">
                          <Plus size={14} className="text-zinc-600" />
                        </div>
                        <span className="text-sm text-zinc-600">"홈 화면에 추가" 선택</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="w-full py-3.5 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  확인했어요
                </button>
              </div>
            ) : (
              /* Android 설치 버튼 */
              <div className="space-y-3">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full py-4 bg-gradient-to-r from-[#87D039] to-[#6BBF2A] text-black rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-[#87D039]/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      설치 중...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      앱 설치하기
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="w-full py-3 text-zinc-500 text-sm font-medium hover:text-zinc-700 transition-colors"
                >
                  나중에 할게요
                </button>
              </div>
            )}
          </div>

          {/* Safe Area for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  );
}
