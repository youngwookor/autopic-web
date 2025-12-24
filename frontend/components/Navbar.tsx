'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { signOut } from '@/lib/supabase';
import { Menu, X, LogOut, User } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

// 조리개 로고
const AutoPicLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m14.31 8 5.74 9.94" />
    <path d="M9.69 8h11.48" />
    <path d="m7.38 12 5.74-9.94" />
    <path d="M9.69 16 3.95 6.06" />
    <path d="M14.31 16H2.83" />
    <path d="m16.62 12-5.74 9.94" />
  </svg>
);

interface NavbarProps {
  isScrolled?: boolean;
}

export default function Navbar({ isScrolled: propIsScrolled }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { balance, setBalance } = useCreditsStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (pathname !== '/') {
      router.push(`/#${id}`);
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(); // Supabase 로그아웃
      logout(); // Store 초기화
      setBalance(0); // 크레딧 초기화
      
      // localStorage 완전 초기화
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('credits-storage');
      
      router.push('/');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const scrolled = propIsScrolled !== undefined ? propIsScrolled : isScrolled;

  return (
    <nav className={`fixed w-full z-[100] transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-white/80 backdrop-blur-xl py-4 shadow-sm border-b border-zinc-100' : 'bg-transparent py-6'}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 cursor-pointer relative z-[101]"
        >
          <AutoPicLogo className="w-6 h-6 text-[#87D039]" />
          <span className="font-black text-xl tracking-tighter text-black uppercase">
            AUTOPIC
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => scrollToSection('studio')} 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
              >
                스튜디오
              </button>
              <button 
                onClick={() => scrollToSection('process')} 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
              >
                이용방법
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
              >
                요금제
              </button>
              
              {/* Credits Badge - 클릭하면 마이페이지 */}
              <Link 
                href="/mypage"
                className="flex items-center gap-2 bg-zinc-100 px-4 py-2 rounded-full hover:bg-zinc-200 transition"
              >
                <span className="text-sm font-bold text-zinc-900">{formatNumber(balance?.credits || 0)}</span>
                <span className="text-xs text-zinc-500">크레딧</span>
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <Link
                  href="/mypage"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  <User size={18} />
                  {user?.name || user?.email?.split('@')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  title="로그아웃"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => scrollToSection('studio')} 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
              >
                스튜디오
              </button>
              <button 
                onClick={() => scrollToSection('process')} 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
              >
                이용방법
              </button>
              <button 
                onClick={() => scrollToSection('showcase')} 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
              >
                갤러리
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
              >
                요금제
              </button>
              <Link
                href="/login"
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                로그인
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden relative z-[101] p-2 text-zinc-900"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center gap-8 transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}>
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => scrollToSection('studio')} 
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                스튜디오
              </button>
              <button 
                onClick={() => scrollToSection('process')} 
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                이용방법
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                요금제
              </button>
              <Link
                href="/mypage"
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                마이페이지
              </Link>
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="bg-zinc-100 px-6 py-3 rounded-full">
                  <span className="font-bold">{formatNumber(balance?.credits || 0)} 크레딧</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-red-500 font-medium"
                >
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => scrollToSection('studio')} 
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                스튜디오
              </button>
              <button 
                onClick={() => scrollToSection('process')} 
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                이용방법
              </button>
              <button 
                onClick={() => scrollToSection('showcase')} 
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                갤러리
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-2xl font-bold text-zinc-800 tracking-tight"
              >
                요금제
              </button>
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="mt-8 bg-zinc-900 text-white px-8 py-4 rounded-full font-medium"
              >
                로그인
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
