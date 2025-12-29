'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('start');

  const sections = [
    { id: 'start', title: '🚀 시작하기', icon: '🚀' },
    { id: 'web', title: '🌐 웹 사용법', icon: '🌐' },
    { id: 'desktop', title: '💻 데스크톱 앱', icon: '💻' },
    { id: 'folder', title: '📂 폴더 구조', icon: '📂' },
    { id: 'batch', title: '⚡ 일괄 처리', icon: '⚡' },
    { id: 'credit', title: '💰 크레딧 안내', icon: '💰' },
    { id: 'faq', title: '❓ FAQ', icon: '❓' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">AUTOPIC</span>
          </Link>
          <Link 
            href="/"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            홈으로
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-8">
        {/* 사이드바 네비게이션 */}
        <nav className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-1">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-3">목차</h3>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-lime-400/10 text-lime-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </nav>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-w-0">
          {/* 타이틀 */}
          <div className="mb-12">
            <h1 className="text-4xl font-black text-white mb-4">사용 가이드</h1>
            <p className="text-lg text-zinc-400">
              AUTOPIC을 처음 사용하시나요? 이 가이드를 따라하면 누구나 쉽게 시작할 수 있어요.
            </p>
          </div>

          {/* 섹션 1: 시작하기 */}
          <section id="start" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🚀</span>
              <h2 className="text-2xl font-bold text-white">시작하기</h2>
            </div>

            {/* 단계별 카드 */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-900 font-black text-xl shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">회원가입 & 로그인</h3>
                    <p className="text-zinc-400 text-sm">
                      <Link href="/auth" className="text-lime-400 hover:underline">autopic.app</Link>에서 
                      이메일로 간편하게 가입하세요. Google 계정으로도 가입 가능해요.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-900 font-black text-xl shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">크레딧 충전</h3>
                    <p className="text-zinc-400 text-sm">
                      마이페이지에서 필요한 만큼 크레딧을 충전하세요. 
                      이미지 1장 생성에 1~3 크레딧이 소모됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-900 font-black text-xl shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">API 키 발급 (데스크톱 앱용)</h3>
                    <p className="text-zinc-400 text-sm">
                      데스크톱 앱을 사용하려면 마이페이지 → API 키 관리에서 키를 발급받으세요.
                    </p>
                  </div>
                </div>
                <div className="bg-zinc-800/50 px-6 py-4 border-t border-zinc-800">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400">💡</span>
                    <p className="text-sm text-zinc-400">
                      <span className="text-amber-400 font-medium">Tip:</span> 웹에서만 사용하실 경우 API 키 발급은 필요 없어요!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 2: 웹 사용법 */}
          <section id="web" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🌐</span>
              <h2 className="text-2xl font-bold text-white">웹 사용법</h2>
            </div>

            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
              <p className="text-zinc-300 mb-6">
                웹 버전은 별도 설치 없이 브라우저에서 바로 사용할 수 있어요. 
                간단한 이미지 생성에 적합합니다.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-zinc-800 rounded-xl p-5">
                  <div className="w-10 h-10 bg-lime-400/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lime-400 text-xl">📤</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">1. 이미지 업로드</h4>
                  <p className="text-sm text-zinc-400">상품 이미지를 드래그하거나 클릭해서 업로드하세요.</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-5">
                  <div className="w-10 h-10 bg-lime-400/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lime-400 text-xl">⚙️</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">2. 옵션 선택</h4>
                  <p className="text-sm text-zinc-400">생성 타입(정물/모델)과 성별, 모델을 선택하세요.</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-5">
                  <div className="w-10 h-10 bg-lime-400/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lime-400 text-xl">💾</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">3. 다운로드</h4>
                  <p className="text-sm text-zinc-400">생성된 이미지를 확인하고 다운로드하세요.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 3: 데스크톱 앱 */}
          <section id="desktop" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">💻</span>
              <h2 className="text-2xl font-bold text-white">데스크톱 앱</h2>
            </div>

            <div className="bg-gradient-to-br from-lime-400/10 to-transparent rounded-2xl border border-lime-400/20 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lime-400 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">대량 작업에 최적화!</h3>
                  <p className="text-zinc-300 text-sm mb-4">
                    수십~수백 개의 상품을 한 번에 처리해야 한다면 데스크톱 앱을 추천해요.
                    폴더만 지정하면 자동으로 모든 상품을 처리합니다.
                  </p>
                  <Link 
                    href="/#download" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-900 rounded-lg text-sm font-bold hover:bg-lime-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    다운로드 (Windows)
                  </Link>
                </div>
              </div>
            </div>

            {/* 설치 방법 */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📥</span> 설치 방법
              </h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0 mt-0.5">1</span>
                  <span className="text-zinc-300">다운로드 받은 <code className="px-2 py-0.5 bg-zinc-800 rounded text-lime-400 text-sm">Autopic_v2.7_Windows.zip</code> 압축 해제</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0 mt-0.5">2</span>
                  <span className="text-zinc-300">폴더 내 <code className="px-2 py-0.5 bg-zinc-800 rounded text-lime-400 text-sm">Autopic.exe</code> 실행</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0 mt-0.5">3</span>
                  <span className="text-zinc-300">발급받은 API 키 입력 후 연동</span>
                </li>
              </ol>
            </div>

            {/* Windows Defender 안내 */}
            <div className="bg-amber-400/10 rounded-2xl border border-amber-400/20 p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-amber-400 mb-2">Windows 보안 경고가 뜨나요?</h4>
                  <p className="text-zinc-300 text-sm">
                    앱이 아직 Microsoft 인증을 받지 않아 SmartScreen 경고가 뜰 수 있어요.
                    <br />
                    <span className="text-zinc-400">&quot;추가 정보&quot; → &quot;실행&quot;</span>을 클릭하면 정상적으로 사용 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 4: 폴더 구조 (핵심!) */}
          <section id="folder" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📂</span>
              <h2 className="text-2xl font-bold text-white">폴더 구조 설정</h2>
              <span className="px-2 py-1 bg-lime-400 text-zinc-900 text-xs font-bold rounded-full">중요!</span>
            </div>

            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">기본 폴더 구조</h3>
              
              {/* 폴더 구조 시각화 */}
              <div className="bg-zinc-950 rounded-xl p-5 font-mono text-sm mb-6 overflow-x-auto">
                <div className="text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">📁</span>
                    <span className="text-white font-bold">작업폴더/</span>
                  </div>
                  <div className="ml-6 border-l border-zinc-700 pl-4 mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">📁</span>
                      <span className="text-zinc-300">상품코드1/</span>
                    </div>
                    <div className="ml-6 border-l border-zinc-700 pl-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">🖼️</span>
                        <span className="text-lime-400 font-bold">5.jpg</span>
                        <span className="text-zinc-500">← 대표 이미지 (권장)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">🖼️</span>
                        <span className="text-zinc-300">6.jpg</span>
                        <span className="text-zinc-500">← 보조 이미지 (선택)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">📄</span>
                        <span className="text-zinc-300">info.txt</span>
                        <span className="text-zinc-500">← 상품 정보 (선택)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">📁</span>
                      <span className="text-zinc-300">상품코드2/</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">📁</span>
                      <span className="text-zinc-300">상품코드3/</span>
                    </div>
                    <div className="text-zinc-500">└── ...</div>
                  </div>
                </div>
              </div>

              {/* 파일 규칙 테이블 */}
              <h4 className="font-bold text-white mb-3">📋 파일명 규칙</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3 px-4 text-zinc-400 font-medium">파일명</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-medium">역할</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-medium">필수</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800">
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-lime-400/20 text-lime-400 rounded font-bold">5.jpg</code>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        <strong>대표 이미지</strong> - AI 분석 및 생성의 기준이 되는 정면 이미지
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-lime-400">⭐ 권장</span>
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-800">
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded">6.jpg</code>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        <strong>보조 이미지</strong> - 측면/후면 등 추가 참고용
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-zinc-500">선택</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded">*.txt</code>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        <strong>상품 정보</strong> - 브랜드, 소재, 색상 등 텍스트 정보
                        <br />
                        <span className="text-zinc-500 text-xs">파일명은 자유롭게 지정 가능 (info.txt, product.txt, 상품정보.txt 등)</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-zinc-500">선택</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 자동 정렬 안내 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl border border-blue-500/20 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">자동 정렬 기능</h3>
                  <p className="text-zinc-300 text-sm mb-4">
                    <code className="px-2 py-0.5 bg-zinc-800 rounded text-lime-400">5.jpg</code>, 
                    <code className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 ml-1">6.jpg</code> 
                    파일이 없어도 괜찮아요!
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      폴더 내 이미지를 <strong className="text-white">파일명 순서</strong>로 자동 정렬
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      첫 번째 이미지 → 대표 이미지(5번)로 사용
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      두 번째 이미지 → 보조 이미지(6번)로 사용
                    </li>
                  </ul>
                </div>
              </div>

              {/* 예시 */}
              <div className="mt-4 bg-zinc-900/50 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium">예시: 5,6번 파일이 없는 경우</p>
                <div className="font-mono text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="text-yellow-400">📁</span>
                    <span>상품폴더/</span>
                  </div>
                  <div className="ml-6 space-y-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">🖼️</span>
                      <span className="text-zinc-300">IMG_001.jpg</span>
                      <span className="text-lime-400 text-xs">→ 대표 이미지로 자동 선택</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">🖼️</span>
                      <span className="text-zinc-300">IMG_002.jpg</span>
                      <span className="text-zinc-500 text-xs">→ 보조 이미지로 자동 선택</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">🖼️</span>
                      <span className="text-zinc-400">IMG_003.jpg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 텍스트 파일 활용 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-green-400">📄</span> 텍스트 파일이 있는 경우
                </h4>
                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs mb-4">
                  <p className="text-zinc-500 mb-2"># product_info.txt (파일명 자유)</p>
                  <p className="text-zinc-300">브랜드: 구찌</p>
                  <p className="text-zinc-300">상품명: GG 마몬트 숄더백</p>
                  <p className="text-zinc-300">소재: 송아지 가죽</p>
                  <p className="text-zinc-300">색상: 블랙</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <p className="text-sm text-zinc-400">
                    AI가 텍스트 정보를 참고하여 <strong className="text-white">더 정확한 분석</strong> 결과 제공
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-400">🖼️</span> 텍스트 파일이 없는 경우
                </h4>
                <div className="bg-zinc-950 rounded-lg p-4 mb-4 flex items-center justify-center h-24">
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">🖼️</span>
                    <span className="text-zinc-500 text-xs">이미지만으로 분석</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <p className="text-sm text-zinc-400">
                    AI가 이미지에서 <strong className="text-white">자동으로 정보 추출</strong>하여 분석
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-zinc-800/50 rounded-xl p-4 flex items-start gap-3">
              <span className="text-amber-400">💡</span>
              <p className="text-sm text-zinc-400">
                <span className="text-amber-400 font-medium">Tip:</span> 텍스트 파일 없이도 충분히 좋은 결과를 얻을 수 있어요!
                더 정확한 분석이 필요한 경우에만 텍스트 파일을 추가하세요.
              </p>
            </div>
          </section>

          {/* 섹션 5: 일괄 처리 */}
          <section id="batch" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⚡</span>
              <h2 className="text-2xl font-bold text-white">일괄 처리 방법</h2>
            </div>

            {/* 프로세스 단계 */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
                  <span className="text-lime-400">📁</span>
                  <span className="text-sm text-white">폴더 선택</span>
                </div>
                <span className="text-zinc-600">→</span>
                <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
                  <span className="text-lime-400">📋</span>
                  <span className="text-sm text-white">상품 확인</span>
                </div>
                <span className="text-zinc-600">→</span>
                <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
                  <span className="text-lime-400">⚙️</span>
                  <span className="text-sm text-white">옵션 선택</span>
                </div>
                <span className="text-zinc-600">→</span>
                <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
                  <span className="text-lime-400">🚀</span>
                  <span className="text-sm text-white">처리 시작</span>
                </div>
                <span className="text-zinc-600">→</span>
                <div className="flex items-center gap-2 bg-lime-400 rounded-full px-4 py-2">
                  <span>✅</span>
                  <span className="text-sm text-zinc-900 font-bold">완료!</span>
                </div>
              </div>

              {/* 상세 단계 */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center text-zinc-900 font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-white mb-2">폴더 선택</h4>
                    <p className="text-zinc-400 text-sm">앱에서 &quot;폴더 선택&quot; 버튼을 클릭하고 작업 폴더를 선택하세요.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center text-zinc-900 font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-white mb-2">상품 목록 확인</h4>
                    <p className="text-zinc-400 text-sm">자동으로 인식된 상품 목록을 확인하세요. 처리할 상품을 선택할 수 있어요.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center text-zinc-900 font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-white mb-2">생성 옵션 선택</h4>
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-2 px-3 text-zinc-400 font-medium">옵션</th>
                            <th className="text-left py-2 px-3 text-zinc-400 font-medium">설명</th>
                            <th className="text-left py-2 px-3 text-zinc-400 font-medium">크레딧</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-300">
                          <tr className="border-b border-zinc-800">
                            <td className="py-2 px-3 font-medium">기본 정물</td>
                            <td className="py-2 px-3">깔끔한 배경의 상품 이미지</td>
                            <td className="py-2 px-3"><span className="text-lime-400">Pro 3</span> / <span className="text-zinc-400">Flash 1</span></td>
                          </tr>
                          <tr className="border-b border-zinc-800">
                            <td className="py-2 px-3 font-medium">기본 모델</td>
                            <td className="py-2 px-3">모델 착용샷</td>
                            <td className="py-2 px-3"><span className="text-lime-400">Pro 3</span> / <span className="text-zinc-400">Flash 1</span></td>
                          </tr>
                          <tr className="border-b border-zinc-800">
                            <td className="py-2 px-3 font-medium">화보 정물</td>
                            <td className="py-2 px-3">감성적인 분위기의 상품 이미지</td>
                            <td className="py-2 px-3"><span className="text-lime-400">Pro 3</span> / <span className="text-zinc-400">Flash 1</span></td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">화보 모델</td>
                            <td className="py-2 px-3">화보 스타일의 모델 착용샷</td>
                            <td className="py-2 px-3"><span className="text-lime-400">Pro 3</span> / <span className="text-zinc-400">Flash 1</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center text-zinc-900 font-bold shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-white mb-2">처리 시작</h4>
                    <p className="text-zinc-400 text-sm">크레딧을 확인하고 &quot;일괄 처리 시작&quot; 버튼을 클릭하세요. 진행 상황이 실시간으로 표시됩니다.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center text-zinc-900 font-bold shrink-0">5</div>
                  <div>
                    <h4 className="font-bold text-white mb-2">결과 확인</h4>
                    <p className="text-zinc-400 text-sm mb-3">각 상품 폴더의 <code className="px-2 py-0.5 bg-zinc-800 rounded text-lime-400">output/</code> 폴더에 생성된 이미지가 저장됩니다.</p>
                    
                    {/* 결과 폴더 구조 */}
                    <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs">
                      <div className="text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400">📁</span>
                          <span>작업폴더/</span>
                        </div>
                        <div className="ml-4 border-l border-zinc-700 pl-3 mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400">📁</span>
                            <span>PROD001/</span>
                          </div>
                          <div className="ml-4 border-l border-zinc-700 pl-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">🖼️</span>
                              <span>5.jpg</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lime-400">📁</span>
                              <span className="text-lime-400 font-bold">output/</span>
                              <span className="text-zinc-500">← 생성된 이미지</span>
                            </div>
                            <div className="ml-4 border-l border-lime-400/30 pl-3 space-y-1">
                              <div className="text-zinc-300">0.jpg <span className="text-zinc-500">(기본 정물)</span></div>
                              <div className="text-zinc-300">1.jpg <span className="text-zinc-500">(기본 모델)</span></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-green-400">📊</span>
                            <span className="text-green-400">작업폴더_result.xlsx</span>
                            <span className="text-zinc-500">← 결과 엑셀</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 중단 & 재개 안내 */}
            <div className="bg-blue-500/10 rounded-2xl border border-blue-500/20 p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💾</span>
                <div>
                  <h4 className="font-bold text-white mb-2">중단해도 이어서 처리 가능!</h4>
                  <p className="text-zinc-300 text-sm">
                    일괄 처리 중 &quot;중지&quot; 버튼을 누르거나 프로그램을 종료해도 진행 상태가 자동 저장됩니다.
                    다음에 같은 폴더를 선택하면 이어서 처리할 수 있어요.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 6: 크레딧 안내 */}
          <section id="credit" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">💰</span>
              <h2 className="text-2xl font-bold text-white">크레딧 안내</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Pro 모델 */}
              <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">👑</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Pro 모델</h3>
                    <p className="text-purple-400 text-sm font-medium">이미지당 3 크레딧</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> 최고 품질의 이미지
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> 정교한 디테일 표현
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> 프리미엄 상품에 추천
                  </li>
                </ul>
              </div>

              {/* Flash 모델 */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl border border-cyan-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Flash 모델</h3>
                    <p className="text-cyan-400 text-sm font-medium">이미지당 1 크레딧</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> 빠른 생성 속도
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> 경제적인 크레딧 소모
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> 대량 작업에 추천
                  </li>
                </ul>
              </div>
            </div>

            {/* 계산 예시 */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <span>🧮</span> 크레딧 계산 예시
              </h4>
              <div className="bg-zinc-950 rounded-xl p-5">
                <p className="text-zinc-400 text-sm mb-3">상품 100개 × (기본 정물 + 기본 모델) = 200회 생성</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-purple-400 font-medium mb-1">Pro 모델 사용 시</p>
                    <p className="text-2xl font-black text-white">600 <span className="text-sm font-normal text-zinc-400">크레딧</span></p>
                    <p className="text-xs text-zinc-500">200회 × 3 크레딧</p>
                  </div>
                  <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                    <p className="text-cyan-400 font-medium mb-1">Flash 모델 사용 시</p>
                    <p className="text-2xl font-black text-white">200 <span className="text-sm font-normal text-zinc-400">크레딧</span></p>
                    <p className="text-xs text-zinc-500">200회 × 1 크레딧</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 7: FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">❓</span>
              <h2 className="text-2xl font-bold text-white">자주 묻는 질문</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: '지원하는 이미지 형식은 무엇인가요?',
                  a: 'JPG, JPEG, PNG, WEBP 형식을 지원합니다.'
                },
                {
                  q: '한 번에 몇 개까지 처리할 수 있나요?',
                  a: '개수 제한은 없습니다! 크레딧만 충분하면 수백 개의 상품도 한 번에 처리할 수 있어요.'
                },
                {
                  q: '처리 중 중단해도 되나요?',
                  a: '네, 언제든 중단할 수 있어요. 진행 상태가 자동 저장되어 나중에 이어서 처리할 수 있습니다.'
                },
                {
                  q: '생성된 이미지의 저작권은 누구에게 있나요?',
                  a: '생성된 모든 이미지는 100% 사용자에게 귀속됩니다. 상업적 용도로 자유롭게 사용하세요.'
                },
                {
                  q: '크레딧 환불이 가능한가요?',
                  a: '사용하지 않은 크레딧은 고객센터를 통해 환불 요청이 가능합니다. 자세한 내용은 이용약관을 참고해주세요.'
                },
                {
                  q: 'API 키가 노출되면 어떻게 하나요?',
                  a: '마이페이지에서 기존 키를 삭제하고 새 키를 발급받으세요. 이전 키는 즉시 비활성화됩니다.'
                },
              ].map((item, index) => (
                <div key={index} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                  <h4 className="font-bold text-white mb-2 flex items-start gap-3">
                    <span className="text-lime-400">Q.</span>
                    {item.q}
                  </h4>
                  <p className="text-zinc-400 text-sm pl-7">
                    <span className="text-zinc-500">A.</span> {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-lime-400/20 to-transparent rounded-3xl border border-lime-400/30 p-8 text-center">
            <h3 className="text-2xl font-black text-white mb-3">준비되셨나요?</h3>
            <p className="text-zinc-400 mb-6">지금 바로 AUTOPIC으로 전문적인 상품 이미지를 만들어보세요!</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link 
                href="/studio" 
                className="px-6 py-3 bg-lime-400 text-zinc-900 rounded-xl font-bold hover:bg-lime-300 transition-colors"
              >
                웹에서 시작하기
              </Link>
              <Link 
                href="/#download" 
                className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
              >
                데스크톱 앱 다운로드
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-zinc-500 text-sm">
          <p>© 2024 AUTOPIC. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
            <span>·</span>
            <Link href="mailto:support@autopic.app" className="hover:text-white transition-colors">문의하기</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
