import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 스튜디오 - 이미지 생성",
  description: "상품 사진을 업로드하고 AI로 전문 스튜디오 퀄리티의 이미지를 생성하세요. 정물, 모델 착용샷, 화보 스타일까지 다양한 옵션을 제공합니다.",
  keywords: ["AI 스튜디오", "상품 이미지 생성", "AI 착용샷", "상품 사진 편집"],
  openGraph: {
    title: "AUTOPIC AI 스튜디오",
    description: "상품 사진을 업로드하고 AI로 전문 스튜디오 퀄리티의 이미지를 생성하세요.",
  },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
