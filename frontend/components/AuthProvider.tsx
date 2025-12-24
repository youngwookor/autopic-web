'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const { setBalance } = useCreditsStore();

  useEffect(() => {
    // 초기 세션 체크
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile.name || '',
          });
          setBalance(profile.credits || 0);
        }
      }
    };

    checkSession();

    // Auth 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile.name || '',
          });
          setBalance(profile.credits || 0);
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
        setBalance(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setBalance, logout]);

  return <>{children}</>;
}
