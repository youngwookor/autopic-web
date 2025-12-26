'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('이메일을 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSent(true);
      toast.success('비밀번호 재설정 이메일을 발송했습니다');
    } catch (error: any) {
      toast.error(error.message || '이메일 발송 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {!isSent ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-zinc-400" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900">비밀번호 찾기</h1>
                <p className="text-zinc-500 mt-2">
                  가입한 이메일 주소를 입력하시면<br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#87D039] text-black font-bold rounded-xl hover:bg-[#9AE045] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                  재설정 링크 발송
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">이메일을 확인하세요</h2>
              <p className="text-zinc-500 mb-6">
                <span className="font-medium text-zinc-700">{email}</span>으로<br />
                비밀번호 재설정 링크를 발송했습니다.
              </p>
              <p className="text-sm text-zinc-400 mb-6">
                이메일이 오지 않으면 스팸함을 확인해주세요.
              </p>
              <button
                onClick={() => setIsSent(false)}
                className="text-[#87D039] font-medium hover:underline"
              >
                다른 이메일로 다시 시도
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-zinc-200">
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-700 transition"
            >
              <ArrowLeft size={16} />
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
