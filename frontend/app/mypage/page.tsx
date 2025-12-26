'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, signOut } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { 
  User, CreditCard, Image, Settings, LogOut, 
  Zap, Crown, ChevronRight, Download,
  ArrowLeft, Sparkles, Key, Monitor
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

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAuthStore();
  const { balance, setBalance } = useCreditsStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [usages, setUsages] = useState<Usage[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // 데이터 로드 함수
  const loadData = async (userId: string) => {
    try {
      // 프로필 로드
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile(profileData);
        setBalance(profileData.credits || 0);
      }

      // 생성 내역 로드
      const { data: generationsData } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      setGenerations(generationsData || []);

      // 사용 내역 로드
      const { data: usagesData } = await supabase
        .from('usages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setUsages(usagesData || []);

      // API 키 로드 (에러 무시)
      try {
        const keysResponse = await fetch(`${API_URL}/api/keys/${userId}`);
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setApiKeys(keysData.keys || []);
        }
      } catch (e) {
        console.log('API keys load skipped');
      }
    } catch (error) {
      console.error('Data load error:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Supabase 세션 직접 확인
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          if (isMounted) {
            router.replace('/login');
          }
          return;
        }

        const userId = session.user.id;

        // Store 업데이트
        if (isMounted) {
          setUser({
            id: userId,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
          });
        }

        // 데이터 로드
        await loadData(userId);

      } catch (error) {
        console.error('Init error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Supabase 로그아웃
      await supabase.auth.signOut();
      
      // Store 초기화
      storeLogout();
      setBalance(0);
      
      // 로컬 스토리지 클리어
      if (typeof window !== 'undefined') {
        localStorage.removeItem('autopic-auth');
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('credits-storage');
        sessionStorage.clear();
      }
      
      toast.success('로그아웃 되었습니다');
      
      // 홈으로 이동
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('로그아웃 중 오류가 발생했습니다');
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeName = (mode: string) => {
    const modes: Record<string, string> = {
      'still': '스틸컷',
      'product': '정물',
      'model': '모델컷',
      'editorial_still': '에디토리얼 스틸',
      'editorial_product': '화보 정물',
      'editorial_model': '화보 모델'
    };
    return modes[mode] || mode;
  };

  // 로딩 중
  if (isLoading) {
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

  // 크레딧 값
  const currentCredits = balance?.credits ?? profile?.credits ?? 0;

  // 이번 달 사용량
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const thisMonthUsage = usages
    .filter(u => new Date(u.created_at) >= thisMonth)
    .reduce((sum, u) => sum + u.credits_used, 0);

  // 총 생성 이미지 (generations 테이블 기준)
  const totalGenerations = generations.length;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-100 rounded-lg transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold">마이페이지</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition text-sm disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
            <span className="hidden md:inline">{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 탭 네비게이션 */}
        <div className="flex gap-1 md:gap-2 bg-white p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-zinc-200 mb-6 md:mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:text-black hover:bg-zinc-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 프로필 카드 */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#87D039] to-[#6BBF2A] rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                  {(profile?.name || user?.email || 'U')[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">{profile?.name || '사용자'}</h2>
                  <p className="text-zinc-500 text-sm md:text-base">{user?.email || profile?.email || ''}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs md:text-sm mb-1">가입일</p>
                  <p className="font-bold text-sm md:text-base">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'}
                  </p>
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

            {/* 크레딧 카드 */}
            <div className="bg-zinc-900 text-white rounded-2xl md:rounded-3xl p-6 md:p-8">
              <p className="text-zinc-400 text-sm mb-2">보유 크레딧</p>
              <p className="text-4xl md:text-5xl font-bold mb-4">{formatNumber(currentCredits)}</p>
              <div className="flex flex-wrap gap-4 md:gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-zinc-400 text-sm">Standard</span>
                  <span className="font-bold">{formatNumber(currentCredits)}회</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-purple-400" />
                  <span className="text-zinc-400 text-sm">Premium</span>
                  <span className="font-bold">{formatNumber(Math.floor(currentCredits / 3))}회</span>
                </div>
              </div>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 bg-[#87D039] text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#9AE045] transition"
              >
                크레딧 충전하기
                <ChevronRight size={18} />
              </Link>
            </div>

            {/* API 키 카드 */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key size={20} />
                  <h3 className="font-bold text-lg">API 키</h3>
                  <span className="text-xs text-zinc-500">({apiKeys.filter(k => k.is_active).length}/3)</span>
                </div>
                <Link href="/mypage/api-keys" className="text-sm text-[#87D039] font-medium hover:underline">
                  관리하기
                </Link>
              </div>
              
              {apiKeys.filter(k => k.is_active).length > 0 ? (
                <div className="space-y-2 mb-4">
                  {apiKeys.filter(k => k.is_active).slice(0, 2).map((key) => (
                    <div key={key.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Key size={14} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{key.name}</p>
                        <p className="text-xs text-zinc-500 font-mono">{key.key_preview}</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">활성</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400 mb-4">
                  <Key size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">생성된 API 키가 없습니다</p>
                </div>
              )}
              
              <Link
                href="/mypage/api-keys"
                className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 text-white rounded-xl font-medium text-sm hover:bg-black transition"
              >
                <Monitor size={16} />
                설치형 프로그램 연동하기
              </Link>
            </div>

            {/* 최근 생성 이미지 */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">최근 생성 이미지</h3>
                <button onClick={() => setActiveTab('generations')} className="text-sm text-[#87D039] font-medium hover:underline">
                  전체보기
                </button>
              </div>
              
              {generations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {generations.slice(0, 4).map((gen) => (
                    <div key={gen.id} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 relative group">
                      {gen.generated_image_url ? (
                        <img src={gen.generated_image_url} alt="Generated" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Image size={32} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400">
                  <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                  <p>아직 생성된 이미지가 없어요</p>
                  <Link href="/#studio" className="inline-block mt-4 text-[#87D039] font-medium hover:underline">
                    첫 이미지 생성하기 →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'generations' && (
          <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
            <h3 className="font-bold text-lg mb-6">생성 내역</h3>
            {generations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generations.map((gen) => (
                  <div key={gen.id} className="bg-zinc-50 rounded-xl overflow-hidden">
                    <div className="aspect-square relative">
                      {gen.generated_image_url ? (
                        <img src={gen.generated_image_url} alt="Generated" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                          <Image size={32} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <span className="text-xs font-medium bg-zinc-200 px-2 py-0.5 rounded">{getModeName(gen.mode)}</span>
                      <p className="text-xs text-zinc-500 mt-2">{formatDate(gen.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-400">
                <Image size={48} className="mx-auto mb-4 opacity-50" />
                <p>생성 내역이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 text-white rounded-2xl md:rounded-3xl p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">현재 잔액</p>
                  <p className="text-3xl font-bold">{formatNumber(currentCredits)}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-1">이번 달 사용</p>
                  <p className="text-3xl font-bold">{formatNumber(thisMonthUsage)}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-1">총 사용량</p>
                  <p className="text-3xl font-bold">{formatNumber(usages.reduce((sum, u) => sum + u.credits_used, 0))}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <h3 className="font-bold text-lg mb-6">사용 내역</h3>
              {usages.length > 0 ? (
                <div className="space-y-3">
                  {usages.map((usage) => (
                    <div key={usage.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center">
                          <Sparkles size={18} className="text-zinc-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">이미지 생성</p>
                          <p className="text-xs text-zinc-500">{formatDate(usage.created_at)}</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-500">-{usage.credits_used}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-400">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                  <p>사용 내역이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <h3 className="font-bold text-lg mb-6">프로필 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">이름</label>
                  <input
                    type="text"
                    defaultValue={profile?.name || ''}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#87D039]"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">이메일</label>
                  <input
                    type="email"
                    value={user?.email || profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500"
                  />
                </div>
                <button
                  onClick={() => toast('프로필 저장 기능은 준비 중입니다', { icon: '🚧' })}
                  className="px-6 py-3 bg-[#87D039] text-black font-bold rounded-xl hover:bg-[#9AE045] transition"
                >
                  저장하기
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <h3 className="font-bold text-lg mb-6">계정 관리</h3>
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    {isLoggingOut ? (
                      <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut size={20} className="text-zinc-500" />
                    )}
                    <span className="font-medium">{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
                  </div>
                  <ChevronRight size={20} className="text-zinc-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
