'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { ArrowLeft, Check, Zap, Crown, Shield, Clock, Download, ChevronLeft, ChevronRight, Globe, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 크레딧 충전 패키지 - 할인율 포함
const CREDIT_PACKAGES = [
  { id: "light", name: "Light", credits: 50, price: 19000, flashCount: 50, proCount: 16, desc: "가볍게 시작", pricePerCredit: 380, discount: 0 },
  { id: "standard", name: "Standard", credits: 200, price: 49000, flashCount: 200, proCount: 66, desc: "소규모 셀러", pricePerCredit: 245, discount: 36 },
  { id: "plus", name: "Plus", credits: 500, price: 119000, flashCount: 500, proCount: 166, popular: true, desc: "가장 인기", pricePerCredit: 238, discount: 37 },
  { id: "mega", name: "Mega", credits: 1500, price: 349000, flashCount: 1500, proCount: 500, desc: "중대형 셀러", pricePerCredit: 233, discount: 39 },
  { id: "ultimate", name: "Ultimate", credits: 5000, price: 999000, flashCount: 5000, proCount: 1666, desc: "최대 할인", pricePerCredit: 200, discount: 47, best: true },
];

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

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

// 나이스페이 SDK 타입 선언
declare global {
  interface Window {
    AUTHNICE?: {
      requestPay: (options: {
        clientId: string;
        method: string;
        orderId: string;
        amount: number;
        goodsName: string;
        returnUrl: string;
        mallReserved?: string;
        fnError?: (result: { errorMsg: string; msg: string }) => void;
      }) => void;
    };
  }
}

// 나이스페이 SDK 로드 (타이밍 문제 해결)
function loadNicepaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 바로 resolve
    if (window.AUTHNICE) {
      console.log('나이스페이 SDK 이미 로드됨');
      resolve();
      return;
    }

    // 이미 스크립트 태그가 있는지 확인
    const existingScript = document.querySelector('script[src="https://pay.nicepay.co.kr/v1/js/"]');
    if (existingScript) {
      // 스크립트는 있지만 AUTHNICE가 아직 없으면 대기
      const checkInterval = setInterval(() => {
        if (window.AUTHNICE) {
          clearInterval(checkInterval);
          console.log('나이스페이 SDK 로드 완료 (대기 후)');
          resolve();
        }
      }, 100);
      
      // 5초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.AUTHNICE) {
          reject(new Error('나이스페이 SDK 로드 타임아웃'));
        }
      }, 5000);
      return;
    }

    // 새로 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://pay.nicepay.co.kr/v1/js/';
    script.async = true;
    
    script.onload = () => {
      // 스크립트 로드 후 AUTHNICE가 정의될 때까지 대기
      const checkInterval = setInterval(() => {
        if (window.AUTHNICE) {
          clearInterval(checkInterval);
          console.log('나이스페이 SDK 로드 완료');
          resolve();
        }
      }, 50);
      
      // 3초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.AUTHNICE) {
          resolve();
        } else {
          reject(new Error('나이스페이 SDK 초기화 실패'));
        }
      }, 3000);
    };
    
    script.onerror = () => {
      reject(new Error('나이스페이 SDK 로드 실패'));
    };
    
    document.head.appendChild(script);
  });
}

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { balance } = useCreditsStore();
  const [currentSlide, setCurrentSlide] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [sdkReady, setSdkReady] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { trackViewPricing, trackInitiateCheckout } = useAnalytics();

  // 나이스페이 SDK 미리 로드
  useEffect(() => {
    trackViewPricing();
    loadNicepaySDK()
      .then(() => {
        setSdkReady(true);
        console.log('나이스페이 SDK 준비 완료');
      })
      .catch((err) => {
        console.error('나이스페이 SDK 로드 실패:', err);
      });
  }, []);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) {
      const idx = CREDIT_PACKAGES.findIndex(p => p.id === plan);
      if (idx !== -1) setCurrentSlide(idx);
    }
  }, [searchParams]);

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, CREDIT_PACKAGES.length - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextSlide();
    else if (distance < -50) prevSlide();
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handlePayment = async (planId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    const plan = CREDIT_PACKAGES.find(p => p.id === planId);
    if (!plan) return;

    setIsLoading(true);
    setSelectedPlan(planId);

    // Analytics: 결제 시작 추적
    trackInitiateCheckout({
      value: plan.price,
      credits: plan.credits,
      planName: plan.name,
    });

    try {
      // 1. 나이스페이 SDK 확인
      if (!window.AUTHNICE) {
        console.log('SDK 재로드 시도...');
        await loadNicepaySDK();
      }

      if (!window.AUTHNICE) {
        throw new Error('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침 해주세요.');
      }
      
      // 2. 결제 생성 (백엔드에 주문 정보 저장)
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createResponse = await fetch(`${API_URL}/api/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, plan: planId, order_id: orderId }),
      });

      if (!createResponse.ok) throw new Error('결제 생성 실패');

      // 3. 나이스페이 설정 가져오기
      const configResponse = await fetch(`${API_URL}/api/nicepay/config`);
      const config = await configResponse.json();
      
      console.log('나이스페이 결제 요청:', {
        clientId: config.client_id,
        orderId,
        amount: plan.price,
      });

      // 4. 나이스페이 결제창 호출
      const returnUrl = `${window.location.origin}/api/nicepay`;
      
      window.AUTHNICE.requestPay({
        clientId: config.client_id,
        method: 'card',
        orderId: orderId,
        amount: plan.price,
        goodsName: `Autopic ${plan.name} - ${formatPrice(plan.credits)}크레딧`,
        returnUrl: returnUrl,
        mallReserved: JSON.stringify({ plan: planId, userId: user.id }),
        fnError: (result) => {
          console.error('나이스페이 오류:', result);
          // 사용자 취소는 에러 메시지 표시하지 않음
          if (!result.errorMsg?.includes('취소') && !result.msg?.includes('취소')) {
            toast.error(result.msg || result.errorMsg || '결제 중 오류가 발생했습니다');
          }
          setIsLoading(false);
          setSelectedPlan(null);
        },
      });

    } catch (error: any) {
      console.error('결제 오류:', error);
      toast.error(error.message || '결제 중 오류가 발생했습니다');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* 네비게이션 */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl py-4 shadow-sm border-b border-zinc-100">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <AutoPicLogo className="w-6 h-6 text-[#87D039]" />
            <span className="font-black text-xl tracking-tighter text-black uppercase">AUTOPIC</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <div className="bg-zinc-100 px-4 py-2 rounded-full">
                <span className="text-sm font-bold">{balance?.credits || 0} 크레딧</span>
              </div>
            )}
            <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-black transition">
              <ArrowLeft size={18} />
              <span className="hidden md:inline text-sm font-medium">돌아가기</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-8 md:pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-zinc-200 text-xs font-bold uppercase tracking-widest bg-white mb-6 text-zinc-500">
            Credit Package
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            크레딧<span className="text-[#87D039]"> 충전</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto">
            구독 없이, 필요한 만큼만 충전<br className="md:hidden" />
            크레딧은 무기한 유효합니다
          </p>
        </div>
      </section>

      {/* 3가지 안내 */}
      <section className="px-4 md:px-6 pb-8 md:pb-12">
        <div className="max-w-[1000px] mx-auto">
          <div className="bg-white rounded-xl md:rounded-2xl border border-zinc-200 p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-0 md:divide-x divide-zinc-200">
              <div className="md:px-6 md:first:pl-0 md:last:pr-0">
                <h4 className="text-xs md:text-sm font-bold text-zinc-900 mb-2 md:mb-3">상품 1개 처리 비용</h4>
                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 md:gap-2 text-zinc-600"><Zap size={12} /> Flash (빠름)</span>
                    <span className="font-bold">1 크레딧</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 md:gap-2 text-zinc-600"><Crown size={12} /> Pro (고품질)</span>
                    <span className="font-bold">3 크레딧</span>
                  </div>
                </div>
              </div>
              <div className="md:px-6 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-200">
                <h4 className="text-xs md:text-sm font-bold text-zinc-900 mb-2 md:mb-3">웹 vs 설치형</h4>
                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 text-zinc-600"><Globe size={12} /><span><strong>웹</strong> - 테스트, 미리보기</span></div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-zinc-600"><Monitor size={12} /><span><strong>설치형</strong> - 대량, 자동화</span></div>
                </div>
              </div>
              <div className="md:px-6 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-200">
                <h4 className="text-xs md:text-sm font-bold text-zinc-900 mb-2 md:mb-3">크레딧 특징</h4>
                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-600">
                  <div className="flex items-center gap-1.5 md:gap-2"><Check size={12} className="text-[#87D039]" />기간 제한 없음</div>
                  <div className="flex items-center gap-1.5 md:gap-2"><Check size={12} className="text-[#87D039]" />웹 + 설치형 모두 사용</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D 캐러셀 슬라이드 */}
      <section className="pb-8 md:pb-12">
        <div 
          className="relative h-[480px] md:h-[520px] mb-6 md:mb-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          ref={sliderRef}
        >
          {/* Navigation Arrows */}
          <button onClick={prevSlide} disabled={currentSlide === 0}
            className={`hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-zinc-200 rounded-full items-center justify-center transition-all z-40 shadow-lg ${currentSlide === 0 ? 'opacity-30' : 'hover:scale-110'}`}>
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextSlide} disabled={currentSlide === CREDIT_PACKAGES.length - 1}
            className={`hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-zinc-200 rounded-full items-center justify-center transition-all z-40 shadow-lg ${currentSlide === CREDIT_PACKAGES.length - 1 ? 'opacity-30' : 'hover:scale-110'}`}>
            <ChevronRight size={24} />
          </button>

          {/* Cards */}
          <div className="absolute inset-0 flex items-center justify-center">
            {CREDIT_PACKAGES.map((pack, idx) => {
              const diff = idx - currentSlide;
              let style: React.CSSProperties;
              
              if (diff === 0) style = { transform: 'translateX(0) scale(1)', opacity: 1, zIndex: 30 };
              else if (diff === -1) style = { transform: 'translateX(-70%) scale(0.85)', opacity: 0.5, zIndex: 20 };
              else if (diff === 1) style = { transform: 'translateX(70%) scale(0.85)', opacity: 0.5, zIndex: 20 };
              else if (diff === -2) style = { transform: 'translateX(-130%) scale(0.7)', opacity: 0, zIndex: 10 };
              else if (diff === 2) style = { transform: 'translateX(130%) scale(0.7)', opacity: 0, zIndex: 10 };
              else style = { transform: 'translateX(0) scale(0.5)', opacity: 0, zIndex: 0 };

              const isCenter = idx === currentSlide;
              const isBest = (pack as any).best;
              
              return (
                <div key={idx} className="absolute w-[280px] md:w-[320px] transition-all duration-500 ease-out cursor-pointer" style={style} onClick={() => setCurrentSlide(idx)}>
                  <div className={`p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col relative ${
                    pack.popular && isCenter ? 'bg-zinc-900 text-white shadow-2xl' 
                    : isBest && isCenter ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-2xl'
                    : isCenter ? 'bg-white border-2 border-zinc-900 shadow-2xl'
                    : 'bg-white border border-zinc-200 shadow-lg'
                  }`}>
                    
                    {/* 할인 배지 (Light 제외) */}
                    {pack.discount > 0 && isCenter && !pack.popular && !isBest && (
                      <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                        {pack.discount}% OFF
                      </div>
                    )}
                    
                    {/* 메인 배지 */}
                    {pack.popular && (
                      <div className="flex justify-center mb-2">
                        <span className="bg-[#87D039] text-black text-[10px] font-bold px-3 py-1 rounded-full">🔥 가장 인기</span>
                      </div>
                    )}
                    {isBest && (
                      <div className="flex justify-center mb-2">
                        <span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full">💎 최고 가성비</span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="text-lg md:text-xl font-bold mb-1">{pack.name}</h3>
                      <p className={`text-xs md:text-sm ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>{pack.desc}</p>
                    </div>

                    <div className="text-center mb-4">
                      <div className="text-3xl md:text-4xl font-bold mb-1">₩{formatPrice(pack.price)}</div>
                      <p className={`text-xs md:text-sm ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {formatPrice(pack.credits)} 크레딧
                      </p>
                      <p className={`text-[10px] md:text-xs mt-1 ${(pack.popular || isBest) && isCenter ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        크레딧당 ₩{pack.pricePerCredit}
                        {pack.discount > 0 && (
                          <span className={`ml-1 font-bold ${(pack.popular || isBest) && isCenter ? 'text-[#87D039]' : 'text-red-500'}`}>
                            ({pack.discount}% 할인)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className={`rounded-xl p-3 md:p-4 mb-4 ${(pack.popular || isBest) && isCenter ? 'bg-white/10' : 'bg-zinc-50'}`}>
                      <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                        <div className="flex items-center justify-between">
                          <span className={`flex items-center gap-1.5 ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            <Zap size={10} /> Flash
                          </span>
                          <span className="font-bold">{formatPrice(pack.flashCount)}회</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`flex items-center gap-1.5 ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            <Crown size={10} /> Pro
                          </span>
                          <span className="font-bold">{formatPrice(pack.proCount)}회</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePayment(pack.id); }}
                      disabled={isLoading && selectedPlan === pack.id}
                      className={`w-full py-3 md:py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                        pack.popular && isCenter ? 'bg-[#87D039] text-black hover:bg-[#9AE045]'
                        : isBest && isCenter ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                        : isCenter ? 'bg-zinc-900 text-white hover:bg-black'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {isLoading && selectedPlan === pack.id ? '처리 중...' : '구매하기'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mb-4 md:hidden">← 좌우로 스와이프하세요 →</p>

        <div className="flex justify-center gap-1.5 md:gap-2 mb-8">
          {CREDIT_PACKAGES.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-zinc-900 w-6 md:w-8' : 'bg-zinc-300 w-1.5 md:w-2'}`}
            />
          ))}
        </div>
      </section>

      {/* 설치형 안내 */}
      <section className="px-4 md:px-6 pb-12">
        <div className="max-w-[1000px] mx-auto">
          <div className="bg-zinc-900 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#87D039] rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <Monitor size={20} className="text-black md:w-6 md:h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm md:text-base">크레딧 충전 시 설치형 프로그램 이용 가능</h4>
                <p className="text-xs md:text-sm text-zinc-400">대량 작업, 폴더 일괄 처리, 자동화 기능 제공</p>
              </div>
            </div>
            <button onClick={() => toast('다운로드 기능은 준비 중입니다', { icon: '📥' })}
              className="w-full md:w-auto whitespace-nowrap px-5 md:px-6 py-2.5 md:py-3 bg-white text-black rounded-lg md:rounded-xl font-bold text-sm hover:bg-zinc-100 transition-colors">
              프로그램 다운로드
            </button>
          </div>
        </div>
      </section>

      {/* 안내 섹션 */}
      <section className="pb-12 px-4 md:px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-zinc-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4"><Shield size={24} className="text-blue-500" /></div>
              <h4 className="font-bold mb-2">안전한 결제</h4>
              <p className="text-sm text-zinc-500">나이스페이를 통한 안전한 결제 시스템</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-zinc-200">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4"><Clock size={24} className="text-green-500" /></div>
              <h4 className="font-bold mb-2">무기한 유효</h4>
              <p className="text-sm text-zinc-500">구매한 크레딧은 기간 제한 없이 사용 가능</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-zinc-200">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4"><Download size={24} className="text-purple-500" /></div>
              <h4 className="font-bold mb-2">즉시 충전</h4>
              <p className="text-sm text-zinc-500">결제 완료 후 크레딧이 즉시 충전됩니다</p>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl border border-zinc-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold mb-2">Enterprise</h3>
              <p className="text-zinc-500 text-xs md:text-sm">월 1,000건 이상 대량 처리가 필요한 기업을 위한 맞춤 플랜</p>
            </div>
            <button onClick={() => toast('문의 기능은 준비 중입니다', { icon: '📧' })}
              className="w-full md:w-auto whitespace-nowrap px-5 md:px-6 py-2.5 md:py-3 bg-zinc-900 text-white rounded-lg md:rounded-xl font-bold text-sm hover:bg-black transition-colors">
              문의하기
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-zinc-500">
          <p>© 2025 Autopic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <PricingPageContent />
    </Suspense>
  );
}
