'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const { setBalance } = useCreditsStore();

  useEffect(() => {
    let mounted = true;

    // Supabase 세션 확인 및 상태 설정
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
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
        }
      } catch (error) {
        console.error('Auth init error:', error);
      }
    };

    // Auth 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
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
            
            // 환영 메시지 (세션당 1회)
            const welcomeKey = `welcomed_${session.user.id}`;
            if (!sessionStorage.getItem(welcomeKey)) {
              sessionStorage.setItem(welcomeKey, 'true');
              const { toast } = await import('react-hot-toast');
              toast.success(`${profile.name || '회원'}님 환영합니다!`, { id: 'welcome-toast' });
            }
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          logout();
          setBalance(0);
        }
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setBalance, logout]);

  return <>{children}</>;
}
