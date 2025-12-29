'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Monitor, Globe, CreditCard, HelpCircle, Folder, Zap, Download, Key, Upload, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

// 로고 컴포넌트
const AutoPicLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m14.31 8 5.74 9.94" />
    <path d="M9.69 8h11.48" />
    <path d="m7.38 12 5.74-9.94" />
    <path d="M9.69 16 3.95 6.06" />
    <path d="M14.31 16H2.83" />
    <path d="m16.62 12-5.74 9.94" />
  </svg>
);

type SectionId = 'web' | 'desktop' | 'credit' | 'faq';
type SubSectionId = 'start' | 'web-usage' | 'desktop-install' | 'folder' | 'batch' | 'credit-info' | 'faq-list';

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<SectionId>('web');
  const [activeSubSection, setActiveSubSection] = useState<SubSectionId>('start');

  const sections: { id: SectionId; title: string; icon: React.ReactNode; subSections: { id: SubSectionId; title: string }[] }[] = [
    {
      id: 'web',
      title: '오토픽 웹 사용법',
      icon: <Globe className="w-5 h-5" />,
      subSections: [
        { id: 'start', title: '시작하기' },
        { id: 'web-usage', title: '웹 사용법' },
      ]
    },
    {
      id: 'desktop',
      title: '오토픽 프로그램 사용법',
      icon: <Monitor className="w-5 h-5" />,
      subSections: [
        { id: 'desktop-install', title: '데스크톱 앱 설치' },
        { id: 'folder', title: '폴더 구조' },
        { id: 'batch', title: '일괄 처리' },
      ]
    },
    {
      id: 'credit',
      title: '크레딧 안내',
      icon: <CreditCard className="w-5 h-5" />,
      subSections: [
        { id: 'credit-info', title: '크레딧 정보' },
      ]
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: <HelpCircle className="w-5 h-5" />,
      subSections: [
        { id: 'faq-list', title: '자주 묻는 질문' },
      ]
    },
  ];

  const handleSectionClick = (sectionId: SectionId) => {
    if (activeSection === sectionId) {
      // 이미 열린 섹션 클릭 시 닫지 않음
      return;
    }
    setActiveSection(sectionId);
    // 첫 번째 서브섹션으로 자동 이동
    const section = sections.find(s => s.id === sectionId);
    if (section && section.subSections.length > 0) {
      setActiveSubSection(section.subSections[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AutoPicLogo className="w-7 h-7 text-[#87D039]" />
            <span className="text-xl font-black text-zinc-900">AUTOPIC</span>
          </Link>
          <Link 
            href="/"
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
          >
            홈으로
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-zinc-900 mb-4">사용 가이드</h1>
          <p className="text-lg text-zinc-500">
            AUTOPIC 사용법을 쉽고 빠르게 알아보세요
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 - 아코디언 메뉴 */}
          <nav className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="rounded-xl overflow-hidden border border-zinc-200">
                  {/* 메인 섹션 버튼 */}
                  <button
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-4 transition-all ${
                      activeSection === section.id
                        ? 'bg-[#87D039] text-white'
                        : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="font-bold text-sm">{section.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* 서브 섹션 */}
                  {activeSection === section.id && (
                    <div className="bg-white border-t border-zinc-100">
                      {section.subSections.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveSubSection(sub.id)}
                          className={`w-full flex items-center gap-2 px-6 py-3 text-sm transition-all ${
                            activeSubSection === sub.id
                              ? 'bg-[#87D039]/10 text-[#87D039] font-bold'
                              : 'text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <ChevronRight className="w-3 h-3" />
                          {sub.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">
            {/* 시작하기 */}
            {activeSubSection === 'start' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">시작하기</h2>
                  <p className="text-zinc-500">3단계로 간단하게 시작하세요</p>
                </div>

                {/* 스텝 카드 */}
                <div className="grid gap-6">
                  {/* Step 1 */}
                  <div className="bg-gradient-to-r from-[#87D039]/5 to-transparent rounded-2xl border border-[#87D039]/20 p-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-[#87D039] rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-[#87D039]/30">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">회원가입 & 로그인</h3>
                        <p className="text-zinc-500 text-sm mb-4">
                          이메일 또는 Google 계정으로 간편하게 가입하세요
                        </p>
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <ArrowRight className="w-5 h-5 text-zinc-300" />
                          <div className="flex-1 h-10 bg-zinc-100 rounded-lg flex items-center px-3 text-sm text-zinc-400">
                            이메일 입력...
                          </div>
                          <div className="px-4 py-2 bg-[#87D039] text-white rounded-lg text-sm font-bold">
                            가입
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-gradient-to-r from-blue-500/5 to-transparent rounded-2xl border border-blue-500/20 p-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-blue-500/30">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">크레딧 충전</h3>
                        <p className="text-zinc-500 text-sm mb-4">
                          마이페이지에서 필요한 만큼 크레딧을 충전하세요
                        </p>
                        <div className="bg-white rounded-xl border border-zinc-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-zinc-500">보유 크레딧</span>
                            <span className="text-xl font-black text-zinc-900">0 → <span className="text-blue-500">100</span></span>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-gradient-to-r from-purple-500/5 to-transparent rounded-2xl border border-purple-500/20 p-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-purple-500/30">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">API 키 발급 <span className="text-xs font-normal text-zinc-400">(데스크톱 앱용)</span></h3>
                        <p className="text-zinc-500 text-sm mb-4">
                          데스크톱 앱 사용 시 필요합니다. 웹만 사용할 경우 생략 가능!
                        </p>
                        <div className="bg-white rounded-xl border border-zinc-200 p-4">
                          <div className="flex items-center gap-3">
                            <Key className="w-5 h-5 text-purple-500" />
                            <code className="flex-1 bg-zinc-50 px-3 py-2 rounded-lg text-sm font-mono text-zinc-600">
                              ap_xxxxxxxxxxxxxxxxxxxx
                            </code>
                            <button className="px-3 py-2 bg-purple-500 text-white rounded-lg text-xs font-bold">
                              복사
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 빠른 시작 */}
                <div className="bg-zinc-50 rounded-2xl p-6 text-center">
                  <p className="text-zinc-600 mb-4">준비되셨나요?</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/register" className="px-6 py-3 bg-[#87D039] text-white rounded-xl font-bold hover:bg-[#7BC02E] transition-colors">
                      회원가입하기
                    </Link>
                    <Link href="/login" className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold hover:bg-zinc-100 transition-colors">
                      로그인하기
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 웹 사용법 */}
            {activeSubSection === 'web-usage' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">웹 사용법</h2>
                  <p className="text-zinc-500">설치 없이 브라우저에서 바로 사용하세요</p>
                </div>

                {/* 프로세스 플로우 */}
                <div className="bg-gradient-to-r from-[#87D039]/10 via-blue-500/10 to-purple-500/10 rounded-2xl p-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                        <Upload className="w-8 h-8 text-[#87D039]" />
                      </div>
                      <span className="text-sm font-bold text-zinc-700">이미지 업로드</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-zinc-300 rotate-90 md:rotate-0" />
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                        <Sparkles className="w-8 h-8 text-blue-500" />
                      </div>
                      <span className="text-sm font-bold text-zinc-700">옵션 선택</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-zinc-300 rotate-90 md:rotate-0" />
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                        <Download className="w-8 h-8 text-purple-500" />
                      </div>
                      <span className="text-sm font-bold text-zinc-700">다운로드</span>
                    </div>
                  </div>
                </div>

                {/* 상세 설명 */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-[#87D039]/10 rounded-xl flex items-center justify-center mb-4">
                      <Upload className="w-6 h-6 text-[#87D039]" />
                    </div>
                    <h4 className="font-bold text-zinc-900 mb-2">1. 이미지 업로드</h4>
                    <p className="text-sm text-zinc-500">
                      상품 이미지를 드래그하거나 클릭해서 업로드하세요. JPG, PNG, WEBP 지원
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-blue-500" />
                    </div>
                    <h4 className="font-bold text-zinc-900 mb-2">2. 옵션 선택</h4>
                    <p className="text-sm text-zinc-500">
                      생성 타입(정물/모델), 성별, AI 모델을 선택하세요
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                      <Download className="w-6 h-6 text-purple-500" />
                    </div>
                    <h4 className="font-bold text-zinc-900 mb-2">3. 다운로드</h4>
                    <p className="text-sm text-zinc-500">
                      생성된 이미지를 확인하고 원하는 이미지를 다운로드하세요
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <Link href="/#studio" className="inline-flex items-center gap-2 px-6 py-3 bg-[#87D039] text-white rounded-xl font-bold hover:bg-[#7BC02E] transition-colors">
                    지금 바로 시작하기
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* 데스크톱 앱 설치 */}
            {activeSubSection === 'desktop-install' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">데스크톱 앱 설치</h2>
                  <p className="text-zinc-500">대량 작업에 최적화된 전용 프로그램</p>
                </div>

                {/* 장점 배너 */}
                <div className="bg-gradient-to-r from-[#87D039] to-[#6BBF2A] rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-4">
                    <Zap className="w-10 h-10" />
                    <div>
                      <h3 className="font-bold text-lg">대량 작업에 최적화!</h3>
                      <p className="text-white/80 text-sm">수백 개의 상품을 폴더 지정만으로 자동 처리</p>
                    </div>
                  </div>
                </div>

                {/* 설치 단계 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#87D039] rounded-lg flex items-center justify-center text-white font-bold shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">다운로드</h4>
                      <p className="text-sm text-zinc-500 mb-3">Windows용 설치 파일을 다운로드하세요</p>
                      <Link href="/#download" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800">
                        <Download className="w-4 h-4" />
                        Autopic_v2.7_Windows.zip
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#87D039] rounded-lg flex items-center justify-center text-white font-bold shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">압축 해제</h4>
                      <p className="text-sm text-zinc-500">다운로드한 ZIP 파일의 압축을 풀어주세요</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#87D039] rounded-lg flex items-center justify-center text-white font-bold shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">실행</h4>
                      <p className="text-sm text-zinc-500">
                        <code className="px-2 py-1 bg-white rounded text-[#87D039] font-mono text-xs">Autopic.exe</code> 파일을 실행하세요
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#87D039] rounded-lg flex items-center justify-center text-white font-bold shrink-0">4</div>
                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">API 키 입력</h4>
                      <p className="text-sm text-zinc-500">마이페이지에서 발급받은 API 키를 입력하면 완료!</p>
                    </div>
                  </div>
                </div>

                {/* 보안 경고 안내 */}
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-800 mb-1">Windows 보안 경고가 뜨나요?</h4>
                      <p className="text-sm text-amber-700">
                        Microsoft 인증 전이라 SmartScreen 경고가 나타날 수 있어요.<br />
                        <strong>&quot;추가 정보&quot; → &quot;실행&quot;</strong>을 클릭하면 정상 실행됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 폴더 구조 */}
            {activeSubSection === 'folder' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">폴더 구조</h2>
                  <p className="text-zinc-500">일괄 처리를 위한 폴더 구성 방법</p>
                </div>

                {/* 폴더 구조 시각화 */}
                <div className="bg-zinc-900 rounded-2xl p-6 text-white font-mono text-sm overflow-x-auto">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">📁</span>
                      <span className="font-bold text-white">작업폴더/</span>
                    </div>
                    <div className="ml-6 border-l border-zinc-700 pl-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">📁</span>
                        <span className="text-zinc-300">상품코드1/</span>
                      </div>
                      <div className="ml-6 border-l border-zinc-700 pl-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">🖼️</span>
                          <span className="text-[#87D039] font-bold">5.jpg</span>
                          <span className="text-zinc-500 text-xs">← 대표 이미지 (권장)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">🖼️</span>
                          <span className="text-zinc-400">6.jpg</span>
                          <span className="text-zinc-500 text-xs">← 보조 이미지 (선택)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">📄</span>
                          <span className="text-zinc-400">상품정보.txt</span>
                          <span className="text-zinc-500 text-xs">← 텍스트 파일 (선택)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">📁</span>
                        <span className="text-zinc-300">상품코드2/</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500">
                        └── ...
                      </div>
                    </div>
                  </div>
                </div>

                {/* 파일 규칙 카드 */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-[#87D039]/5 rounded-xl p-5 border border-[#87D039]/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-[#87D039] rounded-lg flex items-center justify-center text-white font-bold">5</div>
                      <span className="font-bold text-zinc-900">.jpg</span>
                    </div>
                    <p className="text-sm text-zinc-600"><strong>대표 이미지</strong></p>
                    <p className="text-xs text-zinc-500 mt-1">AI 분석의 기준이 되는 정면 이미지</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded">권장</span>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-zinc-400 rounded-lg flex items-center justify-center text-white font-bold">6</div>
                      <span className="font-bold text-zinc-900">.jpg</span>
                    </div>
                    <p className="text-sm text-zinc-600"><strong>보조 이미지</strong></p>
                    <p className="text-xs text-zinc-500 mt-1">측면/후면 등 추가 참고용</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-zinc-200 text-zinc-600 text-xs font-bold rounded">선택</span>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-zinc-400 rounded-lg flex items-center justify-center text-white font-bold text-xs">TXT</div>
                      <span className="font-bold text-zinc-900">*.txt</span>
                    </div>
                    <p className="text-sm text-zinc-600"><strong>상품 정보</strong></p>
                    <p className="text-xs text-zinc-500 mt-1">파일명 자유 (info.txt, 상품.txt 등)</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-zinc-200 text-zinc-600 text-xs font-bold rounded">선택</span>
                  </div>
                </div>

                {/* 자동 정렬 기능 */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-2">✨ 자동 정렬 기능</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        5.jpg, 6.jpg 파일이 없어도 OK! 폴더 내 이미지를 파일명 순서로 자동 정렬합니다.
                      </p>
                      <div className="bg-white rounded-lg p-3 text-sm font-mono">
                        <span className="text-zinc-500">IMG_001.jpg</span> → <span className="text-[#87D039] font-bold">대표 이미지</span><br />
                        <span className="text-zinc-500">IMG_002.jpg</span> → <span className="text-zinc-600">보조 이미지</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 텍스트 파일 설명 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      텍스트 파일이 있으면
                    </h4>
                    <div className="bg-white rounded-lg p-3 font-mono text-xs mb-3">
                      브랜드: 구찌<br />
                      상품명: GG 마몬트<br />
                      소재: 송아지 가죽
                    </div>
                    <p className="text-sm text-green-800">AI가 텍스트를 참고해 더 정확하게 분석</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
                    <h4 className="font-bold text-zinc-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-zinc-400" />
                      텍스트 파일이 없으면
                    </h4>
                    <div className="bg-white rounded-lg p-3 h-16 flex items-center justify-center mb-3">
                      <span className="text-4xl">🖼️</span>
                    </div>
                    <p className="text-sm text-zinc-600">이미지만으로 자동 분석 (충분히 좋은 결과!)</p>
                  </div>
                </div>
              </div>
            )}

            {/* 일괄 처리 */}
            {activeSubSection === 'batch' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">일괄 처리</h2>
                  <p className="text-zinc-500">수백 개 상품을 한 번에 처리하세요</p>
                </div>

                {/* 프로세스 타임라인 */}
                <div className="bg-zinc-50 rounded-2xl p-6">
                  <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
                    {['📁 폴더 선택', '📋 상품 확인', '⚙️ 옵션 선택', '🚀 처리 시작', '✅ 완료!'].map((step, i) => (
                      <React.Fragment key={i}>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${i === 4 ? 'bg-[#87D039] text-white' : 'bg-white border border-zinc-200 text-zinc-700'}`}>
                          {step}
                        </div>
                        {i < 4 && <ArrowRight className="w-4 h-4 text-zinc-300 hidden md:block" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* 생성 옵션 */}
                <div>
                  <h3 className="font-bold text-zinc-900 mb-4">생성 옵션</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { name: '기본 정물', desc: '깔끔한 배경의 상품 이미지', icon: '🛍️' },
                      { name: '기본 모델', desc: '모델 착용샷', icon: '👤' },
                      { name: '화보 정물', desc: '감성적인 분위기의 상품', icon: '📸' },
                      { name: '화보 모델', desc: '화보 스타일 착용샷', icon: '🎭' },
                    ].map((opt) => (
                      <div key={opt.name} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-zinc-200">
                        <span className="text-2xl">{opt.icon}</span>
                        <div>
                          <p className="font-bold text-zinc-900">{opt.name}</p>
                          <p className="text-xs text-zinc-500">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 결과 폴더 구조 */}
                <div>
                  <h3 className="font-bold text-zinc-900 mb-4">처리 결과</h3>
                  <div className="bg-zinc-900 rounded-xl p-5 text-white font-mono text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400">📁</span>
                      <span>상품폴더/</span>
                    </div>
                    <div className="ml-6 border-l border-zinc-700 pl-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">🖼️</span>
                        <span className="text-zinc-400">5.jpg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#87D039]">📁</span>
                        <span className="text-[#87D039] font-bold">output/</span>
                        <span className="text-zinc-500 text-xs">← 생성된 이미지</span>
                      </div>
                      <div className="ml-6 border-l border-[#87D039]/30 pl-4 space-y-1">
                        <div className="text-zinc-300">0.jpg <span className="text-zinc-500">(기본 정물)</span></div>
                        <div className="text-zinc-300">1.jpg <span className="text-zinc-500">(기본 모델)</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 자동 저장 안내 */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-lg">💾</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">중단해도 이어서 처리 가능!</h4>
                      <p className="text-sm text-blue-800">
                        진행 상태가 자동 저장됩니다. 중지하거나 종료해도 다음에 이어서 처리할 수 있어요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 크레딧 안내 */}
            {activeSubSection === 'credit-info' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">크레딧 안내</h2>
                  <p className="text-zinc-500">AI 모델별 크레딧 소모량</p>
                </div>

                {/* 모델 비교 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">👑</span>
                      <div>
                        <h3 className="font-bold text-xl">Pro 모델</h3>
                        <p className="text-purple-200 text-sm">이미지당 3 크레딧</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 최고 품질의 이미지</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 정교한 디테일 표현</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 프리미엄 상품 추천</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">⚡</span>
                      <div>
                        <h3 className="font-bold text-xl">Flash 모델</h3>
                        <p className="text-cyan-200 text-sm">이미지당 1 크레딧</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 빠른 생성 속도</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 경제적인 크레딧 소모</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 대량 작업 추천</li>
                    </ul>
                  </div>
                </div>

                {/* 계산 예시 */}
                <div className="bg-zinc-50 rounded-2xl p-6">
                  <h3 className="font-bold text-zinc-900 mb-4">🧮 크레딧 계산 예시</h3>
                  <p className="text-zinc-600 mb-4">상품 100개 × (기본 정물 + 기본 모델) = 200회 생성</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-purple-100 rounded-xl p-4 text-center">
                      <p className="text-purple-600 font-medium mb-1">Pro 모델</p>
                      <p className="text-3xl font-black text-purple-700">600 <span className="text-lg font-normal">크레딧</span></p>
                      <p className="text-xs text-purple-500">200회 × 3 크레딧</p>
                    </div>
                    <div className="bg-cyan-100 rounded-xl p-4 text-center">
                      <p className="text-cyan-600 font-medium mb-1">Flash 모델</p>
                      <p className="text-3xl font-black text-cyan-700">200 <span className="text-lg font-normal">크레딧</span></p>
                      <p className="text-xs text-cyan-500">200회 × 1 크레딧</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Link href="/mypage" className="inline-flex items-center gap-2 px-6 py-3 bg-[#87D039] text-white rounded-xl font-bold hover:bg-[#7BC02E] transition-colors">
                    크레딧 충전하기
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* FAQ */}
            {activeSubSection === 'faq-list' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">자주 묻는 질문</h2>
                  <p className="text-zinc-500">궁금한 점을 빠르게 해결하세요</p>
                </div>

                <div className="space-y-3">
                  {[
                    { q: '지원하는 이미지 형식은 무엇인가요?', a: 'JPG, JPEG, PNG, WEBP 형식을 지원합니다.' },
                    { q: '한 번에 몇 개까지 처리할 수 있나요?', a: '개수 제한은 없습니다! 크레딧만 충분하면 수백 개의 상품도 한 번에 처리할 수 있어요.' },
                    { q: '처리 중 중단해도 되나요?', a: '네, 언제든 중단할 수 있어요. 진행 상태가 자동 저장되어 나중에 이어서 처리할 수 있습니다.' },
                    { q: '생성된 이미지의 저작권은 누구에게 있나요?', a: '생성된 모든 이미지는 100% 사용자에게 귀속됩니다. 상업적 용도로 자유롭게 사용하세요.' },
                    { q: '크레딧 환불이 가능한가요?', a: '사용하지 않은 크레딧은 고객센터를 통해 환불 요청이 가능합니다.' },
                    { q: 'API 키가 노출되면 어떻게 하나요?', a: '마이페이지에서 기존 키를 삭제하고 새 키를 발급받으세요. 이전 키는 즉시 비활성화됩니다.' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-zinc-900 mb-2 flex items-start gap-2">
                        <span className="text-[#87D039]">Q.</span>
                        {item.q}
                      </h4>
                      <p className="text-zinc-600 text-sm pl-6">
                        <span className="text-zinc-400">A.</span> {item.a}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-50 rounded-xl p-6 text-center">
                  <p className="text-zinc-600 mb-3">추가 문의사항이 있으신가요?</p>
                  <a href="mailto:support@autopic.app" className="text-[#87D039] font-bold hover:underline">
                    support@autopic.app
                  </a>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-zinc-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">© 2024 AUTOPIC. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-900 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-zinc-900 transition-colors">이용약관</Link>
            <a href="mailto:support@autopic.app" className="hover:text-zinc-900 transition-colors">문의하기</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
