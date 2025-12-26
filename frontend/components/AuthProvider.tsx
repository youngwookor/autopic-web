'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const { setBalance } = useCreditsStore();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Has session:', !!session);

        try {
          if (session?.user) {
            // 세션 있음 - 유저 기본 정보 먼저 설정
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
            });

            // 프로필은 별도로 로드 (실패해도 진행)
            supabase
              .from('profiles')
              .select('name, credits')
              .eq('id', session.user.id)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: profile.name || session.user.email?.split('@')[0] || '',
                  });
                  setBalance(profile.credits || 0);
                }
              })
              .catch(console.error);

          } else {
            logout();
            setBalance(0);
          }
        } catch (error) {
          console.error('Auth error:', error);
        }

        // 무조건 Auth 준비 완료 (에러 나도 진행)
        console.log('Auth ready!');
        setIsAuthReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setBalance, logout]);

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

  return <>{children}</>;
}
