'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';

function FailContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">결제 실패</h2>
          <p className="text-zinc-500 mb-4">
            결제가 완료되지 않았습니다.
          </p>
          
          {errorMessage && (
            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-600">{decodeURIComponent(errorMessage)}</p>
              {errorCode && (
                <p className="text-xs text-red-400 mt-1">오류 코드: {errorCode}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition"
            >
              <ArrowLeft size={18} />
              다시 시도하기
            </Link>
            <Link
              href="/"
              className="block w-full bg-zinc-100 text-zinc-700 py-3 rounded-xl font-medium hover:bg-zinc-200 transition"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">로딩 중...</div>
      </div>
    }>
      <FailContent />
    </Suspense>
  );
}
