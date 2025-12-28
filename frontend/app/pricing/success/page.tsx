'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { setBalance } = useCreditsStore();
  const { trackPurchase } = useAnalytics();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [credits, setCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const purchaseTracked = useRef(false);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount || !user) {
        setStatus('error');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/payment/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            payment_key: paymentKey,
            order_id: orderId,
            amount: parseInt(amount),
          }),
        });

        const data = await response.json();

        if (data.success) {
          setCredits(data.credits);
          setTotalCredits(data.total_credits);
          setBalance(data.total_credits);
          setStatus('success');
          
          // Analytics: 구매 완료 추적 (중복 방지)
          if (!purchaseTracked.current) {
            trackPurchase({
              transactionId: orderId,
              value: parseInt(amount),
              credits: data.credits,
              planName: searchParams.get('plan') || undefined,
            });
            purchaseTracked.current = true;
          }
          
          toast.success('결제가 완료되었습니다!');
        } else {
          throw new Error(data.error || '결제 확인 실패');
        }
      } catch (error: any) {
        console.error('Payment confirm error:', error);
        setStatus('error');
        toast.error(error.message || '결제 확인 중 오류가 발생했습니다');
      }
    };

    if (user) {
      confirmPayment();
    }
  }, [searchParams, user, setBalance]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#87D039] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">결제 확인 중...</h2>
          <p className="text-zinc-500">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-xl font-bold mb-2">결제 확인 실패</h2>
          <p className="text-zinc-500 mb-6">문제가 지속되면 고객센터로 문의해주세요</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium"
          >
            다시 시도하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-[#87D039] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">결제 완료!</h2>
          <p className="text-zinc-500 mb-6">크레딧이 충전되었습니다</p>

          <div className="bg-zinc-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-zinc-500 mb-2">충전된 크레딧</p>
            <p className="text-4xl font-bold text-[#87D039]">+{credits}</p>
            <p className="text-sm text-zinc-500 mt-4">현재 보유</p>
            <p className="text-2xl font-bold">{totalCredits} 크레딧</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/#studio"
              className="flex items-center justify-center gap-2 w-full bg-[#87D039] text-black py-3 rounded-xl font-bold hover:bg-[#9AE045] transition"
            >
              이미지 생성하기
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/mypage"
              className="block w-full bg-zinc-100 text-zinc-700 py-3 rounded-xl font-medium hover:bg-zinc-200 transition"
            >
              마이페이지
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-[#87D039]" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
