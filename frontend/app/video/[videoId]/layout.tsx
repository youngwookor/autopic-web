import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AUTOPIC 360° 비디오',
  description: 'AI로 생성한 360° 상품 회전 비디오를 확인해보세요. AUTOPIC에서 상품 사진 한 장으로 전문 스튜디오 퀄리티의 이미지와 비디오를 생성하세요.',
  openGraph: {
    title: 'AUTOPIC 360° 비디오',
    description: 'AI로 생성한 360° 상품 회전 비디오',
    siteName: 'AUTOPIC',
    type: 'video.other',
    url: 'https://autopic.kr',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AUTOPIC 360° 비디오',
    description: 'AI로 생성한 360° 상품 회전 비디오',
  },
};

export default function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
