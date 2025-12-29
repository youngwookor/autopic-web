'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Monitor, Globe, CreditCard, HelpCircle, Download, CheckCircle, ArrowRight, Folder, Zap, X } from 'lucide-react';

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

type MainSection = 'web' | 'desktop' | 'credit' | 'faq';
type SubSection = 'start' | 'web-usage' | 'desktop-install' | 'folder' | 'batch' | 'credit-info' | 'faq-list';

// 이미지 모달 컴포넌트
function ImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <Image 
        src={src} 
        alt={alt} 
        width={1200}
        height={1200}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
      />
    </div>
  );
}

export default function GuidePage() {
  const [activeMain, setActiveMain] = useState<MainSection>('web');
  const [activeSub, setActiveSub] = useState<SubSection>('start');
  const [isAnimating, setIsAnimating] = useState(false);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  const mainSections: { id: MainSection; title: string; icon: React.ReactNode; subs: { id: SubSection; title: string }[] }[] = [
    {
      id: 'web',
      title: '웹 사용법',
      icon: <Globe className="w-4 h-4" />,
      subs: [
        { id: 'start', title: '시작하기' },
        { id: 'web-usage', title: '이미지 생성하기' },
      ]
    },
    {
      id: 'desktop',
      title: '프로그램 사용법',
      icon: <Monitor className="w-4 h-4" />,
      subs: [
        { id: 'desktop-install', title: '설치하기' },
        { id: 'folder', title: '폴더 구조' },
        { id: 'batch', title: '일괄 처리' },
      ]
    },
    {
      id: 'credit',
      title: '크레딧 안내',
      icon: <CreditCard className="w-4 h-4" />,
      subs: [{ id: 'credit-info', title: '크레딧 정보' }]
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: <HelpCircle className="w-4 h-4" />,
      subs: [{ id: 'faq-list', title: '자주 묻는 질문' }]
    },
  ];

  const handleMainClick = (id: MainSection) => {
    setIsAnimating(true);
    setActiveMain(id);
    const section = mainSections.find(s => s.id === id);
    if (section) setActiveSub(section.subs[0].id);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSubClick = (id: SubSection) => {
    setIsAnimating(true);
    setActiveSub(id);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const currentMainSection = mainSections.find(s => s.id === activeMain);

  // Before/After 데이터
  const beforeAfterData = [
    {
      id: 'watch',
      name: '빈티지 시계',
      before: '/guide/watch_before.jpg',
      still: '/guide/watch_still.jpg',
      model: '/guide/watch_model.jpg',
    },
    {
      id: 'skirt',
      name: '벨트 스커트',
      before: '/guide/skirt_before.jpg',
      still: '/guide/skirt_still.png',
      model: '/guide/skirt_model.png',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* 이미지 모달 */}
      {modalImage && (
        <ImageModal 
          src={modalImage.src} 
          alt={modalImage.alt} 
          onClose={() => setModalImage(null)} 
        />
      )}

      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <AutoPicLogo className="w-6 h-6 text-[#87D039] group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold text-zinc-900">AUTOPIC</span>
          </Link>
          <Link 
            href="/"
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
          >
            홈으로
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* 페이지 타이틀 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">사용 가이드</h1>
          <p className="text-zinc-500">단계별로 쉽게 따라하세요</p>
        </div>

        {/* 메인 네비게이션 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1.5 shadow-sm border border-zinc-200">
            {mainSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleMainClick(section.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeMain === section.id
                    ? 'bg-[#87D039] text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                {section.icon}
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 서브 네비게이션 */}
        {currentMainSection && currentMainSection.subs.length > 1 && (
          <div className="flex justify-center mb-10">
            <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
              {currentMainSection.subs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubClick(sub.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeSub === sub.id
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {sub.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <main className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          
          {/* ==================== 시작하기 ==================== */}
          {activeSub === 'start' && (
            <div className="max-w-3xl mx-auto">
              {/* Before/After 쇼케이스 */}
              <div className="mb-16">
                <div className="text-center mb-8">
                  <span className="inline-block px-3 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full mb-4">
                    AI가 만드는 놀라운 결과
                  </span>
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">이런 이미지를 만들 수 있어요</h2>
                  <p className="text-zinc-500">원본 사진 한 장으로 정물컷과 모델컷을 생성합니다</p>
                </div>

                {/* Before/After 갤러리 */}
                <div className="space-y-8">
                  {beforeAfterData.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg transition-shadow">
                      <div className="grid grid-cols-3 gap-4">
                        {/* Before */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-full">원본</span>
                          </div>
                          <div 
                            className="aspect-square rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in hover:ring-2 hover:ring-[#87D039] transition-all"
                            onClick={() => setModalImage({ src: item.before, alt: `${item.name} 원본` })}
                          >
                            <Image 
                              src={item.before} 
                              alt={`${item.name} 원본`}
                              width={400}
                              height={400}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>

                        {/* 정물 */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <span className="inline-block px-2 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full">정물컷</span>
                          </div>
                          <div 
                            className="aspect-square rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in hover:ring-2 hover:ring-[#87D039] transition-all relative"
                            onClick={() => setModalImage({ src: item.still, alt: `${item.name} 정물컷` })}
                          >
                            <Image 
                              src={item.still} 
                              alt={`${item.name} 정물컷`}
                              width={400}
                              height={400}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md">
                              AI 생성
                            </div>
                          </div>
                        </div>

                        {/* 모델 */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <span className="inline-block px-2 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full">모델컷</span>
                          </div>
                          <div 
                            className="aspect-square rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in hover:ring-2 hover:ring-[#87D039] transition-all relative"
                            onClick={() => setModalImage({ src: item.model, alt: `${item.name} 모델컷` })}
                          >
                            <Image 
                              src={item.model} 
                              alt={`${item.name} 모델컷`}
                              width={400}
                              height={400}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md">
                              AI 생성
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 시작 단계 */}
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">3단계로 시작하기</h2>
                  <p className="text-zinc-500">간단한 과정으로 바로 시작할 수 있어요</p>
                </div>

                <div className="space-y-4">
                  {[
                    { step: 1, title: '회원가입', desc: '이메일 또는 Google 계정으로 가입', detail: 'autopic.app에서 간편하게 가입하세요' },
                    { step: 2, title: '크레딧 충전', desc: '마이페이지에서 크레딧 충전', detail: '이미지 1장 생성에 1~3 크레딧 소모' },
                    { step: 3, title: 'API 키 발급', desc: '데스크톱 앱 사용 시 필요', detail: '웹에서만 사용할 경우 생략 가능!', optional: true },
                  ].map((item, index) => (
                    <div
                      key={item.step}
                      className="group bg-white rounded-2xl border border-zinc-200 p-6 hover:border-[#87D039]/50 hover:shadow-lg hover:shadow-[#87D039]/5 transition-all duration-300"
                    >
                      <div className="flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 transition-transform group-hover:scale-110 ${
                          item.optional ? 'bg-zinc-100 text-zinc-400' : 'bg-[#87D039] text-white'
                        }`}>
                          {item.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-zinc-900">{item.title}</h3>
                            {item.optional && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-xs rounded-full">선택</span>
                            )}
                          </div>
                          <p className="text-zinc-600 text-sm mb-1">{item.desc}</p>
                          <p className="text-zinc-400 text-xs">{item.detail}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-[#87D039] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <Link 
                    href="/register" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#87D039] text-white rounded-xl font-bold hover:bg-[#7BC02E] hover:shadow-lg hover:shadow-[#87D039]/25 transition-all"
                  >
                    지금 시작하기
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 웹 사용법 ==================== */}
          {activeSub === 'web-usage' && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block px-3 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full mb-4">
                  설치 불필요
                </span>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">웹에서 이미지 생성하기</h2>
                <p className="text-zinc-500">브라우저에서 바로 사용하세요</p>
              </div>

              {/* 프로세스 단계 */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 mb-8">
                <div className="flex items-center justify-between mb-8">
                  {['업로드', '옵션 선택', 'AI 생성', '다운로드'].map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 font-bold ${
                          'bg-[#87D039] text-white'
                        }`}>
                          {i + 1}
                        </div>
                        <span className="text-xs font-medium text-zinc-700 text-center">{step}</span>
                      </div>
                      {i < 3 && (
                        <div className="w-12 h-0.5 bg-[#87D039] mx-1" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="space-y-4">
                  {[
                    { num: 1, title: '이미지 업로드', desc: '상품 이미지를 드래그하거나 클릭해서 업로드하세요', format: 'JPG, PNG, WEBP 지원' },
                    { num: 2, title: '옵션 선택', desc: '원하는 생성 타입과 AI 모델을 선택하세요', format: '정물/모델, Pro/Flash' },
                    { num: 3, title: 'AI 생성', desc: '생성 버튼을 클릭하면 AI가 이미지를 만듭니다', format: '약 10~30초 소요' },
                    { num: 4, title: '다운로드', desc: '마음에 드는 이미지를 선택해 다운로드하세요', format: '고해상도 이미지' },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl">
                      <div className="w-8 h-8 bg-[#87D039]/10 text-[#87D039] rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                        {item.num}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-900 mb-0.5">{item.title}</h4>
                        <p className="text-zinc-500 text-sm">{item.desc}</p>
                        <span className="text-zinc-400 text-xs">{item.format}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 생성 결과 예시 */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-8">
                <h3 className="font-bold text-zinc-900 mb-4 text-center">생성 결과 예시</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in"
                      onClick={() => setModalImage({ src: beforeAfterData[0].before, alt: '원본' })}>
                      <Image src={beforeAfterData[0].before} alt="원본" width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-center text-xs text-zinc-500">원본 이미지</p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in relative"
                      onClick={() => setModalImage({ src: beforeAfterData[0].still, alt: '정물컷' })}>
                      <Image src={beforeAfterData[0].still} alt="정물컷" width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-[#87D039] text-white text-[10px] font-bold rounded">AI</div>
                    </div>
                    <p className="text-center text-xs text-zinc-500">정물컷 결과</p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in relative"
                      onClick={() => setModalImage({ src: beforeAfterData[0].model, alt: '모델컷' })}>
                      <Image src={beforeAfterData[0].model} alt="모델컷" width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-[#87D039] text-white text-[10px] font-bold rounded">AI</div>
                    </div>
                    <p className="text-center text-xs text-zinc-500">모델컷 결과</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link 
                  href="/#studio" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
                >
                  스튜디오로 이동
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ==================== 데스크톱 설치 ==================== */}
          {activeSub === 'desktop-install' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block px-3 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full mb-4">
                  대량 작업 추천
                </span>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">데스크톱 앱 설치</h2>
                <p className="text-zinc-500">수백 개 상품을 자동으로 처리하세요</p>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-6">
                {[
                  { step: 1, title: '다운로드', desc: 'Windows용 ZIP 파일 다운로드', action: true },
                  { step: 2, title: '압축 해제', desc: '다운로드한 파일 압축 풀기' },
                  { step: 3, title: '실행', desc: 'Autopic.exe 파일 실행' },
                  { step: 4, title: 'API 키 입력', desc: '마이페이지에서 발급받은 키 입력' },
                ].map((item, i) => (
                  <div 
                    key={item.step} 
                    className={`flex items-center gap-5 p-5 ${i < 3 ? 'border-b border-zinc-100' : ''} hover:bg-zinc-50 transition-colors`}
                  >
                    <div className="w-10 h-10 bg-[#87D039]/10 text-[#87D039] rounded-full flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-900">{item.title}</h4>
                      <p className="text-zinc-500 text-sm">{item.desc}</p>
                    </div>
                    {item.action && (
                      <Link 
                        href="/#download"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        다운로드
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-xl border border-amber-200">
                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shrink-0 text-white font-bold">!</div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-1">Windows 보안 경고</h4>
                  <p className="text-amber-800 text-sm">
                    SmartScreen 경고가 나타나면 <strong>&quot;추가 정보&quot; → &quot;실행&quot;</strong>을 클릭하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 폴더 구조 ==================== */}
          {activeSub === 'folder' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block px-3 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full mb-4">
                  중요
                </span>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">폴더 구조</h2>
                <p className="text-zinc-500">일괄 처리를 위한 폴더 구성 방법</p>
              </div>

              {/* 폴더 구조 시각화 */}
              <div className="bg-zinc-900 rounded-2xl p-6 mb-8 font-mono text-sm">
                <div className="text-zinc-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-bold">작업폴더/</span>
                  </div>
                  <div className="ml-6 border-l border-zinc-700 pl-4 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-yellow-400" />
                        <span>상품코드1/</span>
                      </div>
                      <div className="ml-6 border-l border-zinc-700 pl-4 mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#87D039]">●</span>
                          <span className="text-[#87D039] font-bold">5.jpg</span>
                          <span className="text-zinc-500 text-xs ml-2">대표 이미지</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">○</span>
                          <span className="text-zinc-400">6.jpg</span>
                          <span className="text-zinc-600 text-xs ml-2">보조 (선택)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">○</span>
                          <span className="text-zinc-400">*.txt</span>
                          <span className="text-zinc-600 text-xs ml-2">상품정보 (선택)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Folder className="w-4 h-4 text-zinc-600" />
                      <span>상품코드2/</span>
                    </div>
                    <div className="text-zinc-600">└── ...</div>
                  </div>
                </div>
              </div>

              {/* 파일 설명 */}
              <div className="grid gap-3 mb-8">
                <div className="flex items-center gap-4 p-4 bg-[#87D039]/5 rounded-xl border border-[#87D039]/20">
                  <div className="w-12 h-12 bg-[#87D039] rounded-xl flex items-center justify-center text-white font-bold">5</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-zinc-900">대표 이미지</h4>
                      <span className="px-2 py-0.5 bg-[#87D039]/20 text-[#87D039] text-xs font-bold rounded">권장</span>
                    </div>
                    <p className="text-zinc-500 text-sm">AI 분석의 기준이 되는 정면 이미지</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 font-bold">6</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-zinc-900">보조 이미지</h4>
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-xs font-bold rounded">선택</span>
                    </div>
                    <p className="text-zinc-500 text-sm">측면/후면 등 추가 참고용</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 font-bold text-xs">TXT</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-zinc-900">상품 정보</h4>
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-xs font-bold rounded">선택</span>
                    </div>
                    <p className="text-zinc-500 text-sm">파일명 자유 (info.txt, 상품.txt 등 OK)</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  자동 정렬 기능
                </h4>
                <p className="text-blue-800 text-sm mb-3">
                  5.jpg, 6.jpg가 없어도 괜찮아요! 폴더 내 이미지를 파일명 순서로 자동 정렬합니다.
                </p>
                <div className="bg-white rounded-lg p-3 font-mono text-xs text-zinc-600">
                  IMG_001.jpg → <span className="text-[#87D039] font-bold">대표 이미지</span><br />
                  IMG_002.jpg → <span className="text-zinc-500">보조 이미지</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 일괄 처리 ==================== */}
          {activeSub === 'batch' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block px-3 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full mb-4">
                  자동화
                </span>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">일괄 처리</h2>
                <p className="text-zinc-500">수백 개 상품을 한 번에 처리하세요</p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
                {['폴더 선택', '상품 확인', '옵션', '처리', '완료'].map((step, i) => (
                  <React.Fragment key={step}>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      i === 4 ? 'bg-[#87D039] text-white' : 'bg-white border border-zinc-200 text-zinc-600'
                    }`}>
                      {step}
                    </div>
                    {i < 4 && <ChevronRight className="w-4 h-4 text-zinc-300" />}
                  </React.Fragment>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-8">
                <h3 className="font-bold text-zinc-900 mb-4">생성 옵션</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: '기본 정물', desc: '깔끔한 배경' },
                    { name: '기본 모델', desc: '모델 착용샷' },
                    { name: '화보 정물', desc: '감성 분위기' },
                    { name: '화보 모델', desc: '화보 스타일' },
                  ].map((opt) => (
                    <div key={opt.name} className="p-4 bg-zinc-50 rounded-xl">
                      <p className="font-bold text-zinc-900 text-sm">{opt.name}</p>
                      <p className="text-zinc-500 text-xs">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-6 mb-8 font-mono text-sm">
                <p className="text-zinc-400 text-xs mb-3">처리 결과</p>
                <div className="text-zinc-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-yellow-400" />
                    <span>상품폴더/</span>
                  </div>
                  <div className="ml-6 border-l border-zinc-700 pl-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">●</span>
                      <span className="text-zinc-400">5.jpg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-[#87D039]" />
                      <span className="text-[#87D039] font-bold">output/</span>
                      <span className="text-zinc-500 text-xs ml-2">← 생성 결과</span>
                    </div>
                    <div className="ml-6 text-zinc-400 space-y-1">
                      <div>0.jpg <span className="text-zinc-600">(정물)</span></div>
                      <div>1.jpg <span className="text-zinc-600">(모델)</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-zinc-100 rounded-xl">
                <p className="text-zinc-700 text-sm">
                  <strong className="text-zinc-900">💾 자동 저장:</strong> 중단해도 다음에 이어서 처리할 수 있어요
                </p>
              </div>
            </div>
          )}

          {/* ==================== 크레딧 ==================== */}
          {activeSub === 'credit-info' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">크레딧 안내</h2>
                <p className="text-zinc-500">AI 모델별 크레딧 소모량</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-2xl border-2 border-[#87D039] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">👑</span>
                    <span className="px-3 py-1 bg-[#87D039]/10 text-[#87D039] text-xs font-bold rounded-full">추천</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">Pro 모델</h3>
                  <p className="text-[#87D039] font-bold mb-4">이미지당 3 크레딧</p>
                  <ul className="space-y-2 text-sm text-zinc-600">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#87D039]" /> 최고 품질</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#87D039]" /> 정교한 디테일</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#87D039]" /> 프리미엄 상품 추천</li>
                  </ul>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">⚡</span>
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-xs font-bold rounded-full">경제적</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">Flash 모델</h3>
                  <p className="text-zinc-500 font-bold mb-4">이미지당 1 크레딧</p>
                  <ul className="space-y-2 text-sm text-zinc-600">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-zinc-400" /> 빠른 생성</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-zinc-400" /> 경제적</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-zinc-400" /> 대량 작업 추천</li>
                  </ul>
                </div>
              </div>

              <div className="bg-zinc-100 rounded-2xl p-6">
                <h3 className="font-bold text-zinc-900 mb-4">계산 예시</h3>
                <p className="text-zinc-600 text-sm mb-4">상품 100개 × (정물 + 모델) = 200회 생성</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center">
                    <p className="text-zinc-500 text-sm mb-1">Pro</p>
                    <p className="text-2xl font-bold text-zinc-900">600<span className="text-sm font-normal text-zinc-400 ml-1">크레딧</span></p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <p className="text-zinc-500 text-sm mb-1">Flash</p>
                    <p className="text-2xl font-bold text-zinc-900">200<span className="text-sm font-normal text-zinc-400 ml-1">크레딧</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link 
                  href="/mypage" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#87D039] text-white rounded-xl font-bold hover:bg-[#7BC02E] transition-all"
                >
                  크레딧 충전하기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ==================== FAQ ==================== */}
          {activeSub === 'faq-list' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">자주 묻는 질문</h2>
                <p className="text-zinc-500">궁금한 점을 빠르게 해결하세요</p>
              </div>

              <div className="space-y-3">
                {[
                  { q: '지원하는 이미지 형식은?', a: 'JPG, JPEG, PNG, WEBP를 지원합니다.' },
                  { q: '한 번에 몇 개까지 처리 가능한가요?', a: '제한 없습니다. 크레딧만 충분하면 수백 개도 OK!' },
                  { q: '중단해도 되나요?', a: '네, 진행 상태가 자동 저장되어 이어서 처리할 수 있어요.' },
                  { q: '생성된 이미지 저작권은?', a: '100% 사용자에게 귀속됩니다. 상업용 자유롭게 사용하세요.' },
                  { q: '크레딧 환불이 가능한가요?', a: '미사용 크레딧은 고객센터를 통해 환불 가능합니다.' },
                  { q: 'API 키가 노출되면?', a: '마이페이지에서 삭제 후 새 키를 발급받으세요.' },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 transition-colors">
                    <h4 className="font-bold text-zinc-900 mb-2 flex items-start gap-2">
                      <span className="text-[#87D039]">Q</span>
                      {item.q}
                    </h4>
                    <p className="text-zinc-500 text-sm pl-5">{item.a}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center p-6 bg-zinc-100 rounded-xl">
                <p className="text-zinc-600 mb-2">추가 문의사항이 있으신가요?</p>
                <a href="mailto:support@autopic.app" className="text-[#87D039] font-bold hover:underline">
                  support@autopic.app
                </a>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-zinc-200 bg-white mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-400 text-sm">© 2024 AUTOPIC</p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-900 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-zinc-900 transition-colors">이용약관</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
