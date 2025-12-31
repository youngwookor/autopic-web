'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore, useCreditsStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { setBalance } = useCreditsStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false); // 중복 요청 방지

  useEffect(() => {
    const processSubscription = async () => {
      // 이미 처리되었으면 스킵
      if (processedRef.current) {
        return;
      }
      processedRef.current = true;

      if (!isAuthenticated || !user) {
        setError('로그인이 필요합니다');
        setIsProcessing(false);
        return;
      }

      const authKey = searchParams.get('authKey');
      const plan = searchParams.get('plan');
      const isAnnual = searchParams.get('isAnnual') === 'true';

      if (!authKey || !plan) {
        setError('결제 정보가 올바르지 않습니다');
        setIsProcessing(false);
        return;
      }

      try {
        // 빌링키 발급 + 결제 + 구독 생성 통합 API 호출
        const response = await fetch(`${API_URL}/api/billing/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            plan: plan,
            auth_key: authKey,
            customer_key: user.id,
            is_annual: isAnnual,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(data);
          
          // 크레딧 잔액 업데이트
          const creditsResponse = await fetch(`${API_URL}/api/credits/${user.id}`);
          const creditsData = await creditsResponse.json();
          setBalance(creditsData.credits || 0);
          
          toast.success('구독이 시작되었습니다!');
        } else {
          // 이미 구독 중인 경우 성공 처리
          if (data.error?.includes('이미 활성화된 구독') || data.error?.includes('기존 요청을 처리')) {
            // 마이페이지로 리다이렉트
            toast.success('구독이 이미 활성화되어 있습니다');
            router.push('/mypage');
            return;
          }
          setError(data.error || '구독 처리 중 오류가 발생했습니다');
        }
      } catch (err) {
        console.error('구독 처리 오류:', err);
        setError('구독 처리 중 오류가 발생했습니다');
      } finally {
        setIsProcessing(false);
      }
    };

    processSubscription();
  }, [searchParams, user, isAuthenticated, setBalance, router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#87D039] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">구독 처리 중...</h2>
          <p className="text-zinc-500">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">구독 실패</h2>
          <p className="text-zinc-500 mb-8">{error}</p>
          <button
            onClick={() => router.push('/#pricing')}
            className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-[#87D039]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-[#87D039]" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">구독 완료!</h2>
        <p className="text-zinc-500 mb-6">
          {result?.plan_name} 플랜 구독이 시작되었습니다.
        </p>
        
        <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-500">플랜</span>
              <span className="font-bold">{result?.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">지급 크레딧</span>
              <span className="font-bold text-[#87D039]">+{result?.credits_granted?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">결제 금액</span>
              <span className="font-bold">₩{result?.amount_paid?.toLocaleString()}</span>
            </div>
            {result?.card_number && (
              <div className="flex justify-between">
                <span className="text-zinc-500">결제 카드</span>
                <span className="font-medium">{result?.card_number}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">구독 시작일</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">다음 결제일</span>
                <span className="font-medium">
                  {result?.next_billing_date 
                    ? new Date(result.next_billing_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) 
                    : '-'}
                </span>
              </div>
            </div>
          </div>
          
          {/* 크레딧 리셋 안내 */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">📌 크레딧 안내:</span> 매월 {result?.credits_granted?.toLocaleString() || 100} 크레딧이 새로 지급되며, 미사용 크레딧은 다음 달 소멸됩니다.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/mypage')}
            className="w-full px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black transition"
          >
            마이페이지로 이동
          </button>
          <button
            onClick={() => router.push('/#studio')}
            className="w-full px-8 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition"
          >
            이미지 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}
