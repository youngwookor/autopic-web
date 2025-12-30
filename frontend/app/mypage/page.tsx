'use client';

// Vercel에서 정적 생성 방지 - 항상 동적 렌더링
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, deleteAccount } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { 
  User, CreditCard, Image, Settings, LogOut, 
  Zap, Crown, ChevronRight,
  ArrowLeft, Sparkles, Key, Monitor, Trash2, AlertTriangle, X,
  Clock, Download, Info
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'generations' | 'credits' | 'settings';

interface Generation {
  id: string;
  source_image_url: string;
  generated_image_url: string;
  mode: string;
  model_type: string;
  credits_used: number;
  created_at: string;
}

interface Usage {
  id: string;
  action: string;
  credits_used: number;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  is_active: boolean;
  created_at: string;
}

// 남은 보관 일수 계산 함수
function getRemainingDays(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = created.getTime() + (7 * 24 * 60 * 60 * 1000) - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// 남은 시간 포맷 함수
function formatRemainingTime(createdAt: string): string {
  const remainingDays = getRemainingDays(createdAt);
  if (remainingDays <= 0) return '만료됨';
  if (remainingDays === 1) return '오늘 만료';
  return `${remainingDays}일 남음`;
}

// 만료 상태에 따른 색상
function getExpiryColor(createdAt: string): string {
  const remainingDays = getRemainingDays(createdAt);
  if (remainingDays <= 0) return 'text-zinc-400 bg-zinc-100';
  if (remainingDays <= 2) return 'text-red-600 bg-red-50';
  if (remainingDays <= 4) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
}

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout: storeLogout } = useAuthStore();
  const { balance, setBalance } = useCreditsStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [usages, setUsages] = useState<Usage[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 회원탈퇴 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // 데이터 로드 함수
  const loadData = useCallback(async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setBalance(profileData.credits || 0);
      }

      const { data: generationsData } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      setGenerations(generationsData || []);

      const { data: usagesData } = await supabase
        .from('usages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setUsages(usagesData || []);

      try {
        const keysResponse = await fetch(`${API_URL}/api/keys/${userId}`);
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setApiKeys(keysData.keys || []);
        }
      } catch (e) {}
    } catch (error) {
      console.error('Data load error:', error);
    }
  }, [API_URL, setBalance]);

  // AuthProvider에서 세션 복원이 완료된 후 이 컴포넌트가 렌더링됨
  // 따라서 isAuthenticated와 user를 바로 사용 가능
  useEffect(() => {
    // 로그인 안 되어 있으면 로그인 페이지로
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // 데이터 로드
    loadData(user.id).then(() => {
      setIsLoading(false);
    });
  }, [isAuthenticated, user, router, loadData]);

  // 로그아웃 감지
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      await supabase.auth.signOut();
      storeLogout();
      setBalance(0);
      toast.success('로그아웃 되었습니다');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('로그아웃 중 오류가 발생했습니다');
      setIsLoggingOut(false);
    }
  };

  // 회원탈퇴 처리
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '탈퇴합니다') {
      toast.error('"탈퇴합니다"를 정확히 입력해주세요');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      storeLogout();
      setBalance(0);
      toast.success('회원탈퇴가 완료되었습니다');
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message || '회원탈퇴 처리 중 오류가 발생했습니다');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // 이미지 다운로드 함수
  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autopic_${Date.now()}_${index}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('다운로드 완료!');
    } catch (error) {
      toast.error('다운로드에 실패했습니다');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getModeName = (mode: string) => {
    const modes: Record<string, string> = {
      'still': '스틸컷', 'product': '정물', 'model': '모델컷',
      'editorial_still': '에디토리얼 스틸', 'editorial_product': '화보 정물', 'editorial_model': '화보 모델'
    };
    return modes[mode] || mode;
  };

  // 로그인 체크 중이거나 데이터 로딩 중
  if (!isAuthenticated || !user || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#87D039] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '회원정보', icon: User },
    { id: 'generations', label: '생성 내역', icon: Image },
    { id: 'credits', label: '크레딧', icon: CreditCard },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  const currentCredits = typeof balance === 'number' ? balance : (balance?.credits ?? profile?.credits ?? 0);
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const thisMonthUsage = usages.filter(u => new Date(u.created_at) >= thisMonth).reduce((sum, u) => sum + u.credits_used, 0);
  const totalGenerations = generations.length;

  // 유효한 이미지만 필터링 (7일 이내)
  const validGenerations = generations.filter(gen => getRemainingDays(gen.created_at) > 0);
  const expiredGenerations = generations.filter(gen => getRemainingDays(gen.created_at) <= 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-100 rounded-lg transition"><ArrowLeft size={20} /></Link>
            <h1 className="text-xl font-bold">마이페이지</h1>
          </div>
          <button onClick={handleLogout} disabled={isLoggingOut} className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition text-sm disabled:opacity-50">
            {isLoggingOut ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <LogOut size={18} />}
            <span className="hidden md:inline">{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex gap-1 md:gap-2 bg-white p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-zinc-200 mb-6 md:mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}>
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#87D039] to-[#6BBF2A] rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                  {(profile?.name || user?.email || 'U')[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">{profile?.name || user?.name || '사용자'}</h2>
                  <p className="text-zinc-500 text-sm md:text-base">{user?.email || profile?.email || ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs md:text-sm mb-1">가입일</p>
                  <p className="font-bold text-sm md:text-base">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs md:text-sm mb-1">총 생성 이미지</p>
                  <p className="font-bold text-sm md:text-base">{totalGenerations}장</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 col-span-2 md:col-span-1">
                  <p className="text-zinc-500 text-xs md:text-sm mb-1">이번 달 사용</p>
                  <p className="font-bold text-sm md:text-base">{thisMonthUsage} 크레딧</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 text-white rounded-2xl md:rounded-3xl p-6 md:p-8">
              <p className="text-zinc-400 text-sm mb-2">보유 크레딧</p>
              <p className="text-4xl md:text-5xl font-bold mb-4">{formatNumber(currentCredits)}</p>
              <div className="flex flex-wrap gap-4 md:gap-6 mb-6">
                <div className="flex items-center gap-2"><Zap size={16} className="text-yellow-400" /><span className="text-zinc-400 text-sm">Standard</span><span className="font-bold">{formatNumber(currentCredits)}회</span></div>
                <div className="flex items-center gap-2"><Crown size={16} className="text-purple-400" /><span className="text-zinc-400 text-sm">Premium</span><span className="font-bold">{formatNumber(Math.floor(currentCredits / 3))}회</span></div>
              </div>
              <Link href="/#pricing" className="inline-flex items-center gap-2 bg-[#87D039] text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#9AE045] transition">크레딧 충전하기<ChevronRight size={18} /></Link>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Key size={20} /><h3 className="font-bold text-lg">API 키</h3><span className="text-xs text-zinc-500">({apiKeys.filter(k => k.is_active).length}/3)</span></div>
                <Link href="/mypage/api-keys" className="text-sm text-[#87D039] font-medium hover:underline">관리하기</Link>
              </div>
              {apiKeys.filter(k => k.is_active).length > 0 ? (
                <div className="space-y-2 mb-4">
                  {apiKeys.filter(k => k.is_active).slice(0, 2).map((key) => (
                    <div key={key.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><Key size={14} className="text-green-600" /></div>
                      <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{key.name}</p><p className="text-xs text-zinc-500 font-mono">{key.key_preview}</p></div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">활성</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400 mb-4"><Key size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">생성된 API 키가 없습니다</p></div>
              )}
              <Link href="/mypage/api-keys" className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 text-white rounded-xl font-medium text-sm hover:bg-black transition"><Monitor size={16} />설치형 프로그램 연동하기</Link>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">최근 생성 이미지</h3>
                <button onClick={() => setActiveTab('generations')} className="text-sm text-[#87D039] font-medium hover:underline">전체보기</button>
              </div>
              {generations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {generations.slice(0, 4).map((gen) => (
                    <div key={gen.id} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
                      {gen.generated_image_url ? (
                        <>
                          <img src={gen.generated_image_url} alt="Generated" className="w-full h-full object-cover" />
                          {/* 남은 일수 배지 */}
                          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${getExpiryColor(gen.created_at)}`}>
                            {formatRemainingTime(gen.created_at)}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400"><Image size={32} /></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400"><Sparkles size={48} className="mx-auto mb-4 opacity-50" /><p>아직 생성된 이미지가 없어요</p><Link href="/#studio" className="inline-block mt-4 text-[#87D039] font-medium hover:underline">첫 이미지 생성하기 →</Link></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'generations' && (
          <div className="space-y-6">
            {/* 7일 보관 안내 배너 */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Info size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">이미지 보관 안내</h4>
                  <p className="text-sm text-blue-700">
                    생성된 이미지는 <strong>7일간</strong> 보관됩니다. 보관 기간이 지나면 자동으로 삭제되며 복구할 수 없습니다.
                    필요한 이미지는 미리 다운로드해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 곧 만료되는 이미지 경고 */}
            {validGenerations.filter(gen => getRemainingDays(gen.created_at) <= 2).length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900 mb-1">
                      {validGenerations.filter(gen => getRemainingDays(gen.created_at) <= 2).length}개의 이미지가 곧 삭제됩니다
                    </h4>
                    <p className="text-sm text-orange-700">
                      2일 이내에 삭제될 이미지가 있습니다. 필요한 이미지는 지금 다운로드하세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">생성 내역</h3>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Clock size={14} />
                  <span>보관: 7일</span>
                </div>
              </div>

              {validGenerations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {validGenerations.map((gen, index) => (
                    <div key={gen.id} className="bg-zinc-50 rounded-xl overflow-hidden group relative">
                      <div className="aspect-square relative">
                        {gen.generated_image_url ? (
                          <>
                            <img src={gen.generated_image_url} alt="Generated" className="w-full h-full object-cover" />
                            {/* 호버 시 다운로드 버튼 */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => handleDownloadImage(gen.generated_image_url, index)}
                                className="p-3 bg-white rounded-full hover:bg-zinc-100 transition"
                              >
                                <Download size={20} className="text-zinc-900" />
                              </button>
                            </div>
                            {/* 남은 일수 배지 */}
                            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${getExpiryColor(gen.created_at)}`}>
                              {formatRemainingTime(gen.created_at)}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                            <Image size={32} />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium bg-zinc-200 px-2 py-0.5 rounded">{getModeName(gen.mode)}</span>
                        </div>
                        <p className="text-xs text-zinc-500">{formatDate(gen.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-400">
                  <Image size={48} className="mx-auto mb-4 opacity-50" />
                  <p>보관 중인 이미지가 없습니다</p>
                </div>
              )}

              {/* 만료된 이미지 기록 (접힌 상태) */}
              {expiredGenerations.length > 0 && (
                <div className="mt-8 pt-8 border-t border-zinc-200">
                  <details className="group">
                    <summary className="cursor-pointer flex items-center gap-2 text-zinc-500 hover:text-zinc-700 transition">
                      <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
                      <span className="text-sm">만료된 이미지 기록 ({expiredGenerations.length}개)</span>
                    </summary>
                    <div className="mt-4 space-y-2">
                      {expiredGenerations.slice(0, 10).map((gen) => (
                        <div key={gen.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg text-zinc-400">
                          <div className="w-10 h-10 bg-zinc-200 rounded-lg flex items-center justify-center">
                            <Image size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{getModeName(gen.mode)}</p>
                            <p className="text-xs">{formatDate(gen.created_at)}</p>
                          </div>
                          <span className="text-xs bg-zinc-200 px-2 py-0.5 rounded">삭제됨</span>
                        </div>
                      ))}
                      {expiredGenerations.length > 10 && (
                        <p className="text-xs text-zinc-400 text-center py-2">
                          외 {expiredGenerations.length - 10}개의 기록이 더 있습니다
                        </p>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 text-white rounded-2xl md:rounded-3xl p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div><p className="text-zinc-400 text-sm mb-1">현재 잔액</p><p className="text-3xl font-bold">{formatNumber(currentCredits)}</p></div>
                <div><p className="text-zinc-400 text-sm mb-1">이번 달 사용</p><p className="text-3xl font-bold">{formatNumber(thisMonthUsage)}</p></div>
                <div><p className="text-zinc-400 text-sm mb-1">총 사용량</p><p className="text-3xl font-bold">{formatNumber(usages.reduce((sum, u) => sum + u.credits_used, 0))}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <h3 className="font-bold text-lg mb-6">사용 내역</h3>
              {usages.length > 0 ? (
                <div className="space-y-3">
                  {usages.map((usage) => (
                    <div key={usage.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center"><Sparkles size={18} className="text-zinc-600" /></div>
                        <div><p className="font-medium text-sm">이미지 생성</p><p className="text-xs text-zinc-500">{formatDate(usage.created_at)}</p></div>
                      </div>
                      <span className="font-bold text-red-500">-{usage.credits_used}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-400"><CreditCard size={48} className="mx-auto mb-4 opacity-50" /><p>사용 내역이 없습니다</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <h3 className="font-bold text-lg mb-6">프로필 설정</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-zinc-700 mb-2">이름</label><input type="text" defaultValue={profile?.name || ''} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039]" placeholder="이름을 입력하세요" /></div>
                <div><label className="block text-sm font-medium text-zinc-700 mb-2">이메일</label><input type="email" value={user?.email || profile?.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500" /></div>
                <button onClick={() => toast('프로필 저장 기능은 준비 중입니다', { icon: '🚧' })} className="px-6 py-3 bg-[#87D039] text-black font-bold rounded-xl hover:bg-[#9AE045] transition">저장하기</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <h3 className="font-bold text-lg mb-6">계정 관리</h3>
              <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition disabled:opacity-50">
                <div className="flex items-center gap-3">{isLoggingOut ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <LogOut size={20} className="text-zinc-500" />}<span className="font-medium">{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span></div>
                <ChevronRight size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* 회원탈퇴 섹션 */}
            <div className="bg-red-50 rounded-2xl md:rounded-3xl border border-red-200 p-6 md:p-8">
              <h3 className="font-bold text-lg text-red-600 mb-2">위험 구역</h3>
              <p className="text-sm text-red-500 mb-6">이 작업은 되돌릴 수 없습니다</p>
              
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 hover:bg-red-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={20} className="text-red-500" />
                  <div className="text-left">
                    <p className="font-medium text-zinc-900">회원탈퇴</p>
                    <p className="text-xs text-zinc-500">계정과 모든 데이터가 영구적으로 삭제됩니다</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-red-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">회원탈퇴</h3>
              </div>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
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
                <li>보유 크레딧 ({formatNumber(currentCredits)} 크레딧)</li>
                <li>생성 이미지 히스토리 ({totalGenerations}장)</li>
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
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
