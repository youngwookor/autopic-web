'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Download, 
  Play, 
  Pause, 
  RotateCw, 
  Sparkles,
  ArrowRight,
  Share2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VideoSharePage() {
  const params = useParams();
  const videoId = params.videoId as string;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const videoUrl = `${API_URL}/api/video/download/${videoId}`;

  useEffect(() => {
    // 비디오 로드 확인
    const checkVideo = async () => {
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        if (!response.ok) {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (videoId) {
      checkVideo();
    }
  }, [videoId, videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const downloadToast = toast.loading('비디오 다운로드 준비 중...');
    
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('다운로드 실패');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `autopic_360_${videoId.slice(0, 8)}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('다운로드 완료!', { id: downloadToast });
    } catch {
      toast.error('다운로드 실패. 다시 시도해주세요.', { id: downloadToast });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://autopic.kr/video/${videoId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AUTOPIC 360° 비디오',
          text: 'AI로 생성한 360° 상품 회전 비디오를 확인해보세요!',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('링크가 복사되었습니다!');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('링크가 복사되었습니다!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#87D039] animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">비디오 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">비디오를 찾을 수 없습니다</h1>
          <p className="text-zinc-400 text-sm mb-6">
            비디오가 삭제되었거나 링크가 잘못되었을 수 있습니다.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-[#87D039] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#9AE045] transition-colors"
          >
            <Sparkles size={18} />
            AUTOPIC 방문하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* 헤더 */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#87D039] rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-black" />
            </div>
            <span className="font-bold text-white text-lg">AUTOPIC</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">공유</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#87D039] hover:bg-[#9AE045] text-black rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span className="hidden sm:inline">다운로드</span>
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {/* 비디오 컨테이너 */}
          <div className="w-full max-w-2xl">
            {/* 360° 배지 */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full">
                <RotateCw size={14} className="text-white animate-spin" style={{animationDuration: '3s'}} />
                <span className="text-white text-sm font-bold">360° 회전 비디오</span>
              </div>
            </div>

            {/* 비디오 플레이어 */}
            <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden group shadow-2xl">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedData={() => {
                  // 자동 재생 시도
                  videoRef.current?.play().catch(() => {});
                }}
              />
              
              {/* 플레이 오버레이 */}
              <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity cursor-pointer ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
                onClick={togglePlay}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  {isPlaying ? (
                    <Pause size={28} className="text-zinc-700" />
                  ) : (
                    <Play size={28} className="text-zinc-700 ml-1" />
                  )}
                </div>
              </div>
            </div>

            {/* 액션 버튼 (모바일) */}
            <div className="flex gap-3 mt-4 sm:hidden">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
              >
                <Share2 size={18} />
                공유
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#87D039] hover:bg-[#9AE045] text-black rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                다운로드
              </button>
            </div>

            {/* 설명 */}
            <p className="text-center text-zinc-500 text-sm mt-6">
              AI가 생성한 360° 상품 회전 비디오입니다
            </p>
          </div>
        </main>

        {/* CTA 섹션 */}
        <div className="px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-2xl p-6 text-center">
              <h2 className="text-lg md:text-xl font-bold text-white mb-2">
                나만의 360° 비디오 만들기
              </h2>
              <p className="text-zinc-400 text-sm mb-4">
                상품 사진 한 장으로 AI가 4가지 앵글 이미지와 360° 회전 비디오를 생성합니다
              </p>
              <Link
                href="/#studio"
                className="inline-flex items-center gap-2 bg-[#87D039] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#9AE045] transition-colors"
              >
                <Sparkles size={18} />
                무료로 시작하기
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <footer className="border-t border-zinc-800 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between text-zinc-500 text-xs">
            <span>© 2025 AUTOPIC</span>
            <Link href="/" className="hover:text-white transition-colors">
              autopic.kr
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
