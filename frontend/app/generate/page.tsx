'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useCreditsStore, useGenerationStore } from '@/lib/store';
import { imagesApi } from '@/lib/api';
import { modeLabels, formatNumber, downloadBase64Image } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Loader2, 
  Download, 
  ChevronDown,
  Camera,
  Settings2,
  LayoutGrid,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Upload,
  Trash2,
  Video,
  Play,
  RotateCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.autopic.app';

const AutoPicLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const modeOptions = [
  { value: 'still', label: '정물 (PRODUCT)' },
  { value: 'model', label: '모델 (MODEL)' },
];

const categoryOptions = [
  '상의', '하의', '원피스', '가방', '신발', '시계', '주얼리', '아이웨어', '모자', '스카프', '벨트', '소품'
];

// 비디오 생성 크레딧
const VIDEO_CREDITS = 30;

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { balance, fetchBalance } = useCreditsStore();
  const {
    sourceImage,
    mode,
    modelType,
    gender,
    category,
    generatedImages,
    isGenerating,
    error,
    setSourceImage,
    setMode,
    setModelType,
    setGender,
    setCategory,
    setGeneratedImages,
    setIsGenerating,
    setError,
  } = useGenerationStore();

  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<'setup' | 'preview'>('setup');

  // 360° 비디오 관련 상태
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBalance();

    const modeParam = searchParams.get('mode');
    if (modeParam && ['still', 'model', 'editorial_still', 'editorial_model'].includes(modeParam)) {
      setMode(modeParam as any);
    }
  }, [isAuthenticated, router, fetchBalance, searchParams, setMode]);

  useEffect(() => {
    if (isGenerating) setMobileTab('preview');
  }, [isGenerating]);

  useEffect(() => {
    if (previewIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') navigatePreview(-1);
      if (e.key === 'ArrowRight') navigatePreview(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex]);

  // 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const navigatePreview = (dir: number) => {
    setPreviewIndex((prev) => prev !== null ? (prev + dir + 4) % 4 : null);
  };

  const handleGenerate = async () => {
    if (!sourceImage) {
      toast.error('이미지를 먼저 업로드해주세요');
      return;
    }

    const requiredCredits = modelType === 'flash' ? 1 : 3;
    if ((balance?.credits || 0) < requiredCredits) {
      toast.error(`크레딧이 부족합니다. ${requiredCredits}크레딧이 필요합니다.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setProgress(0);
    setMobileTab('preview');
    
    // 비디오 상태 초기화
    setVideoStatus('idle');
    setVideoId(null);
    setVideoUrl(null);
    setVideoError(null);

    let p = 0;
    const progressInterval = setInterval(() => {
      p += 1;
      if (p <= 90) setProgress(p);
      if (p < 30) setLoadingText('AI가 이미지를 분석 중입니다...');
      else if (p < 60) setLoadingText('구도를 최적화하는 중입니다...');
      else if (p < 80) setLoadingText('디테일 및 실루엣 보정 중...');
      else setLoadingText('최종 결과물 마무리 중...');
    }, 400);

    try {
      const startTime = Date.now();
      const modeMap: Record<string, string> = {
        'still': 'product',
        'model': 'model',
        'editorial_product': 'editorial_product',
        'editorial_model': 'editorial_model',
      };
      const apiMode = modeMap[mode] || 'product';
      
      const result = await imagesApi.generate({
        image_base64: sourceImage,
        mode: apiMode as any,
        model_type: modelType,
        gender: gender === '여성' ? 'female' : gender === '남성' ? 'male' : 'female',
        category: category || undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setGeneratedImages(result.images);
        setProcessingTime((Date.now() - startTime) / 1000);
        fetchBalance();
        toast.success(`이미지 4장 생성 완료! (${result.credits_used}크레딧 사용)`);
      } else {
        setError(result.error || '이미지 생성에 실패했습니다');
        toast.error(result.error || '이미지 생성에 실패했습니다');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      const message = err.response?.data?.detail?.error || err.response?.data?.detail || '이미지 생성 중 오류가 발생했습니다';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (e: React.MouseEvent, image: string, index: number) => {
    e.stopPropagation();
    downloadBase64Image(image, `autopic_${mode}_${index + 1}.png`);
    toast.success('다운로드 완료!');
  };

  const handleDownloadAll = () => {
    generatedImages.forEach((image, index) => {
      setTimeout(() => {
        downloadBase64Image(image, `autopic_${mode}_${index + 1}.png`);
      }, index * 500);
    });
    toast.success('전체 다운로드 시작!');
  };

  // 360° 비디오 생성 시작
  const handleVideoGenerate = async () => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if ((balance?.credits || 0) < VIDEO_CREDITS) {
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
      const response = await axios.post(`${API_BASE_URL}/api/video/generate`, {
        user_id: user.id,
        images: generatedImages,
      });

      if (response.data.success) {
        setVideoId(response.data.video_id);
        toast.success('비디오 생성이 시작되었습니다!');
        fetchBalance();
        
        // 폴링 시작
        startPolling(response.data.video_id);
      } else {
        setVideoStatus('failed');
        setVideoError(response.data.error || '비디오 생성 시작 실패');
        toast.error(response.data.error || '비디오 생성 시작 실패');
        setVideoGenerating(false);
      }
    } catch (err: any) {
      setVideoStatus('failed');
      setVideoError(err.response?.data?.error || '비디오 생성 중 오류 발생');
      toast.error('비디오 생성 중 오류가 발생했습니다');
      setVideoGenerating(false);
    }
  };

  // 비디오 상태 폴링
  const startPolling = (vidId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/video/status/${vidId}`);
        
        if (response.data.success) {
          const { status, progress, video_url, error_message } = response.data;
          
          setVideoStatus(status);
          setVideoProgress(progress || 0);
          
          if (status === 'completed') {
            setVideoUrl(video_url);
            setVideoGenerating(false);
            toast.success('360° 비디오 생성 완료!');
            fetchBalance();
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
      window.open(`${API_BASE_URL}/api/video/download/${videoId}`, '_blank');
      toast.success('비디오 다운로드 시작!');
    }
  };

  const requiredCredits = modelType === 'flash' ? 1 : 3;
  const canGenerate = sourceImage && (balance?.credits || 0) >= requiredCredits && !isGenerating;
  const canGenerateVideo = generatedImages.length >= 4 && (balance?.credits || 0) >= VIDEO_CREDITS && !videoGenerating;
  const splitTitles = ['Front View', 'Side View', 'Detail', 'Full Shot'];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F4F4F5] lg:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white border border-zinc-200 lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-3rem)]">
          
          {/* Mobile Tabs */}
          <div className="lg:hidden flex border-b border-zinc-100 bg-white sticky top-16 z-30">
            <button 
              onClick={() => setMobileTab('setup')} 
              className={`flex-1 py-4 text-xs font-black flex items-center justify-center gap-2 transition-colors ${mobileTab === 'setup' ? 'text-[#87D039] border-b-2 border-[#87D039]' : 'text-zinc-400'}`}
            >
              <Settings2 size={16}/> 설정
            </button>
            <button 
              onClick={() => setMobileTab('preview')} 
              className={`flex-1 py-4 text-xs font-black flex items-center justify-center gap-2 transition-colors ${mobileTab === 'preview' ? 'text-[#87D039] border-b-2 border-[#87D039]' : 'text-zinc-400'}`}
            >
              <LayoutGrid size={16}/> 미리보기
            </button>
          </div>

          {/* Left Setup Panel */}
          <div className={`w-full lg:w-[400px] bg-white border-r border-zinc-100 flex-col ${mobileTab === 'setup' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-black flex items-center gap-2 tracking-tight">
                <AutoPicLogo className="w-5 h-5"/> 
                <span>AI Studio</span>
              </h2>
              <span className="tag tag-lime">v2.5</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14}/> 1. 사진 업로드
                </label>
                
                <div 
                  onClick={() => !sourceImage && document.getElementById('file-input')?.click()}
                  className={`relative aspect-video w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group flex flex-col items-center justify-center ${sourceImage ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50'}`}
                >
                  <input 
                    id="file-input"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result as string;
                          const base64 = result.split(',')[1];
                          setSourceImage(base64, file);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {sourceImage ? (
                    <>
                      <img src={`data:image/jpeg;base64,${sourceImage}`} alt="Main" className="w-full h-full object-contain p-2" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSourceImage(null, null); }} 
                        className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:text-red-500 shadow-sm transition-colors"
                      >
                        <Trash2 size={14}/>
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black text-white text-[8px] font-black rounded uppercase tracking-wider">Main Image</div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
                      <Upload size={24}/>
                      <div>
                        <p className="text-xs font-black text-zinc-600">파일을 드래그하여 넣어주세요</p>
                        <p className="text-[10px] font-bold text-zinc-400 mt-1">또는 클릭하여 업로드</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={14}/> 2. 제작 옵션
                </label>
                
                {/* Category */}
                <div className="relative">
                  <label className="text-[10px] font-black text-zinc-400 mb-1.5 block uppercase">카테고리</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-black transition appearance-none cursor-pointer"
                  >
                    <option value="">자동 감지</option>
                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 bottom-3.5 pointer-events-none text-zinc-400"/>
                </div>

                {/* Mode */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase">스타일</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setMode('still')} 
                      className={`py-3 px-3 text-[10px] font-black rounded-xl border-2 transition-all ${mode === 'still' ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                      기본 정물
                    </button>
                    <button 
                      onClick={() => setMode('model')} 
                      className={`py-3 px-3 text-[10px] font-black rounded-xl border-2 transition-all ${mode === 'model' ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                      기본 모델
                    </button>
                    <button 
                      onClick={() => setMode('editorial_product')} 
                      className={`py-3 px-3 text-[10px] font-black rounded-xl border-2 transition-all ${mode === 'editorial_product' ? 'border-purple-500 bg-purple-500 text-white' : 'border-zinc-200 text-zinc-500 hover:border-purple-300'}`}
                    >
                      화보 정물 ✨
                    </button>
                    <button 
                      onClick={() => setMode('editorial_model')} 
                      className={`py-3 px-3 text-[10px] font-black rounded-xl border-2 transition-all ${mode === 'editorial_model' ? 'border-purple-500 bg-purple-500 text-white' : 'border-zinc-200 text-zinc-500 hover:border-purple-300'}`}
                    >
                      화보 모델 ✨
                    </button>
                  </div>
                  {(mode === 'editorial_product' || mode === 'editorial_model') && (
                    <p className="text-[9px] text-purple-500 font-bold animate-fade-in-up">
                      ✨ 룩북/화보 스타일로 고급스러운 이미지를 생성합니다
                    </p>
                  )}
                </div>

                {/* Gender (only for model mode) */}
                {(mode === 'model' || mode === 'editorial_model') && (
                  <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl animate-fade-in-up">
                    <button 
                      onClick={() => setGender('여성')} 
                      className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${gender === '여성' ? 'bg-black text-white shadow-lg' : 'text-zinc-400'}`}
                    >
                      여성 (FEMALE)
                    </button>
                    <button 
                      onClick={() => setGender('남성')} 
                      className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${gender === '남성' ? 'bg-black text-white shadow-lg' : 'text-zinc-400'}`}
                    >
                      남성 (MALE)
                    </button>
                  </div>
                )}

                {/* Model Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setModelType('flash')}
                    disabled={isGenerating}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      modelType === 'flash'
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    } ${isGenerating ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-black text-zinc-900">Flash</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400">빠른 처리 · 1크레딧</p>
                  </button>

                  <button
                    onClick={() => setModelType('pro')}
                    disabled={isGenerating}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      modelType === 'pro'
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    } ${isGenerating ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-black text-zinc-900">Pro</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400">고품질 · 3크레딧</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="p-6 border-t border-zinc-100">
              {/* 크레딧 부족 경고 */}
              {(balance?.credits || 0) < requiredCredits && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <Zap size={16} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800">크레딧이 부족합니다</p>
                      <p className="text-xs text-red-600 mt-1">
                        현재 {formatNumber(balance?.credits || 0)}크레딧 · 필요 {requiredCredits}크레딧
                      </p>
                      <a 
                        href="/#pricing" 
                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-red-600 hover:text-red-700 underline"
                      >
                        크레딧 충전하기 →
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="group w-full py-4 bg-[#87D039] text-black rounded-2xl font-black text-sm hover:bg-[#9AE045] transition-all disabled:opacity-50 disabled:bg-zinc-100 disabled:text-zinc-400 flex items-center justify-center gap-3 shadow-xl active:scale-95"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" size={18}/>
                ) : (
                  <Sparkles className="group-hover:rotate-12 transition-transform" size={18}/>
                )}
                이미지 생성하기
              </button>
              <p className="text-center text-[11px] text-zinc-400 font-bold mt-3">
                보유 크레딧: <span className="text-zinc-900">{formatNumber(balance?.credits || 0)}</span> · 필요: <span className="text-[#87D039]">{requiredCredits}</span>
              </p>
            </div>
          </div>

          {/* Right Preview Panel */}
          <div className={`flex-1 bg-[#FAFAFA] relative flex-col ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="h-16 border-b border-zinc-100 flex items-center justify-between px-6 bg-white/50 backdrop-blur z-10">
              <div className="flex items-center gap-2 text-zinc-500">
                <LayoutGrid size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Canvas View</span>
              </div>
              {generatedImages.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-zinc-400 bg-white border border-zinc-200 px-3 py-1 rounded-full">
                    4컷 자동 생성 완료
                  </div>
                  <button 
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1.5 text-[10px] font-black text-black bg-[#87D039] px-3 py-1.5 rounded-full hover:bg-[#9AE045] transition-colors shadow-sm"
                  >
                    <Download size={12}/> 전체 다운로드
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden dot-pattern">
              {isGenerating ? (
                <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center border border-zinc-100 max-w-sm w-full animate-fade-in-up">
                  <div className="w-16 h-16 border-4 border-[#87D039] border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">이미지 생성 중</h3>
                  <p className="text-zinc-400 text-xs font-bold mb-6">{loadingText}</p>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#87D039] h-full transition-all duration-300" style={{width: `${progress}%`}}></div>
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                <>
                  <div className="w-full max-w-4xl grid grid-cols-2 gap-4 p-4 bg-white rounded-[40px] shadow-2xl border border-zinc-100 animate-fade-in-up">
                    {generatedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square group rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100 transition-all">
                        <img 
                          src={`data:image/png;base64,${img}`} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute top-3 left-3 bg-black/80 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase backdrop-blur-sm tracking-wider">
                          {splitTitles[idx]}
                        </div>
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={() => setPreviewIndex(idx)}
                            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                          >
                            <Maximize2 size={20} />
                          </button>
                          <button 
                            onClick={(e) => handleDownload(e, img, idx)}
                            className="w-12 h-12 bg-[#87D039] text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                          >
                            <Download size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 360° 비디오 섹션 */}
                  <div className="w-full max-w-4xl mt-6 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <RotateCw size={28} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black">360° 회전 비디오</h3>
                            <p className="text-white/80 text-xs font-medium mt-1">
                              생성된 이미지로 360° 회전 비디오를 만들어보세요
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* 비디오 생성 상태에 따른 버튼 */}
                          {videoStatus === 'idle' && (
                            <>
                              <button
                                onClick={() => setShowSampleModal(true)}
                                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                              >
                                <Play size={14} /> 샘플 보기
                              </button>
                              <button
                                onClick={() => setShowVideoModal(true)}
                                disabled={!canGenerateVideo}
                                className="px-5 py-2.5 bg-white text-purple-600 rounded-xl text-xs font-black hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <Video size={14} /> 비디오 만들기 ({VIDEO_CREDITS}크레딧)
                              </button>
                            </>
                          )}
                          
                          {(videoStatus === 'pending' || videoStatus === 'processing') && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm font-bold">생성 중... {videoProgress}%</span>
                              </div>
                              <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-white transition-all duration-300" 
                                  style={{width: `${videoProgress}%`}}
                                />
                              </div>
                            </div>
                          )}
                          
                          {videoStatus === 'completed' && (
                            <button
                              onClick={handleVideoDownload}
                              className="px-5 py-2.5 bg-white text-green-600 rounded-xl text-xs font-black hover:bg-white/90 transition-colors flex items-center gap-2"
                            >
                              <CheckCircle size={14} /> 다운로드
                            </button>
                          )}
                          
                          {videoStatus === 'failed' && (
                            <div className="flex items-center gap-3">
                              <span className="text-red-200 text-xs font-bold flex items-center gap-1">
                                <AlertCircle size={14} /> 실패
                              </span>
                              <button
                                onClick={() => {
                                  setVideoStatus('idle');
                                  setVideoError(null);
                                }}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors"
                              >
                                다시 시도
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 진행 상태 텍스트 */}
                      {(videoStatus === 'pending' || videoStatus === 'processing') && (
                        <p className="mt-4 text-white/70 text-xs text-center">
                          약 2-5분 소요됩니다. 페이지를 닫지 마세요.
                        </p>
                      )}
                      
                      {videoError && (
                        <p className="mt-4 text-red-200 text-xs text-center">
                          {videoError}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : error ? (
                <div className="bg-white p-12 rounded-[40px] shadow-xl text-center border border-zinc-100 max-w-sm w-full">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">😓</span>
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight">생성 실패</h3>
                  <p className="text-xs font-bold text-red-500 mt-2">{error}</p>
                </div>
              ) : (
                <div className="text-center animate-fade-in-up">
                  <div className="relative inline-block mb-6">
                    <AutoPicLogo className="w-16 h-16 text-zinc-200" />
                    <Sparkles size={28} className="absolute -top-3 -right-3 text-zinc-300 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-300 tracking-tight">
                    사진을 업로드하여 스튜디오 촬영을 시작하세요
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewIndex !== null && generatedImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in" 
          onClick={() => setPreviewIndex(null)}
        >
          <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            
            <button 
              onClick={() => navigatePreview(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all md:-left-16"
            >
              <ChevronLeft size={40} strokeWidth={1.5} />
            </button>

            <button 
              onClick={() => navigatePreview(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all md:-right-16"
            >
              <ChevronRight size={40} strokeWidth={1.5} />
            </button>

            <div className="relative w-full max-h-[75vh] flex items-center justify-center">
              <img 
                src={`data:image/png;base64,${generatedImages[previewIndex]}`} 
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                alt=""
              />
            </div>

            <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-4 flex items-center justify-between gap-8 shadow-2xl w-full max-w-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-0.5">View</span>
                <span className="text-sm font-black text-white uppercase tracking-wider">{splitTitles[previewIndex]}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((dot) => (
                    <div key={dot} className={`w-1.5 h-1.5 rounded-full transition-all ${previewIndex === dot ? 'bg-[#87D039] w-4' : 'bg-white/20'}`}></div>
                  ))}
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <button 
                  onClick={(e) => handleDownload(e, generatedImages[previewIndex], previewIndex)} 
                  className="font-black text-xs flex gap-2 items-center text-[#87D039] hover:text-[#9AE045] transition-colors uppercase"
                >
                  <Download size={16}/> Save
                </button>
              </div>
            </div>
          </div>
          
          <button 
            className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors p-2 bg-white/5 rounded-full" 
            onClick={() => setPreviewIndex(null)}
          >
            <X size={28} strokeWidth={1.5}/>
          </button>
        </div>
      )}

      {/* 360° 비디오 생성 확인 모달 */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RotateCw size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-zinc-900">360° 비디오 생성</h3>
              <p className="text-zinc-500 text-sm mt-2">
                생성된 4장의 이미지로 360° 회전 비디오를 만듭니다
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">영상 길이</span>
                <span className="font-bold">8초</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">해상도</span>
                <span className="font-bold">HD (16:9)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">예상 소요 시간</span>
                <span className="font-bold">2-5분</span>
              </div>
              <div className="border-t border-zinc-200 pt-3 flex justify-between text-sm">
                <span className="text-zinc-500">필요 크레딧</span>
                <span className="font-black text-purple-600">{VIDEO_CREDITS}크레딧</span>
              </div>
            </div>

            {(balance?.credits || 0) < VIDEO_CREDITS && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-600 text-sm font-bold">
                  크레딧이 부족합니다 (보유: {balance?.credits || 0})
                </p>
                <a href="/#pricing" className="text-red-600 text-xs underline mt-1 inline-block">
                  크레딧 충전하기 →
                </a>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowVideoModal(false)}
                className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleVideoGenerate}
                disabled={(balance?.credits || 0) < VIDEO_CREDITS}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Video size={16} /> 생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 샘플 비디오 모달 */}
      {showSampleModal && (
        <div 
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowSampleModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-zinc-900">360° 비디오 샘플</h3>
              <button 
                onClick={() => setShowSampleModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-zinc-900 rounded-2xl overflow-hidden mb-4">
              <div className="aspect-video flex items-center justify-center">
                <p className="text-zinc-500 text-sm">
                  샘플 비디오 준비 중입니다
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {['Front View', 'Side View', 'Detail', 'Full Shot'].map((title, idx) => (
                <div key={idx} className="bg-zinc-100 rounded-lg p-2 text-center">
                  <div className="aspect-square bg-zinc-200 rounded-lg mb-1"></div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">{title}</span>
                </div>
              ))}
            </div>

            <p className="text-zinc-500 text-xs text-center">
              위 4장의 이미지로 360° 회전 비디오가 생성됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <GeneratePageContent />
    </Suspense>
  );
}
