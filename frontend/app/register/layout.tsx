import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - 무료로 시작하기",
  description: "AUTOPIC 회원가입하고 무료 5크레딧을 받으세요. 이메일, Google, 카카오로 간편하게 가입할 수 있습니다.",
  keywords: ["AUTOPIC 회원가입", "AI 이미지 생성 무료", "무료 크레딧"],
  openGraph: {
    title: "AUTOPIC 회원가입 - 무료 5크레딧 제공",
    description: "지금 가입하고 무료로 AI 상품 이미지를 생성해보세요.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
