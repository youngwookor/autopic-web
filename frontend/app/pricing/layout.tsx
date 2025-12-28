import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "크레딧 충전 - 합리적인 가격",
  description: "AUTOPIC 크레딧을 충전하고 AI 상품 이미지를 생성하세요. 구독 없이 필요한 만큼만, 크레딧은 무기한 유효합니다. 최대 47% 할인된 가격으로 시작하세요.",
  keywords: ["AUTOPIC 가격", "AI 이미지 생성 가격", "상품 사진 비용", "크레딧 충전"],
  openGraph: {
    title: "AUTOPIC 크레딧 충전 - 합리적인 가격",
    description: "구독 없이 필요한 만큼만, 크레딧은 무기한 유효합니다.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
