'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/landing/Hero';
import Studio from '@/components/landing/Studio';
import GalleryPreview from '@/components/landing/GalleryPreview';
import Process from '@/components/landing/Process';
import Reviews from '@/components/landing/Reviews';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

// 스크롤 애니메이션 래퍼 컴포넌트
function AnimatedSection({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1, rootMargin: '-80px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="text-zinc-900 bg-white min-h-screen selection:bg-black selection:text-white">
      <Navbar isScrolled={isScrolled} />
      <Hero />
      <AnimatedSection><GalleryPreview /></AnimatedSection>
      <AnimatedSection><Studio /></AnimatedSection>
      <AnimatedSection delay={50}><Process /></AnimatedSection>
      <AnimatedSection><Reviews /></AnimatedSection>
      <AnimatedSection delay={50}><Pricing /></AnimatedSection>
      <AnimatedSection><FAQ /></AnimatedSection>
      <Footer />
    </div>
  );
}
