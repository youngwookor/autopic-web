'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, Loader2, AlertTriangle } from 'lucide-react';

function BillingFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 에러 정보 읽기
  const error = searchParams.get('error');
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  
  // 에러 메시지 결정 (우선순위: error > message > 기본값)
  const displayError = error || errorMessage || '카드 등록 중 문제가 발생했습니다.';
  
  // 에러 메시지 디코딩 (URL 인코딩된 경우)
  const decodedError = (() => {
    try {
      return decodeURIComponent(displayError);
    } catch {
      return displayError;
    }
  })();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">구독 실패</h2>
        <p className="text-zinc-500 mb-6">
          {decodedError}
        </p>
        
        {errorCode && (
          <div className="bg-zinc-50 rounded-xl p-4 mb-6 text-sm text-zinc-500">
            오류 코드: {errorCode}
          </div>
        )}
        
        {/* 도움말 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">결제가 실패했나요?</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>카드 한도를 확인해주세요</li>
                <li>카드 정보가 정확한지 확인해주세요</li>
                <li>다른 카드로 다시 시도해보세요</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/pricing?tab=subscription')}
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
