'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { adminApi } from '@/lib/api';
import { formatNumber, formatPrice } from '@/lib/utils';
import { 
  Users, 
  Image, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3,
  Settings,
  Shield,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  total_generations: number;
  generations_today: number;
  generations_week: number;
  total_credits_used: number;
  credits_used_today: number;
  credits_used_week: number;
  total_revenue: number;
  revenue_month: number;
  users_by_tier: Record<string, number>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 인증 체크 - 컴포넌트 마운트 후 약간의 딜레이
  useEffect(() => {
    const checkAuth = async () => {
      // Zustand persist가 로드될 시간을 줌
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) {
        router.push('/login');
        return;
      }
      
      try {
        const parsed = JSON.parse(authStorage);
        const storedUser = parsed?.state?.user;
        
        if (!storedUser) {
          router.push('/login');
          return;
        }
        
        if (!storedUser.is_admin) {
          toast.error('관리자 권한이 필요합니다');
          router.push('/');
          return;
        }
        
        // 관리자 확인됨 - 데이터 로드
        setCheckingAuth(false);
        loadStats();
      } catch (e) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const loadStats = async () => {
    try {
      const data = await adminApi.getDashboard();
      setStats(data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('관리자 권한이 필요합니다');
        router.push('/');
      } else {
        toast.error('통계를 불러오는데 실패했습니다');
        // 기본값 설정
        setStats({
          total_users: 0,
          active_users_today: 0,
          active_users_week: 0,
          new_users_today: 0,
          new_users_week: 0,
          new_users_month: 0,
          total_generations: 0,
          generations_today: 0,
          generations_week: 0,
          total_credits_used: 0,
          credits_used_today: 0,
          credits_used_week: 0,
          total_revenue: 0,
          revenue_month: 0,
          users_by_tier: { free: 0 }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 인증 체크 중
  if (checkingAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-[#87D039]" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

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
            className="flex items-center gap-3 px-4 py-3 bg-zinc-800 text-white rounded-xl font-medium"
          >
            <BarChart3 size={20} />
            대시보드
          </Link>
          <Link 
            href="/admin/users" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl font-medium transition-colors"
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
            <p className="text-zinc-400 mt-1">서비스 현황을 한눈에 확인하세요</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="text-blue-400" size={24} />
                </div>
                <span className="flex items-center gap-1 text-sm text-green-400">
                  <ArrowUpRight size={16} />
                  +{stats.new_users_week}
                </span>
              </div>
              <p className="text-zinc-400 text-sm font-medium">전체 회원</p>
              <p className="text-3xl font-bold mt-1">{formatNumber(stats.total_users)}</p>
            </div>

            {/* Today's Generations */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#87D039]/20 rounded-xl flex items-center justify-center">
                  <Image className="text-[#87D039]" size={24} />
                </div>
                <span className="text-sm text-zinc-400">오늘</span>
              </div>
              <p className="text-zinc-400 text-sm font-medium">이미지 생성</p>
              <p className="text-3xl font-bold mt-1">{formatNumber(stats.generations_today)}</p>
              <p className="text-xs text-zinc-500 mt-2">주간: {formatNumber(stats.generations_week)} / 전체: {formatNumber(stats.total_generations)}</p>
            </div>

            {/* Credits Used */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="text-purple-400" size={24} />
                </div>
                <span className="text-sm text-zinc-400">오늘</span>
              </div>
              <p className="text-zinc-400 text-sm font-medium">크레딧 사용</p>
              <p className="text-3xl font-bold mt-1">{formatNumber(stats.credits_used_today)}</p>
              <p className="text-xs text-zinc-500 mt-2">주간: {formatNumber(stats.credits_used_week)} / 전체: {formatNumber(stats.total_credits_used)}</p>
            </div>

            {/* Revenue */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-yellow-400" size={24} />
                </div>
                <span className="text-sm text-zinc-400">이번 달</span>
              </div>
              <p className="text-zinc-400 text-sm font-medium">매출</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(stats.revenue_month)}</p>
              <p className="text-xs text-zinc-500 mt-2">누적: {formatPrice(stats.total_revenue)}</p>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users by Tier */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-6">요금제별 회원</h3>
              <div className="space-y-4">
                {Object.entries(stats.users_by_tier || {}).map(([tier, count]) => {
                  const total = stats.total_users || 1;
                  const percentage = (count / total) * 100;
                  const colors: Record<string, string> = {
                    free: 'bg-zinc-600',
                    starter: 'bg-[#87D039]',
                    basic: 'bg-purple-500',
                    enterprise: 'bg-yellow-500',
                  };
                  
                  return (
                    <div key={tier}>
                      <div className="flex justify-between mb-2">
                        <span className="text-zinc-300 font-medium capitalize">{tier}</span>
                        <span className="text-zinc-400">{count}명 ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[tier] || 'bg-zinc-500'} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-6">활동 요약</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">오늘 활성 유저</p>
                  <p className="text-2xl font-bold mt-1">{stats.active_users_today}</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">주간 활성 유저</p>
                  <p className="text-2xl font-bold mt-1">{stats.active_users_week}</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">오늘 신규 가입</p>
                  <p className="text-2xl font-bold mt-1">{stats.new_users_today}</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">이번 달 신규</p>
                  <p className="text-2xl font-bold mt-1">{stats.new_users_month}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex gap-4">
            <Link 
              href="/admin/users" 
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors group"
            >
              <h3 className="font-bold mb-2 group-hover:text-[#87D039] transition-colors">유저 관리 →</h3>
              <p className="text-sm text-zinc-400">회원 목록 조회, 크레딧 지급, 권한 관리</p>
            </Link>
            <Link 
              href="/admin/generations" 
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors group"
            >
              <h3 className="font-bold mb-2 group-hover:text-[#87D039] transition-colors">생성 기록 →</h3>
              <p className="text-sm text-zinc-400">이미지 생성 로그, 사용량 분석</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
