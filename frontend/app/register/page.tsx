'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/useAnalytics';
import { signUp, signInWithGoogle, signInWithKakao } from '@/lib/supabase';
import { Loader2, X, Check, ChevronRight, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Google 아이콘
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Kakao 아이콘
const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#000000" d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.64-.15.54-.97 3.48-1 3.64 0 .1.04.2.12.26.08.06.18.08.28.04.36-.1 4.18-2.74 4.7-3.08.42.06.84.1 1.26.1 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
  </svg>
);

// 약관 내용
const TERMS_OF_SERVICE = `
제1조 (목적)
본 약관은 오토픽(AUTOPIC)(이하 "회사")이 운영하는 웹사이트 및 애플리케이션을 통해 제공하는 AI 상품 이미지 생성 서비스 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

제2조 (요금 및 결제 방식)
1. 요금 체계: 서비스는 크레딧 충전형과 정기 구독형(월간/연간)으로 구성됩니다. 사이트에 표기된 모든 금액은 부가세(VAT)가 포함된 최종 결제 금액입니다.
2. 크레딧 충전 플랜:
   - Light: 19,000원 (50 크레딧)
   - Standard: 49,000원 (200 크레딧)
   - Plus: 119,000원 (500 크레딧)
   - Mega: 349,000원 (1,500 크레딧)
   - Ultimate: 999,000원 (5,000 크레딧)
3. 정기 구독 플랜: 매월 정해진 크레딧이 지급되며, 연간 플랜 결제 시 월간 플랜 대비 할인된 가격이 적용됩니다.
4. 결제 제한: 충전형 상품의 특성상 카드사의 정책에 따라 결제 한도가 제한될 수 있으며, 하나카드 등 일부 카드사는 결제가 불가할 수 있습니다.
5. 결제 수단: 신용카드 및 카카오페이, 네이버페이, 페이코, 토스페이에 한해 이용이 가능하며, 그 외의 간편결제 수단은 카드사 및 PG사 정책에 따라 이용이 제한됩니다.

제3조 (크레딧 사용 및 유효기간)
1. 사용 용도: 충전된 크레딧은 서비스 내에서 AI 모델을 이용한 이미지 생성 권한을 획득하는 데 사용됩니다.
   - Standard 모델: 1회 생성 시 1 크레딧 소진
   - Premium 모델: 1회 생성 시 3 크레딧 소진
2. 유효기간: 충전된 크레딧의 이용 기간 및 환불 가능 기간은 결제 시점으로부터 1년(12개월)입니다. 기간이 경과한 크레딧은 소멸되며 환불이 불가합니다.
3. 양도 금지: 사용자가 보유한 크레딧은 타인에게 양도, 판매, 대여할 수 없으며 계정 간 이동도 불가능합니다.

제4조 (저작권 및 상업적 이용)
1. 권리 귀속: 서비스를 통해 생성된 모든 이미지의 저작권 및 소유권은 생성한 이용자에게 귀속됩니다.
2. 상업적 활용: 이용자는 생성된 이미지를 쇼핑몰 홍보, 광고 등 상업적 용도로 제한 없이 사용할 수 있습니다.
3. 회사 활용: 회사는 서비스 홍보 및 AI 품질 개선을 위해 익명화된 생성물을 활용할 수 있습니다.

제5조 (청약철회 및 환불 정책)
1. 전액 환불: 결제 후 7일 이내에 크레딧을 전혀 사용하지 않은 경우에 한하여 전액 환불이 가능합니다.
2. 환불 방법: 환불은 반드시 결제가 이루어졌던 원결제 수단(카드 취소 등)으로 진행됩니다. 시스템상 원결제 취소가 불가능한 부득이한 경우에 한해 별도 정산 후 계좌 입금 처리됩니다.
3. 환불 불가: 디지털 콘텐츠 특성상 1회라도 크레딧을 사용하여 이미지를 생성한 경우 변심에 의한 환불은 불가능합니다.
4. 시스템 오류: 회사의 귀책 사유로 생성에 실패하고 크레딧만 차감된 경우, 해당 크레딧은 즉시 복구해 드립니다.

제6조 (면책 조항)
1. 회사는 AI 기술의 특성상 생성 결과의 완벽성이나 이용자의 주관적 기대치 부합 여부를 보장하지 않으며, 이로 인한 환불은 불가합니다.
2. 천재지변, 외부 서비스의 장애로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.

부칙
이 약관은 2025년 1월 1일부터 시행됩니다.
`;

const PRIVACY_POLICY = `
오토픽(AUTOPIC)은 안전한 서비스 제공을 위해 아래와 같이 개인정보를 수집 및 이용합니다.

1. 수집 및 이용 목적
- 회원 관리: 회원 식별, 본인 확인, 부정 이용 방지, 가입 및 탈퇴 처리.
- 서비스 제공: AI 이미지 생성, 생성물 저장 및 히스토리 관리, 크레딧 관리.
- 결제 및 환불: 유료 크레딧/구독 결제 처리, 원결제 수단으로의 환불 처리, 정산 및 보증보험 관련 사무.
- 고객 상담: 이용 문의 응대 및 고지사항 전달.

2. 수집하는 개인정보 항목
- 필수 항목: 이메일 주소(ID), 비밀번호, 닉네임, 서비스 이용 기록, 접속 로그, IP 정보.
- 결제/환불 시: 카드정보 일부(카드사명, 승인번호), 결제 금액, 휴대전화 번호, (취소 불가 시) 환불 계좌 정보.

3. 개인정보의 보유 및 이용 기간
- 원칙: 회원 탈퇴 시 또는 서비스 종료 시까지 보관합니다.
- 법령에 의한 보존:
  · 계약 또는 청약철회, 대금결제 기록: 5년 (전자상거래법)
  · 소비자의 불만 또는 분쟁처리 기록: 3년 (전자상거래법)
  · 서비스 접속 기록: 3개월 (통신비밀보호법)

4. 동의 거부권 및 불이익
이용자는 개인정보 수집 및 이용에 동의하지 않을 권리가 있으나, 동의하지 않으실 경우 회원가입 및 결제 서비스 이용이 제한됩니다.

5. 개인정보 보호책임자
- 이메일: support@autopic.app

본 방침은 2025년 1월 1일부터 적용됩니다.
`;

export default function RegisterPage() {
  const router = useRouter();
  const { trackSignUp } = useAnalytics();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  // 휴대폰 인증 상태
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // 약관 모달
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('terms');

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 휴대폰 번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 인증번호 발송
  const handleSendCode = async () => {
    const phoneNumbers = phone.replace(/[^\d]/g, '');
    if (phoneNumbers.length !== 11) {
      toast.error('올바른 휴대폰 번호를 입력해주세요');
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await fetch(`${API_URL}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumbers }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('인증번호가 발송되었습니다');
        setCodeSent(true);
        setCountdown(300); // 5분
      } else {
        toast.error(data.error || '인증번호 발송 실패');
      }
    } catch (error) {
      toast.error('인증번호 발송 중 오류가 발생했습니다');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('6자리 인증번호를 입력해주세요');
      return;
    }

    const phoneNumbers = phone.replace(/[^\d]/g, '');
    setIsVerifying(true);
    
    try {
      const response = await fetch(`${API_URL}/api/sms/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumbers, code: verificationCode }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('휴대폰 인증 완료!');
        setIsPhoneVerified(true);
        setCountdown(0);
      } else {
        toast.error(data.error || '인증 실패');
      }
    } catch (error) {
      toast.error('인증 중 오류가 발생했습니다');
    } finally {
      setIsVerifying(false);
    }
  };

  // 전체 동의 핸들러
  const handleAgreeAll = () => {
    const newState = !agreeAll;
    setAgreeAll(newState);
    setAgreeTerms(newState);
    setAgreePrivacy(newState);
    setAgreeMarketing(newState);
  };

  // 개별 동의 변경 시 전체 동의 체크 업데이트
  const updateAgreeAll = (terms: boolean, privacy: boolean, marketing: boolean) => {
    setAgreeAll(terms && privacy && marketing);
  };

  // 약관 모달 열기
  const openTermsModal = (type: 'terms' | 'privacy') => {
    setModalContent(type);
    setShowTermsModal(true);
  };

  // 필수 조건 확인
  const isRequiredAgreed = agreeTerms && agreePrivacy;
  const canSubmit = isRequiredAgreed && isPhoneVerified;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isRequiredAgreed) {
      toast.error('필수 약관에 동의해주세요');
      return;
    }

    if (!isPhoneVerified) {
      toast.error('휴대폰 인증을 완료해주세요');
      return;
    }

    setIsLoading(true);

    try {
      const phoneNumbers = phone.replace(/[^\d]/g, '');
      await signUp(email, password, name, phoneNumbers);
      // Analytics: 회원가입 추적
      trackSignUp('email');
      toast.success('회원가입 완료! 이메일을 확인해주세요.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || '회원가입 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isRequiredAgreed) {
      toast.error('필수 약관에 동의해주세요');
      return;
    }

    if (!isPhoneVerified) {
      toast.error('휴대폰 인증을 완료해주세요');
      return;
    }

    setIsGoogleLoading(true);
    try {
      // Analytics: Google 회원가입 추적
      trackSignUp('google');
      await signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message || 'Google 로그인 실패');
      setIsGoogleLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (!isRequiredAgreed) {
      toast.error('필수 약관에 동의해주세요');
      return;
    }

    if (!isPhoneVerified) {
      toast.error('휴대폰 인증을 완료해주세요');
      return;
    }

    setIsKakaoLoading(true);
    try {
      // Analytics: Kakao 회원가입 추적
      trackSignUp('kakao');
      await signInWithKakao();
    } catch (error: any) {
      toast.error(error.message || '카카오 로그인 실패');
      setIsKakaoLoading(false);
    }
  };

  // 카운트다운 포맷
  const formatCountdown = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-zinc-900">회원가입</h1>
              <p className="text-zinc-500 mt-2">무료로 시작하고 5크레딧을 받으세요</p>
            </div>

            {/* 약관 동의 */}
            <div className="mb-4 p-4 bg-zinc-50 rounded-xl">
              <label className="flex items-center gap-3 pb-3 border-b border-zinc-200 cursor-pointer">
                <div 
                  onClick={handleAgreeAll}
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition ${agreeAll ? 'bg-[#87D039]' : 'border-2 border-zinc-300'}`}
                >
                  {agreeAll && <Check size={14} className="text-white" />}
                </div>
                <span className="font-bold text-zinc-900">전체 동의</span>
              </label>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <div 
                      onClick={() => {
                        const newState = !agreeTerms;
                        setAgreeTerms(newState);
                        updateAgreeAll(newState, agreePrivacy, agreeMarketing);
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition ${agreeTerms ? 'bg-[#87D039]' : 'border-2 border-zinc-300'}`}
                    >
                      {agreeTerms && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-zinc-600">
                      <span className="text-red-500 mr-1">(필수)</span>
                      이용약관 동의
                    </span>
                  </label>
                  <button onClick={() => openTermsModal('terms')} className="text-zinc-400 hover:text-zinc-600">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <div 
                      onClick={() => {
                        const newState = !agreePrivacy;
                        setAgreePrivacy(newState);
                        updateAgreeAll(agreeTerms, newState, agreeMarketing);
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition ${agreePrivacy ? 'bg-[#87D039]' : 'border-2 border-zinc-300'}`}
                    >
                      {agreePrivacy && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-zinc-600">
                      <span className="text-red-500 mr-1">(필수)</span>
                      개인정보 수집 및 이용 동의
                    </span>
                  </label>
                  <button onClick={() => openTermsModal('privacy')} className="text-zinc-400 hover:text-zinc-600">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <div 
                      onClick={() => {
                        const newState = !agreeMarketing;
                        setAgreeMarketing(newState);
                        updateAgreeAll(agreeTerms, agreePrivacy, newState);
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition ${agreeMarketing ? 'bg-[#87D039]' : 'border-2 border-zinc-300'}`}
                    >
                      {agreeMarketing && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-zinc-600">
                      <span className="text-zinc-400 mr-1">(선택)</span>
                      마케팅 정보 수신 동의
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 휴대폰 인증 */}
            <div className="mb-6 p-4 bg-zinc-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Phone size={16} className="text-[#87D039]" />
                <span className="font-bold text-zinc-900 text-sm">휴대폰 인증</span>
                <span className="text-red-500 text-xs">(필수)</span>
                {isPhoneVerified && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    <Shield size={12} />
                    인증완료
                  </span>
                )}
              </div>

              {!isPhoneVerified ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      placeholder="010-0000-0000"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039] text-sm"
                      maxLength={13}
                      disabled={codeSent && countdown > 0}
                    />
                    <button
                      onClick={handleSendCode}
                      disabled={isSendingCode || phone.replace(/[^\d]/g, '').length !== 11 || (codeSent && countdown > 0)}
                      className="px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isSendingCode ? <Loader2 className="animate-spin" size={16} /> : codeSent && countdown > 0 ? formatCountdown(countdown) : '인증요청'}
                    </button>
                  </div>

                  {codeSent && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                        placeholder="인증번호 6자리"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039] text-sm"
                        maxLength={6}
                      />
                      <button
                        onClick={handleVerifyCode}
                        disabled={isVerifying || verificationCode.length !== 6}
                        className="px-4 py-2.5 bg-[#87D039] text-black rounded-lg text-sm font-bold hover:bg-[#9AE045] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isVerifying ? <Loader2 className="animate-spin" size={16} /> : '확인'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Check size={16} className="text-green-600" />
                  {phone} 인증되었습니다
                </div>
              )}
            </div>

            {/* 소셜 로그인 */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || !canSubmit}
                className="w-full py-3 px-4 bg-white border border-zinc-200 rounded-xl font-medium text-zinc-700 hover:bg-zinc-50 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? <Loader2 className="animate-spin" size={18} /> : <GoogleIcon />}
                Google로 시작하기
              </button>

              <button
                onClick={handleKakaoLogin}
                disabled={isKakaoLoading || !canSubmit}
                className="w-full py-3 px-4 bg-[#FEE500] rounded-xl font-medium text-[#000000] hover:bg-[#FDD800] transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isKakaoLoading ? <Loader2 className="animate-spin" size={18} /> : <KakaoIcon />}
                카카오로 시작하기
              </button>
            </div>

            {/* 구분선 */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-zinc-400">또는</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039]"
                  placeholder="홍길동"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039]"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039]"
                  placeholder="6자 이상"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !canSubmit}
                className="w-full py-3 bg-[#87D039] text-black font-bold rounded-xl hover:bg-[#9AE045] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                회원가입
              </button>
            </form>

            <p className="text-center mt-6 text-zinc-500">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-[#87D039] font-bold hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 약관 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="font-bold text-lg">
                {modalContent === 'terms' ? '이용약관' : '개인정보 수집 및 이용 동의'}
              </h3>
              <button onClick={() => setShowTermsModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap text-sm text-zinc-600 font-sans leading-relaxed">
                {modalContent === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY}
              </pre>
            </div>
            <div className="p-4 border-t border-zinc-200">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-black transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
