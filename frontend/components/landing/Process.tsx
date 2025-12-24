'use client';

import { Upload, Scan, Sliders, Download, Check } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface ProcessCardProps {
  step: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  delay: number;
  isVisible: boolean;
  children?: React.ReactNode;
}

const ProcessCard = ({ step, title, desc, icon: Icon, delay, isVisible, children }: ProcessCardProps) => {
  return (
    <div 
      className={`relative bg-zinc-50 rounded-2xl md:rounded-[32px] p-5 md:p-6 lg:p-8 flex flex-col items-center text-center group hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-zinc-200 overflow-hidden h-full ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Step Number */}
      <div className="absolute top-4 md:top-6 left-4 md:left-6 text-[32px] md:text-[40px] font-bold text-zinc-200 leading-none select-none z-0">
        {step}
      </div>

      {/* Icon Container */}
      <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6 rounded-xl md:rounded-2xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        <Icon size={24} className="text-zinc-400 group-hover:text-[#87D039] transition-colors md:w-8 md:h-8" />
        {children}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-zinc-900">{title}</h3>
        <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">{desc}</p>
      </div>

      {/* Hover Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#87D039]/20 rounded-2xl md:rounded-[32px] transition-colors pointer-events-none"></div>
    </div>
  );
};

export default function Process() {
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

  return (
    <section id="process" ref={sectionRef} className="py-16 md:py-24 bg-white px-4 md:px-6">
      <div className="max-w-[1400px] mx-auto">
        <div 
          className={`mb-12 md:mb-20 text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="inline-block px-3 py-1 rounded-full border border-zinc-200 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 mb-3 md:mb-4 text-zinc-500">
            Workflow
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 md:mb-4">완벽한 결과물을 위한 4단계</h2>
          <p className="text-zinc-500 text-sm md:text-lg">복잡한 스튜디오 촬영을 AI 기술로 단순화했습니다.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <ProcessCard
            step="01"
            title="촬영 및 업로드"
            desc="스마트폰으로 제품을 촬영하고 원본 사진을 업로드하세요."
            icon={Upload}
            delay={100}
            isVisible={isVisible}
          >
            <div className="absolute inset-2 border-2 border-zinc-900/5 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute top-1 md:top-2 right-1 md:right-2 w-1.5 md:w-2 h-1.5 md:h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 text-[6px] md:text-[8px] font-mono text-zinc-400">REC</div>
            </div>
          </ProcessCard>

          <ProcessCard
            step="02"
            title="AI 정밀 분석"
            desc="비전 엔진이 제품의 구도, 조명, 재질을 분석합니다."
            icon={Scan}
            delay={200}
            isVisible={isVisible}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#87D039]/10 to-transparent h-[50%] opacity-0 group-hover:opacity-100 pointer-events-none" 
                 style={{ animation: 'scan 2s linear infinite' }}
            />
          </ProcessCard>

          <ProcessCard
            step="03"
            title="스튜디오 보정"
            desc="전문 포토그래퍼 톤으로 조명과 배경을 보정합니다."
            icon={Sliders}
            delay={300}
            isVisible={isVisible}
          >
            <div className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 md:gap-1 items-end h-6 md:h-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-0.5 md:w-1 bg-[#87D039] h-[60%] animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-0.5 md:w-1 bg-[#87D039] h-[80%] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-0.5 md:w-1 bg-[#87D039] h-[40%] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </ProcessCard>

          <ProcessCard
            step="04"
            title="완성 및 다운로드"
            desc="4K 초고화질 이미지를 다운로드 받으세요."
            icon={Download}
            delay={400}
            isVisible={isVisible}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-xl md:rounded-2xl backdrop-blur-sm">
              <div className="bg-[#87D039] p-1.5 md:p-2 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform delay-100">
                <Check size={12} className="text-white md:w-4 md:h-4" strokeWidth={3} />
              </div>
            </div>
          </ProcessCard>
        </div>
      </div>
    </section>
  );
}
