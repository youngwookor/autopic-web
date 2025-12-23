'use client';

import { useState } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  const questions = [
    { 
      q: "정말 스마트폰 사진으로도 가능한가요?", 
      a: "네, 가능합니다. AI가 화질을 개선하고 조명을 보정하기 때문에 스마트폰으로 찍은 사진으로도 충분히 고품질의 결과를 얻을 수 있습니다." 
    },
    { 
      q: "저작권 문제는 없나요?", 
      a: "생성된 이미지의 저작권은 전적으로 사용자에게 귀속됩니다. 상업적 용도로 자유롭게 사용하실 수 있습니다." 
    },
    { 
      q: "사람 얼굴은 어떻게 처리되나요?", 
      a: "프라이버시 보호를 위해 얼굴은 자동으로 크롭되거나 생성되지 않습니다. 옷의 핏과 디테일에 집중합니다." 
    },
    { 
      q: "지원하는 파일 형식이 어떻게 되나요?", 
      a: "JPG, PNG, HEIC 등 대부분의 이미지 형식을 지원하며, 고화질 JPG 및 투명 배경 PNG로 다운로드 가능합니다." 
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('문의가 접수되었습니다');
  };

  return (
    <section className="py-16 md:py-32 bg-white border-t border-zinc-100">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-10 md:mb-16 tracking-tight">궁금한 점이 있으신가요?</h2>
        
        <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* FAQ List */}
          <div className="lg:col-span-7 space-y-3 md:space-y-4">
            {questions.map((item, i) => (
              <div key={i} className="bg-zinc-50 rounded-xl md:rounded-3xl overflow-hidden">
                <button 
                  onClick={() => setOpenIndex(openIndex === i ? null : i)} 
                  className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-zinc-100 transition-colors"
                >
                  <h3 className="font-bold text-sm md:text-lg pr-4">{item.q}</h3>
                  <ChevronDown 
                    size={18} 
                    className={`transition-transform duration-300 flex-shrink-0 md:w-5 md:h-5 ${openIndex === i ? 'rotate-180' : ''}`} 
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-4 md:px-6 pb-4 md:pb-6 text-zinc-500 leading-relaxed text-xs md:text-base">{item.a}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-5 bg-black text-white p-6 md:p-10 rounded-2xl md:rounded-[40px] lg:sticky lg:top-24">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">문의하기</h3>
            <p className="text-zinc-400 text-sm md:text-base mb-6 md:mb-8">찾으시는 답변이 없나요? 직접 문의를 남겨주세요.</p>
            <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-sm md:text-base focus:outline-none focus:border-[#87D039] transition-colors" 
                placeholder="성함" 
              />
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-sm md:text-base focus:outline-none focus:border-[#87D039] transition-colors" 
                placeholder="이메일" 
              />
              <textarea 
                rows={4} 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-sm md:text-base focus:outline-none focus:border-[#87D039] transition-colors resize-none" 
                placeholder="문의 내용" 
              />
              <button 
                type="submit"
                className="w-full py-3 md:py-4 bg-[#87D039] text-black font-bold rounded-lg md:rounded-xl hover:bg-lime-400 transition flex items-center justify-center gap-2 text-sm md:text-base"
              >
                보내기 <Send size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
