'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Showcase() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Apparel', 'Accessories', 'Model'];

  const images = [
    { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", title: "Floral Dress", category: "Apparel" },
    { url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", title: "Velvet Top", category: "Apparel" },
    { url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80", title: "White Blouse", category: "Apparel" },
    { url: "https://images.unsplash.com/photo-1550614000-4b9519e02a48?auto=format&fit=crop&w=800&q=80", title: "Denim Jacket", category: "Model" },
    { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", title: "Nike Red", category: "Accessories" },
    { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", title: "Smart Watch", category: "Accessories" }
  ];

  const filteredImages = activeCategory === 'All' ? images : images.filter(img => img.category === activeCategory);

  return (
    <section id="showcase" className="py-16 md:py-32 bg-[#F4F4F5] overflow-hidden relative">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-[#87D039] font-bold text-xs md:text-sm tracking-widest uppercase flex items-center justify-center gap-2 mb-3 md:mb-4">
            <Sparkles size={14} className="md:w-4 md:h-4" /> Studio Quality
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mt-2 mb-3 md:mb-4">
            스튜디오 퀄리티를 직접 확인하세요
          </h2>
          <p className="text-zinc-500 text-sm md:text-lg mb-6 md:mb-8 px-4">
            스마트폰으로 찍은 사진이 전문가의 손길을 거친 듯 다시 태어납니다.
          </p>

          {/* Category Tabs */}
          <div className="flex justify-center gap-1.5 md:gap-2 mb-8 md:mb-12 flex-wrap px-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all ${activeCategory === cat ? 'bg-black text-white shadow-lg' : 'bg-white text-zinc-500 hover:bg-zinc-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
          {filteredImages.map((img, idx) => (
            <div key={idx} className="group relative rounded-xl md:rounded-3xl overflow-hidden aspect-[3/4] shadow-lg cursor-pointer">
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-8">
                <span className="text-[#87D039] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">{img.category}</span>
                <h3 className="text-white text-sm md:text-xl font-bold">{img.title}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 md:mt-16 text-center">
          <button className="bg-black text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-zinc-800 transition-all shadow-xl flex items-center gap-2 mx-auto group">
            더 많은 갤러리 보기
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
