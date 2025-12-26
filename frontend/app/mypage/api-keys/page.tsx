'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Monitor, Download, ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${API_URL}/api/keys/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('API 키 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id,
          name: newKeyName || 'Default'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewlyGeneratedKey(data.api_key);
        setShowNewKeyModal(false);
        setNewKeyName('');
        toast.success('API 키가 생성되었습니다!');
        fetchApiKeys();
      } else {
        toast.error(data.detail || 'API 키 생성 실패');
      }
    } catch (error) {
      toast.error('API 키 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('이 API 키를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_URL}/api/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('API 키가 삭제되었습니다');
        fetchApiKeys();
      } else {
        toast.error('API 키 삭제 실패');
      }
    } catch (error) {
      toast.error('API 키 삭제 중 오류가 발생했습니다');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('클립보드에 복사되었습니다!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">API 키 관리</h1>
            <p className="text-sm text-zinc-500">설치형 프로그램에서 사용할 API 키를 관리합니다</p>
          </div>
        </div>

        {/* 새로 생성된 키 표시 */}
        {newlyGeneratedKey && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-bold text-green-800 mb-1">새 API 키가 생성되었습니다!</h3>
                <p className="text-sm text-green-700 mb-3">
                  이 키는 다시 표시되지 않습니다. 지금 복사해서 안전한 곳에 보관하세요.
                </p>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-green-200">
                  <code className="flex-1 text-sm font-mono break-all">
                    {showKey ? newlyGeneratedKey : '•'.repeat(40)}
                  </code>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-2 hover:bg-zinc-100 rounded-lg"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(newlyGeneratedKey)}
                    className="p-2 hover:bg-zinc-100 rounded-lg text-green-600"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewlyGeneratedKey(null)}
                className="text-green-500 hover:text-green-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* API 키 목록 */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={18} />
              <span className="font-bold">내 API 키</span>
              <span className="text-xs text-zinc-500">({apiKeys.length}/3)</span>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              disabled={apiKeys.length >= 3}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              새 키 생성
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <Key size={40} className="mx-auto mb-3 opacity-30" />
              <p className="mb-1">생성된 API 키가 없습니다</p>
              <p className="text-sm">설치형 프로그램을 사용하려면 API 키를 생성하세요</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${key.is_active ? 'bg-green-100' : 'bg-zinc-100'}`}>
                    <Key size={18} className={key.is_active ? 'text-green-600' : 'text-zinc-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      {key.is_active ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">활성</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded">비활성</span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500 font-mono">{key.key_preview}</div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        생성: {formatDate(key.created_at)}
                      </span>
                      {key.last_used_at && (
                        <span>마지막 사용: {formatDate(key.last_used_at)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteApiKey(key.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 설치형 프로그램 다운로드 */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#87D039] rounded-xl flex items-center justify-center flex-shrink-0">
              <Monitor size={24} className="text-black" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">설치형 프로그램 다운로드</h3>
              <p className="text-sm text-zinc-400 mb-4">
                대량 일괄 처리, 상품명 정제, SEO 자동 생성 등 고급 기능을 이용하세요
              </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="https://ryehnwfulpkmeqcsiodm.supabase.co/storage/v1/object/public/downloads/Autopic_v2.7_Windows.zip" 
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-100 transition-colors"
                >
                  <Download size={16} />
                  Windows 다운로드
                </a>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition-colors cursor-not-allowed" disabled>
                  <Download size={16} />
                  Mac (준비중)
                </button>
              </div>
            </div>
          </div>

          {/* 사용 방법 */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="font-medium mb-3">사용 방법</h4>
            <ol className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                <span>위에서 API 키를 생성하고 복사합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                <span>설치형 프로그램을 다운로드하여 실행합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                <span>프로그램 설정에서 API 키를 입력합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                <span>크레딧이 자동으로 연동되어 바로 사용할 수 있습니다</span>
              </li>
            </ol>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-1">API 키 보안 주의사항</p>
              <ul className="text-amber-700 space-y-1">
                <li>• API 키는 절대 다른 사람과 공유하지 마세요</li>
                <li>• 키가 노출되었다면 즉시 삭제하고 새로 생성하세요</li>
                <li>• 사용자당 최대 3개의 API 키를 생성할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 새 키 생성 모달 */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">새 API 키 생성</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">키 이름 (선택)</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="예: 메인 PC, 노트북"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <p className="text-xs text-zinc-500 mt-1">어떤 기기에서 사용하는지 구분하기 위한 이름입니다</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="flex-1 py-2.5 border border-zinc-300 rounded-lg font-medium hover:bg-zinc-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={generateApiKey}
                disabled={isGenerating}
                className="flex-1 py-2.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
              >
                {isGenerating ? '생성 중...' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
