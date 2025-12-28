import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - AUTOPIC",
  description: "AUTOPIC 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">서비스 이용약관</h1>
        
        <p className="text-zinc-400 mb-8">시행일: 2024년 12월 1일</p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제1조 (목적)</h2>
            <p>이 약관은 AUTOPIC(이하 "회사")이 제공하는 AI 이미지 생성 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제2조 (정의)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>"서비스"란 회사가 제공하는 AI 기반 상품 이미지 생성 서비스를 말합니다.</li>
              <li>"이용자"란 이 약관에 따라 서비스를 이용하는 회원을 말합니다.</li>
              <li>"크레딧"이란 서비스 이용을 위해 필요한 가상의 결제 단위를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제3조 (서비스의 내용)</h2>
            <p>회사가 제공하는 서비스는 다음과 같습니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>AI 기반 상품 이미지 생성</li>
              <li>AI 기반 모델 착용샷 생성</li>
              <li>기타 회사가 정하는 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제4조 (이용계약의 성립)</h2>
            <p>이용계약은 이용자가 약관의 내용에 동의하고 회원가입 신청을 한 후 회사가 이를 승낙함으로써 성립합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제5조 (크레딧 및 결제)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>서비스 이용을 위해서는 크레딧이 필요합니다.</li>
              <li>크레딧은 회사가 정한 방법으로 충전할 수 있습니다.</li>
              <li>충전된 크레딧은 환불되지 않습니다. 단, 관련 법령에 따른 경우는 예외로 합니다.</li>
              <li>크레딧의 유효기간은 충전일로부터 1년입니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제6조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>타인의 정보를 도용하는 행위</li>
              <li>서비스를 이용하여 불법적인 콘텐츠를 생성하는 행위</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>기타 법령에 위반되는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제7조 (저작권)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>서비스를 통해 생성된 이미지의 저작권은 이용자에게 귀속됩니다.</li>
              <li>이용자가 업로드한 원본 이미지에 대한 권리와 책임은 이용자에게 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제8조 (서비스 중단)</h2>
            <p>회사는 다음 각 호에 해당하는 경우 서비스 제공을 중단할 수 있습니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>설비의 보수 등 공사로 인한 부득이한 경우</li>
              <li>천재지변, 정전 등 불가항력적 사유가 발생한 경우</li>
              <li>서비스 이용의 폭주 등으로 정상적인 서비스 이용에 지장이 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제9조 (면책조항)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
              <li>AI가 생성한 이미지의 품질이나 정확성에 대해서는 보증하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제10조 (약관의 변경)</h2>
            <p>회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제11조 (분쟁해결)</h2>
            <p>서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <a href="/" className="text-lime-400 hover:text-lime-300 transition-colors">
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
