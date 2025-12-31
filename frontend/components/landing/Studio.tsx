'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { 
  Upload, 
  Trash2, 
  Plus, 
  Sparkles, 
  Loader2, 
  Download,
  ChevronLeft,
  ChevronRight,
  Zap,
  Crown,
  ImageIcon,
  Package,
  X,
  Share2,
  Link2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Video,
  RotateCw,
  Play,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import JSZip from 'jszip';

const MODEL_CONFIG = {
  standard: { credits: 1 },
  premium: { credits: 3 },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 알림음 재생 함수
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 성공 알림음 (도-미-솔 화음)
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
};

export default function Studio() {
  const router = useRouter();
  const { trackImageGenerate } = useAnalytics();
  const { user, isAuthenticated } = useAuthStore();
  const { balance, setBalance } = useCreditsStore();
  
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [subImage, setSubImage] = useState<string | null>(null);
  const [subject, setSubject] = useState<'product' | 'model'>('product');
  const [style, setStyle] = useState<'basic' | 'editorial'>('basic');
  const [modelType, setModelType] = useState<'standard' | 'premium'>('premium');
  const [target, setTarget] = useState<'fashion' | 'kids' | 'pet' | 'food'>('fashion');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingSub, setIsDraggingSub] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Pull to Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(0);
  const isPulling = useRef(false);
  
  // 핀치 줌
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const initialDistance = useRef(0);
  const zoomImageRef = useRef<HTMLDivElement>(null);

  // 공유 메뉴
  const [showShareMenu, setShowShareMenu] = useState(false);

  // 360° 비디오 관련 상태
  const VIDEO_CREDITS = 30;
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // 샘플 비디오 모달
  const [showSampleModal, setShowSampleModal] = useState(false);
  
  // 생성된 비디오 뷰어 모달
  const [showVideoViewer, setShowVideoViewer] = useState(false);

  // Portal용 mounted 상태 (SSR 대응)
  const [mounted, setMounted] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const generateButtonRef = useRef<HTMLDivElement>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<HTMLElement>(null);

  const requiredCredits = MODEL_CONFIG[modelType].credits;
  const credits = balance?.credits || 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Portal용 mounted 설정
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pull to Refresh 핸들러
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0 && isAuthenticated) {
      pullStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isAuthenticated]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY.current;
    
    if (diff > 0 && diff < 150) {
      setPullDistance(diff);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80 && isAuthenticated && user?.id) {
      setIsRefreshing(true);
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setBalance(profile.credits || 0);
          toast.success('크레딧 정보가 갱신되었습니다');
        }
      } catch (e) {
        console.error('Refresh error:', e);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    isPulling.current = false;
  }, [pullDistance, isAuthenticated, user?.id, setBalance]);

  useEffect(() => {
    const studio = studioRef.current;
    if (!studio || !isMobile) return;

    studio.addEventListener('touchstart', handleTouchStart, { passive: true });
    studio.addEventListener('touchmove', handleTouchMove, { passive: true });
    studio.addEventListener('touchend', handleTouchEnd);

    return () => {
      studio.removeEventListener('touchstart', handleTouchStart);
      studio.removeEventListener('touchmove', handleTouchMove);
      studio.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // 핀치 줌 핸들러
  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialDistance.current = Math.sqrt(dx * dx + dy * dy);
      setIsZooming(true);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isZooming) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      const scale = currentDistance / initialDistance.current;
      const newZoom = Math.min(Math.max(zoomLevel * scale, 1), 3);
      setZoomLevel(newZoom);
      initialDistance.current = currentDistance;

      // 줌 중심점 계산
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      if (zoomImageRef.current) {
        const rect = zoomImageRef.current.getBoundingClientRect();
        setZoomPosition({
          x: (centerX - rect.left - rect.width / 2) * (1 - newZoom),
          y: (centerY - rect.top - rect.height / 2) * (1 - newZoom)
        });
      }
    }
  };

  const handlePinchEnd = () => {
    setIsZooming(false);
    if (zoomLevel < 1.1) {
      setZoomLevel(1);
      setZoomPosition({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const getMode = () => {
    if (subject === 'product') {
      return style === 'editorial' ? 'editorial_product' : 'product';
    } else {
      return style === 'editorial' ? 'editorial_model' : 'model';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'sub') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'main') {
          setMainImage(result);
          if (isMobile) {
            setTimeout(() => {
              generateButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }
        } else {
          setSubImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'main' | 'sub', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'main') setIsDraggingMain(active);
    else setIsDraggingSub(active);
  };

  const handleDrop = (e: React.DragEvent, type: 'main' | 'sub') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'main') setIsDraggingMain(false);
    else setIsDraggingSub(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'main') {
          setMainImage(result);
          if (isMobile) {
            setTimeout(() => {
              generateButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }
        } else {
          setSubImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (type: 'main' | 'sub') => {
    if (type === 'main') setMainImage(null);
    else setSubImage(null);
  };

  const handleGenerate = async () => {
    if (!mainImage) {
      toast.error('이미지를 먼저 업로드해주세요');
      return;
    }

    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    if (credits < requiredCredits) {
      toast.error(`크레딧이 부족합니다. ${requiredCredits}크레딧이 필요합니다.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    resetZoom();

    if (isMobile && resultSectionRef.current) {
      setTimeout(() => {
        const element = resultSectionRef.current;
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    }

    try {
      const mode = getMode();
      
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          image_base64: mainImage,
          mode: mode,
          model_type: modelType,
          gender: 'auto',
          category: target === 'kids' ? '키즈' : target === 'pet' ? '펫용품' : target === 'food' ? '식품' : 'auto',
          target: target === 'kids' ? '아동' : target === 'pet' ? '반려동물' : target === 'food' ? '식품' : '사람',
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '이미지 생성 실패');
      }

      const images = data.images.map((img: string) => `data:image/jpeg;base64,${img}`);
      setGeneratedImages(images);
      setSelectedImageIndex(0);
      setBalance(data.remaining_credits);
      
      // 생성 완료 알림음 재생
      playNotificationSound();
      
      // Analytics: 이미지 생성 추적
      trackImageGenerate({
        productType: target,
        imageType: subject === 'product' ? '정물' : '인물',
        creditsUsed: data.credits_used,
      });
      
      toast.success(`이미지 생성 완료! (4장, ${data.credits_used}크레딧 사용)`);

      if (isMobile && resultSectionRef.current) {
        setTimeout(() => {
          const element = resultSectionRef.current;
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 100);
      }
      
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || '이미지 생성 실패. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (index?: number) => {
    const targetIndex = index !== undefined ? index : selectedImageIndex;
    const image = generatedImages[targetIndex];
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image;
    link.download = `autopic_${getMode()}_${targetIndex + 1}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('다운로드 완료!');
  };

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      const folder = zip.folder('autopic_images');
      
      for (let i = 0; i < generatedImages.length; i++) {
        const image = generatedImages[i];
        const base64Data = image.split(',')[1];
        folder?.file(`autopic_${getMode()}_${i + 1}.jpg`, base64Data, { base64: true });
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `autopic_images_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('전체 이미지 다운로드 완료!');
    } catch (error) {
      toast.error('다운로드 실패. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  // base64를 Blob으로 변환하는 헬퍼 함수
  const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
    const base64Data = base64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // 공유 기능 - PC/모바일 분리 처리
  const handleShare = async (type: 'link' | 'kakao') => {
    const image = generatedImages[selectedImageIndex];
    if (!image) return;

    // 모바일 감지
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (type === 'link') {
      // 이미지 복사하기
      try {
        const blob = base64ToBlob(image, 'image/png');
        
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          // PNG로 복사 (호환성을 위해)
          const pngBlob = new Blob([blob], { type: 'image/png' });
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob })
          ]);
          toast.success('이미지가 클립보드에 복사되었습니다!');
        } else {
          // 클립보드 API 미지원 시 다운로드로 안내
          toast.error('이 브라우저에서는 이미지 복사를 지원하지 않습니다. 다운로드를 이용해주세요.');
        }
      } catch (e) {
        console.error('Image copy error:', e);
        toast.error('이미지 복사에 실패했습니다. 다운로드를 이용해주세요.');
      }
    } else if (type === 'kakao') {
      // 이미지 공유하기
      const blob = base64ToBlob(image, 'image/jpeg');
      const file = new File([blob], `autopic_image_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      if (isMobileDevice && navigator.share) {
        // 모바일: Web Share API 사용
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'AUTOPIC - AI 상품 이미지',
              text: 'AI로 생성한 고품질 상품 이미지를 확인해보세요!',
              files: [file]
            });
          } else {
            // 파일 공유 미지원 시 URL 공유
            await navigator.share({
              title: 'AUTOPIC - AI 상품 이미지',
              text: 'AI로 생성한 고품질 상품 이미지를 확인해보세요!',
              url: window.location.origin
            });
          }
        } catch (e) {
          if ((e as Error).name !== 'AbortError') {
            console.error('Share error:', e);
            toast.error('공유에 실패했습니다');
          }
        }
      } else {
        // PC: 이미지 다운로드로 대체
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `autopic_image_${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('이미지 다운로드 완료! SNS에 직접 업로드해주세요.');
        } catch (e) {
          console.error('Download error:', e);
          toast.error('다운로드에 실패했습니다');
        }
      }
    }
    
    setShowShareMenu(false);
  };

  // 360° 비디오 생성 시작
  const handleVideoGenerate = async () => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (credits < VIDEO_CREDITS) {
      toast.error(`크레딧이 부족합니다. ${VIDEO_CREDITS}크레딧이 필요합니다.`);
      return;
    }

    if (generatedImages.length < 4) {
      toast.error('이미지 4장이 필요합니다');
      return;
    }

    setVideoGenerating(true);
    setVideoProgress(0);
    setVideoStatus('pending');
    setVideoError(null);
    setShowVideoModal(false);

    try {
      // base64 데이터만 추출 (data:image/jpeg;base64, 제거)
      const imageData = generatedImages.map(img => img.split(',')[1]);
      
      const response = await fetch(`${API_URL}/api/video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          images: imageData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVideoId(data.video_id);
        toast.success('비디오 생성이 시작되었습니다!');
        
        // 크레딧 갱신
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();
        if (profile) setBalance(profile.credits || 0);
        
        // 폴링 시작
        startVideoPolling(data.video_id);
      } else {
        setVideoStatus('failed');
        setVideoError(data.error || '비디오 생성 시작 실패');
        toast.error(data.error || '비디오 생성 시작 실패');
        setVideoGenerating(false);
      }
    } catch (err: any) {
      setVideoStatus('failed');
      setVideoError(err.message || '비디오 생성 중 오류 발생');
      toast.error('비디오 생성 중 오류가 발생했습니다');
      setVideoGenerating(false);
    }
  };

  // 비디오 상태 폴링
  const startVideoPolling = (vidId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/video/status/${vidId}`);
        const data = await response.json();
        
        if (data.success) {
          const { status, progress, video_url, error_message } = data;
          
          setVideoStatus(status);
          setVideoProgress(progress || 0);
          
          if (status === 'completed') {
            setVideoUrl(video_url);
            setVideoGenerating(false);
            playNotificationSound();
            toast.success('360° 비디오 생성 완료!');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
          } else if (status === 'failed') {
            setVideoError(error_message || '비디오 생성 실패');
            setVideoGenerating(false);
            toast.error('비디오 생성에 실패했습니다');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
          }
        }
      } catch (err) {
        console.error('폴링 오류:', err);
      }
    }, 5000); // 5초마다 체크
  };

  // 비디오 다운로드
  const handleVideoDownload = () => {
    if (videoId) {
      window.open(`${API_URL}/api/video/download/${videoId}`, '_blank');
      toast.success('비디오 다운로드 시작!');
    }
  };

  // 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 모달 열림 시 스크롤 방지
  useEffect(() => {
    if (showVideoModal || showSampleModal || showVideoViewer || isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showVideoModal, showSampleModal, showVideoViewer, isModalOpen]);

  const goToPrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? generatedImages.length - 1 : prev - 1));
    resetZoom();
  };

  const goToNextImage = () => {
    setSelectedImageIndex((prev) => (prev === generatedImages.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (generatedImages.length === 0) return;
      if (e.key === 'ArrowLeft') goToPrevImage();
      if (e.key === 'ArrowRight') goToNextImage();
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generatedImages.length]);

  // PC에서는 클릭 확대 비활성화 (모바일은 핀치줌 사용)
  const handleImageClick = () => {
    // 모바일은 핀치줌 사용, PC는 확대 없음
  };

  return (
    <>
      <section ref={studioRef} id="studio" className="py-12 md:py-16 bg-white px-4 md:px-6 relative">
        {/* Pull to Refresh 인디케이터 */}
        {isMobile && isAuthenticated && (
          <div 
            className={`absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-200 ${
              pullDistance > 0 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transform: `translateX(-50%) translateY(${Math.min(pullDistance / 2, 40)}px)` }}
          >
            <div className={`flex items-center gap-2 bg-[#87D039] text-black px-4 py-2 rounded-full text-xs font-bold ${
              isRefreshing ? 'animate-pulse' : ''
            }`}>
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? '갱신 중...' : pullDistance > 80 ? '놓으면 새로고침' : '당겨서 새로고침'}
            </div>
          </div>
        )}

        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <span className="inline-block px-3 py-1 rounded-full border border-zinc-200 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 mb-2 md:mb-3 text-zinc-500">
              AI Studio
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 md:mb-3">AI 이미지 생성</h2>
            <p className="text-zinc-500 text-sm md:text-lg">상품 사진을 업로드하고 전문 스튜디오 퀄리티의 이미지를 생성하세요.</p>
          </div>

          <div className="bg-zinc-50 rounded-2xl md:rounded-[32px] border border-zinc-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              
              {/* Left: Controls */}
              <div className="p-4 md:p-6 lg:p-7 border-b lg:border-b-0 lg:border-r border-zinc-200">
                {isAuthenticated && (
                  <div className="flex items-center justify-between mb-4 md:mb-5 pb-3 md:pb-4 border-b border-zinc-200">
                    <span className="text-xs md:text-sm font-medium text-zinc-500">보유 크레딧</span>
                    <div className="bg-black text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold">
                      {credits} 크레딧
                    </div>
                  </div>
                )}

                <div className="mb-4 md:mb-5">
                  <h3 className="text-sm md:text-base font-bold text-zinc-900 mb-2 md:mb-3 flex items-center gap-2">
                    <Upload size={14} className="text-[#87D039] md:w-4 md:h-4" />
                    사진 업로드
                  </h3>

                  <div className="mb-2 md:mb-3">
                    <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">메인 이미지 (필수)</label>
                    <div 
                      onDragOver={(e) => handleDrag(e, 'main', true)}
                      onDragLeave={(e) => handleDrag(e, 'main', false)}
                      onDrop={(e) => handleDrop(e, 'main')}
                      onClick={() => !mainImage && mainInputRef.current?.click()}
                      className={`relative aspect-[4/3] md:aspect-[3/2] w-full rounded-xl md:rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex items-center justify-center ${mainImage ? 'border-zinc-300 bg-white' : isDraggingMain ? 'border-[#87D039] bg-lime-50' : 'border-zinc-300 hover:border-zinc-400 bg-white'}`}
                    >
                      <input type="file" ref={mainInputRef} onChange={(e) => handleFileChange(e, 'main')} className="hidden" accept="image/*" />
                      {mainImage ? (
                        <>
                          <img src={mainImage} alt="Main" className="w-full h-full object-contain p-2 md:p-3" />
                          <button onClick={(e) => { e.stopPropagation(); removeImage('main'); }} className="absolute top-2 md:top-3 right-2 md:right-3 bg-white p-1.5 md:p-2 rounded-full hover:text-red-500 shadow-md transition-colors">
                            <Trash2 size={14} className="md:w-4 md:h-4"/>
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400 gap-1.5 md:gap-2">
                          <Upload className={`transition-transform duration-300 ${isDraggingMain ? '-translate-y-2 text-[#87D039]' : ''}`} size={24}/>
                          <p className="text-xs md:text-sm font-medium text-zinc-500 text-center px-4">탭하여 업로드<span className="hidden md:inline"> 또는 드래그</span></p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">후면/디테일 이미지 (선택)</label>
                    <div 
                      onDragOver={(e) => handleDrag(e, 'sub', true)}
                      onDragLeave={(e) => handleDrag(e, 'sub', false)}
                      onDrop={(e) => handleDrop(e, 'sub')}
                      onClick={() => !subImage && subInputRef.current?.click()}
                      className={`relative h-12 md:h-14 w-full rounded-lg md:rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex items-center justify-center ${subImage ? 'border-zinc-300 bg-white' : isDraggingSub ? 'border-[#87D039] bg-lime-50' : 'border-zinc-300 hover:border-zinc-400 bg-white'}`}
                    >
                      <input type="file" ref={subInputRef} onChange={(e) => handleFileChange(e, 'sub')} className="hidden" accept="image/*" />
                      {subImage ? (
                        <div className="flex items-center w-full h-full px-3 md:px-4 gap-3 md:gap-4">
                          <img src={subImage} alt="Sub" className="h-8 w-8 md:h-10 md:w-10 object-cover rounded-lg" />
                          <p className="text-xs md:text-sm font-medium text-zinc-600 flex-1">참조 이미지 추가됨</p>
                          <button onClick={(e) => { e.stopPropagation(); removeImage('sub'); }} className="p-1.5 md:p-2 hover:text-red-500">
                            <Trash2 size={14} className="md:w-4 md:h-4"/>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-zinc-400 gap-1.5 md:gap-2">
                          <Plus size={14} className="md:w-4 md:h-4"/>
                          <p className="text-xs md:text-sm font-medium">추가 이미지 (선택)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-sm md:text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Sparkles size={14} className="text-[#87D039] md:w-4 md:h-4" />
                    생성 옵션
                  </h3>

                  <div>
                    <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">AI 모델</label>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <button 
                        onClick={() => setModelType('standard')} 
                        className={`py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 border ${modelType === 'standard' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                      >
                        <Zap size={12} className="md:w-3.5 md:h-3.5" />
                        Standard · 1크레딧
                      </button>
                      <button 
                        onClick={() => setModelType('premium')} 
                        className={`py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 border ${modelType === 'premium' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                      >
                        <Crown size={12} className="md:w-3.5 md:h-3.5" />
                        Premium · 3크레딧
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">생성 유형</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button 
                          onClick={() => setSubject('product')}
                          className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${subject === 'product' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                          🖼️ 정물
                        </button>
                        <button 
                          onClick={() => setSubject('model')}
                          className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${subject === 'model' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                          👤 인물
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">스타일</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button 
                          onClick={() => setStyle('basic')}
                          className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${style === 'basic' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                          📷 일반
                        </button>
                        <button 
                          onClick={() => setStyle('editorial')}
                          className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${style === 'editorial' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                          ✨ 화보
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-100 rounded-xl px-3 py-2">
                    <p className="text-xs text-zinc-600">
                      선택: <span className="font-bold text-zinc-900">
                        {subject === 'product' ? '정물' : '인물'} · {style === 'basic' ? '일반' : '화보'}
                      </span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {subject === 'product' && style === 'basic' && '📦 깔끔한 배경의 상품 중심 이미지'}
                      {subject === 'product' && style === 'editorial' && '✨ 룩북/화보 스타일의 고급스러운 정물 이미지'}
                      {subject === 'model' && style === 'basic' && '👕 자연스러운 모델 착용 이미지'}
                      {subject === 'model' && style === 'editorial' && '✨ 룩북/화보 스타일의 고급스러운 모델 이미지'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">상품 타입</label>
                    <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                      <button 
                        onClick={() => setTarget('fashion')} 
                        className={`py-2 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs transition-all border flex flex-col items-center gap-0.5 ${target === 'fashion' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                      >
                        <span className="text-sm md:text-base">👗</span>
                        <span>패션</span>
                      </button>
                      <button 
                        onClick={() => setTarget('kids')} 
                        className={`py-2 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs transition-all border flex flex-col items-center gap-0.5 ${target === 'kids' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                      >
                        <span className="text-sm md:text-base">👶</span>
                        <span>키즈</span>
                      </button>
                      <button 
                        onClick={() => setTarget('pet')} 
                        className={`py-2 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs transition-all border flex flex-col items-center gap-0.5 ${target === 'pet' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                      >
                        <span className="text-sm md:text-base">🐕</span>
                        <span>펫</span>
                      </button>
                      <button 
                        onClick={() => setTarget('food')} 
                        className={`py-2 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs transition-all border flex flex-col items-center gap-0.5 ${target === 'food' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                      >
                        <span className="text-sm md:text-base">🍔</span>
                        <span>식품</span>
                      </button>
                    </div>
                    {/* 식품 + 인물 조합 경고 */}
                    {target === 'food' && subject === 'model' && (
                      <p className="text-[10px] text-orange-600 mt-1.5 bg-orange-50 px-2 py-1 rounded">
                        ⚠️ 식품은 정물 모드에 최적화되어 있습니다
                      </p>
                    )}
                  </div>

                  <div ref={generateButtonRef}>
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !mainImage}
                      className="w-full py-3 md:py-3.5 bg-[#87D039] text-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base hover:bg-[#9AE045] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                      {isGenerating ? '생성 중...' : `이미지 생성 (${requiredCredits}크레딧)`}
                    </button>
                  </div>
                  
                  {!isAuthenticated && (
                    <p className="text-center text-xs md:text-sm text-zinc-500">
                      <Link href="/login" className="text-[#87D039] font-bold hover:underline">로그인</Link>하고 무료로 시작하세요
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Preview */}
              <div ref={resultSectionRef} className="p-4 md:p-6 lg:p-7 bg-white flex flex-col">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-base font-bold text-zinc-900">생성 결과</h3>
                  {generatedImages.length > 0 && (
                    <div className="flex items-center gap-2">
                      {/* 공유 버튼 */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-full hover:bg-zinc-200 transition-colors"
                        >
                          <Share2 size={12} />
                          공유
                        </button>
                        
                        {/* 공유 메뉴 드롭다운 */}
                        {showShareMenu && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowShareMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-20 min-w-[160px]">
                              <button
                                onClick={() => handleShare('link')}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 transition"
                              >
                                <Link2 size={16} className="text-zinc-500" />
                                이미지 복사
                              </button>
                              <button
                                onClick={() => handleShare('kakao')}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 transition"
                              >
                                <Share2 size={16} className="text-zinc-500" />
                                {isMobile ? '공유하기' : 'SNS 공유용 다운'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 다운로드 버튼 */}
                      <button 
                        onClick={() => handleDownload()}
                        className="flex md:hidden items-center gap-1.5 text-xs font-medium text-black bg-[#87D039] px-3 py-1.5 rounded-full hover:bg-[#9AE045] transition-colors"
                      >
                        <Download size={12} />
                        다운로드
                      </button>
                      <button 
                        onClick={handleDownloadAll}
                        disabled={isDownloading}
                        className="hidden md:flex items-center gap-2 text-sm font-medium text-black bg-[#87D039] px-4 py-2 rounded-full hover:bg-[#9AE045] transition-colors disabled:opacity-50"
                      >
                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                        {isDownloading ? '압축 중...' : '전체 다운로드'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-h-[280px] md:min-h-[350px]">
                  {isGenerating ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="animate-spin mx-auto mb-3 md:mb-4 text-[#87D039]" size={40} />
                        <h4 className="text-base md:text-lg font-bold mb-1 md:mb-2">이미지 생성 중</h4>
                        <p className="text-zinc-500 text-xs md:text-sm">AI가 열심히 작업하고 있습니다...</p>
                        <p className="text-zinc-400 text-xs mt-2">약 30초~1분 소요</p>
                      </div>
                    </div>
                  ) : generatedImages.length > 0 ? (
                    <>
                      {/* 메인 이미지 - 핀치 줌 지원 */}
                      <div 
                        ref={zoomImageRef}
                        className={`relative flex-1 flex items-center justify-center mb-3 md:mb-4 bg-zinc-50 rounded-xl md:rounded-2xl p-3 md:p-4 min-h-[200px] md:min-h-[280px] overflow-hidden ${!isMobile ? 'cursor-pointer' : ''}`}
                        onMouseEnter={() => !isMobile && setIsHovered(true)}
                        onMouseLeave={() => !isMobile && setIsHovered(false)}
                        onClick={handleImageClick}
                        onTouchStart={(e) => {
                          if (isMobile) {
                            if (e.touches.length === 2) {
                              handlePinchStart(e);
                            } else if (e.touches.length === 1 && zoomLevel === 1) {
                              (e.currentTarget as any).touchStartX = e.touches[0].clientX;
                            }
                          }
                        }}
                        onTouchMove={(e) => {
                          if (isMobile && e.touches.length === 2) {
                            handlePinchMove(e);
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (isMobile) {
                            if (isZooming) {
                              handlePinchEnd();
                            } else if (zoomLevel === 1) {
                              const diff = (e.currentTarget as any).touchStartX - e.changedTouches[0].clientX;
                              if (Math.abs(diff) > 50) {
                                if (diff > 0) goToNextImage();
                                else goToPrevImage();
                              }
                            }
                          }
                        }}
                      >
                        {/* 줌 컨트롤 (모바일) */}
                        {isMobile && generatedImages.length > 0 && (
                          <div className="absolute top-2 right-2 flex gap-1 z-20">
                            {zoomLevel > 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                                className="bg-black/50 text-white p-1.5 rounded-full"
                              >
                                <ZoomOut size={16} />
                              </button>
                            )}
                          </div>
                        )}

                        {/* 줌 힌트 */}
                        {isMobile && zoomLevel === 1 && generatedImages.length > 0 && (
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full z-10 flex items-center gap-1">
                            <ZoomIn size={10} />
                            두 손가락으로 확대
                          </div>
                        )}

                        {generatedImages.length > 1 && zoomLevel === 1 && (
                          <>
                            <button 
                              className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 ${isHovered ? 'opacity-100' : 'md:opacity-0 opacity-70'}`}
                              onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                            >
                              <ChevronLeft size={20} className="text-white" />
                            </button>
                            <button 
                              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 ${isHovered ? 'opacity-100' : 'md:opacity-0 opacity-70'}`}
                              onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                            >
                              <ChevronRight size={20} className="text-white" />
                            </button>
                          </>
                        )}
                        
                        {generatedImages.length > 1 && zoomLevel === 1 && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {generatedImages.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                                className={`w-2 h-2 rounded-full transition ${idx === selectedImageIndex ? 'bg-[#87D039]' : 'bg-zinc-300'}`}
                              />
                            ))}
                          </div>
                        )}

                        <img 
                          src={generatedImages[selectedImageIndex]} 
                          alt={`Generated ${selectedImageIndex + 1}`} 
                          className="max-w-full max-h-[250px] md:max-h-[320px] rounded-lg md:rounded-xl shadow-lg object-contain transition-transform duration-200"
                          style={{
                            transform: `scale(${zoomLevel}) translate(${zoomPosition.x / zoomLevel}px, ${zoomPosition.y / zoomLevel}px)`,
                          }}
                          draggable={false}
                        />

                        {isHovered && !isMobile && (
                          <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
                            클릭하여 전체화면
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 md:gap-3">
                        {generatedImages.map((img, index) => (
                          <div 
                            key={index}
                            onClick={() => { setSelectedImageIndex(index); resetZoom(); }}
                            className={`relative aspect-square rounded-lg md:rounded-xl overflow-hidden cursor-pointer transition-all ${selectedImageIndex === index ? 'ring-2 md:ring-3 ring-[#87D039] shadow-lg' : 'ring-1 ring-zinc-200 hover:ring-zinc-400'}`}
                          >
                            <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownload(index); }}
                              className="absolute bottom-1 right-1 bg-black/70 text-white p-1.5 rounded-lg hover:bg-black transition-colors hidden md:block"
                            >
                              <Download size={12} />
                            </button>
                            <span className="absolute top-1 left-1 bg-black/70 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                          <ImageIcon size={24} className="text-zinc-300 md:w-7 md:h-7" />
                        </div>
                        <p className="text-zinc-400 font-medium text-sm md:text-base">사진을 업로드하고<br/>생성 버튼을 눌러주세요</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 360° 비디오 섹션 - 항상 보임 */}
                <div className={`mt-4 md:mt-5 relative overflow-hidden ${generatedImages.length === 0 ? 'opacity-80' : ''}`}>
                  {/* 배경 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-xl md:rounded-2xl" />
                  
                  <div className="relative p-4 md:p-5">
                    {/* 상단: 타이틀 + 샘플 버튼 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <RotateCw size={20} className="text-white md:w-6 md:h-6 animate-spin" style={{animationDuration: '3s'}} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm md:text-base font-bold text-white">360° 회전 비디오</h4>
                            <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[9px] md:text-[10px] font-bold rounded-full">NEW</span>
                          </div>
                          <p className="text-white/70 text-[10px] md:text-xs mt-0.5">
                            {generatedImages.length === 0 
                              ? '먼저 이미지 4장을 생성하면 360° 비디오를 만들 수 있어요'
                              : 'AI가 4장의 이미지를 합성하여 360° 회전 영상을 만듭니다'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* 샘플 보기 버튼 */}
                      <button
                        onClick={() => setShowSampleModal(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg text-[10px] md:text-xs font-medium transition-colors"
                      >
                        <Play size={12} className="md:w-3.5 md:h-3.5" /> 샘플 보기
                      </button>
                    </div>
                    
                    {/* 비디오 생성 상태에 따른 UI */}
                    {videoStatus === 'idle' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            if (generatedImages.length < 4) {
                              toast.error('먼저 이미지 4장을 생성해주세요');
                              return;
                            }
                            setShowVideoModal(true);
                          }}
                          className={`flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                            generatedImages.length >= 4
                              ? 'bg-white text-purple-600 hover:bg-white/90'
                              : 'bg-white/30 text-white/80 cursor-pointer'
                          }`}
                        >
                          <Video size={14} className="md:w-4 md:h-4" />
                          {generatedImages.length >= 4 
                            ? `비디오 만들기 (${VIDEO_CREDITS}크레딧)`
                            : `이미지 생성 후 사용 가능 (${VIDEO_CREDITS}크레딧)`
                          }
                        </button>
                      </div>
                    )}
                    
                    {(videoStatus === 'pending' || videoStatus === 'processing') && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-white" />
                            <span className="text-white text-xs md:text-sm font-bold">비디오 생성 중...</span>
                          </div>
                          <span className="text-white/80 text-xs font-bold">{videoProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-500 ease-out" 
                            style={{width: `${videoProgress}%`}}
                          />
                        </div>
                        <p className="text-white/60 text-[10px] mt-2 text-center">
                          ⏳ 약 2-5분 소요 · 페이지를 닫지 마세요
                        </p>
                      </div>
                    )}
                    
                    {videoStatus === 'completed' && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowVideoViewer(true)}
                            className="flex-1 py-2.5 md:py-3 bg-white text-purple-600 rounded-lg md:rounded-xl text-xs md:text-sm font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                          >
                            <Play size={14} className="md:w-4 md:h-4" />
                            영상 보기
                          </button>
                          <button
                            onClick={handleVideoDownload}
                            className="flex-1 py-2.5 md:py-3 bg-green-500 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Download size={14} className="md:w-4 md:h-4" />
                            다운로드
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setVideoStatus('idle');
                            setVideoId(null);
                            setVideoUrl(null);
                          }}
                          className="py-2 px-4 bg-white/10 text-white/70 rounded-lg text-[10px] md:text-xs font-medium hover:bg-white/20 transition-colors"
                        >
                          새로 만들기
                        </button>
                      </div>
                    )}
                    
                    {videoStatus === 'failed' && (
                      <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={16} className="text-red-200" />
                          <span className="text-red-200 text-xs md:text-sm font-bold">생성 실패</span>
                        </div>
                        <p className="text-red-200/80 text-[10px] md:text-xs mb-3">{videoError}</p>
                        <button
                          onClick={() => {
                            setVideoStatus('idle');
                            setVideoError(null);
                          }}
                          className="w-full py-2 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-colors"
                        >
                          다시 시도
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PC 전용 전체화면 모달 */}
      {isModalOpen && !isMobile && generatedImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-20"
            onClick={() => setIsModalOpen(false)}
          >
            <X size={28} />
          </button>

          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full transition z-20"
            onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
          >
            <ChevronLeft size={32} />
          </button>

          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={generatedImages[selectedImageIndex]} 
              alt={`Image ${selectedImageIndex + 1}`}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
            />
            
            <div className="flex gap-2 mt-4">
              {generatedImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition ${idx === selectedImageIndex ? 'bg-[#87D039]' : 'bg-white/40'}`}
                />
              ))}
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleShare('link')}
                className="flex items-center gap-2 bg-zinc-700 text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-zinc-600 transition"
              >
                <Share2 size={16} />
                공유
              </button>
              <button
                onClick={() => handleDownload(selectedImageIndex)}
                className="flex items-center gap-2 bg-[#87D039] text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#9AE045] transition"
              >
                <Download size={16} />
                다운로드
              </button>
            </div>
          </div>

          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full transition z-20"
            onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}

      {/* 360° 비디오 생성 확인 모달 - Portal로 body에 렌더링 */}
      {mounted && showVideoModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md shadow-2xl max-h-[75vh] md:max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 모바일 드래그 핸들 */}
            <div className="md:hidden w-full py-3 flex justify-center flex-shrink-0">
              <div className="w-10 h-1 bg-zinc-300 rounded-full" />
            </div>
            
            {/* 스크롤 가능한 컨텐츠 영역 */}
            <div className="flex-1 overflow-y-auto px-5 md:px-8 pt-2 md:pt-8">
              <div className="text-center mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <RotateCw size={24} className="text-white md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-xl font-bold text-zinc-900">360° 비디오 생성</h3>
                <p className="text-zinc-500 text-xs md:text-sm mt-1.5 md:mt-2">
                  생성된 4장의 이미지로 360° 회전 비디오를 만듭니다
                </p>
              </div>

              <div className="bg-zinc-50 rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 md:mb-6 space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-zinc-500">영상 길이</span>
                  <span className="font-bold">8초</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-zinc-500">해상도</span>
                  <span className="font-bold">HD (16:9)</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-zinc-500">예상 소요 시간</span>
                  <span className="font-bold">2-5분</span>
                </div>
                <div className="border-t border-zinc-200 pt-2 flex justify-between text-xs md:text-sm">
                  <span className="text-zinc-500">필요 크레딧</span>
                  <span className="font-bold text-purple-600">{VIDEO_CREDITS}크레딧</span>
                </div>
              </div>

              {credits < VIDEO_CREDITS && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-xs md:text-sm font-bold">
                    크레딧이 부족합니다 (보유: {credits})
                  </p>
                  <Link href="/#pricing" className="text-red-600 text-[10px] md:text-xs underline mt-1 inline-block">
                    크레딧 충전하기 →
                  </Link>
                </div>
              )}
            </div>

            {/* 하단 버튼 영역 - 항상 고정 */}
            <div className="flex-shrink-0 px-5 md:px-8 pb-5 md:pb-8 pt-3 border-t border-zinc-100">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="flex-1 py-2.5 md:py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-xs md:text-sm hover:bg-zinc-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleVideoGenerate}
                  disabled={credits < VIDEO_CREDITS}
                  className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-xs md:text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Video size={14} className="md:w-4 md:h-4" /> 생성하기
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 생성된 비디오 뷰어 모달 - Portal로 body에 렌더링 */}
      {mounted && showVideoViewer && videoId && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center"
          onClick={() => setShowVideoViewer(false)}
        >
          <div 
            className="bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-3xl shadow-2xl overflow-hidden max-h-[85vh] md:max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 모바일 드래그 핸들 */}
            <div className="md:hidden w-full py-3 flex justify-center bg-zinc-900">
              <div className="w-10 h-1 bg-zinc-600 rounded-full" />
            </div>
            {/* 비디오 플레이어 */}
            <div className="relative aspect-video bg-black flex-shrink-0">
              <video
                src={`${API_URL}/api/video/download/${videoId}`}
                autoPlay
                loop
                controls
                playsInline
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setShowVideoViewer(false)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
              
              {/* 배지 */}
              <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center gap-1.5">
                <CheckCircle size={12} />
                생성 완료
              </div>
            </div>
            
            {/* 하단 버튼 */}
            <div className="p-4 md:p-5 border-t border-zinc-800">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-zinc-400 text-xs md:text-sm text-center md:text-left">
                  360° 회전 비디오 · 8초 HD
                </div>
                <div className="flex gap-2 justify-center md:justify-end">
                  <button
                    onClick={() => setShowVideoViewer(false)}
                    className="px-4 py-2.5 bg-zinc-700 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-zinc-600 transition-colors"
                  >
                    닫기
                  </button>
                  {/* 공유 버튼 - PC/모바일 분리 처리 */}
                  <button
                    onClick={async () => {
                      const videoUrlFull = `${API_URL}/api/video/download/${videoId}`;
                      
                      // 모바일인지 감지
                      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                      
                      if (isMobileDevice && navigator.share) {
                        // 모바일: Web Share API 사용
                        try {
                          // 파일 공유 시도
                          const response = await fetch(videoUrlFull);
                          const blob = await response.blob();
                          const file = new File([blob], `autopic_360_${videoId?.slice(0, 8)}.mp4`, { type: 'video/mp4' });
                          
                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              files: [file],
                              title: 'AUTOPIC 360° 비디오',
                              text: 'AI로 생성한 360° 상품 회전 비디오',
                            });
                            return;
                          }
                          
                          // 파일 공유 실패 시 URL 공유
                          await navigator.share({
                            title: 'AUTOPIC 360° 비디오',
                            text: 'AI로 생성한 360° 상품 회전 비디오',
                            url: videoUrlFull,
                          });
                        } catch (err) {
                          if ((err as Error).name !== 'AbortError') {
                            toast.error('공유에 실패했습니다');
                          }
                        }
                      } else {
                        // PC: 클립보드에 링크 복사
                        try {
                          await navigator.clipboard.writeText(videoUrlFull);
                          toast.success('비디오 링크가 클립보드에 복사되었습니다');
                        } catch (err) {
                          // 폴백: prompt로 URL 표시
                          prompt('비디오 링크를 복사하세요:', videoUrlFull);
                        }
                      }
                    }}
                    className="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-xs md:text-sm font-bold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                  >
                    <Share2 size={14} />
                    {isMobile ? '공유' : '링크 복사'}
                  </button>
                  <button
                    onClick={() => {
                      handleVideoDownload();
                      setShowVideoViewer(false);
                    }}
                    className="px-4 py-2.5 bg-green-500 text-white rounded-lg text-xs md:text-sm font-bold hover:bg-green-600 transition-colors flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    다운로드
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 샘플 비디오 보기 모달 - Portal로 body에 렌더링 */}
      {mounted && showSampleModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center"
          onClick={() => setShowSampleModal(false)}
        >
          <div 
            className="bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] md:max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 모바일 드래그 핸들 */}
            <div className="md:hidden w-full py-3 flex justify-center bg-zinc-900">
              <div className="w-10 h-1 bg-zinc-600 rounded-full" />
            </div>
            {/* 비디오 플레이어 */}
            <div className="relative aspect-video bg-black flex-shrink-0">
              <video
                src="/samples/sample-360.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setShowSampleModal(false)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
              
              {/* NEW 배지 */}
              <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center gap-1.5">
                <RotateCw size={12} className="animate-spin" style={{animationDuration: '2s'}} />
                360° 회전 비디오
              </div>
            </div>
            
            {/* 정보 섹션 */}
            <div className="p-4 md:p-6 overflow-y-auto">
              <h3 className="text-base md:text-xl font-bold text-white mb-2">AI 360° 회전 비디오</h3>
              <p className="text-zinc-400 text-xs md:text-sm mb-4">
                4장의 상품 이미지를 AI가 분석하여 부드러운 360° 회전 영상을 생성합니다.
                스마트스토어, 쿠팡 등 이커머스 디테일 페이지에 활용하세요.
              </p>
              
              {/* 샘플 이미지 그리드 */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                    <img 
                      src={`/samples/sample-${i}.png`} 
                      alt={`Sample ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <div className="text-zinc-500 text-[10px] md:text-xs">
                  <span className="text-purple-400 font-bold">{VIDEO_CREDITS}크레딧</span> · 8초 HD 영상
                </div>
                <button
                  onClick={() => setShowSampleModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-xs md:text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
