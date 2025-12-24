'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { imagesApi } from '@/lib/api';
import { modeLabels, formatRelativeTime } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import { Image, Clock, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface HistoryItem {
  id: number;
  mode: string;
  model_type: string;
  category: string | null;
  gender: string | null;
  credits_used: number;
  processing_time: number;
  image_count: number;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadHistory();
  }, [isAuthenticated, router]);

  const loadHistory = async () => {
    try {
      const data = await imagesApi.getHistory(50, 0);
      setHistory(data.items);
      setTotal(data.total);
    } catch (error) {
      toast.error('이력을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-[#87D039] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-20">
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
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">생성 이력</h1>
          <p className="text-zinc-500">총 {total}건의 이미지 생성 기록</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-zinc-50 rounded-[32px] p-16 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-200">
              <Image size={32} className="text-zinc-300" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">생성 이력이 없습니다</h3>
            <p className="text-zinc-500 mb-8">이미지를 생성하면 여기에 기록됩니다</p>
            <Link
              href="/#studio"
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white font-medium rounded-full hover:bg-black transition-colors"
            >
              <Sparkles size={18} />
              이미지 생성하기
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-zinc-50 rounded-2xl p-6 flex items-center gap-6 hover:bg-zinc-100 transition-colors"
              >
                {/* Mode Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  item.mode.includes('model') ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {item.mode.includes('model') ? (
                    <Sparkles size={24} className="text-purple-600" />
                  ) : (
                    <Image size={24} className="text-blue-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-zinc-900">
                      {modeLabels[item.mode] || item.mode}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.model_type === 'flash' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {item.model_type}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {item.category || '자동 감지'} · {item.image_count}장 생성
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 font-medium">크레딧</p>
                    <p className="text-lg font-bold text-zinc-900">{item.credits_used}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 font-medium">처리시간</p>
                    <p className="text-lg font-bold text-zinc-900">{item.processing_time?.toFixed(1)}s</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                  <Clock size={14} />
                  <span className="text-sm font-medium">{formatRelativeTime(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
