'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const { setBalance } = useCreditsStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 초기 세션 체크
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          return;
        }

        if (session?.user && mounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
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
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Auth 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
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
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          logout();
          setBalance(0);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // 토큰 갱신 시 세션 유지
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setBalance, logout]);

  // 초기화 중일 때 로딩 표시 (선택적)
  // if (!isInitialized) {
  //   return <div>Loading...</div>;
  // }

  return <>{children}</>;
}
