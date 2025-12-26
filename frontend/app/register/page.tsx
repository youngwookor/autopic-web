'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, signInWithGoogle, signInWithKakao } from '@/lib/supabase';
import { Loader2, X, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

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
이 약관은 AUTOPIC(이하 "회사")가 제공하는 AI 이미지 생성 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "서비스"란 회사가 제공하는 AI 기반 상품 이미지 생성 서비스를 말합니다.
② "회원"이란 회사와 서비스 이용계약을 체결하고 회원 아이디를 부여받은 자를 말합니다.
③ "크레딧"이란 서비스 이용을 위해 필요한 가상의 결제 수단을 말합니다.

제3조 (서비스 이용)
① 회원은 크레딧을 사용하여 AI 이미지 생성 서비스를 이용할 수 있습니다.
② 생성된 이미지의 저작권은 회원에게 있으며, 상업적 용도로 자유롭게 사용할 수 있습니다.
③ 회원은 타인의 초상권, 저작권 등을 침해하는 이미지를 생성해서는 안 됩니다.

제4조 (크레딧 및 결제)
① 크레딧은 회사가 정한 요금에 따라 구매할 수 있습니다.
② 사용하지 않은 크레딧은 구매일로부터 1년간 유효합니다.
③ 결제 완료 후 서비스 이용 전 환불 요청 시 전액 환불되며, 이용 후에는 환불되지 않습니다.

제5조 (서비스 중단)
회사는 시스템 점검, 장애 복구 등의 사유로 서비스를 일시 중단할 수 있으며, 사전 공지 후 진행합니다.

제6조 (면책조항)
① 회사는 AI가 생성한 이미지의 품질이나 정확성을 보장하지 않습니다.
② 회원이 생성한 이미지로 인해 발생하는 법적 책임은 회원에게 있습니다.

제7조 (약관 변경)
회사는 필요 시 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다.

부칙
이 약관은 2024년 1월 1일부터 시행됩니다.
`;

const PRIVACY_POLICY = `
1. 수집하는 개인정보
회사는 서비스 제공을 위해 다음 정보를 수집합니다:
- 필수: 이메일 주소, 이름(닉네임)
- 선택: 휴대폰 번호 (본인확인 시)
- 자동 수집: 서비스 이용 기록, 접속 로그, 쿠키

2. 개인정보의 이용 목적
- 회원 가입 및 관리
- 서비스 제공 및 요금 정산
- 고객 문의 응대
- 서비스 개선 및 통계 분석

3. 개인정보의 보유 및 이용 기간
- 회원 탈퇴 시까지 보유
- 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관
  · 계약 또는 청약철회 기록: 5년
  · 대금결제 및 재화 공급 기록: 5년
  · 소비자 불만 또는 분쟁 처리 기록: 3년

4. 개인정보의 제3자 제공
회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.
단, 법령에 의거하거나 회원의 동의가 있는 경우 예외로 합니다.

5. 개인정보의 파기
회원 탈퇴 시 지체 없이 파기하며, 전자적 파일은 복구 불가능하게 삭제합니다.

6. 회원의 권리
회원은 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며,
회원 탈퇴를 통해 개인정보 처리 정지를 요청할 수 있습니다.

7. 개인정보 보호책임자
- 담당: AUTOPIC 고객지원팀
- 이메일: support@autopic.app

8. 개인정보 처리방침 변경
본 방침은 2024년 1월 1일부터 적용되며, 변경 시 서비스 내 공지합니다.
`;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  // 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // 약관 모달
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('terms');

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

  // 필수 약관 동의 여부
  const isRequiredAgreed = agreeTerms && agreePrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isRequiredAgreed) {
      toast.error('필수 약관에 동의해주세요');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, name);
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

    setIsGoogleLoading(true);
    try {
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

    setIsKakaoLoading(true);
    try {
      await signInWithKakao();
    } catch (error: any) {
      toast.error(error.message || '카카오 로그인 실패');
      setIsKakaoLoading(false);
    }
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
            <div className="mb-6 p-4 bg-zinc-50 rounded-xl">
              {/* 전체 동의 */}
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
                {/* 이용약관 */}
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
                  <button 
                    onClick={() => openTermsModal('terms')}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* 개인정보처리방침 */}
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
                      개인정보처리방침 동의
                    </span>
                  </label>
                  <button 
                    onClick={() => openTermsModal('privacy')}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* 마케팅 수신 */}
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

            {/* 소셜 로그인 */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || !isRequiredAgreed}
                className="w-full py-3 px-4 bg-white border border-zinc-200 rounded-xl font-medium text-zinc-700 hover:bg-zinc-50 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <GoogleIcon />
                )}
                Google로 시작하기
              </button>

              <button
                onClick={handleKakaoLogin}
                disabled={isKakaoLoading || !isRequiredAgreed}
                className="w-full py-3 px-4 bg-[#FEE500] rounded-xl font-medium text-[#000000] hover:bg-[#FDD800] transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isKakaoLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <KakaoIcon />
                )}
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
                disabled={isLoading || !isRequiredAgreed}
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
                {modalContent === 'terms' ? '이용약관' : '개인정보처리방침'}
              </h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition"
              >
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
