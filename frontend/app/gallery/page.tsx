'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/landing/Footer';
import { 
  ArrowRight, 
  Play, 
  Pause,
  Sparkles,
  Zap,
  ImageIcon,
  RotateCcw,
  Check
} from 'lucide-react';

// 카테고리 데이터
const categories = [
  { id: 'bag', name: '가방', nameEn: 'BAG', folder: '가방' },
  { id: 'shoes', name: '신발', nameEn: 'SHOES', folder: '신발' },
  { id: 'watch', name: '시계', nameEn: 'WATCH', folder: '시계' },
  { id: 'clothing', name: '의류', nameEn: 'CLOTHING', folder: '의류' },
  { id: 'jewelry', name: '쥬얼리', nameEn: 'JEWELRY', folder: '쥬얼리' },
  { id: 'kids', name: '키즈', nameEn: 'KIDS', folder: '키즈' },
  { id: 'accessory', name: '패션잡화', nameEn: 'ACCESSORY', folder: '패션잡화' },
];

// 비포/애프터 슬라이더
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
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt={`${categoryName} - AI`}
          fill
          className="object-cover pointer-events-none"
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
      <div className="grid lg:grid-cols-12 gap-8">
        {/* 좌측: 비포/애프터 슬라이더 */}
        <div className="lg:col-span-5">
          <div className="sticky top-40">
            <BeforeAfterSlider
              beforeImage={`/gallery/${category.folder}/0.jpg`}
              afterImage={`/gallery/${category.folder}/${selectedImage}.png`}
              categoryName={category.name}
            />
            <p className="text-center text-zinc-400 text-sm mt-4">
              드래그하여 비교
            </p>
          </div>
        </div>

        {/* 우측: 생성 이미지 + 비디오 */}
        <div className="lg:col-span-7 space-y-8">
          {/* 생성된 이미지 */}
          <div>
            <h3 className="text-xs font-medium text-zinc-400 tracking-widest mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-zinc-200"></span>
              GENERATED IMAGES
            </h3>
            <div className="grid grid-cols-4 gap-3">
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
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 15vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-white text-xs">{imageLabels[imgIndex - 1]}</span>
                  </div>
                  {selectedImage === imgIndex && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#87D039] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 360 비디오 */}
          <div>
            <h3 className="text-xs font-medium text-zinc-400 tracking-widest mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-zinc-200"></span>
              360° VIDEO
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
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    {isVideoPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    )}
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-3 h-3" />
                  360°
                </span>
              </div>
            </div>
          </div>

          {/* 특징 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ImageIcon, label: '4가지 앵글' },
              { icon: Sparkles, label: '배경 자동 제거' },
              { icon: Zap, label: '3초 생성' },
              { icon: RotateCcw, label: '360° 비디오' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                <item.icon className="w-4 h-4 text-[#87D039]" />
                <span className="text-sm text-zinc-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Record<number, number>>(
    Object.fromEntries(categories.map((_, i) => [i, 1]))
  );
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageSelect = (categoryIndex: number, imageIndex: number) => {
    setSelectedImages(prev => ({ ...prev, [categoryIndex]: imageIndex }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 메인 Navbar 사용 */}
      <Navbar isScrolled={isScrolled} />

      {/* 히어로 */}
      <section className="pt-28 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#87D039] text-sm font-medium tracking-widest mb-3">
            AI PRODUCT GALLERY
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4">
            AI가 만든 상품 이미지
          </h1>
          <p className="text-zinc-500 max-w-lg">
            원본 사진 한 장으로 프로페셔널한 상품 이미지와 360° 비디오를 생성합니다.
          </p>
        </div>
      </section>

      {/* 카테고리 탭 */}
      <section className="sticky top-[72px] z-30 bg-white border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(index)}
                className={`relative px-5 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === index ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {cat.nameEn}
                {activeCategory === index && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 메인 쇼케이스 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900">
              {categories[activeCategory].name}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {categories[activeCategory].nameEn} COLLECTION
            </p>
          </div>

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
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            직접 체험해보세요
          </h2>
          <p className="text-zinc-500 mb-8">
            회원가입 시 5 크레딧 무료 제공
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white font-medium rounded-full">
            무료 체험 시작
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 메인 Footer 사용 */}
      <Footer />
    </div>
  );
}
