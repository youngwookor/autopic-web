'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/landing/Hero';
import Studio from '@/components/landing/Studio';
import Process from '@/components/landing/Process';
import Showcase from '@/components/landing/Showcase';
import Reviews from '@/components/landing/Reviews';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
