'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  Sparkles,
  Download,
  Loader2,
  Camera,
  Settings2,
  LayoutGrid,
  ChevronDown,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Crown,
} from 'lucide-react';
import { generateImages } from '@/lib/api';

// 카테고리 목록
const CATEGORIES = [
  '상의', '하의', '원피스', '가방', '신발', 
  '시계', '주얼리', '아이웨어', '모자', '스카프', '벨트', '소품'
];

// 로고 컴포넌트
const AutoPicLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

interface GeneratedImage {
  url: string;
  label: string;
}

export default function Generator() {
  // 상태 관리
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'still' | 'model'>('still');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [category, setCategory] = useState('상의');
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash'); // AI 모델 선택
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ model: string; credit: number; cost: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일을 Base64로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 파일 처리
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setMainImage(base64);
      setError('');
    } catch {
      setError('이미지를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 드래그 앤 드롭
  const handleDrag = (e: React.DragEvent, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(active);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  // 파일 선택
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  };

  // 이미지 삭제
  const removeImage = () => {
    setMainImage(null);
    setGeneratedImages([]);
    setStep('upload');
    setLastResult(null);
  };

  // 이미지 생성
  const handleGenerate = async () => {
    if (!mainImage) {
      setError('이미지를 먼저 업로드해주세요.');
      return;
    }

    setStep('processing');
    setProgress(0);
    setError('');

    // 진행률 애니메이션
    let p = 0;
    const progressInterval = setInterval(() => {
      p += 1;
      if (p <= 90) setProgress(p);
      if (p < 30) setLoadingText('AI가 이미지를 분석 중입니다...');
      else if (p < 60) setLoadingText('구도를 최적화하는 중입니다...');
      else if (p < 80) setLoadingText('디테일 및 실루엣 보정 중...');
      else setLoadingText('최종 결과물 마무리 중...');
    }, 150);

    try {
      const result = await generateImages(
        mainImage, 
        mode, 
        mode === 'model' ? gender : 'auto', 
        category,
        modelType  // AI 모델 전달
      );
      
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.images.length > 0) {
        const labels = result.labels || ['정면', '측면', '후면', '디테일'];
        const images: GeneratedImage[] = result.images.map((img: string, idx: number) => ({
          url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`,
          label: labels[idx] || `이미지 ${idx + 1}`,
        }));
        setGeneratedImages(images);
        setLastResult({
          model: result.model_used || modelType,
          credit: result.credit_used || (modelType === 'pro' ? 3 : 1),
          cost: result.cost_estimate || 0,
        });
        setTimeout(() => setStep('result'), 500);
      } else {
        throw new Error(result.error || '이미지 생성에 실패했습니다.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || '이미지 생성에 실패했습니다.');
      setStep('upload');
    }
  };

  // 다운로드
  const handleDownload = (url: string, label: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `autopic_${label}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 전체 다운로드
  const handleDownloadAll = () => {
    generatedImages.forEach((img, idx) => {
      setTimeout(() => handleDownload(img.url, img.label), idx * 300);
    });
  };

  // 미리보기 네비게이션
  const navigatePreview = (dir: number) => {
    setPreviewIndex((prev) => 
      prev !== null ? (prev + dir + generatedImages.length) % generatedImages.length : null
    );
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex">
      {/* 왼쪽 설정 패널 */}
      <div className="w-[420px] bg-white border-r border-zinc-200 flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AutoPicLogo className="w-6 h-6" />
            <span className="tracking-tight">Autopic Studio</span>
          </h1>
          <span className="text-[10px] font-black text-lime-600 bg-lime-50 px-2 py-1 rounded-full">
            BETA v1.0
          </span>
        </div>

        {/* 설정 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. 이미지 업로드 */}
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Camera size={14} /> 1. 사진 업로드
            </label>

            <div
              onDragOver={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDrop={handleDrop}
              onClick={() => !mainImage && fileInputRef.current?.click()}
              className={`relative aspect-video w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center
                ${mainImage ? 'border-zinc-200 bg-zinc-50' : isDragging ? 'border-lime-500 bg-lime-50' : 'border-zinc-300 hover:border-zinc-800 hover:bg-zinc-50'}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />

              {mainImage ? (
                <>
                  <img src={mainImage} alt="업로드된 이미지" className="w-full h-full object-contain p-2" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:text-red-500 shadow-sm transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black text-white text-[8px] font-black rounded uppercase">
                    원본 이미지
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
                  <Upload className={`transition-transform duration-300 ${isDragging ? '-translate-y-2 text-lime-500' : ''}`} size={24} />
                  <p className="text-xs font-bold text-zinc-600">파일을 드래그하거나 클릭하여 업로드</p>
                  <p className="text-[10px] text-zinc-400">JPG, PNG, WEBP 지원</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. 제작 옵션 */}
          <div className="space-y-4">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Settings2 size={14} /> 2. 제작 옵션
            </label>

            {/* 카테고리 선택 */}
            <div className="relative">
              <label className="text-[10px] font-bold text-zinc-400 mb-1.5 block">상품 카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black transition appearance-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 bottom-3.5 pointer-events-none text-zinc-400" />
            </div>

            {/* 모드 선택 */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl">
              <button
                onClick={() => setMode('still')}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all ${mode === 'still' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                정물 (STILL)
              </button>
              <button
                onClick={() => setMode('model')}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all ${mode === 'model' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                모델 (MODEL)
              </button>
            </div>

            {/* 성별 선택 (모델 모드일 때만) */}
            {mode === 'model' && (
              <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${gender === 'female' ? 'bg-black text-white' : 'text-zinc-400'}`}
                >
                  여성 (FEMALE)
                </button>
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${gender === 'male' ? 'bg-black text-white' : 'text-zinc-400'}`}
                >
                  남성 (MALE)
                </button>
              </div>
            )}
          </div>

          {/* 3. AI 모델 선택 */}
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} /> 3. AI 모델 선택
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Flash 모델 */}
              <button
                onClick={() => setModelType('flash')}
                className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                  modelType === 'flash' 
                    ? 'border-lime-500 bg-lime-50' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className={modelType === 'flash' ? 'text-lime-600' : 'text-zinc-400'} />
                  <span className="font-bold text-sm">Flash</span>
                </div>
                <p className="text-[10px] text-zinc-500 mb-2">빠른 처리, 경제적</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-lime-600">1크레딧/건</span>
                  <span className="text-[10px] text-zinc-400">~137원</span>
                </div>
                {modelType === 'flash' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-lime-500 rounded-full"></div>
                )}
              </button>

              {/* Pro 모델 */}
              <button
                onClick={() => setModelType('pro')}
                className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                  modelType === 'pro' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={16} className={modelType === 'pro' ? 'text-purple-600' : 'text-zinc-400'} />
                  <span className="font-bold text-sm">Pro</span>
                </div>
                <p className="text-[10px] text-zinc-500 mb-2">고품질, 섬세한 디테일</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-600">3크레딧/건</span>
                  <span className="text-[10px] text-zinc-400">~416원</span>
                </div>
                {modelType === 'pro' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 생성 버튼 */}
        <div className="p-6 border-t border-zinc-100">
          <button
            onClick={handleGenerate}
            disabled={step === 'processing' || !mainImage}
            className={`group w-full py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] ${
              modelType === 'pro' 
                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                : 'bg-lime-400 text-black hover:bg-lime-500'
            }`}
          >
            {step === 'processing' ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Sparkles className="group-hover:rotate-12 transition-transform" size={18} />
            )}
            이미지 생성하기 ({modelType === 'pro' ? '3크레딧' : '1크레딧'})
          </button>
          {error && <p className="mt-3 text-xs text-red-500 font-medium text-center">⚠ {error}</p>}
          
          {/* 마지막 결과 정보 */}
          {lastResult && step === 'result' && (
            <div className="mt-3 p-3 bg-zinc-50 rounded-xl text-center">
              <p className="text-[10px] text-zinc-500">
                사용 모델: <span className="font-bold">{lastResult.model === 'pro' ? 'Pro' : 'Flash'}</span> | 
                차감: <span className="font-bold">{lastResult.credit}크레딧</span> | 
                비용: <span className="font-bold">~{Math.round(lastResult.cost)}원</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 미리보기 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 바 */}
        <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center gap-2 text-zinc-500">
            <LayoutGrid size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Canvas View</span>
          </div>
          {generatedImages.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 text-xs font-bold text-white bg-black px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <Download size={14} /> 전체 다운로드
            </button>
          )}
        </div>

        {/* 캔버스 영역 */}
        <div
          className="flex-1 flex items-center justify-center p-8 overflow-auto"
          style={{ backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          {step === 'processing' ? (
            /* 로딩 상태 */
            <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-sm w-full">
              <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6 ${
                modelType === 'pro' ? 'border-purple-400' : 'border-lime-400'
              }`}></div>
              <h3 className="text-xl font-bold mb-2">이미지 생성 중</h3>
              <p className="text-zinc-400 text-sm mb-2">{loadingText}</p>
              <p className="text-xs text-zinc-300 mb-4">
                {modelType === 'pro' ? 'Pro 모델 (고품질)' : 'Flash 모델 (고속)'}
              </p>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    modelType === 'pro' ? 'bg-purple-400' : 'bg-lime-400'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">{progress}%</p>
            </div>
          ) : generatedImages.length > 0 ? (
            /* 결과 그리드 */
            <div className="w-full max-w-3xl grid grid-cols-2 gap-4 p-6 bg-white rounded-3xl shadow-2xl">
              {generatedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square group rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 cursor-pointer"
                  onClick={() => setPreviewIndex(idx)}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                    {img.label}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewIndex(idx); }}
                      className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Maximize2 size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.label); }}
                      className="w-10 h-10 bg-lime-400 text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 빈 상태 */
            <div className="text-center">
              <AutoPicLogo className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-300">사진을 업로드하여 시작하세요</h3>
              <p className="text-sm text-zinc-400 mt-2">AI가 4컷 상품 이미지를 생성합니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 라이트박스 모달 */}
      {previewIndex !== null && generatedImages[previewIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2"
          >
            <X size={32} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); navigatePreview(-1); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2"
          >
            <ChevronLeft size={48} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); navigatePreview(1); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2"
          >
            <ChevronRight size={48} />
          </button>

          <div className="max-w-4xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={generatedImages[previewIndex].url}
              alt={generatedImages[previewIndex].label}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-white font-bold">{generatedImages[previewIndex].label}</span>
              <button
                onClick={() => handleDownload(generatedImages[previewIndex].url, generatedImages[previewIndex].label)}
                className="flex items-center gap-2 text-lime-400 hover:text-lime-300 font-bold"
              >
                <Download size={18} /> 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
