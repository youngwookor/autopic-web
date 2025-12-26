'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';

// 세션 복원 완료 여부를 전역에서 확인할 수 있는 Context
const AuthReadyContext = createContext(false);

export const useAuthReady = () => useContext(AuthReadyContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const { setBalance } = useCreditsStore();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // onAuthStateChange의 첫 번째 이벤트가 세션 복원 완료를 의미
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Has session:', !!session);

        if (!mounted) return;

        if (session?.user) {
          // 세션 있음 - 프로필 정보 로드
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, name, email, credits')
              .eq('id', session.user.id)
              .single();

            if (profile && mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profile.name || '',
              });
              setBalance(profile.credits || 0);
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
          }

          // SIGNED_IN일 때 환영 메시지 (세션당 1회)
          if (event === 'SIGNED_IN') {
            const welcomeKey = `welcomed_${session.user.id}`;
            if (!sessionStorage.getItem(welcomeKey)) {
              sessionStorage.setItem(welcomeKey, 'true');
              const { toast } = await import('react-hot-toast');
              toast.success('환영합니다!', { id: 'welcome-toast' });
            }
          }
        } else {
          // 세션 없음
          if (mounted) {
            logout();
            setBalance(0);
          }
        }

        // 첫 번째 이벤트 후 Auth 준비 완료
        if (!isAuthReady && mounted) {
          setIsAuthReady(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setBalance, logout, isAuthReady]);

  // 세션 복원 완료 전까지 로딩 표시
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#87D039] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-400 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthReadyContext.Provider value={isAuthReady}>
      {children}
    </AuthReadyContext.Provider>
  );
}
