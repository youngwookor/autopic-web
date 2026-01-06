'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, Calendar, CreditCard } from 'lucide-react';

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 결과 정보 읽기 (나이스페이 빌링 콜백에서 전달)
  const plan = searchParams.get('plan') || '';
  const planName = searchParams.get('planName') || plan;
  const credits = parseInt(searchParams.get('credits') || '0', 10);
  const amount = parseInt(searchParams.get('amount') || '0', 10);
  const nextBillingDate = searchParams.get('nextBillingDate') || '';
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-[#87D039]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-[#87D039]" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">구독 완료!</h2>
        <p className="text-zinc-500 mb-6">
          {planName} 플랜 구독이 시작되었습니다.
        </p>
        
        <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-500">플랜</span>
              <span className="font-bold">{planName}</span>
            </div>
            {credits > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">지급 크레딧</span>
                <span className="font-bold text-[#87D039]">+{credits.toLocaleString()}</span>
              </div>
            )}
            {amount > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">결제 금액</span>
                <span className="font-bold">₩{amount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="border-t pt-3 mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Calendar size={14} />
                  구독 시작일
                </span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <CreditCard size={14} />
                  다음 결제일
                </span>
                <span className="font-medium">
                  {formatDate(nextBillingDate)}
                </span>
              </div>
            </div>
          </div>
          
          {/* 크레딧 리셋 안내 */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">📌 크레딧 안내:</span> 매월 {credits.toLocaleString() || 100} 크레딧이 새로 지급되며, 미사용 크레딧은 다음 달 소멸됩니다.
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
            onClick={() => router.push('/dashboard')}
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
