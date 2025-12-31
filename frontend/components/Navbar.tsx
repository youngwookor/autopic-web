'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useCreditsStore } from '@/lib/store';
import { signOut } from '@/lib/supabase';
import { Menu, X, LogOut, User, CreditCard, Home, Sparkles, HelpCircle, ImageIcon } from 'lucide-react';
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
  
  // 스와이프 다운 관련 상태
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 메뉴 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // 메뉴 닫힐 때 dragY 리셋
  useEffect(() => {
    if (!isMenuOpen) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [isMenuOpen]);

  // 스와이프 다운 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    // 아래로 드래그할 때만 반응 (양수 값)
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // 100px 이상 내리면 메뉴 닫기
    if (dragY > 100) {
      setIsMenuOpen(false);
    }
    
    setDragY(0);
  };

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    
    if (pathname !== '/') {
      router.push(`/#${id}`);
      return;
    }
    
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 100);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      logout();
      setBalance(0);
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
    <>
      <nav className={`fixed w-full z-[100] transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-white/80 backdrop-blur-xl py-4 shadow-sm border-b border-zinc-100' : 'bg-transparent py-6'}`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 flex justify-between items-center">
          {/* Logo + User Info */}
          <div className="relative z-[101]">
            <Link 
              href="/" 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
            >
              <AutoPicLogo className="w-6 h-6 text-[#87D039]" />
              <span className="font-black text-xl tracking-tighter text-black uppercase">
                AUTOPIC
              </span>
            </Link>
            {/* 모바일 로그인 상태 표시 */}
            {isAuthenticated && (
              <div className="md:hidden flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-bold text-[#87D039]">
                  {formatNumber(balance?.credits || 0)}C
                </span>
              </div>
            )}
          </div>

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
                <Link
                  href="/gallery"
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  갤러리
                </Link>
                <button 
                  onClick={() => scrollToSection('pricing')} 
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  요금제
                </button>
                <Link
                  href="/guide"
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  가이드
                </Link>
                
                {/* Credits Badge */}
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
                <Link
                  href="/gallery"
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  갤러리
                </Link>
                <button 
                  onClick={() => scrollToSection('pricing')} 
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  요금제
                </button>
                <Link
                  href="/guide"
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                >
                  가이드
                </Link>
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
        </div>
      </nav>

      {/* Mobile Bottom Sheet Menu */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[200] transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Bottom Sheet */}
      <div 
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-3xl md:hidden ${
          isDragging ? '' : 'transition-transform duration-300 ease-out'
        } ${
          isMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          maxHeight: '85vh',
          transform: isMenuOpen ? `translateY(${dragY}px)` : 'translateY(100%)',
          opacity: isMenuOpen ? Math.max(0, 1 - dragY / 300) : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle Bar - 드래그 힌트 */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className={`w-10 h-1 rounded-full transition-colors ${isDragging ? 'bg-zinc-400' : 'bg-zinc-300'}`} />
        </div>

        {/* Menu Content */}
        <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 20px)' }}>
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-4 py-4 border-b border-zinc-100">
                <div className="w-12 h-12 bg-gradient-to-br from-[#87D039] to-[#6BBF2A] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(user?.name || user?.email)?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-zinc-900">{user?.name || user?.email?.split('@')[0]}</p>
                  <p className="text-sm text-zinc-500">{user?.email}</p>
                </div>
                <div className="bg-[#87D039]/10 px-3 py-1.5 rounded-full">
                  <span className="text-sm font-bold text-[#87D039]">{formatNumber(balance?.credits || 0)} 크레딧</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="py-4 space-y-1">
                <button 
                  onClick={() => scrollToSection('studio')}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <Sparkles size={20} className="text-zinc-500" />
                  <span className="font-medium">스튜디오</span>
                </button>
                <button 
                  onClick={() => scrollToSection('process')}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <HelpCircle size={20} className="text-zinc-500" />
                  <span className="font-medium">이용방법</span>
                </button>
                <Link 
                  href="/gallery"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <ImageIcon size={20} className="text-zinc-500" />
                  <span className="font-medium">갤러리</span>
                </Link>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <CreditCard size={20} className="text-zinc-500" />
                  <span className="font-medium">요금제</span>
                </button>
                <Link 
                  href="/guide"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <HelpCircle size={20} className="text-zinc-500" />
                  <span className="font-medium">가이드</span>
                </Link>
                <Link 
                  href="/mypage"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <User size={20} className="text-zinc-500" />
                  <span className="font-medium">마이페이지</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="pt-4 border-t border-zinc-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition"
                >
                  <LogOut size={20} />
                  <span className="font-medium">로그아웃</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Navigation */}
              <div className="py-4 space-y-1">
                <button 
                  onClick={() => scrollToSection('studio')}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <Sparkles size={20} className="text-zinc-500" />
                  <span className="font-medium">스튜디오</span>
                </button>
                <button 
                  onClick={() => scrollToSection('process')}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <HelpCircle size={20} className="text-zinc-500" />
                  <span className="font-medium">이용방법</span>
                </button>
                <Link 
                  href="/gallery"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <ImageIcon size={20} className="text-zinc-500" />
                  <span className="font-medium">갤러리</span>
                </Link>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <CreditCard size={20} className="text-zinc-500" />
                  <span className="font-medium">요금제</span>
                </button>
                <Link 
                  href="/guide"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-zinc-50 transition"
                >
                  <HelpCircle size={20} className="text-zinc-500" />
                  <span className="font-medium">가이드</span>
                </Link>
              </div>

              {/* Login Button */}
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black transition"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition"
                >
                  회원가입
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Safe Area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
