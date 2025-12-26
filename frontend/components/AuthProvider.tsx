'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout, isAuthenticated, user } = useAuthStore();
  const { setBalance } = useCreditsStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1단계: localStorage에서 빠르게 복원 (즉시)
    const quickRestore = () => {
      try {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.user && parsed?.state?.isAuthenticated) {
            console.log('Quick restore from localStorage');
            // 이미 Store에 있으면 스킵
            return true;
          }
        }
      } catch (e) {
        console.error('Quick restore error:', e);
      }
      return false;
    };

    // 2단계: Supabase에서 세션 확인 (느림)
    const verifySession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          // 에러 시에도 기존 세션 유지
          return;
        }

        if (session?.user && mounted) {
          // 프로필 정보 갱신
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
        } else if (!session && mounted) {
          // 세션 없으면 로그아웃
          console.log('No session found, clearing state');
          logout();
          setBalance(0);
        }
      } catch (error) {
        console.error('Session verify error:', error);
        // 에러 시 기존 상태 유지
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    // 실행
    quickRestore();
    verifySession();

    // Auth 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

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
            
            // OAuth 로그인 시 환영 메시지 (리디렉트 후 표시)
            const { toast } = await import('react-hot-toast');
            toast.success(`${profile.name || '회원'}님 환영합니다!`);
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
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setBalance, logout]);

  return <>{children}</>;
}
