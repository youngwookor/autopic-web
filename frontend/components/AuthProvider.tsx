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
    // 이미 초기화됐으면 스킵
    if (isInitialized.current) return;

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Has session:', !!session);

        if (!mounted) return;

        if (session?.user) {
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
              console.log('Profile loaded:', profile.name);
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
          }

          if (event === 'SIGNED_IN') {
            const welcomeKey = `welcomed_${session.user.id}`;
            if (!sessionStorage.getItem(welcomeKey)) {
              sessionStorage.setItem(welcomeKey, 'true');
              const { toast } = await import('react-hot-toast');
              toast.success('환영합니다!', { id: 'welcome-toast' });
            }
          }
        } else {
          if (mounted) {
            logout();
            setBalance(0);
          }
        }

        // 첫 번째 이벤트 후 Auth 준비 완료 (한 번만 실행)
        if (!isInitialized.current && mounted) {
          console.log('Auth ready! Setting isAuthReady to true');
          isInitialized.current = true;
          setIsAuthReady(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setBalance, logout]); // isAuthReady 제거!

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
