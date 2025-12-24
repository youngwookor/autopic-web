# Autopic Backend API

## 환경 설정

```bash
# 가상환경 생성
python -m venv venv
venv\Scripts\activate  # Windows

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에서 API 키 설정
```

## 실행

```bash
# 개발 서버
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
