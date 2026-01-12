import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - AUTOPIC",
  description: "AUTOPIC 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">듀엘로 이용약관</h1>
        
        <p className="text-zinc-400 mb-8">시행일: 2025년 1월 1일</p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제1조 (목적)</h2>
            <p>본 약관은 듀엘로(이하 "회사")가 운영하는 오토픽(AUTOPIC) 웹사이트 및 애플리케이션을 통해 제공하는 AI 상품 이미지 생성 서비스 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제2조 (요금 및 결제 방식)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">1. 요금 체계</h3>
                <p className="text-zinc-400">서비스는 크레딧 충전형과 정기 구독형(월간/연간)으로 구성됩니다. 사이트에 표기된 모든 금액은 부가세(VAT)가 포함된 최종 결제 금액입니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">2. 크레딧 충전 플랜</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  <li>Light: 19,000원 (50 크레딧)</li>
                  <li>Standard: 49,000원 (200 크레딧)</li>
                  <li>Plus: 119,000원 (500 크레딧)</li>
                  <li>Mega: 349,000원 (1,500 크레딧)</li>
                  <li>Ultimate: 999,000원 (5,000 크레딧)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">3. 정기 구독 플랜</h3>
                <p className="text-zinc-400">매월 정해진 크레딧이 지급되며, 연간 플랜 결제 시 월간 플랜 대비 할인된 가격이 적용됩니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">4. 결제 제한</h3>
                <p className="text-zinc-400">충전형 상품의 특성상 카드사의 정책에 따라 결제 한도가 제한될 수 있으며, 하나카드 등 일부 카드사는 결제가 불가할 수 있습니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">5. 결제 수단</h3>
                <p className="text-zinc-400">신용카드 일시불 결제만 가능합니다. 할부 결제, 간편결제, 가상계좌, 계좌이체 등 기타 결제 수단은 이용이 제한됩니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제3조 (크레딧 사용 및 유효기간)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">1. 사용 용도</h3>
                <p className="text-zinc-400 mb-2">충전된 크레딧은 서비스 내에서 AI 모델을 이용한 이미지 생성 권한을 획득하는 데 사용됩니다.</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  <li>Standard 모델: 1회 생성 시 1 크레딧 소진</li>
                  <li>Premium 모델: 1회 생성 시 3 크레딧 소진</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">2. 유효기간</h3>
                <p className="text-zinc-400">충전된 크레딧의 이용 기간 및 환불 가능 기간은 <strong className="text-white">결제 시점으로부터 1년(12개월)</strong>입니다. 기간이 경과한 크레딧은 소멸되며 환불이 불가합니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">3. 양도 금지</h3>
                <p className="text-zinc-400">사용자가 보유한 크레딧은 타인에게 양도, 판매, 대여할 수 없으며 계정 간 이동도 불가능합니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제4조 (생성 이미지 보관 정책)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">1. 보관 기간</h3>
                <p className="text-zinc-400">서비스를 통해 생성된 이미지는 <strong className="text-white">생성일로부터 7일간</strong> 서버에 보관됩니다. 7일이 경과한 이미지는 자동으로 삭제되며, 삭제된 이미지는 복구할 수 없습니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">2. 다운로드 권장</h3>
                <p className="text-zinc-400">이용자는 생성된 이미지를 보관 기간 내에 다운로드하여 별도로 저장하시기 바랍니다. 회사는 보관 기간 경과 후 삭제된 이미지에 대해 어떠한 책임도 지지 않습니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">3. 생성 기록</h3>
                <p className="text-zinc-400">이미지 생성 기록(생성 일시, 모드, 사용 크레딧 등)은 이미지 삭제 후에도 마이페이지에서 확인할 수 있습니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제5조 (저작권 및 상업적 이용)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">1. 권리 귀속</h3>
                <p className="text-zinc-400">서비스를 통해 생성된 모든 이미지의 저작권 및 소유권은 생성한 이용자에게 귀속됩니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">2. 상업적 활용</h3>
                <p className="text-zinc-400">이용자는 생성된 이미지를 쇼핑몰 홍보, 광고 등 상업적 용도로 제한 없이 사용할 수 있습니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">3. 회사 활용</h3>
                <p className="text-zinc-400">회사는 서비스 홍보 및 AI 품질 개선을 위해 익명화된 생성물을 활용할 수 있습니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제6조 (청약철회 및 환불 정책)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">1. 전액 환불</h3>
                <p className="text-zinc-400">결제 후 7일 이내에 크레딧을 전혀 사용하지 않은 경우에 한하여 전액 환불이 가능합니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">2. 환불 방법</h3>
                <p className="text-zinc-400">카드결제를 통한 구매 건의 환불은 원칙적으로 카드 매출 취소 환불을 통해서만 가능합니다. 환불은 반드시 결제가 이루어졌던 원결제 수단(카드 취소 등)으로 진행됩니다. 시스템상 원결제 취소가 불가능한 부득이한 경우에 한해 별도 정산 후 계좌 입금 처리됩니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">3. 환불 불가</h3>
                <p className="text-zinc-400">디지털 콘텐츠 특성상 1회라도 크레딧을 사용하여 이미지를 생성한 경우 변심에 의한 환불은 불가능합니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">4. 시스템 오류</h3>
                <p className="text-zinc-400">회사의 귀책 사유로 생성에 실패하고 크레딧만 차감된 경우, 해당 크레딧은 즉시 복구해 드립니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">제7조 (면책 조항)</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li>회사는 AI 기술의 특성상 생성 결과의 완벽성이나 이용자의 주관적 기대치 부합 여부를 보장하지 않으며, 이로 인한 환불은 불가합니다.</li>
              <li>천재지변, 외부 서비스의 장애로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.</li>
              <li>이용자가 보관 기간(7일) 내에 이미지를 다운로드하지 않아 발생하는 손실에 대해 회사는 책임을 지지 않습니다.</li>
            </ul>
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
