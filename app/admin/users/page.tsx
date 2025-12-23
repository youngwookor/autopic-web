'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { adminApi } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { 
  Users, 
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart3,
  Image,
  Settings,
  LogOut,
  MoreVertical,
  Plus,
  Minus,
  UserCog,
  Ban,
  Check,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserItem {
  id: number;
  email: string;
  name: string | null;
  tier: string;
  credits: number;
  is_active: boolean;
  is_admin: boolean;
  generation_count: number;
  created_at: string;
  last_login: string | null;
}

export default function AdminUsers() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 20;

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      router.push('/');
      return;
    }
    loadUsers();
  }, [isAuthenticated, user, router, page, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers({
        skip: page * limit,
        limit,
        search: search || undefined
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (error) {
      toast.error('유저 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadUsers();
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || creditAmount === 0 || !creditReason.trim()) {
      toast.error('금액과 사유를 입력해주세요');
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.adjustCredits(selectedUser.id, {
        amount: creditAmount,
        reason: creditReason
      });
      toast.success(`${creditAmount > 0 ? '지급' : '차감'} 완료!`);
      setShowCreditModal(false);
      setCreditAmount(0);
      setCreditReason('');
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '크레딧 조정 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await adminApi.updateUser(userId, { is_active: !currentStatus });
      toast.success(currentStatus ? '계정이 비활성화되었습니다' : '계정이 활성화되었습니다');
      loadUsers();
    } catch (error) {
      toast.error('상태 변경 실패');
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    if (!confirm(currentStatus ? '관리자 권한을 해제하시겠습니까?' : '관리자 권한을 부여하시겠습니까?')) {
      return;
    }
    
    try {
      await adminApi.updateUser(userId, { is_admin: !currentStatus });
      toast.success(currentStatus ? '관리자 권한이 해제되었습니다' : '관리자 권한이 부여되었습니다');
      loadUsers();
    } catch (error) {
      toast.error('권한 변경 실패');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-[#87D039]" size={24} />
            AUTOPIC Admin
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl font-medium transition-colors"
          >
            <BarChart3 size={20} />
            대시보드
          </Link>
          <Link 
            href="/admin/users" 
            className="flex items-center gap-3 px-4 py-3 bg-zinc-800 text-white rounded-xl font-medium"
          >
            <Users size={20} />
            유저 관리
          </Link>
          <Link 
            href="/admin/generations" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl font-medium transition-colors"
          >
            <Image size={20} />
            생성 기록
          </Link>
          <Link 
            href="/admin/settings" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl font-medium transition-colors"
          >
            <Settings size={20} />
            설정
          </Link>
        </nav>

        <div className="pt-6 border-t border-zinc-800">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl font-medium transition-colors"
          >
            메인 사이트로
          </Link>
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded-xl font-medium transition-colors"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">유저 관리</h2>
              <p className="text-zinc-400 mt-1">총 {formatNumber(total)}명의 회원</p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이메일 또는 이름으로 검색..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-700"
              />
            </div>
          </form>

          {/* Users Table */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#87D039]" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">유저</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">요금제</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">크레딧</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">생성</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">상태</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">가입일</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold">
                            {u.name?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{u.name || '-'}</p>
                            <p className="text-sm text-zinc-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                          u.tier === 'free' ? 'bg-zinc-700 text-zinc-300' :
                          u.tier === 'starter' ? 'bg-[#87D039]/20 text-[#87D039]' :
                          u.tier === 'basic' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {u.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatNumber(u.credits)}</td>
                      <td className="px-6 py-4 text-zinc-400">{u.generation_count}회</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {u.is_active ? (
                            <span className="flex items-center gap-1 text-green-400 text-xs">
                              <Check size={14} /> 활성
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                              <X size={14} /> 비활성
                            </span>
                          )}
                          {u.is_admin && (
                            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {formatRelativeTime(u.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedUser(u); setShowCreditModal(true); }}
                            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                            title="크레딧 조정"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            className={`p-2 hover:bg-zinc-700 rounded-lg transition-colors ${u.is_active ? 'text-zinc-400 hover:text-red-400' : 'text-zinc-400 hover:text-green-400'}`}
                            title={u.is_active ? '비활성화' : '활성화'}
                          >
                            <Ban size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                            className={`p-2 hover:bg-zinc-700 rounded-lg transition-colors ${u.is_admin ? 'text-yellow-400' : 'text-zinc-400 hover:text-yellow-400'}`}
                            title={u.is_admin ? '관리자 해제' : '관리자 부여'}
                          >
                            <UserCog size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-zinc-400">
                {page * limit + 1} - {Math.min((page + 1) * limit, total)} / {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="px-4 py-2 text-sm">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Credit Adjustment Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-800">
            <h3 className="text-xl font-bold mb-2">크레딧 조정</h3>
            <p className="text-zinc-400 text-sm mb-6">{selectedUser.email}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">현재 크레딧</label>
              <p className="text-2xl font-bold text-[#87D039]">{formatNumber(selectedUser.credits)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">조정 금액</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreditAmount(a => a - 10)}
                  className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                >
                  <Minus size={20} />
                </button>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-center text-lg font-bold focus:outline-none focus:border-zinc-600"
                />
                <button
                  onClick={() => setCreditAmount(a => a + 10)}
                  className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                >
                  <Plus size={20} />
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                양수: 지급 / 음수: 차감
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">사유 *</label>
              <input
                type="text"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="예: 이벤트 보상, 오류 보상"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreditModal(false); setSelectedUser(null); setCreditAmount(0); setCreditReason(''); }}
                className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAdjustCredits}
                disabled={actionLoading || creditAmount === 0 || !creditReason.trim()}
                className="flex-1 py-3 bg-[#87D039] text-black rounded-xl font-bold hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
