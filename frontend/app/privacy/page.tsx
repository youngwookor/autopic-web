import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - AUTOPIC",
  description: "AUTOPIC 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>
        
        <p className="text-zinc-400 mb-8">시행일: 2024년 12월 1일</p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. 개인정보의 수집 및 이용 목적</h2>
            <p>AUTOPIC(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>회원 가입 및 관리: 회원제 서비스 제공, 개인 식별, 부정 이용 방지</li>
              <li>서비스 제공: AI 이미지 생성 서비스 제공, 크레딧 관리</li>
              <li>결제 처리: 크레딧 충전 및 결제 내역 관리</li>
              <li>고객 지원: 문의 응대, 공지사항 전달</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. 수집하는 개인정보 항목</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>필수항목: 이메일 주소, 비밀번호</li>
              <li>결제 시: 결제 정보 (결제 대행사를 통해 처리)</li>
              <li>자동 수집: 서비스 이용 기록, 접속 로그, IP 주소</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. 개인정보의 보유 및 이용 기간</h2>
            <p>회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>회원 탈퇴 시: 즉시 파기</li>
              <li>관계 법령에 따른 보존: 전자상거래법에 따라 결제 기록 5년 보관</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. 개인정보의 제3자 제공</h2>
            <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. 개인정보의 파기</h2>
            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. 이용자의 권리</h2>
            <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. 개인정보 보호책임자</h2>
            <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="mt-2 p-4 bg-zinc-900 rounded-lg text-zinc-400">
              <p>이메일: support@autopic.app</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. 개인정보처리방침 변경</h2>
            <p>이 개인정보처리방침은 2024년 12월 1일부터 적용됩니다. 변경사항이 있을 경우 웹사이트를 통해 공지할 예정입니다.</p>
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
