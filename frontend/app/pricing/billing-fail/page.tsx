'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, Loader2 } from 'lucide-react';

function BillingFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">카드 등록 실패</h2>
        <p className="text-zinc-500 mb-6">
          {errorMessage || '카드 등록 중 문제가 발생했습니다.'}
        </p>
        
        {errorCode && (
          <div className="bg-zinc-50 rounded-xl p-4 mb-8 text-sm text-zinc-500">
            오류 코드: {errorCode}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/#pricing')}
            className="w-full px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full px-8 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    }>
      <BillingFailContent />
    </Suspense>
  );
}
