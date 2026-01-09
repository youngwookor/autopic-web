'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play, Pause, RotateCcw, Check, ImageIcon, Zap } from 'lucide-react';

// 카테고리 데이터 (4개만 - 메인용)
const categories = [
  { id: 'bag', name: '가방', nameEn: 'BAG', folder: 'BAG' },
  { id: 'shoes', name: '신발', nameEn: 'SHOES', folder: 'SHOES' },
  { id: 'watch', name: '시계', nameEn: 'WATCH', folder: 'WATCH' },
  { id: 'clothing', name: '의류', nameEn: 'CLOTHING', folder: 'CLOTHING' },
];

// Before/After 슬라이더
function BeforeAfterSlider({ 
  beforeImage, 
  afterImage, 
  categoryName 
}: { 
  beforeImage: string; 
  afterImage: string;
  categoryName: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square rounded-2xl overflow-hidden select-none bg-zinc-100"
      style={{ cursor: isDragging ? 'grabbing' : 'col-resize' }}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* After Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-zinc-100">
        <Image
          src={afterImage}
          alt={`${categoryName} - AI`}
          fill
          className="object-contain pointer-events-none p-4"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* Before Image */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt={`${categoryName} - 원본`}
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* 슬라이더 라인 */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center">
          <div className="flex items-center gap-0.5 text-zinc-400">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 라벨 */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-medium tracking-wide">
        BEFORE
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-zinc-900 text-xs font-medium tracking-wide flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-[#87D039] rounded-full"></span>
        AFTER
      </div>
    </div>
  );
}

// 카테고리 쇼케이스
function CategoryShowcase({ 
  category, 
  isActive,
  onImageSelect,
  selectedImage
}: { 
  category: typeof categories[0];
  isActive: boolean;
  onImageSelect: (index: number) => void;
  selectedImage: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsVideoPlaying(false);
    }
  }, [isActive]);

  const generatedImages = [1, 2, 3, 4];
  const imageLabels = ['정면', '측면', '후면', '디테일'];

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        {/* 좌측: 비포/애프터 슬라이더 */}
        <div className="lg:col-span-5">
          <BeforeAfterSlider
            beforeImage={`/gallery/${category.folder}/0.png`}
            afterImage={`/gallery/${category.folder}/${selectedImage}.png`}
            categoryName={category.name}
          />
          <p className="text-center text-zinc-400 text-sm mt-3">
            ← 드래그하여 비교 →
          </p>
        </div>

        {/* 우측: 생성 이미지 + 비디오 */}
        <div className="lg:col-span-7 space-y-6">
          {/* 생성된 이미지 */}
          <div>
            <h3 className="text-xs font-medium text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" />
              AI 생성 이미지
            </h3>
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {generatedImages.map((imgIndex) => (
                <button
                  key={imgIndex}
                  onClick={() => onImageSelect(imgIndex)}
                  className={`group relative aspect-square rounded-xl overflow-hidden transition-all duration-300 ${
                    selectedImage === imgIndex
                      ? 'ring-2 ring-[#87D039] ring-offset-2'
                      : 'hover:ring-2 hover:ring-zinc-200 hover:ring-offset-2'
                  }`}
                >
                  <Image
                    src={`/gallery/${category.folder}/${imgIndex}.png`}
                    alt={`${category.name} ${imageLabels[imgIndex - 1]}`}
                    fill
                    className="object-contain bg-zinc-50 p-1"
                    sizes="(max-width: 768px) 25vw, 15vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-white text-[10px] md:text-xs">{imageLabels[imgIndex - 1]}</span>
                  </div>
                  {selectedImage === imgIndex && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#87D039] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 360 비디오 */}
          <div>
            <h3 className="text-xs font-medium text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              360° 회전 비디오
            </h3>
            <div 
              className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 cursor-pointer group"
              onClick={toggleVideo}
            >
              {!videoError ? (
                <video
                  ref={videoRef}
                  src={`/gallery/${category.folder}/video.mp4`}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted
                  onError={() => setVideoError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-zinc-500">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">비디오 준비 중</p>
                  </div>
                </div>
              )}
              
              {!videoError && (
                <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isVideoPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    {isVideoPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-xs flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  360°
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPreview() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Record<number, number>>(
    Object.fromEntries(categories.map((_, i) => [i, 1]))
  );

  const handleImageSelect = (categoryIndex: number, imageIndex: number) => {
    setSelectedImages(prev => ({ ...prev, [categoryIndex]: imageIndex }));
  };

  return (
    <section id="gallery-preview" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-10 md:mb-12">
          <span className="inline-flex items-center gap-2 text-[#87D039] font-bold text-xs tracking-widest uppercase mb-3">
            <Sparkles size={14} />
            AI Results
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-2">
                AI가 만든 상품 이미지
              </h2>
              <p className="text-zinc-500">
                원본 사진 한 장으로 4가지 앵글 + 360° 비디오 생성
              </p>
            </div>
            <Link 
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              전체 갤러리 보기
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(index)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === index 
                  ? 'bg-zinc-900 text-white' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 메인 쇼케이스 */}
        <div className="bg-zinc-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
          {categories.map((category, index) => (
            <CategoryShowcase
              key={category.id}
              category={category}
              isActive={activeCategory === index}
              onImageSelect={(imgIndex) => handleImageSelect(index, imgIndex)}
              selectedImage={selectedImages[index]}
            />
          ))}
        </div>

        {/* 특징 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { icon: ImageIcon, label: '4가지 앵글', desc: '자동 생성' },
            { icon: Sparkles, label: '배경 제거', desc: '원클릭' },
            { icon: Zap, label: '3초 생성', desc: '초고속' },
            { icon: RotateCcw, label: '360° 비디오', desc: '회전 영상' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-[#87D039]/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#87D039]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
