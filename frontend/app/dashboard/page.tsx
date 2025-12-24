'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, getProfile, signOut } from '@/lib/supabase';
import { Sparkles, Zap, Crown, ArrowRight, LogOut } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  name: string;
  credits: number;
  tier: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const profileData = await getProfile(user.id);
        setProfile(profileData);
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#87D039] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">안녕하세요, {profile.name || '사용자'}님!</h1>
            <p className="text-zinc-500">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>

        {/* 크레딧 카드 */}
        <div className="bg-black text-white p-8 rounded-3xl mb-6">
          <p className="text-zinc-400 mb-2">보유 크레딧</p>
          <p className="text-5xl font-bold mb-4">{profile.credits}</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-zinc-400">Flash</span>
              <span className="font-bold">{profile.credits}회</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-purple-400" />
              <span className="text-zinc-400">Pro</span>
              <span className="font-bold">{Math.floor(profile.credits / 3)}회</span>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/studio"
            className="bg-[#87D039] p-6 rounded-2xl flex items-center justify-between hover:bg-[#9AE045] transition"
          >
            <div>
              <Sparkles size={24} className="mb-2" />
              <p className="font-bold text-lg">이미지 생성하기</p>
              <p className="text-sm opacity-70">AI로 상품 이미지 만들기</p>
            </div>
            <ArrowRight size={24} />
          </Link>

          <Link
            href="/pricing"
            className="bg-white border border-zinc-200 p-6 rounded-2xl flex items-center justify-between hover:border-zinc-300 transition"
          >
            <div>
              <Crown size={24} className="mb-2 text-purple-500" />
              <p className="font-bold text-lg">크레딧 충전</p>
              <p className="text-sm text-zinc-500">더 많은 이미지 생성</p>
            </div>
            <ArrowRight size={24} className="text-zinc-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
