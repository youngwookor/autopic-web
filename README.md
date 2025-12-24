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
- **URL**: https://autopic-web.vercel.app

## 백엔드 (backend/)

- **프레임워크**: FastAPI
- **배포**: AWS Lightsail
- **URL**: http://43.200.229.169:8000

## 데이터베이스

- **Supabase** (PostgreSQL)
- 테이블: profiles, api_keys, payments, generations, usages

## 환경변수

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=/backend
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_key
```

### Backend (.env)
```
GEMINI_API_KEYS=key1,key2
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
TOSS_SECRET_KEY=your_toss_secret
```
