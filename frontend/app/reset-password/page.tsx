'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // URL에서 토큰 확인
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('비밀번호가 변경되었습니다');
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || '비밀번호 변경 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 확인 중
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-[#87D039]" size={40} />
      </div>
    );
  }

  // 유효하지 않은 세션
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">링크가 만료되었습니다</h2>
            <p className="text-zinc-500 mb-6">
              비밀번호 재설정 링크가 만료되었거나<br />
              이미 사용된 링크입니다.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block w-full py-3 bg-[#87D039] text-black font-bold rounded-xl hover:bg-[#9AE045] transition"
            >
              다시 요청하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-zinc-400" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900">새 비밀번호 설정</h1>
                <p className="text-zinc-500 mt-2">
                  새로운 비밀번호를 입력해주세요.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">새 비밀번호</label>
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

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039]"
                    placeholder="비밀번호 다시 입력"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#87D039] text-black font-bold rounded-xl hover:bg-[#9AE045] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                  비밀번호 변경
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">비밀번호 변경 완료!</h2>
              <p className="text-zinc-500 mb-6">
                새 비밀번호로 로그인할 수 있습니다.<br />
                잠시 후 로그인 페이지로 이동합니다.
              </p>
              <Link
                href="/login"
                className="text-[#87D039] font-medium hover:underline"
              >
                지금 로그인하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
