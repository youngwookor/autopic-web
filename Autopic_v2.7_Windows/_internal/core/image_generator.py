# -*- coding: utf-8 -*-
"""
이미지 생성 모듈 (v3)
====================
- 기본 정물/모델 + 화보 정물/모델
- 9개 카테고리 그룹 지원
"""

import base64
import io
from pathlib import Path
from typing import Optional, List, Tuple
from PIL import Image

from .gemini_client import GeminiClient


# ============================================================================
# 기본 정물 프롬프트
# ============================================================================

PROMPT_PRODUCT_SINGLE = """Edit this product photo for luxury e-commerce website.
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Remove hanger, mannequin, hanging tag, price tag, label, and background completely
- Pure white background (#FFFFFF) with soft natural shadow
- Make product look 3D volumetric with natural shape
- CRITICAL: Product must look pristine, smooth and wrinkle-free like official brand website photos
- 2x2 grid layout: [top-left: front view] [top-right: side view] [bottom-left: back view] [bottom-right: detail close-up]
- CRITICAL: Keep ALL original details EXACTLY as shown
- Do NOT change any materials, colors, patterns, or design elements"""

PROMPT_PRODUCT_DUAL = """Edit these product photos for luxury e-commerce website.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view recreation
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Remove hanger, mannequin, hanging tag, price tag, label, and background completely
- Pure white background (#FFFFFF) with soft natural shadow
- Make product look 3D volumetric with natural shape
- CRITICAL: Product must look pristine, smooth and wrinkle-free like official brand website photos
- 2x2 grid layout: [top-left: front view] [top-right: side view] [bottom-left: back view] [bottom-right: detail close-up]
- Back view must match the actual back shown in the second image
- CRITICAL: Keep ALL original details EXACTLY as shown"""


# ============================================================================
# 화보 정물 프롬프트 (Editorial)
# ============================================================================

PROMPT_PRODUCT_EDITORIAL_SINGLE = """Create luxury editorial product photos with dramatic lighting.
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

STYLE REQUIREMENTS:
- Dark, moody atmosphere with deep shadows
- Dramatic side lighting creating highlights and reflections
- Rich, cinematic color grading
- Subtle light reflections on product surface
- Dark gray or black gradient background
- Product should appear premium and mysterious

2x2 grid layout:
[top-left]: Front view with dramatic lighting
[top-right]: Side view with rim lighting
[bottom-left]: Back view with moody shadows
[bottom-right]: Detail close-up with spotlight effect

CRITICAL: Keep ALL original product details EXACTLY as shown"""

PROMPT_PRODUCT_EDITORIAL_DUAL = """Create luxury editorial product photos with dramatic lighting.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

STYLE REQUIREMENTS:
- Dark, moody atmosphere with deep shadows
- Dramatic side lighting creating highlights and reflections
- Rich, cinematic color grading
- Dark gray or black gradient background

2x2 grid layout:
[top-left]: Front view with dramatic lighting
[top-right]: Side view with rim lighting
[bottom-left]: Back view (match second image) with moody shadows
[bottom-right]: Detail close-up with spotlight effect

CRITICAL: Keep ALL original product details EXACTLY as shown"""


# ============================================================================
# 화보 모델 프롬프트 (Editorial)
# ============================================================================


PROMPT_MODEL_SINGLE = """Create professional model shots for luxury e-commerce.

STRICT REQUIREMENTS:
1. A beautiful {gender} professional model wearing/holding/using this EXACT product
2. Product must be clearly visible and accurately reproduced
3. Clean studio setting with professional lighting
4. 2x2 grid layout (4 images total):
   - Top left: Full body front view
   - Top right: Full body side angle
   - Bottom left: Upper body shot
   - Bottom right: Close-up product detail on model

Style: Clean, minimal, luxury fashion e-commerce aesthetic
Model: Professional {gender} model, elegant pose, natural expression
Lighting: Professional studio, soft shadows
Background: Pure white or soft gray

Product type: {category}
CRITICAL: Preserve exact product details, colors, patterns, logos."""

PROMPT_MODEL_DUAL = """Create professional model shots for luxury e-commerce using these two product photos.

First image: Front view
Second image: Back/detail view

STRICT REQUIREMENTS:
1. A beautiful {gender} professional model wearing/holding/using this EXACT product
2. Product must be clearly visible and accurately reproduced from both reference images
3. Clean studio setting with professional lighting
4. 2x2 grid layout (4 images total):
   - Top left: Full body front view
   - Top right: Full body side angle
   - Bottom left: Upper body showing front
   - Bottom right: Upper body showing back detail

Style: Clean, minimal, luxury fashion e-commerce aesthetic
Model: Professional {gender} model, elegant pose, natural expression
Lighting: Professional studio, soft shadows
Background: Pure white or soft gray

Product type: {category}
CRITICAL: Preserve exact product details, colors, patterns, logos from both reference images."""
PROMPT_MODEL_EDITORIAL_SINGLE = """You are a legendary fashion photographer creating an ICONIC editorial spread.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

THE MODEL:
- CAUCASIAN/EUROPEAN {gender_model} model with sharp bone structure, piercing eyes
- Age: 22-28, IDENTICAL model in ALL 4 shots
- Expression: Confident, mysterious, almost challenging the camera
- This is the same model from a major Vogue or Harper's Bazaar cover shoot

STYLING & AESTHETIC:
- The product must be the HERO - clearly visible and accurately reproduced
- Editorial poses: dynamic, fashion-forward, NOT catalog stiff poses
- Cinematic, dramatic lighting with intentional shadows and highlights
- Rich, editorial color grading

BACKGROUNDS (CRITICAL - NOT PLAIN STUDIO):
- Luxurious, aspirational settings that enhance the product story
- Options: Grand marble architecture, moody vintage interior, dramatic outdoor location
- Subtle environmental storytelling - hint of luxury lifestyle
- Every frame should be COVER-WORTHY

2x2 grid layout:
[top-left]: Full body FRONT view - powerful editorial pose, dramatic setting
[top-right]: Full body SIDE/3/4 view - movement, fashion-forward angle
[bottom-left]: Full body BACK view - showing rear of product, architectural background
[bottom-right]: Upper body DETAIL - product hero shot, cinematic close-up

CRITICAL REQUIREMENTS:
1. Product EXACTLY matches reference - same color, material, pattern, hardware
2. IDENTICAL model in ALL 4 shots - same face, hair, makeup, body
3. Product CLEARLY VISIBLE in every shot
4. HIGH-FASHION editorial quality - NOT stock photography
5. Dramatic, editorial poses - NOT stiff or catalog-style
6. Consistent color grading across all 4 images

ABSOLUTELY FORBIDDEN:
- NO magazine logos, NO watermarks, NO text overlays, NO "VOGUE" or any brand names
- NO plain white/gray studio backgrounds
- NO stiff, mannequin-like poses
- NO generic stock photo aesthetics"""

PROMPT_MODEL_EDITORIAL_DUAL = """You are a legendary fashion photographer creating an ICONIC editorial spread.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view recreation

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

THE MODEL:
- CAUCASIAN/EUROPEAN {gender_model} model with sharp bone structure, piercing eyes
- Age: 22-28, IDENTICAL model in ALL 4 shots
- Expression: Confident, mysterious, almost challenging the camera
- This is the same model from a major Vogue or Harper's Bazaar cover shoot

STYLING & AESTHETIC:
- The product must be the HERO - clearly visible and accurately reproduced
- Editorial poses: dynamic, fashion-forward, NOT catalog stiff poses
- Cinematic, dramatic lighting with intentional shadows and highlights
- Rich, editorial color grading

BACKGROUNDS (CRITICAL - NOT PLAIN STUDIO):
- Luxurious, aspirational settings that enhance the product story
- Options: Grand marble architecture, moody vintage interior, dramatic outdoor location
- Subtle environmental storytelling - hint of luxury lifestyle
- Every frame should be COVER-WORTHY

2x2 grid layout:
[top-left]: Full body FRONT view - powerful editorial pose, dramatic setting
[top-right]: Full body SIDE/3/4 view - movement, fashion-forward angle
[bottom-left]: Full body BACK view - must accurately reflect the second reference image
[bottom-right]: Upper body DETAIL - product hero shot, cinematic close-up

CRITICAL REQUIREMENTS:
1. Product EXACTLY matches reference - same color, material, pattern, hardware
2. Back view must accurately reflect the second reference image
3. IDENTICAL model in ALL 4 shots - same face, hair, makeup, body
4. Product CLEARLY VISIBLE in every shot
5. HIGH-FASHION editorial quality - NOT stock photography
6. Dramatic, editorial poses - NOT stiff or catalog-style
7. Consistent color grading across all 4 images

ABSOLUTELY FORBIDDEN:
- NO magazine logos, NO watermarks, NO text overlays, NO "VOGUE" or any brand names
- NO plain white/gray studio backgrounds
- NO stiff, mannequin-like poses
- NO generic stock photo aesthetics"""


# ============================================================================
# 카테고리 그룹 설정 (9개 그룹)
# ============================================================================

CATEGORY1_TO_GROUP = {
    "상의": "의류", "하의": "의류", "아우터": "의류", "의류": "의류",
    "가방": "가방", "신발": "신발", "시계": "시계",
}

CATEGORY2_TO_GROUP = {
    "반지": "주얼리", "팔찌": "주얼리", "목걸이": "주얼리", "귀걸이": "주얼리",
    "아이웨어": "아이웨어", "선글라스": "아이웨어",
    "모자": "모자", "머플러/스카프": "스카프", "스카프": "스카프",
    "벨트": "벨트", "지갑": "소품", "키링": "소품", "기타 잡화": "소품",
}

CATEGORY_CONFIG = {
    "의류": {
        "name_en": "clothing",
        "pose_front": "full body FRONT view - model facing camera, showing outfit clearly",
        "pose_side": "full body SIDE view - profile or 3/4 angle showing silhouette",
        "pose_back": "full body BACK view - showing rear of the outfit",
        "pose_detail": "upper body DETAIL shot - closer view highlighting fabric and design",
        "size_note": "", "special_instruction": "",
    },
    "가방": {
        "name_en": "handbag/bag",
        "pose_front": "Model wearing bag on SHOULDER, FRONT view facing camera",
        "pose_side": "Model wearing bag, SIDE view showing bag profile and depth",
        "pose_back": "Model from BACK, bag worn CROSSBODY so bag's FRONT is visible",
        "pose_detail": "Close-up of model's hand HOLDING the bag handle - DETAIL shot",
        "size_note": "Bag should look proportional and realistic to model's body. Do NOT exaggerate bag size.",
        "special_instruction": "",
    },
    "신발": {
        "name_en": "shoes/footwear",
        "pose_front": "Full body FRONT view - model standing, shoes clearly visible on feet",
        "pose_side": "Full body SIDE view - showing shoe profile and heel",
        "pose_back": "Close-up of model's feet from BACK angle - showing heel design",
        "pose_detail": "Close-up DETAIL shot of model's feet wearing the shoes",
        "size_note": "", "special_instruction": "",
    },
    "시계": {
        "name_en": "wristwatch",
        "pose_front": "Model's wrist with watch, FRONT view - watch face clearly visible",
        "pose_side": "Model's wrist at natural angle - watch face and profile visible",
        "pose_back": "Model wearing watch, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of watch ON MODEL'S WRIST",
        "size_note": "",
        "special_instruction": "CRITICAL: Watch must ALWAYS be worn normally on wrist with face visible.",
    },
    "주얼리": {
        "name_en": "jewelry",
        "pose_front": "Model wearing jewelry, FRONT view - jewelry clearly visible",
        "pose_side": "Model wearing jewelry, SIDE view showing profile",
        "pose_back": "Model wearing jewelry, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of jewelry ON THE MODEL",
        "size_note": "",
        "special_instruction": "CRITICAL: Jewelry must always be visible from front.",
    },
    "아이웨어": {
        "name_en": "eyewear/sunglasses",
        "pose_front": "Model wearing eyewear, FRONT view - face and glasses clearly visible",
        "pose_side": "Model wearing eyewear, SIDE PROFILE view",
        "pose_back": "Model wearing eyewear, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of eyewear on model's face",
        "size_note": "",
        "special_instruction": "All angles must show the front of the glasses.",
    },
    "모자": {
        "name_en": "hat/cap",
        "pose_front": "Model wearing hat, FRONT view",
        "pose_side": "Model wearing hat, SIDE view showing hat profile",
        "pose_back": "Model wearing hat, BACK view",
        "pose_detail": "Close-up DETAIL of hat ON THE MODEL'S HEAD",
        "size_note": "", "special_instruction": "",
    },
    "스카프": {
        "name_en": "scarf/muffler",
        "pose_front": "Model wearing scarf around neck, FRONT view",
        "pose_side": "Model wearing scarf, SIDE view",
        "pose_back": "Model wearing scarf, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of scarf ON THE MODEL'S NECK",
        "size_note": "", "special_instruction": "",
    },
    "벨트": {
        "name_en": "belt",
        "pose_front": "Model WEARING the belt around waist, FRONT view - buckle visible",
        "pose_side": "Model wearing belt, SIDE view",
        "pose_back": "Model wearing belt, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of belt buckle ON THE MODEL'S WAIST",
        "size_note": "",
        "special_instruction": "CRITICAL: Model must WEAR the belt around waist in ALL shots.",
    },
    "소품": {
        "name_en": "accessory item",
        "pose_front": "Model HOLDING the item elegantly, FRONT view",
        "pose_side": "Model holding item, SIDE view",
        "pose_back": "Model holding item, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of item ON/WITH THE MODEL",
        "size_note": "",
        "special_instruction": "For wallets and small items, model should hold them elegantly.",
    },
}


def get_category_group(category1: str, category2: str) -> str:
    category1 = str(category1).strip("[]") if category1 else ""
    category2 = str(category2).strip("[]") if category2 else ""
    if category1 in CATEGORY1_TO_GROUP:
        return CATEGORY1_TO_GROUP[category1]
    if category2 in CATEGORY2_TO_GROUP:
        return CATEGORY2_TO_GROUP[category2]
    return "소품"


def build_model_prompt(category_group: str, gender_model: str, has_back: bool) -> str:
    config = CATEGORY_CONFIG.get(category_group, CATEGORY_CONFIG["소품"])
    
    if has_back:
        template = """Create professional luxury fashion e-commerce model photos with this exact {product_type}.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view on model

{size_note}

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

Requirements:
- Use the SAME single {gender_model} model for ALL 4 shots
- CRITICAL: Same face, same hair, same outfit in ALL 4 images
- Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout:
  [top-left]: {pose_front}
  [top-right]: {pose_side}
  [bottom-left]: {pose_back}
  [bottom-right]: {pose_detail}
- High-end luxury brand website style

{special_instruction}

CRITICAL:
- Product must match EXACTLY - same color, pattern, material, design, hardware
- The SAME model must appear in ALL 4 shots with consistent appearance"""
    else:
        template = """Create professional luxury fashion e-commerce model photos with this exact {product_type}.

{size_note}

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

Requirements:
- Use the SAME single {gender_model} model for ALL 4 shots
- CRITICAL: Same face, same hair, same outfit in ALL 4 images
- Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout:
  [top-left]: {pose_front}
  [top-right]: {pose_side}
  [bottom-left]: {pose_back}
  [bottom-right]: {pose_detail}
- High-end luxury brand website style

{special_instruction}

CRITICAL:
- Product must match EXACTLY - same color, pattern, material, design, hardware
- The SAME model must appear in ALL 4 shots with consistent appearance"""
    
    return template.format(
        product_type=config["name_en"], gender_model=gender_model,
        pose_front=config["pose_front"], pose_side=config["pose_side"],
        pose_back=config["pose_back"], pose_detail=config["pose_detail"],
        size_note=config["size_note"], special_instruction=config["special_instruction"],
    )


# ============================================================================
# 유틸리티 함수
# ============================================================================

def load_image_as_base64(image_path: Path, max_size: int = 1568) -> Optional[str]:
    try:
        img = Image.open(image_path)
        if img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P": img = img.convert("RGBA")
            if img.mode in ("RGBA", "LA"): bg.paste(img, mask=img.split()[-1])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=90)
        return base64.standard_b64encode(buffer.getvalue()).decode("utf-8")
    except Exception as e:
        print(f"[오류] 이미지 로드 실패: {image_path} - {e}")
        return None


def split_grid_image(image_bytes: bytes, output_dir: Path, prefix: str, upscale_factor: int = 4) -> List[Path]:
    saved_files = []
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        half_w, half_h = width // 2, height // 2
        padding = 10
        positions = [
            (padding, padding, half_w - padding, half_h - padding),
            (half_w + padding, padding, width - padding, half_h - padding),
            (padding, half_h + padding, half_w - padding, height - padding),
            (half_w + padding, half_h + padding, width - padding, height - padding),
        ]
        suffixes = ["", "_1", "_2", "_3"]
        for i, (left, top, right, bottom) in enumerate(positions):
            cropped = img.crop((left, top, right, bottom))
            if upscale_factor > 1:
                new_size = (cropped.width * upscale_factor, cropped.height * upscale_factor)
                cropped = cropped.resize(new_size, Image.Resampling.LANCZOS)
            output_path = output_dir / f"{prefix}{suffixes[i]}.jpg"
            cropped.save(output_path, "JPEG", quality=95)
            saved_files.append(output_path)
        return saved_files
    except Exception as e:
        print(f"[오류] 이미지 분할 실패: {e}")
        return []


# ============================================================================
# 이미지 생성 클래스
# ============================================================================

class ImageGenerator:
    def __init__(self, gemini_client: GeminiClient, upscale_factor: int = 4):
        self.client = gemini_client
        self.upscale_factor = upscale_factor
    
    def detect_category(self, image_path: Path, callback=None) -> Tuple[str, str, str]:
        if callback: callback("  🔍 카테고리/성별 자동 감지 중...")
        image_b64 = load_image_as_base64(image_path)
        if not image_b64: return "상의", "", "여성"
        
        prompt = """이 상품 이미지를 분석해주세요.

다음 형식으로만 답하세요:
1차카테고리: [가방/상의/하의/아우터/신발/시계/패션잡화]
2차카테고리: [해당하는 2차 카테고리]
성별: [여성/남성/공용]"""
        
        result = self.client.analyze_image(prompt, image_b64, callback)
        if not result: return "상의", "", "여성"
        
        category1, category2, gender = "상의", "", "여성"
        for line in result.split("\n"):
            line = line.strip()
            if "1차카테고리:" in line or "1차 카테고리:" in line:
                category1 = line.split(":")[-1].strip().strip("[]")
            elif "2차카테고리:" in line or "2차 카테고리:" in line:
                category2 = line.split(":")[-1].strip().strip("[]")
            elif "성별:" in line:
                gen_value = line.split(":")[-1].strip().strip("[]")
                if "공용" in gen_value: gender = "공용"
                elif "남성" in gen_value: gender = "남성"
                else: gender = "여성"
        
        if callback: callback(f"  ✅ 감지: {category1}/{category2}, {gender}")
        return category1, category2, gender
    
    def generate(self, input_image_path: Path, output_dir: Path, image_type: str,
                 gender: str = "여성", category1: str = None, category2: str = None,
                 back_image_path: Path = None, callback=None) -> Tuple[bool, List[Path]]:
        
        type_names = {
            "basic_product": "기본 정물", "basic_model": "기본 모델",
            "editorial_product": "화보 정물", "editorial_model": "화보 모델",
        }
        prefixes = {
            "basic_product": "0", "basic_model": "1",
            "editorial_product": "2", "editorial_model": "3",
        }
        type_name = type_names.get(image_type, image_type)
        prefix = prefixes.get(image_type, "0")
        
        if callback: callback(f"  🎨 {type_name} 이미지 생성 중...")
        
        image_b64 = load_image_as_base64(input_image_path)
        if not image_b64:
            if callback: callback(f"  ❌ 이미지 로드 실패")
            return False, []
        
        input_images = [{"mime_type": "image/jpeg", "data": image_b64}]
        has_back = back_image_path and back_image_path.exists()
        
        if has_back:
            back_b64 = load_image_as_base64(back_image_path)
            if back_b64: input_images.append({"mime_type": "image/jpeg", "data": back_b64})
        
        # 프롬프트 선택
        if image_type == "basic_product":
            prompt = PROMPT_PRODUCT_DUAL if has_back else PROMPT_PRODUCT_SINGLE
        elif image_type == "editorial_product":
            prompt = PROMPT_PRODUCT_EDITORIAL_DUAL if has_back else PROMPT_PRODUCT_EDITORIAL_SINGLE
        elif image_type == "editorial_model":
            gender_model = "MALE" if "남성" in str(gender) else "FEMALE"
            prompt = PROMPT_MODEL_EDITORIAL_DUAL if has_back else PROMPT_MODEL_EDITORIAL_SINGLE
            prompt = prompt.format(gender_model=gender_model)
        else:  # basic_model
            gender_model = "MALE" if "남성" in str(gender) else "FEMALE"
            category_group = get_category_group(category1 or "", category2 or "")
            prompt = build_model_prompt(category_group, gender_model, has_back)
            if callback: callback(f"  📋 카테고리 그룹: {category_group}")
        
        result_bytes = self.client.generate_image(prompt=prompt, input_images=input_images, callback=callback)
        
        if not result_bytes:
            if callback: callback(f"  ❌ {type_name} 생성 실패")
            return False, []
        
        output_dir.mkdir(parents=True, exist_ok=True)
        saved_files = split_grid_image(result_bytes, output_dir, prefix, self.upscale_factor)
        
        if saved_files:
            if callback: callback(f"  ✅ {type_name} 완료 ({len(saved_files)}장)")
            return True, saved_files
        return False, []
    
    def generate_all(self, input_image_path: Path, output_dir: Path, gender: str = "여성",
                     category1: str = None, category2: str = None,
                     basic_product: bool = True, basic_model: bool = True,
                     editorial_product: bool = False, editorial_model: bool = False,
                     callback=None) -> dict:
        results = {}
        
        back_image = None
        for ext in [".jpg", ".jpeg", ".png"]:
            candidate = input_image_path.parent / f"6{ext}"
            if candidate.exists():
                back_image = candidate
                break
        
        if basic_product:
            success, files = self.generate(input_image_path, output_dir, "basic_product",
                                          gender, category1, category2, back_image, callback)
            results["basic_product"] = files if success else []
        
        if basic_model:
            success, files = self.generate(input_image_path, output_dir, "basic_model",
                                          gender, category1, category2, back_image, callback)
            results["basic_model"] = files if success else []
        
        if editorial_product:
            success, files = self.generate(input_image_path, output_dir, "editorial_product",
                                          gender, category1, category2, back_image, callback)
            results["editorial_product"] = files if success else []
        
        if editorial_model:
            success, files = self.generate(input_image_path, output_dir, "editorial_model",
                                          gender, category1, category2, back_image, callback)
            results["editorial_model"] = files if success else []
        
        return results
    
    def generate_images(self, image_data: bytes, mode: str = "product", gender: str = None,
                        category: str = None, callback=None) -> List[bytes]:
        """단일 이미지 테스트용"""
        try:
            img = Image.open(io.BytesIO(image_data))
            if img.mode in ("RGBA", "LA", "P"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P": img = img.convert("RGBA")
                if img.mode in ("RGBA", "LA"): bg.paste(img, mask=img.split()[-1])
                img = bg
            elif img.mode != "RGB":
                img = img.convert("RGB")
            img.thumbnail((1568, 1568), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=90)
            image_b64 = base64.standard_b64encode(buffer.getvalue()).decode("utf-8")
        except Exception as e:
            if callback: callback(f"이미지 처리 오류: {e}")
            return []
        
        if mode == "product":
            prompt = PROMPT_PRODUCT_SINGLE
        else:
            gender_str = gender if gender else "여성"
            gender_model = "MALE" if "남성" in str(gender_str) else "FEMALE"
            category_group = get_category_group(category or "", "")
            prompt = build_model_prompt(category_group, gender_model, False)
        
        if callback: callback("AI 이미지 생성 중...")
        
        result_bytes = self.client.generate_image(
            prompt=prompt, input_images=[{"mime_type": "image/jpeg", "data": image_b64}], callback=callback
        )
        
        if not result_bytes:
            if callback: callback("이미지 생성 실패")
            return []
        
        try:
            img = Image.open(io.BytesIO(result_bytes))
            width, height = img.size
            half_w, half_h = width // 2, height // 2
            padding = 10
            positions = [
                (padding, padding, half_w - padding, half_h - padding),
                (half_w + padding, padding, width - padding, half_h - padding),
                (padding, half_h + padding, half_w - padding, height - padding),
                (half_w + padding, half_h + padding, width - padding, height - padding),
            ]
            results = []
            for left, top, right, bottom in positions:
                cropped = img.crop((left, top, right, bottom))
                if self.upscale_factor > 1:
                    new_size = (cropped.width * self.upscale_factor, cropped.height * self.upscale_factor)
                    cropped = cropped.resize(new_size, Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                cropped.save(buf, format="JPEG", quality=95)
                results.append(buf.getvalue())
            if callback: callback("이미지 생성 완료!")
            return results
        except Exception as e:
            if callback: callback(f"이미지 분할 오류: {e}")
            return []


    def regenerate_single(
        self,
        input_image_path: Path,
        output_dir: Path,
        image_type: str,  # basic_product, basic_model, editorial_product, editorial_model
        image_index: int,  # 0, 1, 2, 3
        gender: str,
        category1: str,
        category2: str,
        callback=None
    ) -> Optional[Path]:
        """개별 이미지 재생성"""
        
        type_prefix_map = {
            "basic_product": "0",
            "basic_model": "1",
            "editorial_product": "2",
            "editorial_model": "3"
        }
        
        if image_type not in type_prefix_map:
            if callback:
                callback(f"❌ 알 수 없는 이미지 타입: {image_type}")
            return None
        
        prefix = type_prefix_map[image_type]
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 프롬프트 선택
        category_group = get_category_group(category1, category2)
        
        if image_type == "basic_product":
            prompt = PROMPT_PRODUCT_SINGLE.format(category=category_group)
        elif image_type == "basic_model":
            prompt = PROMPT_MODEL_SINGLE.format(gender=gender, category=category_group)
        elif image_type == "editorial_product":
            prompt = PROMPT_PRODUCT_EDITORIAL_SINGLE.format(category=category_group)
        elif image_type == "editorial_model":
            prompt = PROMPT_MODEL_EDITORIAL_SINGLE.format(gender=gender, category=category_group)
        
        if callback:
            callback(f"  🔄 {image_type} #{image_index} 재생성 중...")
        
        # 이미지 생성
        result_bytes = self.gemini_client.generate_image(input_image_path, prompt, callback)
        
        if not result_bytes:
            if callback:
                callback(f"  ❌ 재생성 실패")
            return None
        
        # 2x2 분할 후 해당 인덱스만 저장
        try:
            from PIL import Image
            import io
            
            img = Image.open(io.BytesIO(result_bytes))
            
            # 업스케일
            upscaled = img.resize(
                (img.width * self.upscale_factor, img.height * self.upscale_factor),
                Image.Resampling.LANCZOS
            )
            
            # 2x2 분할
            w, h = upscaled.size
            half_w, half_h = w // 2, h // 2
            
            crops = [
                upscaled.crop((0, 0, half_w, half_h)),
                upscaled.crop((half_w, 0, w, half_h)),
                upscaled.crop((0, half_h, half_w, h)),
                upscaled.crop((half_w, half_h, w, h))
            ]
            
            if image_index < 0 or image_index >= len(crops):
                image_index = 0
            
            cropped = crops[image_index]
            
            # 파일명 결정
            if image_index == 0:
                filename = f"{prefix}.jpg"
            else:
                filename = f"{prefix}_{image_index}.jpg"
            
            output_path = output_dir / filename
            cropped.save(output_path, "JPEG", quality=95)
            
            if callback:
                callback(f"  ✅ 저장됨: {filename}")
            
            return output_path
            
        except Exception as e:
            if callback:
                callback(f"  ❌ 이미지 처리 오류: {e}")
            return None
