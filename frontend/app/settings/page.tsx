'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { deleteAccount } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { User, Mail, Building, ArrowLeft, Shield, Trash2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '탈퇴합니다') {
      toast.error('"탈퇴합니다"를 정확히 입력해주세요');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      logout();
      toast.success('회원탈퇴가 완료되었습니다');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || '회원탈퇴 처리 중 오류가 발생했습니다');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
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
        <div className="bg-zinc-50 rounded-[32px] p-8 mb-6">
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

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-8">
          <h2 className="text-xl font-bold text-red-600 mb-2">위험 구역</h2>
          <p className="text-sm text-red-500 mb-6">이 작업은 되돌릴 수 없습니다</p>
          
          <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-red-200">
            <div className="flex items-center gap-4">
              <Trash2 size={20} className="text-red-500" />
              <div>
                <p className="font-bold text-zinc-900">회원탈퇴</p>
                <p className="text-sm text-zinc-400">계정과 모든 데이터가 영구적으로 삭제됩니다</p>
              </div>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-500 text-white font-medium text-sm rounded-xl hover:bg-red-600 transition-colors"
            >
              탈퇴하기
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">회원탈퇴</h3>
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-zinc-600">
                정말로 탈퇴하시겠습니까? 탈퇴 시 다음 정보가 모두 삭제됩니다:
              </p>
              <ul className="text-sm text-zinc-500 space-y-1 list-disc list-inside">
                <li>계정 정보 및 프로필</li>
                <li>보유 크레딧</li>
                <li>생성 이미지 히스토리</li>
                <li>결제 내역</li>
              </ul>
              <p className="text-red-600 font-medium text-sm">
                ⚠️ 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                탈퇴를 확인하려면 <span className="font-bold text-red-600">"탈퇴합니다"</span>를 입력하세요
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="탈퇴합니다"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-zinc-100 text-zinc-700 font-bold rounded-xl hover:bg-zinc-200 transition"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== '탈퇴합니다' || isDeleting}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '처리 중...' : '회원탈퇴'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
