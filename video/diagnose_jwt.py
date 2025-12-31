"""
JWT 오류 진단 스크립트
- 시스템 시간 확인
- 서비스 계정 키 검증
- 간단한 API 호출 테스트
"""

import os
import time
import json
import requests
from datetime import datetime

SERVICE_ACCOUNT_FILE = r"C:\Users\Nam\Desktop\autopic-web\video\gen-lang-client-0839670658-2b0742ad86db.json"

print("=" * 60)
print("🔍 JWT 오류 진단")
print("=" * 60)

# 1. 시스템 시간 확인
print("\n📅 1. 시스템 시간 확인")
local_time = datetime.now()
print(f"   로컬 시간: {local_time.strftime('%Y-%m-%d %H:%M:%S')}")

# Google 시간 서버와 비교
try:
    response = requests.head("https://www.google.com", timeout=5)
    server_date = response.headers.get('Date')
    if server_date:
        from email.utils import parsedate_to_datetime
        google_time = parsedate_to_datetime(server_date)
        time_diff = abs((local_time - google_time.replace(tzinfo=None)).total_seconds())
        print(f"   Google 서버 시간: {google_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   시간 차이: {time_diff:.1f}초")
        
        if time_diff > 60:
            print(f"   ⚠️  경고: 시간 차이가 {time_diff:.0f}초입니다!")
            print(f"   → Windows 설정 > 시간 및 언어 > '지금 동기화' 클릭 필요")
        else:
            print(f"   ✅ 시간 동기화 정상")
except Exception as e:
    print(f"   ❌ Google 시간 확인 실패: {e}")

# 2. 서비스 계정 키 파일 확인
print("\n🔑 2. 서비스 계정 키 파일 확인")
if os.path.exists(SERVICE_ACCOUNT_FILE):
    print(f"   ✅ 파일 존재: {SERVICE_ACCOUNT_FILE}")
    
    try:
        with open(SERVICE_ACCOUNT_FILE, 'r') as f:
            key_data = json.load(f)
        
        print(f"   📧 서비스 계정: {key_data.get('client_email', 'N/A')}")
        print(f"   🏢 프로젝트: {key_data.get('project_id', 'N/A')}")
        print(f"   🔐 키 ID: {key_data.get('private_key_id', 'N/A')[:20]}...")
        
        # private_key 확인
        private_key = key_data.get('private_key', '')
        if private_key and '-----BEGIN PRIVATE KEY-----' in private_key:
            print(f"   ✅ Private Key 형식 정상")
        else:
            print(f"   ❌ Private Key 형식 오류!")
            
    except json.JSONDecodeError:
        print(f"   ❌ JSON 파싱 오류 - 파일이 손상됨")
    except Exception as e:
        print(f"   ❌ 파일 읽기 오류: {e}")
else:
    print(f"   ❌ 파일 없음: {SERVICE_ACCOUNT_FILE}")

# 3. Google OAuth 토큰 요청 테스트
print("\n🔐 3. OAuth 토큰 요청 테스트")
try:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SERVICE_ACCOUNT_FILE
    
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request
    
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    
    print(f"   📝 Credentials 생성 성공")
    print(f"   📧 Service Account: {credentials.service_account_email}")
    
    # 토큰 갱신 시도 (이게 실패하면 JWT 오류)
    print(f"   🔄 토큰 갱신 시도 중...")
    credentials.refresh(Request())
    
    print(f"   ✅ 토큰 획득 성공!")
    print(f"   🎫 Token: {credentials.token[:50]}...")
    print(f"   ⏰ 만료: {credentials.expiry}")
    
except Exception as e:
    print(f"   ❌ 토큰 획득 실패: {e}")
    
    if "Invalid JWT Signature" in str(e):
        print("\n" + "=" * 60)
        print("🔧 해결 방법:")
        print("=" * 60)
        print("""
1. 시간 동기화 (가장 흔한 원인):
   - Windows 설정 > 시간 및 언어 > 날짜 및 시간
   - '자동으로 시간 설정' 켜기
   - '지금 동기화' 클릭

2. 서비스 계정 키 재발급:
   - Google Cloud Console > IAM > 서비스 계정
   - 해당 계정 클릭 > 키 > 키 추가 > 새 키 만들기
   - JSON 다운로드 후 교체

3. 서비스 계정 활성화 확인:
   - Google Cloud Console에서 서비스 계정이 비활성화되지 않았는지 확인
""")

print("\n" + "=" * 60)
print("진단 완료")
print("=" * 60)
