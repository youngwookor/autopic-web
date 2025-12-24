'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudioPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 메인페이지의 스튜디오 섹션으로 리다이렉트
    router.replace('/#studio');
  }, [router]);

  return null;
}
