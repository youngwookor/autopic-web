'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signInWithGoogle, signInWithKakao, supabase, getProfile } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { updateBalance } = useCreditsStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await signIn(email, password);
      
      if (user) {
        // 프로필 가져오기
        const profile = await getProfile(user.id);
        
        // Store 업데이트
        setUser({
          id: user.id,
          email: user.email || '',
          name: profile.name,
        });
        updateBalance(profile.credits);
        
        toast.success(`${profile.name || '회원'}님 환영합니다!`);
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message || 'Google 로그인 실패');
      setIsGoogleLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true);
    try {
      await signInWithKakao();
    } catch (error: any) {
      toast.error(error.message || '카카오 로그인 실패');
      setIsKakaoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">로그인</h1>
            <p className="text-zinc-500 mt-2">Autopic에 오신 것을 환영합니다</p>
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 bg-white border border-zinc-200 rounded-xl font-medium text-zinc-700 hover:bg-zinc-50 transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <GoogleIcon />
              )}
              Google로 계속하기
            </button>

            <button
              onClick={handleKakaoLogin}
              disabled={isKakaoLoading}
              className="w-full py-3 px-4 bg-[#FEE500] rounded-xl font-medium text-[#000000] hover:bg-[#FDD800] transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isKakaoLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <KakaoIcon />
              )}
              카카오로 계속하기
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

          {/* 이메일 로그인 폼 */}
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

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#87D039] text-black font-bold rounded-xl hover:bg-[#9AE045] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
              로그인
            </button>
          </form>

          <p className="text-center mt-6 text-zinc-500">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-[#87D039] font-bold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
