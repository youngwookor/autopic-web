'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { 
  Upload, 
  Trash2, 
  Plus, 
  Sparkles, 
  Loader2, 
  Download,
  ChevronDown,
  Zap,
  Crown,
  ImageIcon,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type CategoryGroup = "상의" | "하의" | "원피스" | "가방" | "신발" | "시계" | "주얼리" | "아이웨어" | "모자" | "스카프" | "벨트" | "소품";

const categoryOptions: CategoryGroup[] = ['상의', '하의', '원피스', '가방', '신발', '시계', '주얼리', '아이웨어', '모자', '스카프', '벨트', '소품'];

const MODEL_CONFIG = {
  flash: { credits: 1 },
  pro: { credits: 3 },
};

// 카테고리 매핑 (한글 → 영어)
const categoryMap: Record<string, string> = {
  '상의': 'clothing',
  '하의': 'clothing',
  '원피스': 'clothing',
  '가방': 'bag',
  '신발': 'shoes',
  '시계': 'watch',
  '주얼리': 'jewelry',
  '아이웨어': 'eyewear',
  '모자': 'hat',
  '스카프': 'scarf',
  '벨트': 'belt',
  '소품': 'accessory',
};

// 백엔드 API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Studio() {
  const router = useRouter();
  
  // Store에서 인증 상태 가져오기
  const { user, isAuthenticated } = useAuthStore();
  const { balance, setBalance } = useCreditsStore();
  
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [subImage, setSubImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'product' | 'model' | 'editorial_product' | 'editorial_model'>('product');
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [category, setCategory] = useState<CategoryGroup>('상의');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingSub, setIsDraggingSub] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  const requiredCredits = MODEL_CONFIG[modelType].credits;
  const credits = balance?.credits || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'sub') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'main') setMainImage(result);
        else setSubImage(result);
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
        if (type === 'main') setMainImage(result);
        else setSubImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (type: 'main' | 'sub') => {
    if (type === 'main') setMainImage(null);
    else setSubImage(null);
  };

  // 이미지 생성 핸들러
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

    try {
      // 백엔드 API 호출
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          image_base64: mainImage,
          mode: mode,
          model_type: modelType,
          gender: gender,
          category: categoryMap[category] || 'clothing',
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '이미지 생성 실패');
      }

      // Base64 이미지를 data URL로 변환
      const images = data.images.map((img: string) => `data:image/jpeg;base64,${img}`);
      setGeneratedImages(images);
      setSelectedImageIndex(0);
      
      // 크레딧 업데이트
      setBalance(data.remaining_credits);
      
      toast.success(`이미지 생성 완료! (4장, ${data.credits_used}크레딧 사용)`);
      
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
    link.download = `autopic_${mode}_${targetIndex + 1}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('다운로드 완료!');
  };

  const handleDownloadAll = () => {
    generatedImages.forEach((_, index) => {
      setTimeout(() => handleDownload(index), index * 300);
    });
  };

  return (
    <section id="studio" className="py-12 md:py-16 bg-white px-4 md:px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-8">
          <span className="inline-block px-3 py-1 rounded-full border border-zinc-200 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 mb-2 md:mb-3 text-zinc-500">
            AI Studio
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 md:mb-3">AI 이미지 생성</h2>
          <p className="text-zinc-500 text-sm md:text-lg">상품 사진을 업로드하고 전문 스튜디오 퀄리티의 이미지를 생성하세요.</p>
        </div>

        {/* Studio Container */}
        <div className="bg-zinc-50 rounded-2xl md:rounded-[32px] border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            
            {/* Left: Controls */}
            <div className="p-4 md:p-6 lg:p-7 border-b lg:border-b-0 lg:border-r border-zinc-200">
              {/* Credits Display */}
              {isAuthenticated && (
                <div className="flex items-center justify-between mb-4 md:mb-5 pb-3 md:pb-4 border-b border-zinc-200">
                  <span className="text-xs md:text-sm font-medium text-zinc-500">보유 크레딧</span>
                  <div className="bg-black text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold">
                    {credits} 크레딧
                  </div>
                </div>
              )}

              {/* Image Upload Section */}
              <div className="mb-4 md:mb-5">
                <h3 className="text-sm md:text-base font-bold text-zinc-900 mb-2 md:mb-3 flex items-center gap-2">
                  <Upload size={14} className="text-[#87D039] md:w-4 md:h-4" />
                  사진 업로드
                </h3>

                {/* Main Image */}
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

                {/* Sub Image */}
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

              {/* Options Section */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-sm md:text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#87D039] md:w-4 md:h-4" />
                  생성 옵션
                </h3>

                {/* AI Model Selection */}
                <div>
                  <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">AI 모델</label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <button 
                      onClick={() => setModelType('flash')} 
                      className={`py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 ${modelType === 'flash' ? 'bg-yellow-400 text-black' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                    >
                      <Zap size={12} className="md:w-3.5 md:h-3.5" />
                      Flash · 1크레딧
                    </button>
                    <button 
                      onClick={() => setModelType('pro')} 
                      className={`py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 ${modelType === 'pro' ? 'bg-purple-500 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                    >
                      <Crown size={12} className="md:w-3.5 md:h-3.5" />
                      Pro · 3크레딧
                    </button>
                  </div>
                </div>

                {/* Category & Mode in one row */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {/* Category */}
                  <div>
                    <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">카테고리</label>
                    <div className="relative">
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CategoryGroup)}
                        className="w-full bg-white border border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#87D039] transition appearance-none cursor-pointer"
                      >
                        {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 md:w-3.5 md:h-3.5"/>
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div>
                    <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">생성 유형</label>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {/* 정물 드롭다운 */}
                      <div className="relative">
                        <select 
                          value={mode === 'product' || mode === 'editorial_product' ? mode : ''}
                          onChange={(e) => setMode(e.target.value as any)}
                          className={`w-full border rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium focus:outline-none transition appearance-none cursor-pointer ${
                            mode === 'product' || mode === 'editorial_product'
                              ? mode === 'editorial_product' 
                                ? 'bg-purple-500 text-white border-purple-500' 
                                : 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <option value="product">🖼️ 기본 정물</option>
                          <option value="editorial_product">✨ 화보 정물</option>
                        </select>
                        <ChevronDown size={12} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none md:w-3.5 md:h-3.5 ${mode === 'product' || mode === 'editorial_product' ? 'text-white/70' : 'text-zinc-400'}`}/>
                      </div>
                      
                      {/* 모델 드롭다운 */}
                      <div className="relative">
                        <select 
                          value={mode === 'model' || mode === 'editorial_model' ? mode : ''}
                          onChange={(e) => setMode(e.target.value as any)}
                          className={`w-full border rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium focus:outline-none transition appearance-none cursor-pointer ${
                            mode === 'model' || mode === 'editorial_model'
                              ? mode === 'editorial_model' 
                                ? 'bg-purple-500 text-white border-purple-500' 
                                : 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <option value="model">👤 기본 모델</option>
                          <option value="editorial_model">✨ 화보 모델</option>
                        </select>
                        <ChevronDown size={12} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none md:w-3.5 md:h-3.5 ${mode === 'model' || mode === 'editorial_model' ? 'text-white/70' : 'text-zinc-400'}`}/>
                      </div>
                    </div>
                    {(mode === 'editorial_product' || mode === 'editorial_model') && (
                      <p className="text-[10px] text-purple-500 font-medium mt-1.5">✨ 룩북/화보 스타일의 고급스러운 이미지</p>
                    )}
                  </div>
                </div>

                {/* Gender Selection (for model modes) */}
                {(mode === 'model' || mode === 'editorial_model') && (
                  <div>
                    <label className="text-xs md:text-sm font-medium text-zinc-600 mb-1.5 md:mb-2 block">모델 성별</label>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <button 
                        onClick={() => setGender('female')} 
                        className={`py-2 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all ${gender === 'female' ? 'bg-pink-500 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                      >
                        여성
                      </button>
                      <button 
                        onClick={() => setGender('male')} 
                        className={`py-2 md:py-2.5 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all ${gender === 'male' ? 'bg-blue-500 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                      >
                        남성
                      </button>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !mainImage}
                  className="w-full py-3 md:py-3.5 bg-[#87D039] text-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base hover:bg-[#9AE045] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                  {isGenerating ? '생성 중...' : `이미지 생성 (${requiredCredits}크레딧)`}
                </button>
                
                {!isAuthenticated && (
                  <p className="text-center text-xs md:text-sm text-zinc-500">
                    <Link href="/login" className="text-[#87D039] font-bold hover:underline">로그인</Link>하고 무료로 시작하세요
                  </p>
                )}
              </div>
            </div>

            {/* Right: Preview */}
            <div className="p-4 md:p-6 lg:p-7 bg-white flex flex-col">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-bold text-zinc-900">생성 결과</h3>
                {generatedImages.length > 0 && (
                  <button 
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium text-black bg-[#87D039] px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-[#9AE045] transition-colors"
                  >
                    <Download size={12} className="md:w-3.5 md:h-3.5"/> 전체 다운로드
                  </button>
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
                    {/* Main Preview */}
                    <div className="flex-1 flex items-center justify-center mb-3 md:mb-4 bg-zinc-50 rounded-xl md:rounded-2xl p-3 md:p-4 min-h-[200px] md:min-h-[280px]">
                      <img 
                        src={generatedImages[selectedImageIndex]} 
                        alt={`Generated ${selectedImageIndex + 1}`} 
                        className="max-w-full max-h-[250px] md:max-h-[350px] rounded-lg md:rounded-xl shadow-lg object-contain"
                      />
                    </div>
                    
                    {/* Thumbnails */}
                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                      {generatedImages.map((img, index) => (
                        <div 
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative aspect-square rounded-lg md:rounded-xl overflow-hidden cursor-pointer transition-all ${selectedImageIndex === index ? 'ring-2 md:ring-3 ring-[#87D039] shadow-lg' : 'ring-1 ring-zinc-200 hover:ring-zinc-400'}`}
                        >
                          <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(index); }}
                            className="absolute bottom-1 right-1 bg-black/70 text-white p-1 md:p-1.5 rounded-md md:rounded-lg hover:bg-black transition-colors"
                          >
                            <Download size={10} className="md:w-3 md:h-3" />
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
