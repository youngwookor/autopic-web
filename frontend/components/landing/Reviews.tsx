'use client';

import { Star } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function Reviews() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const reviews = [
    { 
      name: "김민준 대표", 
      brand: "Urban Classic", 
      text: "모델 섭외 비용이 달 300만원씩 들었는데, 0원이 되었습니다. 퀄리티는 오히려 더 좋아졌어요." 
    },
    { 
      name: "이서연 디렉터", 
      brand: "Mood Seoul", 
      text: "급하게 신상이 들어왔을 때 폰으로 찍어서 바로 올릴 수 있는 게 가장 큰 장점입니다." 
    },
    { 
      name: "박지훈 MD", 
      brand: "The Fit", 
      text: "마케팅 문구까지 써주는 기능이 정말 유용합니다. 인스타 업로드가 훨씬 편해졌습니다." 
    }
  ];

  return (
    <section id="reviews" ref={sectionRef} className="py-16 md:py-32 bg-white overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div 
          className={`flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 mb-10 md:mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl">
            4.9
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">2,400+ 브랜드의 선택</h2>
        </div>
        
        <div className="flex flex-nowrap overflow-x-auto gap-3 md:gap-4 pb-4 no-scrollbar md:grid md:grid-cols-3">
          {reviews.map((review, i) => (
            <div 
              key={i} 
              className={`min-w-[280px] md:min-w-0 bg-zinc-50 p-6 md:p-10 rounded-2xl md:rounded-[32px] border border-zinc-100 hover:shadow-xl transition-all duration-700 flex flex-col justify-between ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${(i + 1) * 150}ms` }}
            >
              <div>
                <div className="flex gap-0.5 md:gap-1 text-black mb-4 md:mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" className="md:w-[18px] md:h-[18px]" />
                  ))}
                </div>
                <p className="text-base md:text-xl font-medium leading-relaxed mb-6 md:mb-8">"{review.text}"</p>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-4 md:pt-6">
                <div>
                  <div className="font-bold text-sm md:text-lg">{review.name}</div>
                  <div className="text-xs md:text-sm text-zinc-500">{review.brand}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
