import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 수집 및 이용 동의 - AUTOPIC",
  description: "AUTOPIC 개인정보 수집 및 이용 동의",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">개인정보 수집 및 이용 동의</h1>
        
        <p className="text-zinc-400 mb-8">시행일: 2025년 1월 1일</p>

        <p className="text-zinc-300 mb-8">
          <strong className="text-white">오토픽(AUTOPIC)</strong>은 안전한 서비스 제공을 위해 아래와 같이 개인정보를 수집 및 이용합니다.
        </p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. 수집 및 이용 목적</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">회원 관리:</strong> 회원 식별, 본인 확인, 부정 이용 방지, 가입 및 탈퇴 처리.</li>
              <li><strong className="text-zinc-200">서비스 제공:</strong> AI 이미지 생성, 생성물 저장 및 히스토리 관리, 크레딧 관리.</li>
              <li><strong className="text-zinc-200">결제 및 환불:</strong> 유료 크레딧/구독 결제 처리, 원결제 수단으로의 환불 처리, 정산 및 보증보험 관련 사무.</li>
              <li><strong className="text-zinc-200">고객 상담:</strong> 이용 문의 응대 및 고지사항 전달.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. 수집하는 개인정보 항목</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">필수 항목:</strong> 이메일 주소(ID), 비밀번호, 닉네임, 서비스 이용 기록, 접속 로그, IP 정보.</li>
              <li><strong className="text-zinc-200">결제/환불 시:</strong> 카드정보 일부(카드사명, 승인번호), 결제 금액, 휴대전화 번호, (취소 불가 시) 환불 계좌 정보.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. 개인정보의 보유 및 이용 기간</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">원칙</h3>
                <p className="text-zinc-400">회원 탈퇴 시 또는 서비스 종료 시까지 보관합니다.</p>
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 mb-2">법령에 의한 보존</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  <li>계약 또는 청약철회, 대금결제 기록: 5년 (전자상거래법)</li>
                  <li>소비자의 불만 또는 분쟁처리 기록: 3년 (전자상거래법)</li>
                  <li>서비스 접속 기록: 3개월 (통신비밀보호법)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. 동의 거부권 및 불이익</h2>
            <p className="text-zinc-400">이용자는 개인정보 수집 및 이용에 동의하지 않을 권리가 있으나, 동의하지 않으실 경우 회원가입 및 결제 서비스 이용이 제한됩니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. 개인정보의 제3자 제공</h2>
            <p className="text-zinc-400 mb-2">회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. 이용자의 권리</h2>
            <p className="text-zinc-400 mb-2">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. 개인정보 보호책임자</h2>
            <p className="text-zinc-400 mb-2">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="mt-2 p-4 bg-zinc-900 rounded-lg text-zinc-400">
              <p>이메일: support@autopic.app</p>
            </div>
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
