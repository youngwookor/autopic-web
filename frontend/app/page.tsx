'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import Hero from '@/components/landing/Hero';
import Studio from '@/components/landing/Studio';
import Process from '@/components/landing/Process';
import Showcase from '@/components/landing/Showcase';
import Reviews from '@/components/landing/Reviews';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // URL 해시로 접근 시 해당 섹션으로 스크롤
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="text-zinc-900 bg-white min-h-screen selection:bg-black selection:text-white">
      <Navbar isScrolled={isScrolled} />
      <Hero />
      <Studio />
      <Process />
      <Showcase />
      <Reviews />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
