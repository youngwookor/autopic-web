import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "AUTOPIC에 로그인하고 AI 상품 이미지 생성을 시작하세요. Google, 카카오 간편 로그인을 지원합니다.",
  robots: {
    index: false, // 로그인 페이지는 검색 노출 불필요
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
