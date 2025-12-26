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

    // 프로필 로드 함수 (별도 비동기)
    const loadProfile = async (userId: string, email: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, credits')
          .eq('id', userId)
          .single();

        if (profile) {
          setUser({
            id: userId,
            email: email,
            name: profile.name || email.split('@')[0] || '',
          });
          setBalance(profile.credits || 0);
          console.log('Profile loaded:', profile.name);
        }
      } catch (e) {
        console.error('Profile error:', e);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, 'Has session:', !!session);

        if (session?.user) {
          // 1. 기본 유저 정보 즉시 설정
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
          });

          // 2. 프로필은 백그라운드에서 로드 (await 없이!)
          loadProfile(session.user.id, session.user.email || '');

        } else {
          logout();
          setBalance(0);
        }

        // 3. 즉시 Auth 준비 완료! (프로필 로드 안 기다림)
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
