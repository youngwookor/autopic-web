'use client';

import { ArrowRight, Plus } from 'lucide-react';

export default function Hero() {
  const slides = [
    { label: "Studio Shot" },
    { label: "Accessories" },
    { label: "Outerwear" },
    { label: "Detail" },
    { label: "Texture" },
  ];

  return (
    <section className="relative min-h-screen bg-white text-black overflow-hidden flex flex-col justify-between pt-24 md:pt-32 pb-0">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-[20%] -right-[10%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-gradient-to-br from-[#87D039]/20 to-emerald-100/40 rounded-full blur-[80px] md:blur-[120px]"
          style={{ animation: 'pulse 20s ease-in-out infinite' }}
        />
        <div 
          className="absolute top-[10%] -left-[10%] w-[350px] md:w-[700px] h-[350px] md:h-[700px] bg-gradient-to-tr from-blue-100/40 to-purple-100/30 rounded-full blur-[60px] md:blur-[100px]"
          style={{ animation: 'pulse 25s ease-in-out infinite reverse' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[20%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-gradient-to-t from-yellow-100/30 to-orange-50/20 rounded-full blur-[50px] md:blur-[80px]"
          style={{ animation: 'float 15s ease-in-out infinite' }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      {/* Top Right Decoration */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 lg:top-12 lg:right-12">
        <Plus size={24} strokeWidth={1} className="text-zinc-300 md:w-8 md:h-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center max-w-[1600px] w-full mx-auto relative z-10 px-4 md:px-6 lg:px-12 mb-12 md:mb-20">
        <div className="max-w-4xl animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-zinc-200 text-[10px] md:text-xs font-medium tracking-wide bg-zinc-50">
              AutoPic Studio 2.0
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-8xl font-medium tracking-tight leading-[1.1] md:leading-[1.05] mb-6 md:mb-10 text-zinc-900">
            Photograph less,<br />
            <span className="text-zinc-400">Sell more.</span>
          </h1>

          <div className="flex flex-col gap-6 md:gap-8 md:flex-row md:items-center">
            <p className="text-base md:text-lg lg:text-xl text-zinc-600 max-w-md leading-relaxed">
              AI가 완성하는 커머스 사진의 새로운 기준.<br />
              조명, 모델, 보정까지 클릭 한번으로 해결하세요.
            </p>

            <button
              onClick={() => document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex items-center justify-center md:justify-start gap-2 md:gap-3 bg-zinc-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors w-full md:w-auto"
            >
              무료로 시작하기
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Slider */}
      <div className="relative w-full overflow-hidden pb-8 md:pb-12">
        <div className="flex w-full overflow-visible py-8 md:py-12">
          <div 
            className="flex gap-3 md:gap-4 lg:gap-6 px-4 items-center animate-marquee"
            style={{ width: 'fit-content' }}
          >
            {[...slides, ...slides, ...slides, ...slides].map((slide, idx) => (
              <div
                key={idx}
                className="relative flex-shrink-0 w-[100px] md:w-[120px] lg:w-[160px] aspect-[4/5] rounded-lg md:rounded-xl overflow-hidden bg-zinc-200 group border-[2px] md:border-[3px] border-transparent hover:border-[#87D039] hover:scale-110 hover:z-50 hover:shadow-[0_0_20px_rgba(135,208,57,0.6)] transition-all duration-300 ease-out origin-center"
              >
                <div className="w-full h-full bg-gradient-to-br from-zinc-300 to-zinc-200" />
                <div className="absolute bottom-1.5 md:bottom-2 left-1.5 md:left-2 bg-white/90 backdrop-blur-sm px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity">
                  {slide.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
