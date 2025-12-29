'use client';

import Link from 'next/link';
import { Globe, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-black py-12 md:py-20 border-t border-zinc-200">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
          {/* 사업자 정보 */}
          <div className="flex-1">
            <div className="font-black text-xl md:text-2xl tracking-tighter mb-4 md:mb-6 flex items-center gap-1 uppercase">
              AUTOPIC
            </div>
            <p className="text-zinc-500 font-medium max-w-sm text-sm md:text-base mb-4">
              AI 기술로 완성하는 차세대 이커머스 촬영 및 마케팅 자동화 솔루션.
            </p>
            <div className="text-zinc-400 text-[10px] md:text-xs space-y-1">
              <p><span className="text-zinc-500">상호:</span> 듀엘로 | <span className="text-zinc-500">대표:</span> 장진영</p>
              <p><span className="text-zinc-500">사업자등록번호:</span> 705-23-02252</p>
              <p><span className="text-zinc-500">주소:</span> 경기도 부천시 원미구 송내대로265번길 53, 8층 804,805호</p>
              <p><span className="text-zinc-500">이메일:</span> support@autopic.app</p>
            </div>
          </div>
          
          {/* 링크 */}
          <div className="flex gap-10 md:gap-16">
            <div>
              <h4 className="font-bold mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-widest text-zinc-400">Product</h4>
              <ul className="text-zinc-500 space-y-1.5 md:space-y-2 text-xs md:text-sm font-medium">
                <li><a href="#studio" className="hover:text-black transition-colors">Studio</a></li>
                <li><a href="#pricing" className="hover:text-black transition-colors">Pricing</a></li>
                <li><Link href="/guide" className="hover:text-black transition-colors">Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-widest text-zinc-400">Legal</h4>
              <ul className="text-zinc-500 space-y-1.5 md:space-y-2 text-xs md:text-sm font-medium">
                <li><Link href="/privacy" className="hover:text-black transition-colors">개인정보처리방침</Link></li>
                <li><Link href="/terms" className="hover:text-black transition-colors">이용약관</Link></li>
                <li><a href="mailto:support@autopic.app" className="hover:text-black transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-100 mt-12 md:mt-20 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs font-medium text-zinc-400">
          <p>&copy; 2024 AUTOPIC. All rights reserved.</p>
          <div className="flex gap-4 md:gap-6">
            <Link href="https://autopic.app" target="_blank">
              <Globe size={16} className="hover:text-black cursor-pointer transition-colors md:w-[18px] md:h-[18px]" />
            </Link>
            <a href="mailto:support@autopic.app">
              <Mail size={16} className="hover:text-black cursor-pointer transition-colors md:w-[18px] md:h-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
