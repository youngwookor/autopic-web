'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Coins, Check, X, Zap, Crown, Monitor, Globe, ChevronLeft, ChevronRight, ChevronDown, AlertCircle, Sparkles, Gift } from 'lucide-react';
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
  { 
    id: 'free', 
    name: 'Free', 
    desc: '무료 체험', 
    price: 0, 
    annualPrice: 0,
    credits: '5 크레딧 (1회)', 
    monthlyCredits: 5,
    features: [
      { text: '웹 스튜디오', included: true }, 
      { text: 'Standard/Premium', included: true }, 
      { text: '설치형 프로그램', included: false }, 
      { text: '우선 처리', included: false }
    ], 
    buttonText: '무료로 시작', 
    popular: false,
    best: false
  },
  { 
    id: 'starter', 
    name: 'Starter', 
    desc: '가장 인기', 
    price: 29000, 
    annualPrice: 24650,
    credits: '월 100 크레딧', 
    monthlyCredits: 100,
    features: [
      { text: '웹 스튜디오', included: true }, 
      { text: 'Standard/Premium', included: true }, 
      { text: '우선 처리', included: true }, 
      { text: '설치형 프로그램', included: false }
    ], 
    buttonText: '구독 시작', 
    popular: true,
    best: false
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    desc: '전문 셀러용', 
    price: 79000, 
    annualPrice: 67150,
    credits: '월 300 크레딧', 
    monthlyCredits: 300,
    features: [
      { text: '웹 스튜디오', included: true }, 
      { text: 'Standard/Premium', included: true }, 
      { text: '우선 처리', included: true }, 
      { text: '설치형 프로그램', included: false }
    ], 
    buttonText: '구독 시작', 
    popular: false,
    best: true
  }
];

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

// 나이스페이 SDK 로드
function loadNicepaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.AUTHNICE) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src="https://pay.nicepay.co.kr/v1/js/"]');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.AUTHNICE) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.AUTHNICE) {
          reject(new Error('나이스페이 SDK 로드 타임아웃'));
        }
      }, 5000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.nicepay.co.kr/v1/js/';
    script.async = true;
    
    script.onload = () => {
      const checkInterval = setInterval(() => {
        if (window.AUTHNICE) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      
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

export default function Pricing() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [pricingMode, setPricingMode] = useState<'subscription' | 'credits'>('credits');
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(2);
  const [subSlide, setSubSlide] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [webDetailOpen, setWebDetailOpen] = useState(false);
  const [desktopDetailOpen, setDesktopDetailOpen] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  
  // 구독 결제 확인 모달 상태
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<typeof SUBSCRIPTION_PLANS[0] | null>(null);
  
  // 크레딧 결제 확인 모달 상태
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingCreditPlan, setPendingCreditPlan] = useState<typeof CREDIT_PACKAGES[0] | null>(null);

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price);
  
  // 나이스페이 SDK 미리 로드
  useEffect(() => {
    loadNicepaySDK()
      .then(() => {
        setSdkReady(true);
      })
      .catch((err) => {
        console.error('나이스페이 SDK 로드 실패:', err);
      });
  }, []);
  
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

  // 크레딧 충전 버튼 클릭 → 확인 모달 표시
  const handleCreditClick = (planId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }
    
    const plan = CREDIT_PACKAGES.find(p => p.id === planId);
    if (!plan) return;
    
    // 확인 모달 표시
    setPendingCreditPlan(plan);
    setShowCreditModal(true);
  };

  // 크레딧 결제 진행
  const handleConfirmCreditPayment = async () => {
    if (!pendingCreditPlan || !user) return;
    
    setShowCreditModal(false);
    setIsLoading(true);
    setSelectedPlan(pendingCreditPlan.id);
    
    try {
      if (!window.AUTHNICE) {
        await loadNicepaySDK();
      }

      if (!window.AUTHNICE) {
        throw new Error('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침 해주세요.');
      }
      
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createResponse = await fetch(`${API_URL}/api/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, plan: pendingCreditPlan.id, order_id: orderId }),
      });
      
      if (!createResponse.ok) throw new Error('결제 생성 실패');
      
      const configResponse = await fetch(`${API_URL}/api/nicepay/config`);
      const config = await configResponse.json();
      
      const returnUrl = `${window.location.origin}/api/nicepay`;
      
      window.AUTHNICE.requestPay({
        clientId: config.client_id,
        method: 'card',
        orderId: orderId,
        amount: pendingCreditPlan.price,
        goodsName: `Autopic ${pendingCreditPlan.name} - ${formatPrice(pendingCreditPlan.credits)}크레딧`,
        returnUrl: returnUrl,
        mallReserved: JSON.stringify({ plan: pendingCreditPlan.id, userId: user.id }),
        fnError: (result) => {
          if (!result.errorMsg?.includes('취소') && !result.msg?.includes('취소')) {
            toast.error(result.msg || result.errorMsg || '결제 중 오류가 발생했습니다');
          }
          setIsLoading(false);
          setSelectedPlan(null);
        },
      });
      
    } catch (error: any) {
      toast.error(error.message || '결제 중 오류가 발생했습니다');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  // 구독 버튼 클릭 → 확인 모달 표시
  const handleSubscribeClick = (planId: string) => {
    if (planId === 'free') {
      if (!isAuthenticated) {
        toast.success('회원가입하고 무료 5크레딧을 받으세요!');
        router.push('/register');
        return;
      }
      toast.success('스튜디오에서 이미지를 생성해보세요!');
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || !plan.price) {
      toast.error('플랜 정보를 찾을 수 없습니다');
      return;
    }

    setPendingPlan(plan);
    setShowPaymentModal(true);
  };

  // 구독 결제 진행
  const handleConfirmPayment = async () => {
    if (!pendingPlan || !user) return;

    setShowPaymentModal(false);
    setIsLoading(true);
    setSelectedPlan(pendingPlan.id);

    try {
      if (!window.AUTHNICE) {
        await loadNicepaySDK();
      }

      if (!window.AUTHNICE) {
        throw new Error('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침 해주세요.');
      }

      const configResponse = await fetch(`${API_URL}/api/nicepay/billing/config`);
      if (!configResponse.ok) {
        throw new Error('결제 설정을 가져올 수 없습니다');
      }
      const config = await configResponse.json();

      let amount: number;
      let goodsName: string;
      
      if (isAnnual) {
        amount = (pendingPlan.annualPrice || pendingPlan.price) * 12;
        goodsName = `Autopic ${pendingPlan.name} 구독 (연간)`;
      } else {
        amount = pendingPlan.price;
        goodsName = `Autopic ${pendingPlan.name} 구독 (월간)`;
      }
      
      const orderId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const returnUrl = `${window.location.origin}/api/nicepay-billing`;

      window.AUTHNICE.requestPay({
        clientId: config.client_id,
        method: 'card',
        orderId: orderId,
        amount: amount,
        goodsName: goodsName,
        returnUrl: returnUrl,
        mallReserved: JSON.stringify({ 
          plan: pendingPlan.id, 
          userId: user.id, 
          isAnnual: isAnnual 
        }),
        fnError: (result) => {
          if (!result.errorMsg?.includes('취소') && !result.msg?.includes('취소')) {
            toast.error(result.msg || result.errorMsg || '결제 중 오류가 발생했습니다');
          }
          setIsLoading(false);
          setSelectedPlan(null);
        },
      });

    } catch (error: any) {
      toast.error(error.message || '결제 중 오류가 발생했습니다');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  // 크레딧 결제 확인 모달 컴포넌트
  const CreditPaymentModal = () => {
    if (!showCreditModal || !pendingCreditPlan) return null;

    const pack = pendingCreditPlan;
    const isBest = (pack as any).best;
    const isPopular = pack.popular;
    
    // 테마 색상 결정
    let themeColor = 'blue';
    let bgGradient = 'from-blue-600 to-blue-700';
    let iconBg = 'bg-blue-100';
    let iconColor = 'text-blue-600';
    let accentColor = 'text-blue-600';
    let buttonBg = 'bg-blue-600 hover:bg-blue-700';
    
    if (isPopular) {
      themeColor = 'green';
      bgGradient = 'from-zinc-800 to-zinc-900';
      iconBg = 'bg-[#87D039]/20';
      iconColor = 'text-[#87D039]';
      accentColor = 'text-[#87D039]';
      buttonBg = 'bg-[#87D039] hover:bg-[#9AE045] text-black';
    } else if (isBest) {
      themeColor = 'purple';
      bgGradient = 'from-purple-600 to-purple-700';
      iconBg = 'bg-purple-100';
      iconColor = 'text-purple-600';
      accentColor = 'text-purple-600';
      buttonBg = 'bg-purple-600 hover:bg-purple-700';
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
          {/* 헤더 - 테마 컬러 */}
          <div className={`bg-gradient-to-r ${bgGradient} p-5 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isPopular && <span className="text-[10px] font-bold bg-[#87D039] text-black px-2 py-0.5 rounded-full">🔥 가장 인기</span>}
                  {isBest && <span className="text-[10px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">💎 최고 가성비</span>}
                </div>
                <h3 className="text-xl font-bold">{pack.name} 패키지</h3>
                <p className="text-sm opacity-80">{pack.desc}</p>
              </div>
              <div className={`w-12 h-12 ${isPopular ? 'bg-white/20' : 'bg-white/20'} rounded-xl flex items-center justify-center`}>
                <Coins size={24} />
              </div>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-5">
            {/* 크레딧 정보 */}
            <div className="bg-zinc-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-500 text-sm">충전 크레딧</span>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className={accentColor} />
                  <span className="text-2xl font-bold">{formatPrice(pack.credits)}</span>
                  <span className="text-zinc-400 text-sm">크레딧</span>
                </div>
              </div>
              
              <div className="border-t border-zinc-200 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Zap size={14} className="text-yellow-500" /> Standard 이미지
                  </span>
                  <span className="font-bold">{formatPrice(pack.flashCount)}회</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Crown size={14} className="text-purple-500" /> Premium 이미지
                  </span>
                  <span className="font-bold">{formatPrice(pack.proCount)}회</span>
                </div>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="bg-zinc-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500 text-sm">크레딧당 가격</span>
                <div className="text-right">
                  <span className="font-bold">₩{pack.pricePerCredit}</span>
                  {pack.discount > 0 && (
                    <span className={`ml-1.5 text-xs font-bold ${accentColor}`}>({pack.discount}% 할인)</span>
                  )}
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-3 flex items-center justify-between">
                <span className="text-zinc-500">총 결제 금액</span>
                <span className={`text-2xl font-bold ${accentColor}`}>₩{formatPrice(pack.price)}</span>
              </div>
            </div>

            {/* 안내 사항 */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5">
              <div className="flex gap-2">
                <Gift size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-green-700">
                  <p className="font-bold mb-1">크레딧 영구 보관</p>
                  <p>충전된 크레딧은 만료 없이 영구 보관됩니다. 필요할 때 편하게 사용하세요!</p>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmCreditPayment}
                className={`flex-1 py-3 rounded-xl font-bold text-white ${buttonBg} transition-colors`}
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 구독 결제 확인 모달 컴포넌트
  const PaymentConfirmModal = () => {
    if (!showPaymentModal || !pendingPlan) return null;

    const monthlyPrice = isAnnual ? (pendingPlan.annualPrice || pendingPlan.price) : pendingPlan.price;
    const totalAmount = isAnnual ? monthlyPrice * 12 : monthlyPrice;
    const billingCycle = isAnnual ? '연간' : '월간';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold">결제 정보 확인</h3>
          </div>

          {/* 결제 정보 */}
          <div className="bg-zinc-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">플랜</span>
              <span className="font-bold">{pendingPlan.name} ({billingCycle})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">월 크레딧</span>
              <span className="font-bold">{pendingPlan.monthlyCredits} 크레딧</span>
            </div>
            <div className="border-t border-zinc-200 pt-3">
              {isAnnual ? (
                <>
                  <div className="flex justify-between items-center text-sm text-zinc-500 mb-1">
                    <span>월 환산 금액</span>
                    <span>₩{formatPrice(monthlyPrice)}/월</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">총 결제 금액</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-blue-600">₩{formatPrice(totalAmount)}</span>
                      <div className="text-xs text-green-600 font-medium">15% 할인 적용</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">결제 금액</span>
                  <span className="text-xl font-bold text-blue-600">₩{formatPrice(totalAmount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">결제 주기</span>
              <span className="font-medium">{isAnnual ? '1년 단위 자동 갱신' : '매월 자동 결제'}</span>
            </div>
          </div>

          {/* 안내 사항 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <div className="flex gap-2">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-bold mb-1">월간 리셋형 구독</p>
                <p>크레딧은 매월 새로 지급되며, 미사용분은 다음 달로 이월되지 않습니다.</p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 py-3 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirmPayment}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              결제 진행
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 통일된 카드 크기
  const CARD_HEIGHT = "h-[380px] md:h-[420px]";
  const CARD_WIDTH = "w-[260px] md:w-[300px]";
  const CAROUSEL_HEIGHT = "h-[440px] md:h-[480px]";

  // 크레딧 카드 렌더링 함수
  const renderCreditCard = (pack: typeof CREDIT_PACKAGES[0], idx: number, isCenter: boolean) => {
    const isBest = (pack as any).best;
    return (
      <div className={`${CARD_HEIGHT} p-5 md:p-6 rounded-2xl md:rounded-3xl flex flex-col relative ${pack.popular && isCenter ? 'bg-zinc-900 text-white shadow-2xl' : isBest && isCenter ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-2xl' : isCenter ? 'bg-white border-2 border-zinc-900 shadow-2xl' : 'bg-white border border-zinc-200 shadow-lg'}`}>
        {pack.discount > 0 && isCenter && !pack.popular && !isBest && (<div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">{pack.discount}% OFF</div>)}
        {pack.popular && (<div className="flex justify-center mb-2"><span className="bg-[#87D039] text-black text-[10px] font-bold px-3 py-1 rounded-full">🔥 가장 인기</span></div>)}
        {isBest && (<div className="flex justify-center mb-2"><span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full">💎 최고 가성비</span></div>)}
        <div className="text-center mb-3">
          <h3 className="text-lg md:text-xl font-bold mb-1">{pack.name}</h3>
          <p className={`text-xs ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>{pack.desc}</p>
        </div>
        <div className="text-center mb-3">
          <div className="text-2xl md:text-3xl font-bold mb-1">₩{formatPrice(pack.price)}</div>
          <p className={`text-xs ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>{formatPrice(pack.credits)} 크레딧</p>
          <p className={`text-[10px] mt-1 ${(pack.popular || isBest) && isCenter ? 'text-zinc-400' : 'text-zinc-400'}`}>크레딧당 ₩{pack.pricePerCredit}{pack.discount > 0 && (<span className={`ml-1 font-bold ${(pack.popular || isBest) && isCenter ? 'text-[#87D039]' : 'text-red-500'}`}>({pack.discount}% 할인)</span>)}</p>
        </div>
        <div className={`rounded-xl p-3 mb-3 flex-1 ${(pack.popular || isBest) && isCenter ? 'bg-white/10' : 'bg-zinc-50'}`}>
          <div className="space-y-2 text-xs md:text-sm">
            <div className="flex items-center justify-between"><span className={`flex items-center gap-1.5 ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}><Zap size={12} /> Standard</span><span className="font-bold">{formatPrice(pack.flashCount)}회</span></div>
            <div className="flex items-center justify-between"><span className={`flex items-center gap-1.5 ${(pack.popular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}><Crown size={12} /> Premium</span><span className="font-bold">{formatPrice(pack.proCount)}회</span></div>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); handleCreditClick(pack.id); }} disabled={isLoading && selectedPlan === pack.id} className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 mt-auto ${pack.popular && isCenter ? 'bg-[#87D039] text-black hover:bg-[#9AE045]' : isBest && isCenter ? 'bg-yellow-400 text-black hover:bg-yellow-300' : isCenter ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>{isLoading && selectedPlan === pack.id ? '처리 중...' : '구매하기'}</button>
      </div>
    );
  };

  // 구독 카드 렌더링 함수
  const renderSubscriptionCard = (plan: typeof SUBSCRIPTION_PLANS[0], idx: number, isCenter: boolean) => {
    const displayPrice = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
    const isBest = plan.best;
    const isPopular = plan.popular;
    
    return (
      <div className={`${CARD_HEIGHT} p-5 md:p-6 rounded-2xl md:rounded-3xl flex flex-col relative ${isPopular && isCenter ? 'bg-zinc-900 text-white shadow-2xl' : isBest && isCenter ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-2xl' : isCenter ? 'bg-white border-2 border-zinc-900 shadow-2xl' : 'bg-white border border-zinc-200 shadow-lg'}`}>
        {isPopular && (<div className="flex justify-center mb-2"><span className="bg-[#87D039] text-black text-[10px] font-bold px-3 py-1 rounded-full">🔥 가장 인기</span></div>)}
        {isBest && (<div className="flex justify-center mb-2"><span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full">💎 전문 셀러 추천</span></div>)}
        <div className="text-center mb-3">
          <h3 className="text-lg md:text-xl font-bold mb-1">{plan.name}</h3>
          <p className={`text-xs ${(isPopular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>{plan.desc}</p>
        </div>
        <div className="text-center mb-3">
          <div className="text-2xl md:text-3xl font-bold mb-1">
            {displayPrice > 0 ? `₩${formatPrice(displayPrice)}` : '₩0'}
            {displayPrice > 0 && <span className={`text-sm font-normal ${(isPopular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-400'}`}>/월</span>}
          </div>
          <p className={`text-xs ${(isPopular || isBest) && isCenter ? 'text-zinc-300' : 'text-zinc-500'}`}>{plan.credits}</p>
          {isAnnual && displayPrice > 0 && <p className="text-[10px] text-[#87D039] mt-1 font-bold">연간 결제 시 15% 할인</p>}
        </div>
        <div className={`rounded-xl p-3 mb-3 flex-1 ${(isPopular || isBest) && isCenter ? 'bg-white/10' : 'bg-zinc-50'}`}>
          <div className="space-y-2 text-xs md:text-sm">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                {f.included ? <Check size={14} className="text-[#87D039]" /> : <X size={14} className={(isPopular || isBest) && isCenter ? 'text-zinc-500' : 'text-zinc-300'} />}
                <span className={f.included ? ((isPopular || isBest) && isCenter ? 'text-white' : 'text-zinc-700') : ((isPopular || isBest) && isCenter ? 'text-zinc-500' : 'text-zinc-400')}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSubscribeClick(plan.id); }} 
          disabled={isLoading && selectedPlan === plan.id} 
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 mt-auto ${isPopular && isCenter ? 'bg-[#87D039] text-black hover:bg-[#9AE045]' : isBest && isCenter ? 'bg-yellow-400 text-black hover:bg-yellow-300' : isCenter ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
        >
          {isLoading && selectedPlan === plan.id ? '처리 중...' : plan.buttonText}
        </button>
      </div>
    );
  };

  return (
    <section id="pricing" className="py-12 md:py-24 bg-zinc-50 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* 헤더 */}
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
            {/* 설치형 프로그램 설명 */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-3 md:p-6 mb-4 md:mb-12">
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
                  <button onClick={() => setDesktopDetailOpen(!desktopDetailOpen)} className="text-[10px] text-zinc-400 flex items-center">
                    상세 <ChevronDown size={10} className={`transition-transform ${desktopDetailOpen ? 'rotate-180' : ''}`}/>
                  </button>
                </div>
                {desktopDetailOpen && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    <span className="flex items-center gap-1"><Zap size={8} className="text-yellow-500"/><span className="text-zinc-300">Standard 1C</span></span>
                    <span className="flex items-center gap-1"><Crown size={8} className="text-purple-500"/><span className="text-zinc-300">Premium 3C</span></span>
                  </div>
                )}
              </div>
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
                <button onClick={() => setDesktopDetailOpen(!desktopDetailOpen)} className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 ml-auto">
                  상세 기능 <ChevronDown size={12} className={`transition-transform ${desktopDetailOpen ? 'rotate-180' : ''}`}/>
                </button>
              </div>
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
            <div className={`relative ${CAROUSEL_HEIGHT} mb-4 md:mb-8`} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => handleTouchEnd(false)}>
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
                  return (
                    <div key={idx} className={`absolute ${CARD_WIDTH} transition-all duration-500 ease-out cursor-pointer`} style={style} onClick={() => setCurrentSlide(idx)}>
                      {renderCreditCard(pack, idx, isCenter)}
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
            {/* 웹 버전 설명 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-3 md:p-6 mb-4 md:mb-12">
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
                  <button onClick={() => setWebDetailOpen(!webDetailOpen)} className="text-[10px] text-blue-100 flex items-center">
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
                <button onClick={() => setWebDetailOpen(!webDetailOpen)} className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 ml-auto">
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
              <span className={`text-xs font-medium flex items-center gap-1.5 ${isAnnual ? 'text-zinc-900' : 'text-zinc-400'}`}>연간 <span className="text-[#87D039] text-[10px] font-bold">15% 할인</span></span>
            </div>

            {/* 구독 캐러셀 */}
            <div className={`relative ${CAROUSEL_HEIGHT} mb-4 md:mb-8`} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => handleTouchEnd(true)}>
              <button onClick={prevSubSlide} disabled={subSlide === 0} className={`hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-zinc-200 rounded-full items-center justify-center transition-all z-40 shadow-lg ${subSlide === 0 ? 'opacity-30' : 'hover:scale-110'}`}><ChevronLeft size={24} /></button>
              <button onClick={nextSubSlide} disabled={subSlide === SUBSCRIPTION_PLANS.length - 1} className={`hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-zinc-200 rounded-full items-center justify-center transition-all z-40 shadow-lg ${subSlide === SUBSCRIPTION_PLANS.length - 1 ? 'opacity-30' : 'hover:scale-110'}`}><ChevronRight size={24} /></button>
              <div className="absolute inset-0 flex items-center justify-center">
                {SUBSCRIPTION_PLANS.map((plan, idx) => {
                  const diff = idx - subSlide;
                  let style: React.CSSProperties;
                  if (diff === 0) style = { transform: 'translateX(0) scale(1)', opacity: 1, zIndex: 30 };
                  else if (diff === -1) style = { transform: 'translateX(-70%) scale(0.85)', opacity: 0.5, zIndex: 20 };
                  else if (diff === 1) style = { transform: 'translateX(70%) scale(0.85)', opacity: 0.5, zIndex: 20 };
                  else if (diff === -2) style = { transform: 'translateX(-130%) scale(0.7)', opacity: 0, zIndex: 10 };
                  else if (diff === 2) style = { transform: 'translateX(130%) scale(0.7)', opacity: 0, zIndex: 10 };
                  else style = { transform: 'translateX(0) scale(0.5)', opacity: 0, zIndex: 0 };
                  const isCenter = idx === subSlide;
                  return (
                    <div key={plan.id} className={`absolute ${CARD_WIDTH} transition-all duration-500 ease-out cursor-pointer`} style={style} onClick={() => setSubSlide(idx)}>
                      {renderSubscriptionCard(plan, idx, isCenter)}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-center text-xs text-zinc-400 mb-3 md:hidden">← 좌우로 스와이프하세요 →</p>
            <div className="flex justify-center gap-1.5 mb-6 md:mb-10">
              {SUBSCRIPTION_PLANS.map((_, idx) => (<button key={idx} onClick={() => setSubSlide(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${subSlide === idx ? 'bg-zinc-900 w-6' : 'bg-zinc-300 w-1.5'}`} />))}
            </div>

            {/* 구독 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6 mb-6">
              <h4 className="font-bold text-blue-800 mb-3 text-center">📋 월간 리셋형 구독 안내</h4>
              <div className="grid md:grid-cols-3 gap-3 text-xs md:text-sm">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700">매월 크레딧이 새로 지급됩니다 (누적 X)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700">언제든 구독 취소 가능</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700">취소 시 남은 기간까지 이용 가능</span>
                </div>
              </div>
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

      {/* 크레딧 결제 확인 모달 */}
      <CreditPaymentModal />
      
      {/* 구독 결제 확인 모달 */}
      <PaymentConfirmModal />
    </section>
  );
}
