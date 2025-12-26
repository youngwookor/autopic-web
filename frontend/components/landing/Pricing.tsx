'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Coins, Check, X, Zap, Crown, Monitor, Globe, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CREDIT_PACKAGES = [
  { id: "light", name: "Light", credits: 50, price: 19000, flashCount: 50, proCount: 16, desc: "가볍게 시작", pricePerCredit: 380, discount: 0 },
  { id: "standard", name: "Standard", credits: 200, price: 49000, flashCount: 200, proCount: 66, desc: "소규모 셀러", pricePerCredit: 245, discount: 36 },
  { id: "plus", name: "Plus", credits: 500, price: 119000, flashCount: 500, proCount: 166, popular: true, desc: "가장 인기", pricePerCredit: 238, discount: 37 },
  { id: "mega", name: "Mega", credits: 1500, price: 349000, flashCount: 1500, proCount: 500, desc: "중대형 셀러", pricePerCredit: 233, discount: 39 },
  { id: "ultimate", name: "Ultimate", credits: 5000, price: 999000, flashCount: 5000, proCount: 1666, desc: "최대 할인", pricePerCredit: 200, discount: 47, best: true },
];

const SUBSCRIPTION_PLANS = [
  { id: 'free', name: 'Free', desc: '무료 체험', price: 0, credits: '5 크레딧 (1회)', features: [{ text: '웹 미리보기', included: true }, { text: 'Standard/Premium', included: true }, { text: '설치형 프로그램', included: false }, { text: '우선 처리', included: false }], buttonText: '무료로 시작', recommended: false },
  { id: 'starter', name: 'Starter', desc: '정기 구독', price: 29000, annualPrice: 23200, credits: '월 100 크레딧', features: [{ text: '웹 미리보기', included: true }, { text: 'Standard/Premium', included: true }, { text: '우선 처리', included: true }, { text: '설치형 프로그램', included: false }], buttonText: '구독 시작', recommended: true }
];

function loadTossPayments(clientKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).TossPayments) {
      resolve((window as any).TossPayments(clientKey));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.onload = () => resolve((window as any).TossPayments(clientKey));
    script.onerror = () => reject(new Error('토스페이먼츠 로드 실패'));
    document.head.appendChild(script);
  });
}

export default function Pricing() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [pricingMode, setPricingMode] = useState<'subscription' | 'credits'>('credits');
  const [isAnnual, setIsAnnual] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(2);
  const [subSlide, setSubSlide] = useState(1); // 구독 슬라이드용
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [webDetailOpen, setWebDetailOpen] = useState(false);
  const [desktopDetailOpen, setDesktopDetailOpen] = useState(false);

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price);
  
  // 크레딧 슬라이드
  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, CREDIT_PACKAGES.length - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));
  
  // 구독 슬라이드
  const nextSubSlide = () => setSubSlide((prev) => Math.min(prev + 1, SUBSCRIPTION_PLANS.length - 1));
  const prevSubSlide = () => setSubSlide((prev) => Math.max(prev - 1, 0));
  
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = (isSubscription?: boolean) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (isSubscription) {
      if (distance > 50) nextSubSlide();
      else if (distance < -50) prevSubSlide();
    } else {
      if (distance > 50) nextSlide();
      else if (distance < -50) prevSlide();
    }
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
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createResponse = await fetch(`${API_URL}/api/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, plan: planId, order_id: orderId }),
      });
      if (!createResponse.ok) throw new Error('결제 생성 실패');
      const configResponse = await fetch(`${API_URL}/api/payment/config`);
      const config = await configResponse.json();
      const tossPayments = await loadTossPayments(config.client_key);
      await tossPayments.requestPayment('카드', {
        amount: plan.price,
        orderId: orderId,
        orderName: `Autopic ${plan.name} - ${formatPrice(plan.credits)}크레딧`,
        customerName: user.name || user.email,
        successUrl: `${window.location.origin}/pricing/success?plan=${planId}`,
        failUrl: `${window.location.origin}/pricing/fail`,
      });
    } catch (error: any) {
      if (error.code !== 'USER_CANCEL') {
        toast.error(error.message || '결제 중 오류가 발생했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (plan: string) => {
    if (plan === 'free') {
      if (!isAuthenticated) {
        toast.error('로그인이 필요합니다');
        router.push('/login');
        return;
      }
      toast.success('회원가입 시 5크레딧이 지급됩니다!');
      return;
    }
    toast('구독 결제 기능은 준비 중입니다', { icon: '🚧' });
  };

  return (
    <section id="pricing" className="py-12 md:py-24 bg-zinc-50 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* 헤더 - 모바일 컴팩트 */}
        <div className="text-center mb-4 md:mb-12">
          <span className="inline-block px-3 py-1 rounded-full border border-zinc-200 text-[10px] font-bold uppercase tracking-widest bg-white mb-2 md:mb-4 text-zinc-500">Pricing</span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 md:mb-4">합리적인 요금제</h2>
          <p className="text-zinc-500 text-sm md:text-lg">브랜드 성장 단계에 맞춰 최적의 플랜을 선택하세요.</p>
        </div>

        {/* 탭 전환 */}
        <div className="flex justify-center mb-4 md:mb-10">
          <div className="bg-white p-1 rounded-xl border border-zinc-200 inline-flex shadow-sm">
            <button onClick={() => setPricingMode('credits')} className={`px-4 md:px-8 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${pricingMode === 'credits' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-black'}`}>
              <Coins size={14} /> 크레딧 충전
            </button>
            <button onClick={() => setPricingMode('subscription')} className={`px-4 md:px-8 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${pricingMode === 'subscription' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-black'}`}>
              <CreditCard size={14} /> 정기 구독
            </button>
          </div>
        </div>

        {pricingMode === 'credits' ? (
          <>
            {/* 설치형 프로그램 설명 - 모바일 초컴팩트 */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-3 md:p-6 mb-4 md:mb-12">
              {/* 모바일: 한 줄로 압축 */}
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Monitor size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">설치형 프로그램</span>
                        <span className="text-[8px] font-bold bg-[#87D039] text-black px-1 py-0.5 rounded">2배 가성비</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">1크레딧당 8장 (정물4 + 모델4)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDesktopDetailOpen(!desktopDetailOpen)}
                    className="text-[10px] text-zinc-400 flex items-center"
                  >
                    상세 <ChevronDown size={10} className={`transition-transform ${desktopDetailOpen ? 'rotate-180' : ''}`}/>
                  </button>
                </div>
                
                {/* 모바일 상세 기능 */}
                {desktopDetailOpen && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    <span className="flex items-center gap-1"><Zap size={8} className="text-yellow-500"/><span className="text-zinc-300">Standard 1C</span></span>
                    <span className="flex items-center gap-1"><Crown size={8} className="text-purple-500"/><span className="text-zinc-300">Premium 3C</span></span>
                  </div>
                )}
              </div>

              {/* PC: 기존 레이아웃 */}
              <div className="hidden md:flex flex-row items-center gap-8">
                <div className="flex items-center gap-3 border-r border-white/10 pr-8">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Monitor size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">설치형 프로그램</h4>
                      <span className="text-[9px] font-bold bg-[#87D039] text-black px-1.5 py-0.5 rounded">2배 가성비</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">대량 작업 및 자동화</p>
                  </div>
                </div>
                
                <div className="bg-[#87D039]/20 rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold text-[#87D039]">8장</div>
                  <div className="text-[10px] text-[#87D039]/80">1크레딧당 (정물4 + 모델4)</div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-white"><Zap size={14} className="text-yellow-500"/><span className="font-bold">Standard</span> <span className="text-zinc-400">1크레딧</span></span>
                  <span className="flex items-center gap-1 text-white"><Crown size={14} className="text-purple-500"/><span className="font-bold">Premium</span> <span className="text-zinc-400">3크레딧</span></span>
                </div>
                
                <button 
                  onClick={() => setDesktopDetailOpen(!desktopDetailOpen)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 ml-auto"
                >
                  상세 기능 <ChevronDown size={12} className={`transition-transform ${desktopDetailOpen ? 'rotate-180' : ''}`}/>
                </button>
              </div>
              
              {/* PC 상세 기능 */}
              {desktopDetailOpen && (
                <div className="hidden md:grid mt-4 pt-4 border-t border-white/10 grid-cols-6 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-[#87D039]" /><span className="text-zinc-300">정물+모델 동시 생성</span></div>
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-[#87D039]" /><span className="text-zinc-300">폴더 단위 대량 처리</span></div>
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-[#87D039]" /><span className="text-zinc-300">AI 상품 분석</span></div>
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-[#87D039]" /><span className="text-zinc-300">상품명 자동 정제</span></div>
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-[#87D039]" /><span className="text-zinc-300">SEO 자동 생성</span></div>
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-[#87D039]" /><span className="text-zinc-300">엑셀 자동 출력</span></div>
                </div>
              )}
            </div>

            {/* 크레딧 캐러셀 */}
            <div className="relative h-[420px] md:h-[520px] mb-4 md:mb-8" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => handleTouchEnd(false)}>
              <button onClick={prevSlide} disabled={currentSlide === 0} className={`hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-zinc-200 rounded-full items-center justify-center transition-all z-40 shadow-lg ${currentSlide === 0 ? 'opacity-30' : 'hover:scale-110'}`}><ChevronLeft size={24} /></button>
              <button onClick={nextSlide} disabled={currentSlide === CREDIT_PACKAGES.length - 1} className={`hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-zinc-200 rounded-full items-center justify-center transition-all z-40 shadow-lg ${currentSlide === CREDIT_PACKAGES.length - 1 ? 'opacity-30' : 'hover:scale-110'}`}><ChevronRight size={24} /></button>
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
                    <div key={idx} className="absolute w-[260px] md:w-[320px] transition-all duration-500 ease-out cursor-pointer" style={style} onClick={() => setCurrentSlide(idx)}>
                      <div className={`p-5 md:p-8 rounded-2xl md:rounded-3xl flex flex-col relative ${pack.popular && isCenter ? 'bg-zinc-900 text-white shadow-2xl' : isBest && isCenter ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-2xl' : isCenter ? 'bg-white border-2 border-zinc-900 shadow-2xl' : 'bg-white border border-zinc-200 shadow-lg'}`}>
                        {pack.discount > 0 && isCenter && !pack.popular && !isBest && (<div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">{pack.discount}% OFF</div>)}
                        {pack.popular && (<div className="flex justify-center mb-2"><span className="bg-[#87D039] text-black text-[10px] font-bold px-3 py-1 rounded-full">🔥 가장 인기</span></div>)}
                        {isBest && (<div className="flex justify-center mb-2"><span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full">💎 최고 가성비</span></div>)}
                        <div className="text-center mb-3 md:mb-4">
                          <h3 className="text-lg md:text-xl font-bold mb-1">{pack.name}</h3>
                          <p className={`text-xs ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>{pack.desc}</p>
                        </div>
                        <div className="text-center mb-3 md:mb-4">
                          <div className="text-2xl md:text-4xl font-bold mb-1">₩{formatPrice(pack.price)}</div>
                          <p className={`text-xs ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>{formatPrice(pack.credits)} 크레딧</p>
                          <p className={`text-[10px] mt-1 ${(pack.popular || isBest) && isCenter ? 'text-zinc-400' : 'text-zinc-400'}`}>크레딧당 ₩{pack.pricePerCredit}{pack.discount > 0 && (<span className={`ml-1 font-bold ${(pack.popular || isBest) && isCenter ? 'text-[#87D039]' : 'text-red-500'}`}>({pack.discount}% 할인)</span>)}</p>
                        </div>
                        <div className={`rounded-xl p-3 mb-3 md:mb-4 ${(pack.popular || isBest) && isCenter ? 'bg-white/10' : 'bg-zinc-50'}`}>
                          <div className="space-y-1.5 text-xs md:text-sm">
                            <div className="flex items-center justify-between"><span className={`flex items-center gap-1.5 ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}><Zap size={10} /> Standard</span><span className="font-bold">{formatPrice(pack.flashCount)}회</span></div>
                            <div className="flex items-center justify-between"><span className={`flex items-center gap-1.5 ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}><Crown size={10} /> Premium</span><span className="font-bold">{formatPrice(pack.proCount)}회</span></div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handlePayment(pack.id); }} disabled={isLoading && selectedPlan === pack.id} className={`w-full py-2.5 md:py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${pack.popular && isCenter ? 'bg-[#87D039] text-black hover:bg-[#9AE045]' : isBest && isCenter ? 'bg-yellow-400 text-black hover:bg-yellow-300' : isCenter ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>{isLoading && selectedPlan === pack.id ? '처리 중...' : '구매하기'}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-center text-xs text-zinc-400 mb-3 md:hidden">← 좌우로 스와이프하세요 →</p>
            <div className="flex justify-center gap-1.5 mb-6 md:mb-10">
              {CREDIT_PACKAGES.map((_, idx) => (<button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-zinc-900 w-6' : 'bg-zinc-300 w-1.5'}`} />))}
            </div>

            {/* 설치형 프로그램 다운로드 */}
            <div className="bg-zinc-900 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#87D039] rounded-lg flex items-center justify-center flex-shrink-0"><Monitor size={18} className="text-black" /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">크레딧 충전 후 설치형 프로그램 이용 가능</h4>
                  <p className="text-xs text-zinc-400 hidden md:block">대량 일괄 처리 · 상품명 정제 · SEO 자동 생성 · 엑셀 출력</p>
                </div>
              </div>
              <button onClick={() => router.push('/mypage/api-keys')} className="w-full md:w-auto whitespace-nowrap px-5 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-100 transition-colors">API 키 발급받기</button>
            </div>
          </>
        ) : (
          <>
            {/* 웹 버전 설명 - 모바일 초컴팩트 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-3 md:p-6 mb-4 md:mb-12">
              {/* 모바일 */}
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe size={16} className="text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">웹 버전</span>
                      <p className="text-[10px] text-blue-100">1크레딧당 4장 (정물 또는 모델)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setWebDetailOpen(!webDetailOpen)}
                    className="text-[10px] text-blue-100 flex items-center"
                  >
                    상세 <ChevronDown size={10} className={`transition-transform ${webDetailOpen ? 'rotate-180' : ''}`}/>
                  </button>
                </div>
                
                {webDetailOpen && (
                  <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    <span className="flex items-center gap-1"><Zap size={8} className="text-yellow-300"/><span className="text-blue-100">Standard 1C</span></span>
                    <span className="flex items-center gap-1"><Crown size={8} className="text-purple-300"/><span className="text-blue-100">Premium 3C</span></span>
                  </div>
                )}
              </div>

              {/* PC */}
              <div className="hidden md:flex flex-row items-center gap-8">
                <div className="flex items-center gap-3 border-r border-white/20 pr-8">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">웹 버전</h4>
                    <p className="text-[11px] text-blue-100">테스트 및 미리보기</p>
                  </div>
                </div>
                
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold text-white">4장</div>
                  <div className="text-[10px] text-blue-100">1크레딧당 (정물 또는 모델)</div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-white"><Zap size={14} className="text-yellow-300"/><span className="font-bold">Standard</span> <span className="text-blue-100">1크레딧</span></span>
                  <span className="flex items-center gap-1 text-white"><Crown size={14} className="text-purple-300"/><span className="font-bold">Premium</span> <span className="text-blue-100">3크레딧</span></span>
                </div>
                
                <button 
                  onClick={() => setWebDetailOpen(!webDetailOpen)}
                  className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 ml-auto"
                >
                  상세 기능 <ChevronDown size={12} className={`transition-transform ${webDetailOpen ? 'rotate-180' : ''}`}/>
                </button>
              </div>
              
              {webDetailOpen && (
                <div className="hidden md:grid mt-4 pt-4 border-t border-white/20 grid-cols-5 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-white" /><span className="text-blue-100">기본/화보 정물 이미지</span></div>
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-white" /><span className="text-blue-100">기본/화보 모델 이미지</span></div>
                  <div className="flex items-center gap-1.5"><Check size={10} className="text-white" /><span className="text-blue-100">Standard / Premium 모델</span></div>
                  <div className="flex items-center gap-1.5"><X size={10} className="text-blue-200/50" /><span className="text-blue-200/50">대량 일괄 처리</span></div>
                  <div className="flex items-center gap-1.5"><X size={10} className="text-blue-200/50" /><span className="text-blue-200/50">SEO 자동 생성</span></div>
                </div>
              )}
            </div>

            {/* 월간/연간 토글 */}
            <div className="flex items-center justify-center gap-3 mb-4 md:mb-10">
              <span className={`text-xs font-medium ${!isAnnual ? 'text-zinc-900' : 'text-zinc-400'}`}>월간</span>
              <button onClick={() => setIsAnnual(!isAnnual)} className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isAnnual ? 'bg-[#87D039]' : 'bg-zinc-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
              <span className={`text-xs font-medium flex items-center gap-1.5 ${isAnnual ? 'text-zinc-900' : 'text-zinc-400'}`}>연간 <span className="text-[#87D039] text-[10px] font-bold">20% 할인</span></span>
            </div>

            {/* 모바일: 슬라이드 형태 - 수정된 버전 */}
            <div className="md:hidden relative h-[380px] mb-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => handleTouchEnd(true)}>
              <div className="absolute inset-0 flex items-center justify-center">
                {SUBSCRIPTION_PLANS.map((plan, idx) => {
                  const diff = idx - subSlide;
                  let style: React.CSSProperties;
                  if (diff === 0) {
                    style = { transform: 'translateX(0) scale(1)', opacity: 1, zIndex: 30 };
                  } else if (diff === -1) {
                    style = { transform: 'translateX(-70%) scale(0.85)', opacity: 0.5, zIndex: 20 };
                  } else if (diff === 1) {
                    style = { transform: 'translateX(70%) scale(0.85)', opacity: 0.5, zIndex: 20 };
                  } else {
                    style = { transform: 'translateX(0) scale(0.5)', opacity: 0, zIndex: 0 };
                  }
                  const isCenter = idx === subSlide;
                  const displayPrice = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
                  
                  return (
                    <div key={plan.id} className="absolute w-[260px] transition-all duration-500 ease-out cursor-pointer" style={style} onClick={() => setSubSlide(idx)}>
                      <div className={`p-5 rounded-2xl flex flex-col relative ${plan.recommended && isCenter ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-2xl' : isCenter ? 'bg-white border-2 border-zinc-900 shadow-2xl' : 'bg-white border border-zinc-200 shadow-lg'}`}>
                        {plan.recommended && isCenter && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-[#87D039] text-black text-[10px] font-bold px-4 py-1 rounded-full">추천</span></div>}
                        <div className="text-center mb-3 mt-2">
                          <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                          <p className={`text-xs ${plan.recommended && isCenter ? 'text-blue-100' : 'text-zinc-500'}`}>{plan.desc}</p>
                        </div>
                        <div className="text-center mb-3">
                          <div className="text-2xl font-bold mb-1">₩{formatPrice(displayPrice)}{displayPrice > 0 && <span className={`text-sm font-normal ${plan.recommended && isCenter ? 'text-blue-100' : 'text-zinc-400'}`}>/월</span>}</div>
                          <p className={`text-xs ${plan.recommended && isCenter ? 'text-blue-100' : 'text-zinc-500'}`}>{plan.credits}</p>
                          {isAnnual && displayPrice > 0 && <p className="text-[10px] text-[#87D039] mt-1">연간 결제 시 20% 할인</p>}
                        </div>
                        <div className={`rounded-xl p-3 mb-3 flex-1 ${plan.recommended && isCenter ? 'bg-white/10' : 'bg-zinc-50'}`}>
                          <div className="space-y-1.5 text-xs">
                            {plan.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-2">
                                {f.included ? <Check size={12} className="text-[#87D039]" /> : <X size={12} className={plan.recommended && isCenter ? 'text-blue-200/50' : 'text-zinc-300'} />}
                                <span className={f.included ? (plan.recommended && isCenter ? 'text-white' : 'text-zinc-700') : (plan.recommended && isCenter ? 'text-blue-200/50' : 'text-zinc-400')}>{f.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleSubscribe(plan.id); }} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${plan.recommended && isCenter ? 'bg-white text-blue-600 hover:bg-blue-50' : isCenter ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>{plan.buttonText}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-center text-xs text-zinc-400 mb-3 md:hidden">← 좌우로 스와이프하세요 →</p>
            {/* 모바일 인디케이터 */}
            <div className="flex justify-center gap-1.5 mb-6 md:hidden">
              {SUBSCRIPTION_PLANS.map((_, idx) => (<button key={idx} onClick={() => setSubSlide(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${subSlide === idx ? 'bg-zinc-900 w-6' : 'bg-zinc-300 w-1.5'}`} />))}
            </div>

            {/* PC: 2카드 그리드 */}
            <div className="hidden md:grid grid-cols-2 gap-6 max-w-[700px] mx-auto mb-8 md:mb-10">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const displayPrice = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
                return (
                  <div key={plan.id} className={`p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col relative ${plan.recommended ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-2xl' : 'bg-white border-2 border-zinc-200 shadow-lg hover:border-zinc-400 transition-all'}`}>
                    {plan.recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-[#87D039] text-black text-[10px] font-bold px-4 py-1 rounded-full">추천</span></div>}
                    <div className="text-center mb-4 md:mb-6 mt-2">
                      <h3 className="text-lg md:text-xl font-bold mb-1">{plan.name}</h3>
                      <p className={`text-xs md:text-sm ${plan.recommended ? 'text-blue-100' : 'text-zinc-500'}`}>{plan.desc}</p>
                    </div>
                    <div className="text-center mb-4 md:mb-6">
                      <div className="text-3xl md:text-4xl font-bold mb-1">₩{formatPrice(displayPrice)}{displayPrice > 0 && <span className={`text-sm md:text-base font-normal ${plan.recommended ? 'text-blue-100' : 'text-zinc-400'}`}>/월</span>}</div>
                      <p className={`text-xs md:text-sm ${plan.recommended ? 'text-blue-100' : 'text-zinc-500'}`}>{plan.credits}</p>
                      {isAnnual && displayPrice > 0 && <p className="text-[10px] text-[#87D039] mt-1">연간 결제 시 20% 할인</p>}
                    </div>
                    <div className={`rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex-1 ${plan.recommended ? 'bg-white/10' : 'bg-zinc-50'}`}>
                      <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                        {plan.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {f.included ? <Check size={12} className="text-[#87D039]" /> : <X size={12} className={plan.recommended ? 'text-blue-200/50' : 'text-zinc-300'} />}
                            <span className={f.included ? (plan.recommended ? 'text-white' : 'text-zinc-700') : (plan.recommended ? 'text-blue-200/50' : 'text-zinc-400')}>{f.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleSubscribe(plan.id)} className={`w-full py-3 md:py-3.5 rounded-xl font-bold text-sm transition-all ${plan.recommended ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>{plan.buttonText}</button>
                  </div>
                );
              })}
            </div>
            <div className="text-center"><p className="text-xs md:text-sm text-zinc-500">대량 작업이 필요하신가요?{' '}<button onClick={() => setPricingMode('credits')} className="text-[#87D039] font-bold hover:underline">크레딧 충전 →</button></p></div>
          </>
        )}

        {/* Enterprise */}
        <div className="mt-6 md:mt-10 bg-white rounded-xl border border-zinc-200 p-4 md:p-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-base md:text-xl font-bold mb-1">Enterprise</h3>
            <p className="text-zinc-500 text-xs md:text-sm">월 1,000건 이상 대량 처리가 필요한 기업을 위한 맞춤 플랜</p>
          </div>
          <button onClick={() => toast('문의 기능은 준비 중입니다', { icon: '📧' })} className="w-full md:w-auto whitespace-nowrap px-5 py-2.5 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-colors">문의하기</button>
        </div>
      </div>
    </section>
  );
}
