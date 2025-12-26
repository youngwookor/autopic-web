'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { RefreshCw, Trash2, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface DebugInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  online: boolean;
  screenSize: string;
  timezone: string;
}

interface AuthStatus {
  hasSession: boolean;
  sessionError: string | null;
  userId: string | null;
  email: string | null;
  expiresAt: string | null;
  provider: string | null;
}

interface StoreStatus {
  authStore: {
    isAuthenticated: boolean;
    userId: string | null;
    email: string | null;
  };
  creditsStore: {
    credits: number;
  };
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const { balance } = useCreditsStore();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 브라우저 정보 수집
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info: DebugInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        localStorage: (() => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })(),
        sessionStorage: (() => {
          try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })(),
        online: navigator.onLine,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      setDebugInfo(info);
      addLog('브라우저 정보 수집 완료');
    }
  }, []);

  // localStorage 데이터 수집
  const collectLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const data: Record<string, string> = {};
      const keys = ['autopic-auth', 'auth-storage', 'credits-storage'];
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            // JSON이면 파싱해서 요약
            const parsed = JSON.parse(value);
            data[key] = JSON.stringify(parsed, null, 2).substring(0, 500) + '...';
          } catch {
            data[key] = value.substring(0, 200) + '...';
          }
        } else {
          data[key] = '(없음)';
        }
      });
      setLocalStorageData(data);
      addLog('localStorage 데이터 수집 완료');
    }
  };

  // Supabase 세션 체크
  const checkAuthStatus = async () => {
    setIsLoading(true);
    addLog('Supabase 세션 확인 시작...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`세션 에러: ${error.message}`);
        setAuthStatus({
          hasSession: false,
          sessionError: error.message,
          userId: null,
          email: null,
          expiresAt: null,
          provider: null,
        });
      } else if (session) {
        addLog(`세션 발견: ${session.user.email}`);
        setAuthStatus({
          hasSession: true,
          sessionError: null,
          userId: session.user.id,
          email: session.user.email || null,
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null,
          provider: session.user.app_metadata?.provider || null,
        });
      } else {
        addLog('세션 없음');
        setAuthStatus({
          hasSession: false,
          sessionError: null,
          userId: null,
          email: null,
          expiresAt: null,
          provider: null,
        });
      }
    } catch (err: any) {
      addLog(`예외 발생: ${err.message}`);
      setAuthStatus({
        hasSession: false,
        sessionError: err.message,
        userId: null,
        email: null,
        expiresAt: null,
        provider: null,
      });
    }
    
    setIsLoading(false);
  };

  // Store 상태 체크
  const checkStoreStatus = () => {
    setStoreStatus({
      authStore: {
        isAuthenticated,
        userId: user?.id || null,
        email: user?.email || null,
      },
      creditsStore: {
        credits: balance?.credits || 0,
      },
    });
    addLog('Store 상태 수집 완료');
  };

  // 모든 상태 새로고침
  const refreshAll = async () => {
    addLog('=== 전체 상태 새로고침 ===');
    collectLocalStorage();
    await checkAuthStatus();
    checkStoreStatus();
  };

  // 캐시 클리어
  const clearAllCache = async () => {
    addLog('=== 캐시 클리어 시작 ===');
    
    try {
      // localStorage 클리어
      localStorage.removeItem('autopic-auth');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('credits-storage');
      addLog('localStorage 클리어 완료');
      
      // Supabase 로그아웃
      await supabase.auth.signOut({ scope: 'local' });
      addLog('Supabase 로컬 세션 클리어 완료');
      
      toast.success('캐시가 클리어되었습니다');
      
      // 상태 새로고침
      await refreshAll();
    } catch (err: any) {
      addLog(`캐시 클리어 에러: ${err.message}`);
      toast.error('캐시 클리어 실패');
    }
  };

  // 테스트 로그인 시도
  const testLogin = async () => {
    addLog('=== 테스트 로그인 시작 (Google) ===');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      
      if (error) {
        addLog(`OAuth 에러: ${error.message}`);
        toast.error(error.message);
      } else {
        addLog(`OAuth URL 생성됨: ${data.url?.substring(0, 100)}...`);
        // 리다이렉트 발생
      }
    } catch (err: any) {
      addLog(`예외: ${err.message}`);
      toast.error(err.message);
    }
    
    setIsLoading(false);
  };

  // 로그 복사
  const copyLogs = () => {
    const allInfo = `
=== AUTOPIC 디버그 정보 ===
시간: ${new Date().toLocaleString()}

=== 브라우저 정보 ===
${JSON.stringify(debugInfo, null, 2)}

=== Supabase 세션 ===
${JSON.stringify(authStatus, null, 2)}

=== Store 상태 ===
${JSON.stringify(storeStatus, null, 2)}

=== localStorage ===
${JSON.stringify(localStorageData, null, 2)}

=== 로그 ===
${logs.join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(allInfo);
    toast.success('디버그 정보가 복사되었습니다');
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const StatusIcon = ({ ok }: { ok: boolean }) => 
    ok ? <CheckCircle className="text-green-500" size={18} /> : <XCircle className="text-red-500" size={18} />;

  return (
    <div className="min-h-screen bg-zinc-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-2">🔧 로그인 디버그</h1>
          <p className="text-sm text-zinc-500 mb-4">
            이 페이지에서 로그인 문제의 원인을 파악할 수 있습니다.
          </p>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={refreshAll}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              새로고침
            </button>
            <button
              onClick={clearAllCache}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
            >
              <Trash2 size={16} />
              캐시 클리어
            </button>
            <button
              onClick={copyLogs}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium"
            >
              <Copy size={16} />
              정보 복사
            </button>
          </div>
        </div>

        {/* 브라우저 정보 */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            📱 브라우저 정보
          </h2>
          {debugInfo && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-zinc-500">쿠키 활성화</span>
                <StatusIcon ok={debugInfo.cookiesEnabled} />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-zinc-500">localStorage</span>
                <StatusIcon ok={debugInfo.localStorage} />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-zinc-500">sessionStorage</span>
                <StatusIcon ok={debugInfo.sessionStorage} />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-zinc-500">온라인 상태</span>
                <StatusIcon ok={debugInfo.online} />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-zinc-500">화면 크기</span>
                <span className="font-mono">{debugInfo.screenSize}</span>
              </div>
              <div className="py-2">
                <span className="text-zinc-500 block mb-1">User Agent</span>
                <p className="font-mono text-xs bg-zinc-100 p-2 rounded break-all">
                  {debugInfo.userAgent}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Supabase 세션 */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            🔐 Supabase 세션
            {authStatus?.hasSession ? (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">활성</span>
            ) : (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">없음</span>
            )}
          </h2>
          {authStatus && (
            <div className="space-y-2 text-sm">
              {authStatus.sessionError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{authStatus.sessionError}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-zinc-500">User ID</span>
                <span className="font-mono text-xs">{authStatus.userId || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-zinc-500">Email</span>
                <span>{authStatus.email || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-zinc-500">Provider</span>
                <span>{authStatus.provider || '-'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">만료 시간</span>
                <span className="text-xs">{authStatus.expiresAt || '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Store 상태 */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-bold mb-4">📦 Store 상태</h2>
          {storeStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-zinc-500">isAuthenticated</span>
                <StatusIcon ok={storeStatus.authStore.isAuthenticated} />
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-zinc-500">User ID</span>
                <span className="font-mono text-xs">{storeStatus.authStore.userId || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-zinc-500">Email</span>
                <span>{storeStatus.authStore.email || '-'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Credits</span>
                <span className="font-bold">{storeStatus.creditsStore.credits}</span>
              </div>
            </div>
          )}
        </div>

        {/* localStorage */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-bold mb-4">💾 localStorage</h2>
          <div className="space-y-3">
            {Object.entries(localStorageData).map(([key, value]) => (
              <div key={key}>
                <p className="text-sm font-medium text-zinc-700 mb-1">{key}</p>
                <pre className="text-xs bg-zinc-100 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                  {value}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* 테스트 로그인 */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-bold mb-4">🧪 테스트 로그인</h2>
          <p className="text-sm text-zinc-500 mb-4">
            캐시를 클리어한 후 아래 버튼으로 로그인을 테스트하세요.
          </p>
          <button
            onClick={testLogin}
            disabled={isLoading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50"
          >
            Google 로그인 테스트
          </button>
        </div>

        {/* 로그 */}
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="font-bold mb-4 text-white">📋 로그</h2>
          <div className="bg-black rounded-lg p-4 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-zinc-500 text-sm">로그가 없습니다</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className="text-green-400 text-xs font-mono mb-1">{log}</p>
              ))
            )}
          </div>
        </div>

        {/* 도움말 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h2 className="font-bold mb-2 text-yellow-800">💡 문제 해결 방법</h2>
          <ol className="text-sm text-yellow-700 space-y-2 list-decimal list-inside">
            <li><strong>캐시 클리어</strong> 버튼을 눌러 모든 저장된 데이터를 삭제</li>
            <li><strong>Google 로그인 테스트</strong> 버튼으로 로그인 시도</li>
            <li>문제가 지속되면 <strong>정보 복사</strong> 버튼을 눌러 개발자에게 전달</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
