'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import { User, Mail, Building, ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('로그아웃되었습니다');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          스튜디오로 돌아가기
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">설정</h1>
          <p className="text-zinc-500">계정 정보를 확인하고 관리합니다</p>
        </div>

        {/* Profile Section */}
        <div className="bg-zinc-50 rounded-[32px] p-8 mb-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">프로필 정보</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-5 p-5 bg-white rounded-2xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">이름</p>
                <p className="text-lg font-bold text-zinc-900">{user?.name || '미설정'}</p>
              </div>
            </div>

            <div className="flex items-center gap-5 p-5 bg-white rounded-2xl">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Mail size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">이메일</p>
                <p className="text-lg font-bold text-zinc-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-5 p-5 bg-white rounded-2xl">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">요금제</p>
                <p className="text-lg font-bold text-zinc-900 capitalize">{user?.tier}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-zinc-50 rounded-[32px] p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">계정</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-white rounded-2xl">
              <div className="flex items-center gap-4">
                <Shield size={20} className="text-zinc-400" />
                <div>
                  <p className="font-bold text-zinc-900">비밀번호 변경</p>
                  <p className="text-sm text-zinc-400">계정 보안을 위해 주기적으로 변경하세요</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-zinc-100 text-zinc-600 font-medium text-sm rounded-xl hover:bg-zinc-200 transition-colors">
                변경
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full p-5 bg-white rounded-2xl text-left hover:bg-red-50 transition-colors group"
            >
              <span className="font-bold text-red-500 group-hover:text-red-600">로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
