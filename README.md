# Autopic Web

AI 기반 이커머스 상품 이미지 생성 서비스

## 구조

```
autopic-web/
├── frontend/          # Next.js 프론트엔드 (Vercel 배포)
├── backend/           # FastAPI 백엔드 (AWS Lightsail)
└── README.md
```

## 프론트엔드 (frontend/)

- **프레임워크**: Next.js 14
- **배포**: Vercel
- **URL**: https://autopic.app

## 백엔드 (backend/)

- **프레임워크**: FastAPI
- **배포**: AWS Lightsail
- **URL**: http://43.200.229.169:8000

## 데이터베이스

- **Supabase** (PostgreSQL)
- 테이블: profiles, api_keys, payments, generations, usages, subscriptions, subscription_history

---

## 🚀 배포 방법

### 프론트엔드 (Vercel) - 자동 배포

GitHub에 push하면 **자동으로 Vercel에 배포**됨

```bash
cd C:\Users\Nam\Desktop\autopic-web
git add .
git commit -m "변경 내용"
git push
```

→ Vercel 대시보드에서 배포 상태 확인: https://vercel.com/dashboard

---

### 백엔드 (AWS Lightsail) - 수동 배포

**1. SSH 접속**
- AWS Lightsail 콘솔 → 인스턴스 → "Connect using SSH" 클릭
- 또는: `ssh -i [키파일경로] ubuntu@43.200.229.169`

**2. 배포 명령어 (한 줄로 복사해서 붙여넣기)**
```bash
cd ~/autopic-repo/backend && git pull && sudo systemctl restart autopic && sudo systemctl status autopic
```

**3. 로그 확인 (문제 발생 시)**
```bash
sudo journalctl -u autopic -f
```

---

### Supabase (DB) - SQL 실행

1. https://supabase.com/dashboard 접속
2. AUTOPIC 프로젝트 선택
3. 왼쪽 메뉴 → SQL Editor
4. SQL 파일 내용 붙여넣기 → Run

SQL 파일 위치: `backend/sql/` 폴더

---

## 환경변수

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://43.200.229.169:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)
```
GEMINI_API_KEYS=key1,key2
CLAUDE_API_KEY=your_claude_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key
```

---

## 주요 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/credits/{user_id}` | 크레딧 조회 |
| `POST /api/generate` | 이미지 생성 |
| `POST /api/payment/create` | 결제 생성 |
| `POST /api/payment/confirm` | 결제 승인 |
| `GET /api/subscription/{user_id}` | 구독 상태 조회 |
| `POST /api/subscription/create` | 구독 생성 |
| `POST /api/subscription/cancel` | 구독 취소 |

---

## 배포 체크리스트

- [ ] 코드 수정 완료
- [ ] `git push` (프론트엔드 자동 배포)
- [ ] Vercel 배포 완료 확인
- [ ] AWS SSH 접속 → 배포 명령어 실행
- [ ] 사이트에서 기능 테스트
