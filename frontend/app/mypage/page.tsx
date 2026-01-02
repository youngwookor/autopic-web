'use client';

// Vercel에서 정적 생성 방지 - 항상 동적 렌더링
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, deleteAccount } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { 
  User, CreditCard, Image, Settings, LogOut, 
  Zap, Crown, ChevronRight,
  ArrowLeft, Sparkles, Key, Monitor, Trash2, AlertTriangle, X,
  Clock, Download, Info, CalendarDays, RefreshCw, XCircle, Check,
  Video, Play, Loader2, Pause, Share2, RotateCw, Maximize2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/landing/Footer';
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

interface VideoGeneration {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  video_url: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  source_image_ids?: string[]; // 연결된 이미지 ID들
}

// 이미지 배치 그룹 인터페이스
interface ImageBatch {
  id: string; // 첫 이미지 ID
  images: Generation[];
  mode: string;
  model_type: string;
  created_at: string;
  canCreateVideo: boolean; // 정물/화보정물만 true
}

// 구독 정보 인터페이스
interface Subscription {
  has_subscription: boolean;
  subscription_id?: string;
  plan?: string;
  plan_name?: string;
  status?: string;
  monthly_credits?: number;
  price?: number;
  current_period_start?: string;
  current_period_end?: string;
  next_billing_date?: string;
  cancel_at_period_end?: boolean;
  tier?: string;
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

// 비디오 생성 가능 모드 체크 (정물/화보정물만 허용, 인물 제외)
function canCreateVideoFromMode(mode: string): boolean {
  return mode === 'product' || mode === 'editorial_product';
}

// 이미지들을 배치로 그룹핑 (5초 이내 + 같은 mode)
function groupIntoBatches(generations: Generation[]): ImageBatch[] {
  if (generations.length === 0) return [];
  
  const batches: ImageBatch[] = [];
  let currentBatch: Generation[] = [];
  let currentMode = '';
  let currentTime = 0;
  
  // 시간순 정렬 (오래된 것 먼저)
  const sorted = [...generations].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  for (const gen of sorted) {
    const genTime = new Date(gen.created_at).getTime();
    
    // 새 배치 시작 조건: 모드가 다르거나, 5초 이상 차이나거나, 4장 채움
    if (
      currentBatch.length === 0 ||
      gen.mode !== currentMode ||
      genTime - currentTime > 5000 ||
      currentBatch.length >= 4
    ) {
      // 이전 배치 저장
      if (currentBatch.length > 0) {
        batches.push({
          id: currentBatch[0].id,
          images: currentBatch,
          mode: currentMode,
          model_type: currentBatch[0].model_type,
          created_at: currentBatch[0].created_at,
          canCreateVideo: canCreateVideoFromMode(currentMode) && currentBatch.length === 4,
        });
      }
      // 새 배치 시작
      currentBatch = [gen];
      currentMode = gen.mode;
      currentTime = genTime;
    } else {
      currentBatch.push(gen);
      currentTime = genTime;
    }
  }
  
  // 마지막 배치 저장
  if (currentBatch.length > 0) {
    batches.push({
      id: currentBatch[0].id,
      images: currentBatch,
      mode: currentMode,
      model_type: currentBatch[0].model_type,
      created_at: currentBatch[0].created_at,
      canCreateVideo: canCreateVideoFromMode(currentMode) && currentBatch.length === 4,
    });
  }
  
  // 최신순으로 정렬
  return batches.reverse();
}

// ============ 알림 관련 함수들 (Studio.tsx에서 가져옴) ============

// 알림음 재생 함수
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch {
    console.log('Audio not supported');
  }
};

// 브라우저 푸시 알림 함수
const sendPushNotification = (title: string, body: string) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      tag: 'autopic-video',
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          tag: 'autopic-video',
        });
      }
    });
  }
};

// 타이틀 깜빡임 함수
let titleBlinkInterval: NodeJS.Timeout | null = null;
const originalTitle = 'AUTOPIC - AI 상품 이미지 생성';

const startTitleBlink = (message: string) => {
  if (titleBlinkInterval) return;
  
  let isOriginal = true;
  titleBlinkInterval = setInterval(() => {
    document.title = isOriginal ? message : originalTitle;
    isOriginal = !isOriginal;
  }, 1000);
  
  // 10초 후 자동 중지
  setTimeout(() => {
    stopTitleBlink();
  }, 10000);
};

const stopTitleBlink = () => {
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
    document.title = originalTitle;
  }
};

// 진동 함수 (모바일)
const triggerVibration = () => {
  if ('vibrate' in navigator) {
    // 짧은 진동 패턴: 200ms 진동, 100ms 멈춤, 200ms 진동
    navigator.vibrate([200, 100, 200]);
  }
};

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout: storeLogout } = useAuthStore();
  const { balance, setBalance } = useCreditsStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [usages, setUsages] = useState<Usage[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [videoHistory, setVideoHistory] = useState<VideoGeneration[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Portal용 mounted 상태 (SSR 대응)
  const [mounted, setMounted] = useState(false);

  // 비디오 모달 상태
  const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoSharing, setIsVideoSharing] = useState(false);

  // 배치에서 비디오 생성 상태
  const [generatingBatchId, setGeneratingBatchId] = useState<string | null>(null);
  const [batchVideoProgress, setBatchVideoProgress] = useState<number>(0);
  const [batchVideoId, setBatchVideoId] = useState<string | null>(null);
  const [batchVideoStatus, setBatchVideoStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 비디오 생성 확인 모달 상태
  const [showVideoConfirmModal, setShowVideoConfirmModal] = useState(false);
  const [selectedBatchForVideo, setSelectedBatchForVideo] = useState<ImageBatch | null>(null);

  // 비디오 전체화면 모달 상태
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState<string | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // 완료된 비디오 인라인 플레이어 상태 (배치별)
  const [completedBatchVideo, setCompletedBatchVideo] = useState<{batchId: string; videoId: string} | null>(null);
  const [isInlineVideoPlaying, setIsInlineVideoPlaying] = useState(false);
  const inlineVideoRef = useRef<HTMLVideoElement>(null);

  // 회원탈퇴 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 구독 취소 모달 상태
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);

  // Navbar 스크롤 상태
  const [isScrolled, setIsScrolled] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const VIDEO_CREDITS = 30;

  // Portal용 mounted 설정 및 스크롤 이벤트
  useEffect(() => {
    setMounted(true);
    
    // 스크롤 이벤트 리스너 (Navbar용)
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // 페이지 포커스 시 타이틀 깜빡임 중지
    const handleFocus = () => {
      stopTitleBlink();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', handleFocus);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // ============ 개발용 테스트 함수 (콘솔에서 사용) ============
  useEffect(() => {
    // 첫 번째 배치 ID 가져오기 (테스트용)
    const getFirstBatchId = () => {
      const validGens = generations.filter(gen => getRemainingDays(gen.created_at) > 0);
      const batches = groupIntoBatches(validGens);
      return batches.length > 0 ? batches[0].id : null;
    };

    // 테스트: 비디오 생성 시작 (프로그레스 바 표시)
    (window as any).testVideoStart = () => {
      const batchId = getFirstBatchId();
      if (!batchId) {
        console.log('❌ 테스트할 배치가 없습니다. 먼저 이미지를 생성하세요.');
        return;
      }
      setGeneratingBatchId(batchId);
      setBatchVideoProgress(0);
      setBatchVideoStatus('processing');
      console.log('✅ 비디오 생성 시작 시뮬레이션 (배치 ID:', batchId, ')');
      console.log('💡 testVideoProgress(50) 으로 진행률 변경');
    };

    // 테스트: 진행률 변경 (0-100)
    (window as any).testVideoProgress = (percent: number) => {
      if (!generatingBatchId) {
        console.log('❌ 먼저 testVideoStart() 를 실행하세요');
        return;
      }
      const p = Math.min(100, Math.max(0, percent));
      setBatchVideoProgress(p);
      console.log(`✅ 진행률: ${p}%`);
    };

    // 테스트: 비디오 완료 (알림음, 진동, 인라인 플레이어)
    (window as any).testVideoComplete = () => {
      const batchId = generatingBatchId || getFirstBatchId();
      if (!batchId) {
        console.log('❌ 테스트할 배치가 없습니다.');
        return;
      }
      
      // 알림 기능들 실행
      playNotificationSound();
      sendPushNotification('AUTOPIC', '🎉 360° 비디오 생성 완료!');
      startTitleBlink('🎉 비디오 완성!');
      triggerVibration();
      
      // 상태 업데이트
      setCompletedBatchVideo({ batchId, videoId: 'test-video-id-12345' });
      setGeneratingBatchId(null);
      setBatchVideoProgress(0);
      setBatchVideoStatus('completed');
      
      console.log('✅ 비디오 완료 시뮬레이션');
      console.log('🔊 알림음 재생됨');
      console.log('📳 진동 실행됨 (모바일)');
      console.log('📝 타이틀 깜빡임 시작됨');
      console.log('🎬 인라인 플레이어가 표시됩니다 (샘플 비디오 없음)');
    };

    // 테스트: 모달 열기
    (window as any).testVideoModal = () => {
      const validGens = generations.filter(gen => getRemainingDays(gen.created_at) > 0);
      const batches = groupIntoBatches(validGens);
      if (batches.length === 0) {
        console.log('❌ 테스트할 배치가 없습니다.');
        return;
      }
      setSelectedBatchForVideo(batches[0]);
      setShowVideoConfirmModal(true);
      console.log('✅ 비디오 생성 확인 모달 열림');
    };

    // 테스트: 초기화
    (window as any).testVideoReset = () => {
      setGeneratingBatchId(null);
      setBatchVideoProgress(0);
      setBatchVideoStatus('idle');
      setCompletedBatchVideo(null);
      setBatchVideoId(null);
      setShowVideoConfirmModal(false);
      stopTitleBlink();
      console.log('✅ 모든 상태 초기화됨');
    };

    // 테스트 함수 목록 출력
    (window as any).testVideoHelp = () => {
      console.log(`
╔══════════════════════════════════════════════════════╗
║          🧪 비디오 생성 테스트 함수 목록              ║
╠══════════════════════════════════════════════════════╣
║  testVideoModal()      - 확인 모달 열기              ║
║  testVideoStart()      - 생성 시작 (프로그레스 바)   ║
║  testVideoProgress(50) - 진행률 변경 (0-100)         ║
║  testVideoComplete()   - 완료 (알림/진동/플레이어)   ║
║  testVideoReset()      - 초기화                      ║
╚══════════════════════════════════════════════════════╝
      `);
    };

    console.log('🧪 비디오 테스트 함수 로드됨. testVideoHelp() 로 목록 확인');

    return () => {
      delete (window as any).testVideoStart;
      delete (window as any).testVideoProgress;
      delete (window as any).testVideoComplete;
      delete (window as any).testVideoModal;
      delete (window as any).testVideoReset;
      delete (window as any).testVideoHelp;
    };
  }, [generations, generatingBatchId]);

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

      // 구독 정보 로드
      try {
        const subscriptionResponse = await fetch(`${API_URL}/api/subscription/${userId}`);
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          if (subscriptionData.success) {
            setSubscription(subscriptionData);
          }
        }
      } catch (e) {
        console.log('Subscription load failed:', e);
      }

      // 비디오 히스토리 로드
      try {
        const videoResponse = await fetch(`${API_URL}/api/video/history/${userId}?limit=10`);
        if (videoResponse.ok) {
          const videoData = await videoResponse.json();
          if (videoData.success) {
            setVideoHistory(videoData.videos || []);
          }
        }
      } catch (e) {
        console.log('Video history load failed:', e);
      }
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

  // 구독 취소 처리
  const handleCancelSubscription = async (immediate: boolean = false) => {
    if (!user?.id) return;
    
    setIsCancellingSubscription(true);
    try {
      const response = await fetch(`${API_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          immediate: immediate,
          reason: '사용자 직접 취소'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(immediate ? '구독이 즉시 취소되었습니다' : '구독 기간 종료 후 취소됩니다');
        // 구독 정보 새로고침
        if (user?.id) {
          await loadData(user.id);
        }
      } else {
        toast.error(result.error || '구독 취소에 실패했습니다');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('구독 취소 중 오류가 발생했습니다');
    } finally {
      setIsCancellingSubscription(false);
      setShowCancelSubscriptionModal(false);
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

  // 비디오 다운로드
  const handleVideoDownload = async (video: VideoGeneration) => {
    if (!video.video_url) return;
    
    const downloadToast = toast.loading('비디오 다운로드 준비 중...');
    
    try {
      const response = await fetch(`${API_URL}${video.video_url}`);
      if (!response.ok) throw new Error('다운로드 실패');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `autopic_360_${video.id.slice(0, 8)}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('다운로드 완료!', { id: downloadToast });
    } catch {
      toast.error('다운로드 실패. 다시 시도해주세요.', { id: downloadToast });
    }
  };

  // 비디오 다운로드 (videoId로)
  const handleVideoDownloadById = async (videoId: string) => {
    const downloadToast = toast.loading('비디오 다운로드 준비 중...');
    
    try {
      const response = await fetch(`${API_URL}/api/video/download/${videoId}`);
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
    }
  };

  // 비디오 공유
  const handleVideoShare = async (video: VideoGeneration) => {
    const videoShareUrl = `https://autopic.kr/video/${video.id}`;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    setIsVideoSharing(true);
    
    try {
      if (isMobileDevice && navigator.share) {
        // 모바일: URL 공유
        await navigator.share({
          title: 'AUTOPIC 360° 비디오',
          text: 'AI로 생성한 360° 상품 회전 비디오를 확인해보세요!',
          url: videoShareUrl,
        });
      } else {
        // PC: URL 클립보드 복사
        await navigator.clipboard.writeText(videoShareUrl);
        toast.success('비디오 링크가 클립보드에 복사되었습니다!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('공유에 실패했습니다.');
      }
    } finally {
      setIsVideoSharing(false);
    }
  };

  // 비디오 공유 (videoId로)
  const handleVideoShareById = async (videoId: string) => {
    const videoShareUrl = `https://autopic.kr/video/${videoId}`;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      if (isMobileDevice && navigator.share) {
        await navigator.share({
          title: 'AUTOPIC 360° 비디오',
          text: 'AI로 생성한 360° 상품 회전 비디오를 확인해보세요!',
          url: videoShareUrl,
        });
      } else {
        await navigator.clipboard.writeText(videoShareUrl);
        toast.success('비디오 링크가 클립보드에 복사되었습니다!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('공유에 실패했습니다.');
      }
    }
  };

  // 비디오 생성 확인 모달 열기
  const openVideoConfirmModal = (batch: ImageBatch) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (currentCredits < VIDEO_CREDITS) {
      toast.error(`크레딧이 부족합니다. ${VIDEO_CREDITS}크레딧이 필요합니다.`);
      return;
    }

    if (batch.images.length < 4) {
      toast.error('이미지 4장이 필요합니다');
      return;
    }

    if (!batch.canCreateVideo) {
      toast.error('정물 이미지만 비디오 생성이 가능합니다');
      return;
    }

    // 알림 권한 미리 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setSelectedBatchForVideo(batch);
    setShowVideoConfirmModal(true);
  };

  // 배치에서 360° 비디오 생성 시작
  const handleCreateVideoFromBatch = async () => {
    if (!selectedBatchForVideo || !user?.id) return;

    const batch = selectedBatchForVideo;
    setShowVideoConfirmModal(false);
    setGeneratingBatchId(batch.id);
    setBatchVideoProgress(0);
    setBatchVideoStatus('pending');
    setBatchVideoId(null);
    setCompletedBatchVideo(null);

    try {
      // 이미지 URL에서 base64로 변환
      const imagePromises = batch.images.map(async (img) => {
        const response = await fetch(img.generated_image_url);
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // data:image/jpeg;base64, 부분 제거
            resolve(base64.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
      });

      const imageData = await Promise.all(imagePromises);

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
        setBatchVideoId(data.video_id);
        toast.success('비디오 생성이 시작되었습니다!');
        
        // 크레딧 새로고침
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();
        if (profile) setBalance(profile.credits || 0);
        
        // 폴링 시작
        startBatchVideoPolling(data.video_id, batch.id);
      } else {
        setGeneratingBatchId(null);
        setBatchVideoStatus('failed');
        toast.error(data.error || '비디오 생성 시작 실패');
      }
    } catch (err) {
      setGeneratingBatchId(null);
      setBatchVideoStatus('failed');
      console.error('Video generation error:', err);
      toast.error('비디오 생성 중 오류가 발생했습니다');
    }
  };

  // 비디오 생성 폴링
  const startBatchVideoPolling = useCallback((videoId: string, batchId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/video/status/${videoId}`);
        const data = await response.json();
        
        if (data.success) {
          setBatchVideoProgress(data.progress || 0);
          setBatchVideoStatus(data.status);
          
          if (data.status === 'completed') {
            // 알림 기능들 실행
            playNotificationSound();
            sendPushNotification('AUTOPIC', '🎉 360° 비디오 생성 완료!');
            startTitleBlink('🎉 비디오 완성!');
            triggerVibration();
            
            toast.success('360° 비디오 생성 완료!');
            
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
            
            // 완료된 비디오 정보 저장
            setCompletedBatchVideo({ batchId, videoId });
            setGeneratingBatchId(null);
            setBatchVideoProgress(0);
            
            // 비디오 히스토리 새로고침
            if (user?.id) {
              const videoResponse = await fetch(`${API_URL}/api/video/history/${user.id}?limit=10`);
              if (videoResponse.ok) {
                const videoData = await videoResponse.json();
                if (videoData.success) {
                  setVideoHistory(videoData.videos || []);
                }
              }
            }
          } else if (data.status === 'failed') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
            setGeneratingBatchId(null);
            setBatchVideoProgress(0);
            setBatchVideoStatus('failed');
            toast.error('비디오 생성에 실패했습니다');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    // 10분 후 폴링 중지
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (generatingBatchId === batchId) {
        setGeneratingBatchId(null);
        setBatchVideoProgress(0);
      }
    }, 600000);
  }, [API_URL, user?.id, generatingBatchId]);

  // 인라인 비디오 플레이어 토글
  const toggleInlineVideoPlay = () => {
    if (inlineVideoRef.current) {
      if (isInlineVideoPlaying) {
        inlineVideoRef.current.pause();
      } else {
        inlineVideoRef.current.play();
      }
      setIsInlineVideoPlaying(!isInlineVideoPlaying);
    }
  };

  // 비디오 전체화면 열기
  const openVideoFullscreen = (videoUrl: string) => {
    setFullscreenVideoUrl(videoUrl);
    setShowVideoFullscreen(true);
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
      {/* 네비게이션 바 */}
      <Navbar isScrolled={isScrolled} />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 pt-24 md:pt-28">
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

            {/* 구독 정보 카드 */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RefreshCw size={20} />
                  <h3 className="font-bold text-lg">구독 플랜</h3>
                </div>
                {subscription?.has_subscription && (
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    subscription.status === 'active' && !subscription.cancel_at_period_end
                      ? 'bg-green-100 text-green-700'
                      : subscription.cancel_at_period_end
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {subscription.status === 'active' && !subscription.cancel_at_period_end
                      ? '구독 중'
                      : subscription.cancel_at_period_end
                      ? '취소 예정'
                      : subscription.status}
                  </span>
                )}
              </div>

              {subscription?.has_subscription ? (
                <div className="space-y-4">
                  {/* 플랜 정보 */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Crown size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{subscription.plan_name} 플랜</p>
                          <p className="text-sm text-zinc-500">월 {subscription.monthly_credits?.toLocaleString()} 크레딧</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold">₩{subscription.price?.toLocaleString()}<span className="text-sm font-normal text-zinc-500">/월</span></p>
                    </div>

                    {/* 기간 정보 */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-100">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays size={14} className="text-purple-500" />
                        <span className="text-zinc-600">시작일</span>
                        <span className="font-medium">
                          {subscription.current_period_start
                            ? new Date(subscription.current_period_start).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-zinc-600">다음 결제</span>
                        <span className="font-medium">
                          {subscription.next_billing_date
                            ? new Date(subscription.next_billing_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 취소 예정 경고 */}
                  {subscription.cancel_at_period_end && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-800">구독 취소 예정</p>
                          <p className="text-sm text-orange-600">
                            {subscription.current_period_end
                              ? `${new Date(subscription.current_period_end).toLocaleDateString('ko-KR')} 까지 이용 가능합니다.`
                              : '기간 종료 후 취소됩니다.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 플랜 특징 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Check size={14} className="text-green-500" />
                      <span>웹 스튜디오 이용</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Check size={14} className="text-green-500" />
                      <span>우선 처리</span>
                    </div>
                    {subscription.plan === 'basic' && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Check size={14} className="text-green-500" />
                          <span>설치형 프로그램</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Check size={14} className="text-green-500" />
                          <span>API 액세스</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 구독 취소 버튼 */}
                  {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                    <div className="pt-4 border-t border-zinc-100">
                      <button
                        onClick={() => setShowCancelSubscriptionModal(true)}
                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-500 transition"
                      >
                        <XCircle size={16} />
                        <span>구독 취소하기</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={28} className="text-zinc-400" />
                  </div>
                  <p className="text-zinc-500 mb-2">활성화된 구독이 없습니다</p>
                  <p className="text-sm text-zinc-400 mb-4">정기 구독으로 매달 크레딧을 받아보세요</p>
                  <Link 
                    href="/#pricing" 
                    className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-black transition"
                  >
                    구독 플랜 보기
                    <ChevronRight size={16} />
                  </Link>
                </div>
              )}
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
            {/* 360° 비디오 히스토리 */}
            {videoHistory.length > 0 && (
              <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Video size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base">360° 비디오</h3>
                      <p className="text-[10px] md:text-xs text-zinc-500">생성 후 7일간 보관</p>
                    </div>
                  </div>
                </div>

                {/* 비디오 그리드 - PC 3열, 모바일 2열 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {videoHistory.map((video) => (
                    <div 
                      key={video.id} 
                      className={`bg-zinc-50 rounded-xl overflow-hidden group ${video.status === 'completed' ? 'cursor-pointer' : ''}`}
                      onClick={() => video.status === 'completed' && setSelectedVideo(video)}
                    >
                      {/* 비디오 썸네일 영역 */}
                      <div className="aspect-video relative bg-zinc-900">
                        {video.status === 'completed' && video.video_url ? (
                          <>
                            {/* 실제 비디오 썸네일 */}
                            <video
                              src={`${API_URL}${video.video_url}`}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                // 첫 프레임으로 이동
                                (e.target as HTMLVideoElement).currentTime = 0.1;
                              }}
                            />
                            {/* 호버 시 재생 오버레이 */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/90 rounded-full flex items-center justify-center">
                                <Play size={20} className="text-zinc-900 ml-0.5" />
                              </div>
                            </div>
                            {/* 남은 일수 배지 */}
                            <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold ${getExpiryColor(video.created_at)}`}>
                              {formatRemainingTime(video.created_at)}
                            </div>
                            {/* 비디오 아이콘 */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white">
                              <Video size={10} />
                              <span>8초</span>
                            </div>
                          </>
                        ) : video.status === 'processing' || video.status === 'pending' ? (
                          <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex flex-col items-center justify-center">
                            <Loader2 size={24} className="text-violet-500 animate-spin mb-2" />
                            <span className="text-[10px] md:text-xs text-violet-600 font-medium">
                              {video.status === 'pending' ? '대기중...' : `${video.progress}%`}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center">
                            <XCircle size={24} className="text-red-400 mb-1" />
                            <span className="text-[10px] text-red-500">실패</span>
                          </div>
                        )}
                      </div>

                      {/* 하단 정보 */}
                      <div className="p-2.5 md:p-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] md:text-xs text-zinc-500 truncate">
                              {new Date(video.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {video.status === 'completed' && video.video_url && (
                            <a
                              href={`${API_URL}${video.video_url}`}
                              download={`autopic_360_${video.id.slice(0, 8)}.mp4`}
                              className="p-1.5 md:p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download size={14} className="md:w-4 md:h-4" />
                            </a>
                          )}
                        </div>
                        {video.error_message && (
                          <p className="text-[10px] text-red-500 mt-1 truncate">{video.error_message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

              {(() => {
                const validBatches = groupIntoBatches(validGenerations);
                
                return validBatches.length > 0 ? (
                  <div className="space-y-6">
                    {validBatches.map((batch) => {
                      // 이 배치에서 비디오 생성 중인지 확인
                      const isGeneratingThisBatch = generatingBatchId === batch.id;
                      // 이 배치의 비디오가 완성되었는지 확인
                      const hasCompletedVideo = completedBatchVideo?.batchId === batch.id;
                      
                      return (
                        <div key={batch.id} className="bg-zinc-50 rounded-lg md:rounded-2xl p-2.5 md:p-5">
                          {/* 배치 헤더 */}
                          <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="flex items-center gap-1 md:gap-3">
                              <span className="text-[9px] md:text-xs font-medium bg-zinc-200 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded md:rounded-lg">
                                {getModeName(batch.mode)}
                              </span>
                              <span className={`text-[8px] md:text-[10px] font-bold px-1 md:px-2 py-0.5 rounded-full uppercase ${
                                batch.model_type === 'standard' || batch.model_type === 'flash'
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {batch.model_type === 'standard' ? 'STD' : batch.model_type === 'premium' ? 'PRO' : batch.model_type.slice(0,3).toUpperCase()}
                              </span>
                              <span className={`text-[9px] md:text-xs px-1 md:px-2 py-0.5 rounded-full ${getExpiryColor(batch.created_at)}`}>
                                {formatRemainingTime(batch.created_at)}
                              </span>
                            </div>
                            <p className="text-[9px] md:text-xs text-zinc-400">
                              {new Date(batch.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                            </p>
                          </div>

                          {/* 이미지 그리드 */}
                          <div className="grid grid-cols-4 gap-1 md:gap-3 mb-2 md:mb-4">
                            {batch.images.map((img, idx) => (
                              <div key={img.id} className="relative aspect-square rounded-md md:rounded-xl overflow-hidden bg-zinc-200 group">
                                {img.generated_image_url ? (
                                  <>
                                    <img 
                                      src={img.generated_image_url} 
                                      alt={`Generated ${idx + 1}`} 
                                      className="w-full h-full object-cover" 
                                    />
                                    {/* 호버 시 다운로드 */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button
                                        onClick={() => handleDownloadImage(img.generated_image_url, idx)}
                                        className="p-1 md:p-2 bg-white rounded-full hover:bg-zinc-100 transition"
                                      >
                                        <Download size={12} className="md:w-4 md:h-4 text-zinc-900" />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <Image size={16} className="md:w-6 md:h-6" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* 비디오 생성 중 또는 완료된 비디오 표시 */}
                          {isGeneratingThisBatch && (
                            <div className="mb-3 bg-gradient-to-r from-violet-500/10 to-purple-600/10 rounded-xl p-3 md:p-4 border border-violet-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Loader2 size={14} className="animate-spin text-violet-600" />
                                  <span className="text-xs md:text-sm font-bold text-violet-700">비디오 생성 중...</span>
                                </div>
                                <span className="text-xs md:text-sm font-bold text-violet-600">{batchVideoProgress}%</span>
                              </div>
                              <div className="w-full h-2 bg-violet-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500 ease-out rounded-full" 
                                  style={{width: `${batchVideoProgress}%`}}
                                />
                              </div>
                              <p className="text-[10px] md:text-xs text-violet-500 mt-2 text-center">
                                약 2-5분 소요 · 페이지를 닫지 마세요
                              </p>
                            </div>
                          )}

                          {hasCompletedVideo && completedBatchVideo && (
                            <div className="mb-3 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
                              {/* 비디오 완료 헤더 */}
                              <div className="flex items-center justify-between p-2 md:p-3 bg-white border-b border-zinc-200">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs md:text-sm font-bold text-zinc-900">360° 비디오 완성!</h4>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setCompletedBatchVideo(null);
                                    setBatchVideoId(null);
                                    setBatchVideoStatus('idle');
                                  }}
                                  className="text-zinc-400 hover:text-zinc-600 text-[9px] md:text-[10px] px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors"
                                >
                                  닫기
                                </button>
                              </div>

                              {/* 인라인 비디오 플레이어 */}
                              <div className="relative aspect-video bg-zinc-900 group">
                                <video
                                  ref={inlineVideoRef}
                                  src={`${API_URL}/api/video/download/${completedBatchVideo.videoId}`}
                                  className="w-full h-full object-contain"
                                  loop
                                  playsInline
                                  muted
                                  onPlay={() => setIsInlineVideoPlaying(true)}
                                  onPause={() => setIsInlineVideoPlaying(false)}
                                />
                                
                                {/* 플레이 오버레이 */}
                                <div 
                                  className={`absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity cursor-pointer ${isInlineVideoPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
                                  onClick={toggleInlineVideoPlay}
                                >
                                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                    {isInlineVideoPlaying ? (
                                      <Pause size={20} className="text-zinc-700" />
                                    ) : (
                                      <Play size={20} className="text-zinc-700 ml-1" />
                                    )}
                                  </div>
                                </div>

                                {/* 전체화면 버튼 */}
                                <button
                                  onClick={() => openVideoFullscreen(`${API_URL}/api/video/download/${completedBatchVideo.videoId}`)}
                                  className="absolute top-2 right-2 p-1.5 md:p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Maximize2 size={12} className="md:w-3.5 md:h-3.5 text-white" />
                                </button>

                                {/* 360° 배지 */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-[9px] md:text-[10px] font-medium flex items-center gap-1">
                                  <RotateCw size={9} className="animate-spin" style={{animationDuration: '3s'}} />
                                  360°
                                </div>
                              </div>

                              {/* 액션 버튼들 */}
                              <div className="flex gap-2 p-2 md:p-3 bg-white">
                                <button
                                  onClick={() => handleVideoShareById(completedBatchVideo.videoId)}
                                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[10px] md:text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                  <Share2 size={12} />
                                  공유
                                </button>
                                <button
                                  onClick={() => handleVideoDownloadById(completedBatchVideo.videoId)}
                                  className="flex-1 py-2 bg-[#87D039] text-black rounded-lg text-[10px] md:text-xs font-bold hover:bg-[#9AE045] transition-colors flex items-center justify-center gap-1"
                                >
                                  <Download size={12} />
                                  다운로드
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 액션 버튼 */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={async () => {
                                for (let i = 0; i < batch.images.length; i++) {
                                  await handleDownloadImage(batch.images[i].generated_image_url, i);
                                }
                              }}
                              className="flex items-center gap-0.5 md:gap-1.5 px-1.5 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded transition"
                            >
                              <Download size={10} className="md:w-3.5 md:h-3.5" />
                              다운로드
                            </button>

                            {/* 비디오 생성 버튼 */}
                            {isGeneratingThisBatch ? (
                              <div className="flex items-center gap-1 px-2 md:px-4 py-1 md:py-2 bg-violet-100 text-violet-700 rounded md:rounded-xl">
                                <Loader2 size={10} className="md:w-4 md:h-4 animate-spin" />
                                <span className="text-[9px] md:text-xs font-medium">{batchVideoProgress}%</span>
                              </div>
                            ) : hasCompletedVideo ? (
                              <button
                                onClick={() => openVideoConfirmModal(batch)}
                                disabled={currentCredits < VIDEO_CREDITS}
                                className="flex items-center gap-1 px-2 md:px-4 py-1 md:py-2 bg-zinc-200 text-zinc-600 rounded md:rounded-xl font-medium text-[9px] md:text-xs hover:bg-zinc-300 transition disabled:opacity-50"
                              >
                                <RefreshCw size={10} className="md:w-3.5 md:h-3.5" />
                                새로 만들기
                              </button>
                            ) : batch.canCreateVideo ? (
                              <button
                                onClick={() => openVideoConfirmModal(batch)}
                                disabled={currentCredits < VIDEO_CREDITS}
                                className="flex items-center gap-1 px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded md:rounded-xl font-medium text-[9px] md:text-xs hover:from-violet-600 hover:to-purple-700 transition disabled:opacity-50"
                              >
                                <Video size={10} className="md:w-3.5 md:h-3.5" />
                                비디오 생성
                                <span className="text-[8px] md:text-[10px] opacity-75">({VIDEO_CREDITS}크레딧)</span>
                              </button>
                            ) : (
                              /* 모델컷 등 비디오 생성 불가 - 비활성화 버튼 + 툴팁 */
                              <div className="relative group">
                                <button
                                  onClick={() => {
                                    // 모바일에서 클릭 시 토스트로 안내
                                    toast('정물 이미지만 360° 비디오 생성이 가능합니다', { icon: 'ℹ️' });
                                  }}
                                  className="flex items-center gap-1 px-2 md:px-4 py-1 md:py-2 bg-zinc-100 text-zinc-400 rounded md:rounded-xl font-medium text-[9px] md:text-xs cursor-not-allowed"
                                >
                                  <Video size={10} className="md:w-3.5 md:h-3.5" />
                                  비디오 생성
                                  <span className="text-[8px] md:text-[10px] opacity-75">({VIDEO_CREDITS}크레딧)</span>
                                </button>
                                {/* PC 툴팁 - hover 시 표시 */}
                                <div className="absolute bottom-full right-0 mb-2 hidden md:group-hover:block z-20 pointer-events-none">
                                  <div className="bg-zinc-800 text-white text-[10px] px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                                    정물 이미지만 360° 비디오 생성이 가능합니다
                                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-400">
                    <Image size={48} className="mx-auto mb-4 opacity-50" />
                    <p>보관 중인 이미지가 없습니다</p>
                  </div>
                );
              })()}

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
                탈퇴를 확인하려면 <span className="font-bold text-red-600">&quot;탈퇴합니다&quot;</span>를 입력하세요
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

      {/* 구독 취소 확인 모달 */}
      {showCancelSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <XCircle size={24} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">구독 취소</h3>
              </div>
              <button 
                onClick={() => setShowCancelSubscriptionModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition"
                disabled={isCancellingSubscription}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-zinc-600">
                정말로 구독을 취소하시겠습니까?
              </p>
              
              <div className="bg-zinc-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Crown size={20} className="text-purple-500" />
                  <span className="font-bold">{subscription?.plan_name} 플랜</span>
                </div>
                <p className="text-sm text-zinc-500">
                  월 {subscription?.monthly_credits?.toLocaleString()} 크레딧 · ₩{subscription?.price?.toLocaleString()}/월
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  현재 기간 종료 후 취소를 선택하면 <strong>
                  {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('ko-KR')
                    : '-'}
                  </strong>까지 계속 이용할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleCancelSubscription(false)}
                disabled={isCancellingSubscription}
                className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
              >
                {isCancellingSubscription ? '처리 중...' : '기간 종료 후 취소'}
              </button>
              <button
                onClick={() => handleCancelSubscription(true)}
                disabled={isCancellingSubscription}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50"
              >
                {isCancellingSubscription ? '처리 중...' : '즉시 취소 (환불 불가)'}
              </button>
              <button
                onClick={() => setShowCancelSubscriptionModal(false)}
                disabled={isCancellingSubscription}
                className="w-full py-3 bg-zinc-100 text-zinc-700 font-bold rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
              >
                다음에 하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비디오 재생 모달 (히스토리에서 클릭) */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedVideo(null);
            setIsVideoPlaying(false);
          }}
        >
          <div 
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setSelectedVideo(null);
                setIsVideoPlaying(false);
              }}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition"
            >
              <X size={28} />
            </button>

            {/* 360° 배지 */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full">
                <Video size={14} className="text-white" />
                <span className="text-white text-sm font-bold">360° 회전 비디오</span>
              </div>
            </div>

            {/* 비디오 플레이어 */}
            <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden">
              <video
                ref={videoPlayerRef}
                src={`${API_URL}${selectedVideo.video_url}`}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted
                autoPlay
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
              
              {/* 플레이 오버레이 */}
              <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity cursor-pointer ${isVideoPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const video = videoPlayerRef.current;
                  if (video) {
                    if (isVideoPlaying) {
                      video.pause();
                    } else {
                      video.play();
                    }
                  }
                }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  {isVideoPlaying ? (
                    <div className="w-5 h-5 flex gap-1">
                      <div className="w-1.5 h-full bg-zinc-700 rounded"></div>
                      <div className="w-1.5 h-full bg-zinc-700 rounded"></div>
                    </div>
                  ) : (
                    <Play size={28} className="text-zinc-700 ml-1" />
                  )}
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => handleVideoShare(selectedVideo)}
                disabled={isVideoSharing}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {isVideoSharing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} />
                )}
                공유
              </button>
              <button
                onClick={() => handleVideoDownload(selectedVideo)}
                className="flex items-center gap-2 px-6 py-3 bg-[#87D039] text-black rounded-xl font-bold hover:bg-[#9AE045] transition"
              >
                <Download size={18} />
                다운로드
              </button>
            </div>

            {/* 생성 정보 */}
            <p className="text-center text-zinc-500 text-sm mt-4">
              {new Date(selectedVideo.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 생성
            </p>
          </div>
        </div>
      )}

      {/* 비디오 생성 확인 모달 */}
      {mounted && showVideoConfirmModal && selectedBatchForVideo && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowVideoConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md shadow-2xl max-h-[75vh] md:max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="md:hidden w-full py-3 flex justify-center flex-shrink-0">
              <div className="w-10 h-1 bg-zinc-300 rounded-full" />
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 md:px-8 pt-2 md:pt-8">
              <div className="text-center mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <RotateCw size={24} className="text-white md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-xl font-bold text-zinc-900">360° 비디오 생성</h3>
                <p className="text-zinc-500 text-xs md:text-sm mt-1.5 md:mt-2">
                  선택한 4장의 이미지로 360° 회전 비디오를 만듭니다
                </p>
              </div>

              {/* 선택된 이미지 미리보기 */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {selectedBatchForVideo.images.map((img, idx) => (
                  <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-100">
                    <img 
                      src={img.generated_image_url} 
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
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

              {currentCredits < VIDEO_CREDITS && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-xs md:text-sm font-bold">
                    크레딧이 부족합니다 (보유: {currentCredits})
                  </p>
                  <Link href="/#pricing" className="text-red-600 text-[10px] md:text-xs underline mt-1 inline-block">
                    크레딧 충전하기 →
                  </Link>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-5 md:px-8 pb-5 md:pb-8 pt-3 border-t border-zinc-100">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVideoConfirmModal(false)}
                  className="flex-1 py-2.5 md:py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-xs md:text-sm hover:bg-zinc-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateVideoFromBatch}
                  disabled={currentCredits < VIDEO_CREDITS}
                  className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-xs md:text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Video size={14} className="md:w-4 md:h-4" /> 생성하기
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 비디오 전체화면 모달 */}
      {mounted && showVideoFullscreen && fullscreenVideoUrl && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setShowVideoFullscreen(false)}
        >
          <button
            onClick={() => setShowVideoFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X size={24} className="text-white" />
          </button>
          
          <video
            src={fullscreenVideoUrl}
            autoPlay
            loop
            controls
            playsInline
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (completedBatchVideo) {
                  handleVideoShareById(completedBatchVideo.videoId);
                }
              }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Share2 size={16} />
              공유
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (completedBatchVideo) {
                  handleVideoDownloadById(completedBatchVideo.videoId);
                }
              }}
              className="px-5 py-2.5 bg-[#87D039] text-black rounded-full text-sm font-bold hover:bg-[#9AE045] transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
