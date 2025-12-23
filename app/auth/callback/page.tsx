'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { setBalance } = useCreditsStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Callback - Session:', data.session?.user?.id);
        
        if (error) {
          console.error('Auth callback error:', error);
          toast.error('로그인 처리 중 오류가 발생했습니다');
          router.push('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          const user = data.session.user;
          
          // profiles 테이블에 사용자가 있는지 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          console.log('Callback - Profile:', profile, 'Error:', profileError);

          // 프로필이 없으면 생성 (신규 가입)
          if (profileError && profileError.code === 'PGRST116') {
            const newProfile = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.nickname || user.email?.split('@')[0],
              credits: 5,
              tier: 'free',
            };
            
            console.log('Callback - Creating new profile:', newProfile);
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);
            
            if (insertError) {
              console.error('Profile insert error:', insertError);
              toast.error('프로필 생성 중 오류가 발생했습니다');
            } else {
              console.log('Callback - Profile created successfully');
              toast.success('회원가입 완료! 5 크레딧이 지급되었습니다 🎉');
            }
            
            // Store 업데이트
            setUser({
              id: user.id,
              email: user.email || '',
              name: newProfile.name || '',
            });
            setBalance(5);
            
          } else if (profile) {
            // 기존 사용자 - Store 업데이트
            setUser({
              id: user.id,
              email: user.email || '',
              name: profile.name || '',
            });
            setBalance(profile.credits || 0);
            
            toast.success('로그인 성공!');
          }

          router.push('/');
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Callback error:', err);
        toast.error('로그인 처리 중 오류가 발생했습니다');
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router, setUser, setBalance]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-[#87D039]" size={48} />
        <p className="text-zinc-600 font-medium">로그인 처리 중...</p>
      </div>
    </div>
  );
}
