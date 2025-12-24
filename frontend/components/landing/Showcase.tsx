'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Showcase() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Model', 'Product', 'Lifestyle'];

  const images = [
    { 
      url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80", 
      title: "Summer Collection", 
      category: "Model",
      color: "from-rose-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80", 
      title: "Nike Air Max", 
      category: "Product",
      color: "from-red-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", 
      title: "Smart Watch", 
      category: "Product",
      color: "from-sky-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80", 
      title: "Street Style", 
      category: "Model",
      color: "from-amber-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80", 
      title: "Leather Bag", 
      category: "Product",
      color: "from-orange-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80", 
      title: "Minimal Store", 
      category: "Lifestyle",
      color: "from-zinc-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80", 
      title: "Fashion Week", 
      category: "Model",
      color: "from-purple-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80", 
      title: "Sunglasses", 
      category: "Product",
      color: "from-yellow-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80", 
      title: "Sneakers Collection", 
      category: "Product",
      color: "from-emerald-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80", 
      title: "Elegant Dress", 
      category: "Model",
      color: "from-pink-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80", 
      title: "Denim Jacket", 
      category: "Product",
      color: "from-blue-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80", 
      title: "Fashion Store", 
      category: "Lifestyle",
      color: "from-indigo-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?auto=format&fit=crop&w=600&q=80", 
      title: "Winter Coat", 
      category: "Model",
      color: "from-slate-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80", 
      title: "Backpack", 
      category: "Product",
      color: "from-amber-600/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80", 
      title: "Colorful Sneakers", 
      category: "Product",
      color: "from-cyan-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80", 
      title: "Runway Show", 
      category: "Model",
      color: "from-fuchsia-500/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80", 
      title: "Running Shoes", 
      category: "Product",
      color: "from-orange-600/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80", 
      title: "Shopping Day", 
      category: "Lifestyle",
      color: "from-rose-400/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80", 
      title: "Classic Sneakers", 
      category: "Product",
      color: "from-red-600/80"
    },
    { 
      url: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=600&q=80", 
      title: "Casual Style", 
      category: "Model",
      color: "from-teal-500/80"
    },
  ];

  const filteredImages = activeCategory === 'All' ? images : images.filter(img => img.category === activeCategory);

  // 3장씩 스크롤
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 360 + 24; // 카드 너비 + gap
      const scrollAmount = cardWidth * 3; // 3장씩
      
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
        behavior: 'smooth'
      });
    }
    // 수동 조작 시 자동 재생 일시 정지
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = 360 + 24;
        const scrollAmount = cardWidth * 2; // 자동은 2장씩
        
        // 끝에 도달하면 처음으로
        if (scrollLeft + clientWidth >= scrollWidth - 100) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollTo({
            left: scrollLeft + scrollAmount,
            behavior: 'smooth'
          });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, filteredImages]);

  return (
    <section id="showcase" className="py-20 md:py-32 bg-zinc-950 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#87D039]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <span className="inline-flex items-center gap-2 text-[#87D039] font-bold text-xs tracking-widest uppercase mb-4">
              <Sparkles size={14} />
              Gallery
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              AI가 만든<br className="md:hidden" /> 스튜디오 퀄리티
            </h2>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat 
                    ? 'bg-[#87D039] text-black' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Scroll Gallery */}
        <div 
          className="relative group"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Navigation Buttons */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-[#87D039] hover:text-black text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-4 backdrop-blur-sm border border-white/10 hover:border-[#87D039] shadow-xl"
          >
            <ArrowLeft size={24} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-[#87D039] hover:text-black text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:-translate-x-4 backdrop-blur-sm border border-white/10 hover:border-[#87D039] shadow-xl"
          >
            <ArrowRight size={24} />
          </button>

          {/* Gradient Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:-mx-8 md:px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredImages.map((img, idx) => (
              <div
                key={idx}
                className="relative flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group/card"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image */}
                <img
                  src={img.url}
                  alt={img.title}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-all duration-700 ${
                    hoveredIndex === idx ? 'scale-110' : 'scale-100'
                  }`}
                />
                
                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${img.color} to-transparent transition-opacity duration-500 ${
                  hoveredIndex === idx ? 'opacity-60' : 'opacity-0'
                }`} />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                  {/* Category Badge - Always visible */}
                  <span className={`self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    hoveredIndex === idx 
                      ? 'bg-white text-black' 
                      : 'bg-black/50 text-white/80 backdrop-blur-sm'
                  }`}>
                    {img.category}
                  </span>
                  
                  {/* Title - Slide up on hover */}
                  <h3 className={`text-white text-lg md:text-xl font-bold mt-3 transition-all duration-500 ${
                    hoveredIndex === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {img.title}
                  </h3>

                  {/* View Button */}
                  <div className={`flex items-center gap-2 mt-2 transition-all duration-500 delay-75 ${
                    hoveredIndex === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <span className="text-white/80 text-sm font-medium">View Details</span>
                    <ArrowRight size={14} className="text-white" />
                  </div>
                </div>

                {/* Border Glow on Hover */}
                <div className={`absolute inset-0 rounded-2xl md:rounded-3xl border-2 transition-all duration-500 ${
                  hoveredIndex === idx ? 'border-white/30' : 'border-transparent'
                }`} />
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: Math.ceil(filteredImages.length / 3) }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === 0 ? 'w-8 bg-[#87D039]' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { number: '50K+', label: '생성된 이미지' },
            { number: '98%', label: '만족도' },
            { number: '3초', label: '평균 생성 시간' },
            { number: '24/7', label: '서비스 가용성' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center md:text-left p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-[#87D039]/30 transition-all duration-300">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#87D039]">{stat.number}</p>
              <p className="text-white/60 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 md:mt-16 text-center">
          <button 
            onClick={() => document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center gap-3 bg-[#87D039] text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-[#9AE045] transition-all shadow-[0_0_40px_rgba(135,208,57,0.3)] hover:shadow-[0_0_60px_rgba(135,208,57,0.5)]"
          >
            지금 무료로 시작하기
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
