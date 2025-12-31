"""
Google Veo 3.1 Standard - 최종 버전
(후면 정확도 + 부드러운 전환)
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
from google.genai.types import GenerateVideosConfig, Image, VideoGenerationReferenceImage


def save_video(video_bytes, filename="Veo_Standard_Final"):
    """video_bytes를 파일로 저장"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(OUTPUT_DIR, f"{filename}_{timestamp}.mp4")
    
    with open(filepath, "wb") as f:
        f.write(video_bytes)
    
    return filepath


def load_image_bytes(image_path):
    """이미지 파일을 바이트로 로드"""
    with open(image_path, "rb") as f:
        return f.read()


def generate_video_standard_final(image_paths, duration_seconds=8):
    """Standard 모델 최종 버전 - 후면 정확도 + 부드러운 전환"""
    
    print(f"\n{'─'*60}")
    print(f"🎬 Veo 3.1 Standard - 최종 버전")
    print(f"   (후면 정확도 + 부드러운 전환)")
    print(f"{'─'*60}")
    
    cost = duration_seconds * 0.40
    print(f"   📷 입력 이미지: 3장 (정면/측면/후면)")
    for i, p in enumerate(image_paths[:3]):
        view_names = ["정면(front)", "측면(side)", "후면(back)"]
        print(f"      {i+1}. {os.path.basename(p)} - {view_names[i]}")
    print(f"   ⏱️  길이: {duration_seconds}초")
    print(f"   💰 예상 비용: ${cost:.2f} (~{int(cost * 1400)}원)")
    
    print(f"\n   🔧 이번 수정 사항:")
    print(f"      ✅ 후면 정확도 (이전 테스트 OK)")
    print(f"      🆕 부드러운 전환 (갑작스런 변환 방지)")
    print(f"      🆕 일정한 회전 속도 강조")
    
    start_time = time.time()
    
    print(f"\n   🔑 클라이언트 초기화 중...")
    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
    print(f"   ✅ 클라이언트 준비 완료")
    
    print(f"   📤 이미지 로드 중...")
    images_data = []
    for path in image_paths[:3]:
        img_bytes = load_image_bytes(path)
        images_data.append(img_bytes)
        print(f"      ✅ {os.path.basename(path)} ({len(img_bytes):,} bytes)")
    
    # [최종] 후면 정확도 + 부드러운 전환 프롬프트
    prompt = """
    Create a smooth 360-degree product rotation video.
    
    REFERENCE IMAGES:
    - Image 1: FRONT view
    - Image 2: SIDE view
    - Image 3: BACK view (shows "GUCCI" text on green tab - NOT metal logo)
    
    SMOOTH TRANSITION - CRITICAL:
    - NO sudden jumps, cuts, or instant changes between frames
    - Smooth continuous motion throughout the ENTIRE video
    - Each frame must blend naturally and gradually into the next
    - Constant rotation speed - no acceleration, no deceleration, no pauses
    - The product must morph smoothly between angles
    - Like a real turntable rotating at constant speed
    
    ROTATION:
    - Rotate CLOCKWISE only (one direction)
    - Complete exactly ONE full 360-degree rotation
    - 0s: Front → 2s: Side → 4s: Back → 6s: Other side → 8s: Front
    
    BACK VIEW ACCURACY:
    - The BACK (Image 3) shows "GUCCI" TEXT printed on green leather
    - Do NOT add metal GG logo or any embossed hardware
    - Match Image 3 exactly
    
    REQUIREMENTS:
    - Show ONE product only
    - Pure white background (#FFFFFF)
    - Product stays centered
    - Consistent lighting throughout
    - No morphing of product shape - only rotation
    """

    print(f"\n   📝 프롬프트 핵심:")
    print(f"      - 부드러운 연속 전환 (NO sudden jumps)")
    print(f"      - 일정한 회전 속도 (like a real turntable)")
    print(f"      - 후면 GUCCI 텍스트 정확도")
    
    print(f"\n   🚀 비디오 생성 요청 중...")
    
    try:
        reference_images = []
        
        for i, img_bytes in enumerate(images_data):
            ref_img = VideoGenerationReferenceImage(
                image=Image(
                    image_bytes=img_bytes,
                    mime_type="image/png"
                ),
                reference_type="asset"
            )
            reference_images.append(ref_img)
        
        print(f"   🖼️  reference_images: {len(reference_images)}장")
        
        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",  # Standard 모델
            prompt=prompt.strip(),
            config=GenerateVideosConfig(
                reference_images=reference_images,
                aspect_ratio="16:9",
                number_of_videos=1,
                duration_seconds=duration_seconds,
            ),
        )
        
        print(f"   ✅ 작업 시작됨!")
        print(f"   ⏳ 생성 중... (약 2-5분 소요)")
        
        attempt = 0
        while not operation.done:
            attempt += 1
            elapsed = attempt * 15
            mins = elapsed // 60
            secs = elapsed % 60
            if mins > 0:
                print(f"   ⏳ 생성 중... ({mins}분 {secs}초 경과)", end="\r")
            else:
                print(f"   ⏳ 생성 중... ({secs}초 경과)", end="\r")
            time.sleep(15)
            operation = client.operations.get(operation)
        
        total_elapsed = time.time() - start_time
        mins = int(total_elapsed // 60)
        secs = int(total_elapsed % 60)
        print(f"\n   ✅ 작업 완료! ({mins}분 {secs}초)")
        
        if operation.result and operation.result.generated_videos:
            video = operation.result.generated_videos[0]
            
            if video.video and video.video.video_bytes:
                filepath = save_video(video.video.video_bytes)
                print(f"   💾 저장됨: {filepath}")
                return filepath, total_elapsed, cost
            elif video.video and video.video.uri:
                print(f"   📍 GCS URI: {video.video.uri}")
                return video.video.uri, total_elapsed, cost
            else:
                print(f"   ❌ video_bytes/uri 없음")
                return None, total_elapsed, cost
        else:
            print(f"   ❌ 결과 없음")
            return None, total_elapsed, cost
            
    except Exception as e:
        total_elapsed = time.time() - start_time
        print(f"\n   ❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return None, total_elapsed, cost


def main():
    print("\n" + "="*60)
    print("🚀 Veo 3.1 Standard - 최종 테스트")
    print("   (후면 정확도 유지 + 부드러운 전환 추가)")
    print("="*60)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"\n❌ 서비스 계정 파일 없음")
        return
    
    print("\n✅ 서비스 계정 파일 확인됨")
    
    image_files = [
        ("0.png", "정면"),
        ("0_1.png", "측면"),
        ("0_3.png", "후면"),
    ]
    image_paths = []
    
    print("\n📷 이미지 확인:")
    for filename, view in image_files:
        path = os.path.join(IMAGE_DIR, filename)
        if os.path.exists(path):
            image_paths.append(path)
            print(f"   ✅ {filename} - {view}")
        else:
            print(f"   ❌ {filename} 없음")
            return
    
    print("\n📝 이전 테스트 결과:")
    print("   ✅ 후면 정확도 좋음 (GUCCI 텍스트)")
    print("   ❌ 영상 중간에 갑자기 확 변환됨")
    
    print("\n🔧 이번 수정:")
    print("   - 'NO sudden jumps or cuts' 명시")
    print("   - 'like a real turntable' 비유 추가")
    print("   - 'blend naturally and gradually' 강조")
    
    print("\n💰 비용: $3.20 (8초) = ~4,480원")
    
    confirm = input("\n진행? (y/n): ").strip().lower()
    if confirm != 'y':
        print("취소됨")
        return
    
    result, elapsed, cost = generate_video_standard_final(image_paths, duration_seconds=8)
    
    print("\n" + "="*60)
    print("📊 최종 결과")
    print("="*60)
    
    if result:
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)
        print(f"✅ 성공!")
        print(f"   📁 파일: {result}")
        print(f"   ⏱️  소요시간: {mins}분 {secs}초")
        print(f"   💰 비용: ${cost:.2f} (~{int(cost * 1400)}원)")
        print("\n🔍 확인 포인트:")
        print("   1. 영상 전환이 부드러운지 (갑작스런 변환 없는지)")
        print("   2. 후면 GUCCI 텍스트 정확한지")
        print("   3. 일정한 회전 속도인지")
    else:
        print("❌ 실패")


if __name__ == "__main__":
    main()
