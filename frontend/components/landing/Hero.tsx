'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Play, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// 데모 비디오 모달 컴포넌트
function VideoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // ESC 키로 닫기
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    // 스크롤 방지
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* 비디오 컨테이너 - 모바일: 하단 시트, PC: 중앙 */}
      <div 
        className="relative w-full md:w-auto md:max-w-4xl bg-zinc-900 rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="md:hidden w-full py-3 flex justify-center">
          <div className="w-10 h-1 bg-zinc-600 rounded-full" />
        </div>

        {/* 비디오 플레이어 */}
        <div className="relative w-full aspect-video bg-black">
          <video
            src="/samples/demo-hero.mp4"
            autoPlay
            loop
            controls
            playsInline
            className="w-full h-full object-contain"
          />
          
          {/* 배지 */}
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            360° 회전 비디오
          </div>
        </div>
        
        {/* 하단 정보 */}
        <div className="p-4 md:p-5 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm md:text-base">AI 360° 상품 비디오</h3>
              <p className="text-zinc-400 text-xs md:text-sm mt-0.5">4장의 이미지로 생성된 회전 영상</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#87D039] text-black rounded-full text-xs md:text-sm font-bold hover:bg-[#9AE045] transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const products = [
    { image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", name: "Nike Air", category: "Sneakers" },
    { image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80", name: "Leather Bag", category: "Accessories" },
    { image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", name: "Smart Watch", category: "Electronics" },
    { image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80", name: "Colorful Kicks", category: "Sneakers" },
  ];

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // CTA 버튼 클릭 핸들러
  const handleCtaClick = () => {
    if (isAuthenticated) {
      // 로그인 상태 → 스튜디오 섹션으로 스크롤
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // 비로그인 상태 → 회원가입 페이지로 이동
      router.push('/register');
    }
  };

  return (
    <section className="relative bg-[#fafafa] overflow-hidden">
      {/* 유튜브 모달 */}
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #e5e5e5 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* ============ MOBILE VERSION ============ */}
      <div className="lg:hidden relative z-10 px-5 pt-24 pb-16">
        <div className="max-w-md mx-auto">
          {/* Badge */}
          <div 
            className={`flex justify-center mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#87D039] rounded-full animate-pulse" />
                AI 이미지
              </div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                360° 비디오
                <span className="px-1 py-0.5 bg-white/20 rounded text-[10px]">NEW</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 
            className={`text-[11vw] font-bold leading-[1.1] tracking-tight text-center mb-4 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <span className="text-zinc-900">촬영 없이</span>
            <br />
            <span className="text-[#87D039]">완벽한 사진</span>
          </h1>

          {/* Description */}
          <p 
            className={`text-zinc-500 text-base text-center mb-6 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            AI가 3초 만에 상품 이미지 4장과<br />360° 회전 비디오를 만들어드립니다
          </p>

          {/* Image Card */}
          <div 
            className={`relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl mb-8 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            {products.map((product, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ${
                  currentSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              >
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <span className="text-white/70 text-xs uppercase tracking-wider">{product.category}</span>
                  <h3 className="text-white text-xl font-bold">{product.name}</h3>
                </div>
              </div>
            ))}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#87D039] rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-zinc-700">AI Generated</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 flex">
              {products.map((_, idx) => (
                <div key={idx} className="flex-1 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-white origin-left ${currentSlide === idx ? 'animate-progress' : currentSlide > idx ? 'scale-x-100' : 'scale-x-0'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className={`space-y-3 mb-8 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={handleCtaClick}
              className="w-full bg-zinc-900 text-white px-7 py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2"
            >
              무료로 시작하기
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => setShowVideo(true)}
              className="w-full flex items-center justify-center gap-2 text-zinc-600 font-medium text-sm py-2 hover:text-zinc-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <Play size={12} fill="currentColor" />
              </div>
              360° 영상 보기
            </button>
          </div>

          {/* Stats */}
          <div className={`flex items-center justify-center gap-4 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center">
              <div className="text-lg font-bold text-zinc-900">50K+</div>
              <div className="text-[10px] text-zinc-500">생성된 이미지</div>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-zinc-900">3초</div>
              <div className="text-[10px] text-zinc-500">생성시간</div>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">360°</div>
              <div className="text-[10px] text-zinc-500">회전 비디오</div>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-zinc-900">98%</div>
              <div className="text-[10px] text-zinc-500">만족도</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ PC VERSION ============ */}
      <div className="hidden lg:block relative z-10 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 h-screen flex items-center">
          <div className="grid grid-cols-2 gap-20 items-center w-full">
            
            {/* Left - Text Content */}
            <div>
              {/* Badge */}
              <div 
                className={`flex items-center gap-3 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
              >
                <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-medium px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#87D039] rounded-full animate-pulse" />
                  AI 상품 이미지 생성
                </div>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full">
                  360° 비디오
                  <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">NEW</span>
                </div>
              </div>

              {/* Main Title */}
              <h1 
                className={`text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight mb-6 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <span className="text-zinc-900">촬영 없이</span>
                <br />
                <span className="text-[#87D039]">완벽한 사진</span>
              </h1>

              {/* Description */}
              <p 
                className={`text-xl text-zinc-500 mb-10 max-w-md leading-relaxed transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                스튜디오 없이, 모델 없이<br />
                AI가 3초 만에 상품 이미지 4장과 360° 회전 비디오를 만들어드립니다
              </p>

              {/* CTA Buttons */}
              <div 
                className={`flex items-center gap-4 mb-12 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <button
                  onClick={handleCtaClick}
                  className="group bg-zinc-900 text-white px-8 py-4 rounded-full font-semibold flex items-center gap-3 hover:bg-zinc-800 transition-all hover:shadow-xl"
                >
                  무료로 시작하기
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => setShowVideo(true)}
                  className="flex items-center gap-3 text-zinc-600 font-medium hover:text-zinc-900 transition-colors px-4"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow hover:scale-105">
                    <Play size={16} fill="currentColor" />
                  </div>
                  360° 영상 보기
                </button>
              </div>

              {/* Stats */}
              <div 
                className={`flex items-center gap-8 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <div>
                  <div className="text-3xl font-bold text-zinc-900">50K+</div>
                  <div className="text-sm text-zinc-500">생성된 이미지</div>
                </div>
                <div className="w-px h-12 bg-zinc-200" />
                <div>
                  <div className="text-3xl font-bold text-zinc-900">3초</div>
                  <div className="text-sm text-zinc-500">평균 생성시간</div>
                </div>
                <div className="w-px h-12 bg-zinc-200" />
                <div>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">360°</div>
                  <div className="text-sm text-zinc-500">회전 비디오</div>
                </div>
                <div className="w-px h-12 bg-zinc-200" />
                <div>
                  <div className="text-3xl font-bold text-zinc-900">98%</div>
                  <div className="text-sm text-zinc-500">고객 만족도</div>
                </div>
              </div>
            </div>

            {/* Right - Visual */}
            <div 
              className={`relative transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}
            >
              {/* Main Image Card */}
              <div className="relative">
                <div className="relative aspect-[3/4] max-w-[420px] ml-auto rounded-3xl overflow-hidden shadow-2xl">
                  {products.map((product, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-all duration-700 ${
                        currentSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                      }`}
                    >
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <span className="text-white/70 text-xs uppercase tracking-wider">{product.category}</span>
                        <h3 className="text-white text-2xl font-bold">{product.name}</h3>
                      </div>
                    </div>
                  ))}
                  
                  {/* AI Badge */}
                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 bg-[#87D039] rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-zinc-700">AI Generated</span>
                  </div>

                  {/* Progress */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 flex">
                    {products.map((_, idx) => (
                      <div key={idx} className="flex-1 relative overflow-hidden">
                        <div className={`absolute inset-0 bg-white origin-left ${currentSlide === idx ? 'animate-progress' : currentSlide > idx ? 'scale-x-100' : 'scale-x-0'}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Card - Speed */}
                <div 
                  className="absolute -left-16 top-20 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-float"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#87D039]/10 flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">생성 속도</div>
                    <div className="text-xl font-bold text-zinc-900">3초</div>
                  </div>
                </div>

                {/* Floating Card - Today */}
                <div 
                  className="absolute -right-12 top-1/2 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-float"
                  style={{ animationDelay: '1s' }}
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                    <span className="text-xl">🎨</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">오늘 생성</div>
                    <div className="text-xl font-bold text-zinc-900">1,247장</div>
                  </div>
                </div>

                {/* Small Preview */}
                <div 
                  className="absolute -bottom-6 left-0 w-28 h-28 rounded-2xl overflow-hidden shadow-xl border-4 border-white animate-float"
                  style={{ animationDelay: '0.5s' }}
                >
                  <img
                    src={products[(currentSlide + 1) % products.length].image}
                    alt="Next"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-2 left-2 text-white text-[10px] font-medium">Next</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-progress {
          animation: progress 3s linear;
        }
      `}</style>
    </section>
  );
}
