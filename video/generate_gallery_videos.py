"""
갤러리 비디오 일괄 생성 스크립트
- 각 카테고리 폴더의 생성 이미지로 360° 비디오 생성
- 생성된 비디오는 각 폴더에 video.mp4로 저장
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

# 갤러리 폴더 경로
GALLERY_DIR = r"C:\Users\Nam\Desktop\autopic-web\frontend\public\gallery"

# 처리할 카테고리 목록
CATEGORIES = [
    "가방",
    "신발", 
    "시계",
    "의류",
    "쥬얼리",
    "키즈",
    "패션잡화"
]

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SERVICE_ACCOUNT_FILE
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

from google import genai
from google.genai.types import GenerateVideosConfig, Image, VideoGenerationReferenceImage


def load_image_bytes(image_path):
    """이미지 파일을 바이트로 로드"""
    with open(image_path, "rb") as f:
        return f.read()


def get_category_images(category_path):
    """카테고리 폴더에서 생성된 이미지 3장 가져오기 (1.png, 2.png, 3.png)"""
    images = []
    
    # 모든 카테고리 동일: 1.png, 2.png, 3.png 사용
    for i in range(1, 4):
        img_path = os.path.join(category_path, f"{i}.png")
        if os.path.exists(img_path):
            images.append(img_path)
    
    return images


def generate_video(image_paths, output_path, category_name, duration_seconds=8):
    """360° 회전 비디오 생성"""
    
    print(f"\n{'─'*60}")
    print(f"🎬 [{category_name}] 비디오 생성 시작")
    print(f"{'─'*60}")
    
    if len(image_paths) < 3:
        print(f"   ❌ 이미지가 3장 미만입니다. (현재 {len(image_paths)}장)")
        return False
    
    cost = duration_seconds * 0.40
    print(f"   📷 입력 이미지: {len(image_paths)}장")
    for i, p in enumerate(image_paths):
        print(f"      {i+1}. {os.path.basename(p)}")
    print(f"   ⏱️  길이: {duration_seconds}초")
    print(f"   💰 예상 비용: ${cost:.2f} (~{int(cost * 1400)}원)")
    
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
    
    # 360° 회전 비디오 프롬프트
    prompt = """
    Create a smooth 360-degree product rotation video.
    
    REFERENCE IMAGES:
    - Image 1: FRONT view
    - Image 2: SIDE view  
    - Image 3: BACK view
    
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
    
    REQUIREMENTS:
    - Show ONE product only
    - Pure white background (#FFFFFF)
    - Product stays centered
    - Consistent lighting throughout
    - No morphing of product shape - only rotation
    - Maintain all product details accurately
    """

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
        
        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
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
                with open(output_path, "wb") as f:
                    f.write(video.video.video_bytes)
                print(f"   💾 저장됨: {output_path}")
                return True
            elif video.video and video.video.uri:
                print(f"   📍 GCS URI: {video.video.uri}")
                print(f"   ⚠️  video_bytes 없음 - GCS에서 다운로드 필요")
                return False
            else:
                print(f"   ❌ video_bytes/uri 없음")
                return False
        else:
            print(f"   ❌ 결과 없음")
            return False
            
    except Exception as e:
        print(f"\n   ❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("\n" + "="*60)
    print("🚀 갤러리 비디오 일괄 생성")
    print("="*60)
    
    # 서비스 계정 확인
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"\n❌ 서비스 계정 파일 없음: {SERVICE_ACCOUNT_FILE}")
        return
    print("\n✅ 서비스 계정 파일 확인됨")
    
    # 갤러리 폴더 확인
    if not os.path.exists(GALLERY_DIR):
        print(f"\n❌ 갤러리 폴더 없음: {GALLERY_DIR}")
        return
    print(f"✅ 갤러리 폴더 확인됨: {GALLERY_DIR}")
    
    # 카테고리별 상태 확인
    print("\n📁 카테고리 상태:")
    categories_to_process = []
    
    for category in CATEGORIES:
        category_path = os.path.join(GALLERY_DIR, category)
        video_path = os.path.join(category_path, "video.mp4")
        
        if not os.path.exists(category_path):
            print(f"   ❌ {category}: 폴더 없음")
            continue
        
        images = get_category_images(category_path)
        has_video = os.path.exists(video_path)
        
        if has_video:
            print(f"   ✅ {category}: 이미지 {len(images)}장, 비디오 있음 (스킵)")
        elif len(images) >= 3:
            print(f"   🎯 {category}: 이미지 {len(images)}장, 비디오 없음 → 생성 필요")
            categories_to_process.append((category, category_path, images))
        else:
            print(f"   ⚠️  {category}: 이미지 {len(images)}장 (3장 미만, 스킵)")
    
    if not categories_to_process:
        print("\n✅ 모든 카테고리에 비디오가 있거나, 생성 가능한 카테고리가 없습니다.")
        return
    
    # 비용 계산
    total_cost = len(categories_to_process) * 8 * 0.40
    print(f"\n💰 예상 총 비용: ${total_cost:.2f} (~{int(total_cost * 1400)}원)")
    print(f"   - {len(categories_to_process)}개 카테고리 × 8초 × $0.40/초")
    
    # 처리할 카테고리 목록
    print(f"\n📋 처리할 카테고리:")
    for i, (name, _, _) in enumerate(categories_to_process, 1):
        print(f"   {i}. {name}")
    
    # 확인
    confirm = input("\n진행하시겠습니까? (y/n): ").strip().lower()
    if confirm != 'y':
        print("취소됨")
        return
    
    # 비디오 생성
    results = []
    for i, (category, category_path, images) in enumerate(categories_to_process, 1):
        print(f"\n\n{'='*60}")
        print(f"📦 [{i}/{len(categories_to_process)}] {category} 처리 중...")
        print(f"{'='*60}")
        
        video_path = os.path.join(category_path, "video.mp4")
        success = generate_video(images, video_path, category)
        results.append((category, success))
        
        # 다음 카테고리 전에 잠시 대기 (API 제한 방지)
        if i < len(categories_to_process):
            print(f"\n   ⏸️  다음 카테고리 처리 전 10초 대기...")
            time.sleep(10)
    
    # 최종 결과
    print("\n\n" + "="*60)
    print("📊 최종 결과")
    print("="*60)
    
    success_count = sum(1 for _, s in results if s)
    fail_count = len(results) - success_count
    
    for category, success in results:
        status = "✅ 성공" if success else "❌ 실패"
        print(f"   {category}: {status}")
    
    print(f"\n   성공: {success_count}개")
    print(f"   실패: {fail_count}개")
    print(f"   총 비용: ${success_count * 8 * 0.40:.2f}")


if __name__ == "__main__":
    main()
