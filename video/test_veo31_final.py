"""
Google Veo 3.1 Fast - 4뷰 합성 이미지 (최종 버전)
- 시작 부분에 합성 이미지 안 보이도록 프롬프트 개선
"""

import os
import time
from datetime import datetime

# ============================================
# 설정
# ============================================
SERVICE_ACCOUNT_FILE = r"C:\Users\Nam\Desktop\autopic-web\video\gen-lang-client-0839670658-2b0742ad86db.json"
PROJECT_ID = "gen-lang-client-0839670658"
LOCATION = "us-central1"

IMAGE_DIR = r"C:\Users\Nam\Desktop\autopic-web\video"
OUTPUT_DIR = os.path.join(IMAGE_DIR, "output")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SERVICE_ACCOUNT_FILE
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

from google import genai
from google.genai.types import GenerateVideosConfig, Image


def save_video(video_bytes, filename="Veo31_final"):
    """video_bytes를 파일로 저장"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(OUTPUT_DIR, f"{filename}_{timestamp}.mp4")
    
    with open(filepath, "wb") as f:
        f.write(video_bytes)
    
    return filepath


def generate_video_veo(image_path, duration_seconds=8):
    """Veo 3.1 Fast로 비디오 생성 (4뷰 합성 이미지, 개선된 프롬프트)"""
    
    print(f"\n{'─'*60}")
    print(f"🎬 Veo 3.1 Fast - 4뷰 합성 이미지 (최종)")
    print(f"{'─'*60}")
    
    cost = duration_seconds * 0.15
    print(f"   📷 입력 이미지: {os.path.basename(image_path)}")
    print(f"   ⏱️  길이: {duration_seconds}초")
    print(f"   💰 예상 비용: ${cost:.2f} (~{int(cost * 1400)}원)")
    
    start_time = time.time()
    
    print(f"\n   🔑 클라이언트 초기화 중...")
    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
    print(f"   ✅ 클라이언트 준비 완료")
    
    print(f"   📤 이미지 로드 중...")
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    print(f"   ✅ 이미지 로드 완료 ({len(image_bytes)} bytes)")
    
    # 개선된 프롬프트 - 시작 부분 명시
    prompt = """
CRITICAL VIDEO START INSTRUCTION:
- Start the video showing ONLY ONE single product on white background
- Do NOT show multiple products, grid, or reference images at the beginning
- Begin IMMEDIATELY with ONLY the front view of ONE product
- The reference image grid is for YOUR understanding only, NOT for the video output

The input image shows 4 DIFFERENT VIEWS of the SAME product arranged horizontally for reference:
- View 1 (leftmost): FRONT view
- View 2: SIDE view  
- View 3: BACK view (may look different from front)
- View 4 (rightmost): DETAIL view

Create a smooth 360-degree product rotation video:
1. START with ONLY ONE product showing the FRONT view
2. Slowly rotate clockwise to SIDE view
3. Continue rotating to BACK view (use View 3 as reference - it may look different!)
4. Continue rotating to other side
5. Complete rotation back to FRONT view

RULES:
- Show ONLY ONE product throughout the entire video
- The BACK may have different details than the front - this is correct
- Maintain exact colors and textures from the reference views
- Clean pure white studio background
- Professional soft even lighting
- Smooth, continuous rotation
- Product centered in frame at all times
"""

    print(f"\n   🚀 비디오 생성 요청 중...")
    print(f"   📍 모델: veo-3.1-fast-generate-preview")
    print(f"   💡 개선: 시작 시 단일 제품만 표시하도록 프롬프트 강화")
    
    try:
        operation = client.models.generate_videos(
            model="veo-3.1-fast-generate-preview",
            prompt=prompt.strip(),
            image=Image(
                image_bytes=image_bytes,
                mime_type="image/png"
            ),
            config=GenerateVideosConfig(
                aspect_ratio="16:9",
                number_of_videos=1,
                duration_seconds=duration_seconds,
            ),
        )
        
        print(f"   ✅ 작업 시작됨!")
        print(f"   ⏳ 생성 중...")
        
        attempt = 0
        while not operation.done:
            attempt += 1
            print(f"   ⏳ 생성 중... ({attempt * 15}초 경과)", end="\r")
            time.sleep(15)
            operation = client.operations.get(operation)
        
        elapsed = time.time() - start_time
        print(f"\n   ✅ 작업 완료! ({elapsed:.1f}초)")
        
        if operation.result and operation.result.generated_videos:
            video = operation.result.generated_videos[0]
            
            if video.video and video.video.video_bytes:
                filepath = save_video(video.video.video_bytes)
                print(f"   💾 저장됨: {filepath}")
                return filepath
            else:
                print(f"   ❌ video_bytes 없음")
                return None
        else:
            print(f"   ❌ 결과 없음")
            return None
            
    except Exception as e:
        print(f"   ❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    print("\n" + "="*60)
    print("🚀 AUTOPIC - Veo 3.1 Fast 최종 테스트")
    print("="*60)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"\n❌ 서비스 계정 파일 없음")
        return
    
    print("\n✅ 서비스 계정 파일 확인됨")
    
    # 4뷰 합성 이미지
    image_path = os.path.join(IMAGE_DIR, "0-side.png")
    
    if not os.path.exists(image_path):
        print(f"\n❌ 이미지 없음: {image_path}")
        return
    
    print(f"✅ 합성 이미지 확인됨: 0-side.png")
    
    print("\n📝 개선 사항:")
    print("   - 시작 시 합성 이미지 대신 단일 제품만 표시")
    print("   - 프롬프트 강화로 AI 이해도 향상")
    
    print("\n영상 길이:")
    print("   1: 5초 ($0.75)")
    print("   2: 8초 ($1.20) [권장]")
    
    choice = input("\n선택 (기본값 2): ").strip()
    duration = 5 if choice == "1" else 8
    
    cost = duration * 0.15
    print(f"\n✅ 선택: {duration}초 (${cost:.2f} = ~{int(cost * 1400)}원)")
    
    confirm = input("\n진행? (y/n): ").strip().lower()
    if confirm != 'y':
        print("취소됨")
        return
    
    result = generate_video_veo(image_path, duration)
    
    print("\n" + "="*60)
    print("📊 결과")
    print("="*60)
    
    if result:
        print(f"✅ 성공!")
        print(f"   📁 파일: {result}")
        print(f"   💰 비용: ${cost:.2f} (~{int(cost * 1400)}원)")
        print("\n🔍 확인 포인트:")
        print("   1. 시작 시 단일 제품만 보이는지")
        print("   2. 후면 환각 없이 정확한지")
        print("   3. 360도 회전 품질")
    else:
        print("❌ 실패")


if __name__ == "__main__":
    main()
