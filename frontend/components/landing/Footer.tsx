'use client';

import { Globe, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-black py-12 md:py-20 border-t border-zinc-200">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
          <div>
            <div className="font-black text-xl md:text-2xl tracking-tighter mb-4 md:mb-6 flex items-center gap-1 uppercase">
              AUTOPIC
            </div>
            <p className="text-zinc-500 font-medium max-w-sm text-sm md:text-base">
              AI 기술로 완성하는 차세대 이커머스 촬영 및 마케팅 자동화 솔루션.
            </p>
          </div>
          <div className="flex gap-10 md:gap-16">
            <div>
              <h4 className="font-bold mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-widest text-zinc-400">Product</h4>
              <ul className="text-zinc-500 space-y-1.5 md:space-y-2 text-xs md:text-sm font-medium">
                <li><a href="#studio" className="hover:text-black transition-colors">Studio</a></li>
                <li><a href="#pricing" className="hover:text-black transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-widest text-zinc-400">Company</h4>
              <ul className="text-zinc-500 space-y-1.5 md:space-y-2 text-xs md:text-sm font-medium">
                <li><a href="#" className="hover:text-black transition-colors">About</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-100 mt-12 md:mt-20 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs font-medium text-zinc-400">
          <p>&copy; 2024 AUTOPIC Inc. All rights reserved.</p>
          <div className="flex gap-4 md:gap-6">
            <Globe size={16} className="hover:text-black cursor-pointer transition-colors md:w-[18px] md:h-[18px]" />
            <Mail size={16} className="hover:text-black cursor-pointer transition-colors md:w-[18px] md:h-[18px]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
