# AUTOPIC 웹서비스 개발 체크리스트
## 최종 업데이트: 2025-12-24

---

## ✅ 완료된 작업

### 인프라 & 배포
- [x] AWS Lightsail 백엔드 서버 (43.200.229.169:8000)
- [x] Vercel 프론트엔드 배포 (autopic-web-44v2.vercel.app)
- [x] Supabase 데이터베이스 연동
- [x] 환경변수 설정 완료

### 인증 시스템
- [x] 이메일/비밀번호 회원가입/로그인
- [x] JWT 토큰 인증
- [x] Supabase Auth 연동
- [ ] Google OAuth 로그인
- [ ] Kakao OAuth 로그인 (예정)

### 프론트엔드 UI
- [x] 랜딩페이지 (Hero, Studio, Process, Showcase, Reviews, Pricing, FAQ, Footer)
- [x] 로그인/회원가입 페이지
- [x] 이미지 생성 스튜디오 (정물/모델, 일반/화보 선택)
- [x] 마이페이지 (크레딧, API 키, 사용 내역)
- [x] 요금제 페이지 (크레딧 충전 / 구독)
- [x] 반응형 디자인 (모바일/PC)
- [x] 스크롤 애니메이션

### 백엔드 API
- [x] 사용자 인증 API
- [x] 이미지 생성 API (Gemini 연동)
- [x] 크레딧 시스템 API
- [x] 사용 내역 API
- [x] API 키 발급/관리

### 이미지 생성
- [x] Flash 모델 (1크레딧)
- [x] Pro 모델 (3크레딧)
- [x] 정물/모델 이미지 선택
- [x] 일반/화보 스타일 선택
- [x] 결과 이미지 다운로드 (개별/ZIP)

### 결제 시스템
- [x] 토스페이먼츠 연동 (테스트 모드)
- [x] 크레딧 패키지 구매 UI
- [ ] 실결제 전환 (라이브 키)
- [ ] 구독 결제 구현

---

## 🔴 긴급 - 배포 후 수정 필요

### Mixed Content 문제 (HTTPS → HTTP)
- [ ] 백엔드 HTTPS 적용 또는
- [ ] Vercel Proxy 설정으로 우회

### 로그인/인증 안정성
- [ ] 세션 유지 문제 확인
- [ ] 로그아웃 후 상태 초기화

---

## 🟡 Phase 2: 추가 기능

### 소셜 로그인
- [ ] Google OAuth 연동
- [ ] Kakao OAuth 연동
- [ ] 네이버 OAuth 연동 (선택)

### 관리자 어드민
- [ ] /admin 대시보드
- [ ] 유저 관리 (목록, 검색, 크레딧 지급)
- [ ] 생성 로그 조회
- [ ] 매출/통계 대시보드

### 이메일 시스템
- [ ] 회원가입 인증 이메일
- [ ] 비밀번호 재설정
- [ ] 결제 영수증 발송

---

## 🟢 Phase 3: 고도화

### SEO & 마케팅
- [ ] 메타 태그 최적화
- [ ] Open Graph 이미지
- [ ] robots.txt, sitemap.xml
- [ ] Google Analytics
- [ ] Google Search Console

### 성능 & 보안
- [ ] Rate Limiting
- [ ] 이미지 CDN
- [ ] 에러 모니터링 (Sentry)

### 설치형 프로그램 연동
- [x] API 키 발급 시스템
- [ ] 설치형 ↔ 웹 API 완전 연동 테스트
- [ ] 사용량 동기화

---

## 🔵 Phase 4: 운영 준비

### 법적 요구사항
- [ ] 이용약관
- [ ] 개인정보처리방침
- [ ] 환불정책
- [ ] 사업자 정보 표시

### 도메인 & SSL
- [ ] 커스텀 도메인 구매 (autopic.kr 등)
- [ ] 도메인 연결
- [ ] SSL 인증서

### 실결제 전환
- [ ] 토스페이먼츠 라이브 키 발급
- [ ] 실결제 테스트
- [ ] 세금계산서/영수증 발급

---

## 📁 주요 파일 경로

```
C:\Users\Nam\Desktop\autopic-web\
├── frontend\              # Next.js 프론트엔드
│   ├── app\              # 페이지들
│   ├── components\       # 컴포넌트
│   ├── lib\              # 유틸리티
│   └── .env.local        # 환경변수
├── backend\              # FastAPI 백엔드
│   └── main.py          # 메인 API
└── README.md
```

---

## 🔑 환경변수 (Vercel)

| Key | Value |
|-----|-------|
| NEXT_PUBLIC_API_URL | http://43.200.229.169:8000 |
| NEXT_PUBLIC_SUPABASE_URL | https://ryehnwfulpkmeqcsiodm.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGci... |
| NEXT_PUBLIC_TOSS_CLIENT_KEY | test_ck_ma60RZblrqBjxnGpByx8wzYWBn1 |

---

## 🚀 다음 작업 우선순위

1. **Mixed Content 해결** - HTTPS 문제
2. **카카오 로그인 연동**
3. **설치형 프로그램 연동 테스트**
4. **실결제 전환**
5. **도메인 연결**
