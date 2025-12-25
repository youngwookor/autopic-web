# -*- coding: utf-8 -*-
"""
Autopic Backend - FastAPI
=========================
AI 이미지 생성 + 결제 API 서버

기존 processor.py, editorial_image_generator_v3.py와 100% 동일한 프롬프트/성별 처리
+ 확장 카테고리 지원 (키즈, 펫용품, 뷰티, 스포츠)
+ 한글/영문 카테고리 모두 지원
+ TARGET 자동 감지 (사람/아동/반려동물)
"""

import os
import io
import base64
import uuid
import httpx
import secrets
import hashlib
import asyncio
from datetime import datetime
from typing import Optional, List, Dict
from collections import defaultdict
import time

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from dotenv import load_dotenv
from supabase import create_client, Client

# 환경변수 로드
load_dotenv()

# Gemini 클라이언트
from google import genai
from google.genai import types

app = FastAPI(
    title="Autopic API", description="AI 상품 이미지 생성 + 결제 API", version="1.2.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 설정
# ============================================================================

GEMINI_API_KEYS = os.getenv("GEMINI_API_KEYS", "").split(",")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
TOSS_CLIENT_KEY = os.getenv("TOSS_CLIENT_KEY", "")
TOSS_SECRET_KEY = os.getenv("TOSS_SECRET_KEY", "")

# Supabase 클라이언트 (Service Role Key 사용)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ============================================================================
# Rate Limiter (속도 제한)
# ============================================================================


class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 60
        self.last_cleanup = time.time()

    def _cleanup(self):
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return
        for key in list(self.requests.keys()):
            self.requests[key] = [
                (ts, cnt) for ts, cnt in self.requests[key] if now - ts < 60
            ]
            if not self.requests[key]:
                del self.requests[key]
        self.last_cleanup = now

    def is_allowed(self, key: str, limit: int, window: int = 60) -> bool:
        self._cleanup()
        now = time.time()
        window_start = now - window
        recent_requests = [
            (ts, cnt) for ts, cnt in self.requests[key] if ts > window_start
        ]
        total_requests = sum(cnt for _, cnt in recent_requests)
        if total_requests >= limit:
            return False
        self.requests[key].append((now, 1))
        return True

    def get_remaining(self, key: str, limit: int, window: int = 60) -> int:
        now = time.time()
        window_start = now - window
        recent_requests = [
            (ts, cnt) for ts, cnt in self.requests[key] if ts > window_start
        ]
        total_requests = sum(cnt for _, cnt in recent_requests)
        return max(0, limit - total_requests)


rate_limiter = RateLimiter()

RATE_LIMITS = {
    "generate": {"limit": 10, "window": 60},
    "api_key": {"limit": 20, "window": 60},
}

# 모델 설정
MODEL_CONFIG = {
    "standard": {"model": "gemini-2.5-flash-image-preview", "credits": 1},
    "premium": {"model": "gemini-3-pro-image-preview", "credits": 3},
    "flash": {"model": "gemini-2.5-flash-image-preview", "credits": 1},
    "pro": {"model": "gemini-3-pro-image-preview", "credits": 3},
}

PRICING_PLANS = {
    "light": {"credits": 50, "price": 19000, "name": "Light"},
    "standard": {"credits": 200, "price": 49000, "name": "Standard"},
    "plus": {"credits": 500, "price": 119000, "name": "Plus"},
    "mega": {"credits": 1500, "price": 349000, "name": "Mega"},
    "ultimate": {"credits": 5000, "price": 999000, "name": "Ultimate"},
}

current_key_index = 0


def get_gemini_client():
    global current_key_index
    if not GEMINI_API_KEYS or not GEMINI_API_KEYS[0]:
        raise HTTPException(status_code=500, detail="Gemini API 키가 설정되지 않았습니다")
    key = GEMINI_API_KEYS[current_key_index % len(GEMINI_API_KEYS)]
    return genai.Client(api_key=key)


def rotate_key():
    global current_key_index
    current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)


# ============================================================================
# 카테고리 그룹 설정 (13개 그룹) - 확장 버전
# ============================================================================

# 1차 카테고리 → 그룹 매핑 (한글)
CATEGORY1_TO_GROUP = {
    # 기존 패션
    "상의": "의류",
    "하의": "의류",
    "아우터": "의류",
    "의류": "의류",
    "가방": "가방",
    "신발": "신발",
    "시계": "시계",
    "액세서리": "소품",
    "패션잡화": "소품",
    # 확장 카테고리
    "키즈": "키즈",
    "아동": "키즈",
    "유아": "키즈",
    "펫": "펫용품",
    "반려동물": "펫용품",
    "뷰티": "뷰티",
    "화장품": "뷰티",
    "스킨케어": "뷰티",
    "스포츠": "스포츠",
    "운동": "스포츠",
    "레저": "스포츠",
    "애슬레저": "스포츠",
}

# 2차 카테고리 → 그룹 매핑 (한글)
CATEGORY2_TO_GROUP = {
    # 주얼리
    "반지": "주얼리",
    "팔찌": "주얼리",
    "목걸이": "주얼리",
    "귀걸이": "주얼리",
    "주얼리": "주얼리",
    # 아이웨어
    "아이웨어": "아이웨어",
    "선글라스": "아이웨어",
    "안경": "아이웨어",
    # 모자
    "모자": "모자",
    "캡": "모자",
    "비니": "모자",
    # 스카프
    "머플러/스카프": "스카프",
    "스카프": "스카프",
    "머플러": "스카프",
    # 벨트
    "벨트": "벨트",
    # 소품
    "지갑": "소품",
    "키링": "소품",
    "기타 잡화": "소품",
    "파우치": "소품",
    # 키즈
    "아동복": "키즈",
    "유아복": "키즈",
    "아동신발": "키즈",
    "아동가방": "키즈",
    # 펫용품
    "펫의류": "펫용품",
    "펫용품": "펫용품",
    "목줄/하네스": "펫용품",
    "펫캐리어": "펫용품",
    # 뷰티
    "메이크업": "뷰티",
    "스킨케어": "뷰티",
    "향수": "뷰티",
    "헤어케어": "뷰티",
    # 스포츠
    "운동복": "스포츠",
    "요가웨어": "스포츠",
    "스포츠웨어": "스포츠",
    "레깅스": "스포츠",
    "운동화": "스포츠",
}

# 영문 카테고리 → 그룹 매핑 (API 호출용)
CATEGORY_EN_TO_GROUP = {
    # 기존
    "clothing": "의류",
    "bag": "가방",
    "shoes": "신발",
    "watch": "시계",
    "jewelry": "주얼리",
    "eyewear": "아이웨어",
    "hat": "모자",
    "scarf": "스카프",
    "belt": "벨트",
    "accessory": "소품",
    # 확장
    "kids": "키즈",
    "pet": "펫용품",
    "beauty": "뷰티",
    "sports": "스포츠",
}

# TARGET → 카테고리 그룹 매핑
TARGET_TO_CATEGORY_GROUP = {
    "반려동물": "펫용품",
    "아동": "키즈",
    "사람": None,  # None이면 기존 카테고리 유지
}


def get_category_group(category1: str, category2: str = "", target: str = "사람") -> str:
    """카테고리 그룹 결정 (한글/영문 모두 지원 + TARGET 기반 오버라이드)"""
    
    # 1. TARGET 기반 오버라이드 (최우선)
    if target in TARGET_TO_CATEGORY_GROUP and TARGET_TO_CATEGORY_GROUP[target]:
        return TARGET_TO_CATEGORY_GROUP[target]
    
    category1 = str(category1).strip("[]") if category1 else ""
    category2 = str(category2).strip("[]") if category2 else ""
    
    # 2. 영문 카테고리 체크
    if category1.lower() in CATEGORY_EN_TO_GROUP:
        return CATEGORY_EN_TO_GROUP[category1.lower()]
    
    # 3. 한글 1차 카테고리 체크
    if category1 in CATEGORY1_TO_GROUP:
        return CATEGORY1_TO_GROUP[category1]
    
    # 4. 한글 2차 카테고리 체크
    if category2 in CATEGORY2_TO_GROUP:
        return CATEGORY2_TO_GROUP[category2]
    
    # 5. 영문 2차 카테고리 체크
    if category2.lower() in CATEGORY_EN_TO_GROUP:
        return CATEGORY_EN_TO_GROUP[category2.lower()]
    
    # 6. 기본값
    return "의류"


def convert_gender_to_model(gender: str) -> str:
    """성별을 모델 타입으로 변환 (기존 processor.py와 100% 동일)"""
    gender_str = str(gender) if gender else ""
    
    if gender_str == "검토필요":
        return "MALE"
    elif gender_str == "male":
        return "MALE"
    elif "남성" in gender_str and "여성" not in gender_str:
        return "MALE"
    else:
        return "FEMALE"


# ============================================================================
# 카테고리별 모델 포즈 설정 (13개 그룹)
# ============================================================================

CATEGORY_MODEL_CONFIG = {
    # ==================== 기존 패션 카테고리 ====================
    "의류": {
        "name_en": "clothing",
        "pose_front": "full body FRONT view - model facing camera, showing outfit clearly",
        "pose_side": "full body SIDE view - profile or 3/4 angle showing silhouette",
        "pose_back": "full body BACK view - showing rear of the outfit",
        "pose_detail": "upper body DETAIL shot - closer view highlighting fabric and design",
        "size_note": "",
        "special_instruction": "",
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
        "pose_back": "Close-up of model's feet from BACK angle - showing heel design (focus on feet and shoes only)",
        "pose_detail": "Close-up DETAIL shot of model's feet wearing the shoes - showing texture and craftsmanship",
        "size_note": "",
        "special_instruction": "",
    },
    "시계": {
        "name_en": "wristwatch",
        "pose_front": "Model's wrist with watch, FRONT view - watch face clearly visible facing camera",
        "pose_side": "Model's wrist at natural angle (arm relaxed) - watch face and profile visible",
        "pose_back": "Model wearing watch, 3/4 ANGLE view - different pose showing watch on wrist from another elegant angle",
        "pose_detail": "Close-up DETAIL of watch ON MODEL'S WRIST - showing dial and craftsmanship",
        "size_note": "",
        "special_instruction": "CRITICAL: Watch must ALWAYS be worn normally on wrist with face visible. All 4 shots must show the watch face and model's wrist.",
    },
    "주얼리": {
        "name_en": "jewelry",
        "pose_front": "Model wearing jewelry, FRONT view - jewelry clearly visible",
        "pose_side": "Model wearing jewelry, SIDE view showing profile",
        "pose_back": "Model wearing jewelry, 3/4 ANGLE view - different elegant pose still showing the jewelry from front",
        "pose_detail": "Close-up DETAIL of jewelry ON THE MODEL - showing craftsmanship while model wears it",
        "size_note": "",
        "special_instruction": "CRITICAL: Jewelry must always be visible from front. For necklaces, show chest/collarbone area. For rings/bracelets, show palm side.",
    },
    "아이웨어": {
        "name_en": "eyewear/sunglasses",
        "pose_front": "Model wearing eyewear, FRONT view - face and glasses clearly visible",
        "pose_side": "Model wearing eyewear, SIDE PROFILE view showing temple arm and frame",
        "pose_back": "Model wearing eyewear, 3/4 ANGLE view - showing glasses from a different front angle",
        "pose_detail": "Close-up DETAIL of eyewear on model's face - lens and frame details",
        "size_note": "",
        "special_instruction": "All angles must show the front of the glasses, not the back of head.",
    },
    "모자": {
        "name_en": "hat/cap",
        "pose_front": "Model wearing hat, FRONT view - face and hat clearly visible",
        "pose_side": "Model wearing hat, SIDE view showing hat profile and brim",
        "pose_back": "Model wearing hat, BACK view showing back of hat and head",
        "pose_detail": "Close-up DETAIL of hat ON THE MODEL'S HEAD - showing design, logo, or texture",
        "size_note": "",
        "special_instruction": "",
    },
    "스카프": {
        "name_en": "scarf/muffler",
        "pose_front": "Model wearing scarf around neck, FRONT view - scarf draping visible",
        "pose_side": "Model wearing scarf, SIDE view showing how it's wrapped",
        "pose_back": "Model wearing scarf, 3/4 ANGLE view - different elegant pose showing scarf styling from another front angle",
        "pose_detail": "Close-up DETAIL of scarf ON THE MODEL'S NECK - showing pattern, texture, and fabric",
        "size_note": "",
        "special_instruction": "",
    },
    "벨트": {
        "name_en": "belt",
        "pose_front": "Model WEARING the belt around waist, FRONT view - buckle clearly visible",
        "pose_side": "Model wearing belt, SIDE view showing belt profile on waist",
        "pose_back": "Model wearing belt, 3/4 ANGLE view - different pose showing belt and buckle from another front angle",
        "pose_detail": "Close-up DETAIL of belt buckle ON THE MODEL'S WAIST - showing hardware and leather craftsmanship",
        "size_note": "",
        "special_instruction": "CRITICAL: Model must WEAR the belt around waist in ALL shots. Do NOT show model holding a separate belt.",
    },
    "소품": {
        "name_en": "accessory item",
        "pose_front": "Model HOLDING the item elegantly, FRONT view",
        "pose_side": "Model holding item, SIDE view showing item profile",
        "pose_back": "Model holding item, 3/4 ANGLE view - showing item from different angle",
        "pose_detail": "Close-up DETAIL of item ON/WITH THE MODEL - showing craftsmanship",
        "size_note": "",
        "special_instruction": "For wallets and small items, model should hold them elegantly in hands.",
    },
    
    # ==================== 확장 카테고리 ====================
    "키즈": {
        "name_en": "kids clothing/item",
        "pose_front": "CHILD model (age 8-12) wearing item, FRONT view - bright, cheerful expression",
        "pose_side": "Child model, SIDE view - playful, natural pose",
        "pose_back": "Child model, BACK view - showing rear of outfit",
        "pose_detail": "Upper body DETAIL shot - closer view highlighting design and fabric",
        "size_note": "Use age-appropriate child model (8-12 years old). Keep poses natural and fun.",
        "special_instruction": "CRITICAL: Use CHILD model only. Bright, cheerful atmosphere. Colorful, kid-friendly styling.",
    },
    "펫용품": {
        "name_en": "pet product/accessory",
        "pose_front": "Cute pet (dog or cat) wearing/using the product, FRONT view - adorable expression",
        "pose_side": "Pet wearing product, SIDE view - showing product clearly on pet",
        "pose_back": "Pet wearing product, 3/4 ANGLE view - pet looking adorable",
        "pose_detail": "Close-up DETAIL of product ON THE PET - showing quality and design",
        "size_note": "Use a cute, well-groomed pet (dog or cat). Pet should be the main focus.",
        "special_instruction": "CRITICAL: The product must be worn BY THE PET, not by a human. Show a cute dog or cat wearing/using the product. Warm, loving atmosphere.",
    },
    "뷰티": {
        "name_en": "beauty/cosmetic product",
        "pose_front": "Model with flawless skin HOLDING product elegantly near face, FRONT view",
        "pose_side": "Model applying or presenting product, SIDE view - showing skin texture",
        "pose_back": "Close-up of model's hand holding product, elegant angle",
        "pose_detail": "Product DETAIL with model's skin visible - showing texture and packaging",
        "size_note": "Focus on clean, glowing skin. Product should complement model's beauty.",
        "special_instruction": "CRITICAL: Model must have flawless, dewy skin. Soft, luxurious lighting. Clean beauty aesthetic.",
    },
    "스포츠": {
        "name_en": "sportswear/athletic wear",
        "pose_front": "Athletic model in DYNAMIC pose wearing item, FRONT view - energetic, powerful",
        "pose_side": "Model in motion or stretch pose, SIDE view - showing fit and flexibility",
        "pose_back": "Model from BACK in athletic stance - showing back design",
        "pose_detail": "Upper body or focus area DETAIL - highlighting technical fabric and fit",
        "size_note": "Model should look fit and athletic. Dynamic, energetic poses.",
        "special_instruction": "CRITICAL: Use fit, athletic model. Dynamic poses suggesting movement. Gym or outdoor sports setting optional.",
    },
}


# ============================================================================
# 프롬프트 - 기존 방식과 100% 동일
# ============================================================================

PROMPT_PRODUCT = """Edit this product photo for luxury e-commerce website.
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

PROMPT_PRODUCT_EDITORIAL_LUXURY = """Create luxury editorial product photos with dramatic lighting.
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

PROMPT_PRODUCT_EDITORIAL_KIDS = """Create bright, cheerful product photos for kids' items.
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

STYLE REQUIREMENTS:
- Bright, cheerful, colorful atmosphere
- Soft, warm natural lighting
- Pastel or playful colored backgrounds (light pink, mint, yellow, sky blue)
- Fun props like balloons, toys, stars, or cute decorations
- Happy, joyful mood perfect for children's products
- Clean, inviting aesthetic

2x2 grid layout:
[top-left]: Front view with soft lighting and colorful background
[top-right]: Side view with playful props nearby
[bottom-left]: Back view with cheerful setting
[bottom-right]: Detail close-up highlighting cute design elements

CRITICAL: Keep ALL original product details EXACTLY as shown. Make it appealing to parents shopping for kids."""

PROMPT_PRODUCT_EDITORIAL_PET = """Create adorable, heartwarming product photos for pet items.
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

STYLE REQUIREMENTS:
- Warm, cozy, loving atmosphere
- Soft, natural lighting (golden hour feel)
- Warm-toned backgrounds (cream, beige, soft wood tones)
- Homey setting elements (soft blankets, cushions, pet beds)
- Inviting mood that pet owners will love
- Clean, premium pet boutique aesthetic

2x2 grid layout:
[top-left]: Front view with warm, cozy background
[top-right]: Side view with soft textures nearby
[bottom-left]: Back view in homey setting
[bottom-right]: Detail close-up highlighting quality and design

CRITICAL: Keep ALL original product details EXACTLY as shown. Make it appealing to loving pet owners."""


def build_editorial_product_prompt(category: str, target: str = "사람") -> str:
    """카테고리/타겟별 화보 정물 프롬프트 생성"""
    category_group = get_category_group(category, "", target)
    
    if category_group == "키즈" or target == "아동":
        return PROMPT_PRODUCT_EDITORIAL_KIDS
    elif category_group == "펫용품" or target == "반려동물":
        return PROMPT_PRODUCT_EDITORIAL_PET
    else:
        return PROMPT_PRODUCT_EDITORIAL_LUXURY


def build_model_prompt(category: str, gender: str, target: str = "사람") -> str:
    """카테고리별 기본 모델 프롬프트 생성 (공홈 스타일)"""
    category_group = get_category_group(category, "", target)
    config = CATEGORY_MODEL_CONFIG.get(category_group, CATEGORY_MODEL_CONFIG["의류"])
    gender_model = convert_gender_to_model(gender)
    
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
        product_type=config["name_en"],
        gender_model=gender_model,
        pose_front=config["pose_front"],
        pose_side=config["pose_side"],
        pose_back=config["pose_back"],
        pose_detail=config["pose_detail"],
        size_note=config["size_note"],
        special_instruction=config["special_instruction"],
    )


def build_editorial_model_prompt(category: str, gender: str, target: str = "사람") -> str:
    """카테고리별 화보 모델 프롬프트 생성 (에디토리얼 스타일)"""
    category_group = get_category_group(category, "", target)
    config = CATEGORY_MODEL_CONFIG.get(category_group, CATEGORY_MODEL_CONFIG["의류"])
    gender_model = convert_gender_to_model(gender)
    
    # 키즈/펫용품은 화보 스타일 다르게 처리
    if category_group == "키즈":
        return f"""Create bright, cheerful editorial photos featuring a child model with this exact {config['name_en']}.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

MODEL: Adorable CHILD model (age 8-12) with bright smile
- Same child in ALL 4 shots
- Natural, playful expressions
- Age-appropriate styling

{config['size_note']}

VISUAL STYLE:
- Bright, colorful, cheerful atmosphere
- Soft natural lighting
- Fun, kid-friendly backgrounds (playground, bedroom, outdoor)
- Warm, happy mood

2x2 GRID LAYOUT:
[TOP-LEFT]: {config['pose_front']}
[TOP-RIGHT]: {config['pose_side']}
[BOTTOM-LEFT]: {config['pose_back']}
[BOTTOM-RIGHT]: {config['pose_detail']}

{config['special_instruction']}

CRITICAL: Product must match EXACTLY. Same child model in ALL shots."""
    
    elif category_group == "펫용품":
        return f"""Create adorable pet photos featuring a cute pet wearing/using this exact {config['name_en']}.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

SUBJECT: Cute, well-groomed PET (dog or cat) - NOT a human model
- Same pet in ALL 4 shots
- Pet must be WEARING or USING the product
- Adorable, photogenic pet with expressive eyes

{config['size_note']}

VISUAL STYLE:
- Warm, cozy atmosphere
- Soft natural lighting
- Home or outdoor setting (living room, garden, park)
- Loving, heartwarming mood

2x2 GRID LAYOUT:
[TOP-LEFT]: {config['pose_front']}
[TOP-RIGHT]: {config['pose_side']}
[BOTTOM-LEFT]: {config['pose_back']}
[BOTTOM-RIGHT]: {config['pose_detail']}

{config['special_instruction']}

ABSOLUTELY CRITICAL: 
- The product must be worn BY THE PET (dog or cat), NOT by a human
- Do NOT show any human wearing pet clothes
- Same pet in ALL 4 shots"""
    
    elif category_group == "뷰티":
        return f"""Create luxurious beauty editorial photos featuring a model with this exact {config['name_en']}.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

MODEL: Stunning {gender_model} model with FLAWLESS, GLOWING skin
- Same model in ALL 4 shots
- Dewy, luminous complexion
- Elegant, sophisticated makeup

{config['size_note']}

VISUAL STYLE:
- Clean, luxurious beauty aesthetic
- Soft, flattering lighting that highlights skin
- Minimal, elegant backgrounds (marble, soft gradients)
- High-end beauty brand campaign quality

2x2 GRID LAYOUT:
[TOP-LEFT]: {config['pose_front']}
[TOP-RIGHT]: {config['pose_side']}
[BOTTOM-LEFT]: {config['pose_back']}
[BOTTOM-RIGHT]: {config['pose_detail']}

{config['special_instruction']}

CRITICAL: Product must match EXACTLY. Same model in ALL shots. Focus on skin quality."""
    
    elif category_group == "스포츠":
        return f"""Create dynamic athletic editorial photos featuring a model with this exact {config['name_en']}.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

MODEL: Fit, athletic {gender_model} model with toned physique
- Same model in ALL 4 shots
- Dynamic, powerful poses
- Athletic, energetic expressions

{config['size_note']}

VISUAL STYLE:
- High-energy, dynamic atmosphere
- Dramatic sports lighting
- Gym, studio, or outdoor sports setting
- Nike/Adidas campaign quality

2x2 GRID LAYOUT:
[TOP-LEFT]: {config['pose_front']}
[TOP-RIGHT]: {config['pose_side']}
[BOTTOM-LEFT]: {config['pose_back']}
[BOTTOM-RIGHT]: {config['pose_detail']}

{config['special_instruction']}

CRITICAL: Product must match EXACTLY. Same athletic model in ALL shots."""
    
    else:
        # 기존 패션 화보 스타일
        template = """You are a legendary fashion photographer creating an ICONIC editorial spread.

PRODUCT TO FEATURE: {product_type}
[Reference image attached - preserve EXACT product details: color, material, pattern, hardware, design]

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

MODEL CASTING - CRITICAL:
- Stunning {gender_model} HIGH-FASHION model with striking features
- CAUCASIAN/EUROPEAN model with sharp bone structure, piercing eyes
- Age: early-to-mid 20s, tall and statuesque  
- CRITICAL: EXACT SAME model in ALL 4 shots (identical face, hair color, hairstyle, makeup)
- Expression: fierce, smoldering, or mysteriously captivating
- Perfect editorial hair and makeup

{size_note}

VISUAL STYLE - MAKE IT UNFORGETTABLE:
- Cinematic, dramatic lighting with intentional shadows and highlights
- Rich, editorial color grading
- Luxurious, aspirational backgrounds (NOT plain studio)
- Shallow depth of field for drama
- Every frame should be COVER-WORTHY

2x2 GRID LAYOUT:
[TOP-LEFT] HERO SHOT: {pose_front}
Dramatic lighting, powerful presence, magazine cover quality

[TOP-RIGHT] LIFESTYLE SHOT: {pose_side} 
Storytelling moment with emotional depth, luxurious setting

[BOTTOM-LEFT] MOVEMENT SHOT: {pose_back}
Dynamic energy - hair or fabric in motion, frozen in perfect moment

[BOTTOM-RIGHT] DETAIL SHOT: {pose_detail}
Artistic close-up highlighting the product craftsmanship

{special_instruction}

NON-NEGOTIABLE REQUIREMENTS:
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
- NO generic stock photo aesthetics
- NO Asian models (Western/European casting only)"""

        return template.format(
            product_type=config["name_en"],
            gender_model=gender_model,
            pose_front=config["pose_front"],
            pose_side=config["pose_side"],
            pose_back=config["pose_back"],
            pose_detail=config["pose_detail"],
            size_note=config["size_note"],
            special_instruction=config["special_instruction"],
        )


# ============================================================================
# API 모델
# ============================================================================


class GenerateRequest(BaseModel):
    user_id: str
    image_base64: str
    mode: str = "product"
    model_type: str = "flash"
    gender: str = "female"
    category: str = "clothing"
    target: str = "사람"  # 사람/아동/반려동물


class GenerateResponse(BaseModel):
    success: bool
    images: List[str] = []
    image_urls: List[str] = []
    credits_used: int = 0
    remaining_credits: int = 0
    error: Optional[str] = None


class PaymentRequest(BaseModel):
    user_id: str
    plan: str
    order_id: str


class PaymentConfirmRequest(BaseModel):
    user_id: str
    payment_key: str
    order_id: str
    amount: int


class PaymentResponse(BaseModel):
    success: bool
    credits: int = 0
    total_credits: int = 0
    error: Optional[str] = None


# ============================================================================
# 유틸리티 함수
# ============================================================================


def process_image(base64_data: str, max_size: int = 1568) -> str:
    try:
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]

        image_bytes = base64.b64decode(base64_data)
        img = Image.open(io.BytesIO(image_bytes))

        if img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            if img.mode in ("RGBA", "LA"):
                bg.paste(img, mask=img.split()[-1])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")

        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=90)
        return base64.standard_b64encode(buffer.getvalue()).decode("utf-8")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"이미지 처리 오류: {str(e)}")


def split_grid_image(image_bytes: bytes, upscale_factor: int = 4) -> List[bytes]:
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

        results = []
        for left, top, right, bottom in positions:
            cropped = img.crop((left, top, right, bottom))
            if upscale_factor > 1:
                new_size = (
                    cropped.width * upscale_factor,
                    cropped.height * upscale_factor,
                )
                cropped = cropped.resize(new_size, Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            cropped.save(buffer, format="JPEG", quality=95)
            results.append(buffer.getvalue())

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 분할 오류: {str(e)}")


async def upload_to_storage(user_id: str, image_bytes: bytes, index: int) -> str:
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{user_id}/{timestamp}_{index}.jpg"

        supabase.storage.from_("generated-images").upload(
            filename, image_bytes, {"content-type": "image/jpeg"}
        )

        url = supabase.storage.from_("generated-images").get_public_url(filename)
        return url
    except Exception as e:
        print(f"Storage 업로드 오류: {e}")
        return ""


async def check_credits(user_id: str, required: int) -> int:
    try:
        result = (
            supabase.table("profiles")
            .select("credits")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if result.data:
            return result.data.get("credits", 0)
        return 0
    except Exception as e:
        print(f"크레딧 확인 오류: {e}")
        return 0


async def deduct_credits(user_id: str, amount: int) -> int:
    try:
        result = supabase.rpc(
            "deduct_credits_atomic", {"p_user_id": user_id, "p_amount": amount}
        ).execute()

        if result.data:
            data = result.data
            if data.get("success"):
                supabase.table("usages").insert(
                    {
                        "user_id": user_id,
                        "action": "image_generation",
                        "credits_used": amount,
                    }
                ).execute()
                return data.get("credits", 0)
            else:
                raise HTTPException(
                    status_code=400, detail=data.get("error", "크레딧 차감 실패")
                )

        raise HTTPException(status_code=500, detail="크레딧 처리 중 오류가 발생했습니다")
    except HTTPException:
        raise
    except Exception as e:
        print(f"크레딧 차감 오류: {e}")
        raise HTTPException(status_code=500, detail="크레딧 처리 중 오류가 발생했습니다")


async def add_credits(user_id: str, amount: int) -> int:
    try:
        result = supabase.rpc(
            "add_credits_atomic", {"p_user_id": user_id, "p_amount": amount}
        ).execute()

        if result.data:
            data = result.data
            if data.get("success"):
                return data.get("credits", 0)
            else:
                raise HTTPException(
                    status_code=400, detail=data.get("error", "크레딧 추가 실패")
                )

        raise HTTPException(status_code=500, detail="크레딧 처리 중 오류가 발생했습니다")
    except HTTPException:
        raise
    except Exception as e:
        print(f"크레딧 추가 오류: {e}")
        raise HTTPException(status_code=500, detail="크레딧 처리 중 오류가 발생했습니다")


async def save_generation(
    user_id: str, image_urls: List[str], mode: str, model_type: str, credits_used: int
):
    try:
        for url in image_urls:
            supabase.table("generations").insert(
                {
                    "user_id": user_id,
                    "generated_image_url": url,
                    "mode": mode,
                    "model_type": model_type,
                    "credits_used": (
                        credits_used // len(image_urls) if image_urls else credits_used
                    ),
                }
            ).execute()
    except Exception as e:
        print(f"생성 내역 저장 오류: {e}")


# ============================================================================
# API 엔드포인트 - 기본
# ============================================================================


@app.get("/")
async def root():
    return {"message": "Autopic API", "version": "1.2.0", "categories": list(CATEGORY_MODEL_CONFIG.keys())}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/credits/{user_id}")
async def get_credits(user_id: str):
    credits = await check_credits(user_id, 0)
    return {"credits": credits}


@app.get("/api/categories")
async def get_categories():
    return {
        "categories": list(CATEGORY_MODEL_CONFIG.keys()),
        "category_en": list(CATEGORY_EN_TO_GROUP.keys()),
        "targets": ["사람", "아동", "반려동물"],
    }


# ============================================================================
# API 엔드포인트 - 이미지 생성
# ============================================================================


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    if request.model_type not in MODEL_CONFIG:
        raise HTTPException(status_code=400, detail="잘못된 모델 타입입니다")

    config = MODEL_CONFIG[request.model_type]
    required_credits = config["credits"]

    current_credits = await check_credits(request.user_id, required_credits)
    if current_credits < required_credits:
        return GenerateResponse(
            success=False,
            error=f"크레딧이 부족합니다. 필요: {required_credits}, 보유: {current_credits}",
            remaining_credits=current_credits,
        )

    try:
        processed_image = process_image(request.image_base64)

        # 프롬프트 선택 (TARGET 기반 카테고리 오버라이드 적용)
        if request.mode == "model":
            prompt = build_model_prompt(request.category, request.gender, request.target)
        elif request.mode == "editorial_product":
            prompt = build_editorial_product_prompt(request.category, request.target)
        elif request.mode == "editorial_model":
            prompt = build_editorial_model_prompt(request.category, request.gender, request.target)
        else:
            prompt = PROMPT_PRODUCT

        client = get_gemini_client()

        response = client.models.generate_content(
            model=config["model"],
            contents=[
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": processed_image,
                            }
                        },
                    ]
                }
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"], temperature=0.4
            ),
        )

        image_bytes = None
        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    data = part.inline_data.data
                    if isinstance(data, str):
                        image_bytes = base64.b64decode(data)
                    else:
                        image_bytes = data
                    break

        if not image_bytes:
            rotate_key()
            return GenerateResponse(
                success=False,
                error="이미지 생성에 실패했습니다. 다시 시도해주세요.",
                remaining_credits=current_credits,
            )

        split_images = split_grid_image(image_bytes)

        image_urls = []
        for i, img_bytes in enumerate(split_images):
            url = await upload_to_storage(request.user_id, img_bytes, i)
            if url:
                image_urls.append(url)

        remaining = await deduct_credits(request.user_id, required_credits)

        await save_generation(
            request.user_id,
            image_urls,
            request.mode,
            request.model_type,
            required_credits,
        )

        images_base64 = [base64.b64encode(img).decode("utf-8") for img in split_images]

        return GenerateResponse(
            success=True,
            images=images_base64,
            image_urls=image_urls,
            credits_used=required_credits,
            remaining_credits=remaining,
        )

    except Exception as e:
        print(f"이미지 생성 오류: {e}")
        rotate_key()
        return GenerateResponse(
            success=False,
            error=f"이미지 생성 중 오류가 발생했습니다: {str(e)}",
            remaining_credits=current_credits,
        )


# ============================================================================
# API 엔드포인트 - 결제
# ============================================================================


@app.post("/api/payment/create")
async def create_payment(request: PaymentRequest):
    if request.plan not in PRICING_PLANS:
        raise HTTPException(status_code=400, detail="잘못된 요금제입니다")

    plan = PRICING_PLANS[request.plan]

    try:
        supabase.table("payments").insert(
            {
                "user_id": request.user_id,
                "order_id": request.order_id,
                "amount": plan["price"],
                "credits": plan["credits"],
                "status": "pending",
            }
        ).execute()

        return {
            "success": True,
            "order_id": request.order_id,
            "amount": plan["price"],
            "credits": plan["credits"],
            "plan_name": plan["name"],
        }
    except Exception as e:
        print(f"결제 생성 오류: {e}")
        raise HTTPException(status_code=500, detail="결제 생성 중 오류가 발생했습니다")


@app.post("/api/payment/confirm", response_model=PaymentResponse)
async def confirm_payment(request: PaymentConfirmRequest):
    try:
        auth_string = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tosspayments.com/v1/payments/confirm",
                headers={
                    "Authorization": f"Basic {auth_string}",
                    "Content-Type": "application/json",
                },
                json={
                    "paymentKey": request.payment_key,
                    "orderId": request.order_id,
                    "amount": request.amount,
                },
            )

        if response.status_code != 200:
            error_data = response.json()
            return PaymentResponse(
                success=False, error=error_data.get("message", "결제 승인 실패")
            )

        payment_data = response.json()

        payment_result = (
            supabase.table("payments")
            .select("*")
            .eq("order_id", request.order_id)
            .single()
            .execute()
        )

        if not payment_result.data:
            return PaymentResponse(success=False, error="결제 정보를 찾을 수 없습니다")

        payment = payment_result.data
        credits_to_add = payment["credits"]

        supabase.table("payments").update(
            {
                "status": "completed",
                "payment_key": request.payment_key,
                "method": payment_data.get("method", ""),
                "paid_at": datetime.now().isoformat(),
            }
        ).eq("order_id", request.order_id).execute()

        new_credits = await add_credits(request.user_id, credits_to_add)

        return PaymentResponse(
            success=True,
            credits=credits_to_add,
            total_credits=new_credits,
        )

    except Exception as e:
        print(f"결제 승인 오류: {e}")
        return PaymentResponse(
            success=False, error=f"결제 처리 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/api/payment/config")
async def get_payment_config():
    return {
        "client_key": TOSS_CLIENT_KEY,
        "plans": PRICING_PLANS,
    }


# ============================================================================
# API 키 발급 시스템
# ============================================================================


def generate_api_key() -> str:
    return f"ap_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()


class APIKeyRequest(BaseModel):
    user_id: str
    name: str = "Default"


class APIKeyResponse(BaseModel):
    success: bool
    api_key: Optional[str] = None
    key_id: Optional[str] = None
    error: Optional[str] = None


@app.post("/api/keys/generate", response_model=APIKeyResponse)
async def generate_user_api_key(request: APIKeyRequest):
    try:
        existing = (
            supabase.table("api_keys")
            .select("*")
            .eq("user_id", request.user_id)
            .eq("is_active", True)
            .execute()
        )

        if existing.data and len(existing.data) >= 3:
            return APIKeyResponse(
                success=False,
                error="최대 3개의 API 키만 발급할 수 있습니다. 기존 키를 삭제해주세요.",
            )

        api_key = generate_api_key()
        key_hash = hash_api_key(api_key)
        key_id = str(uuid.uuid4())

        supabase.table("api_keys").insert(
            {
                "id": key_id,
                "user_id": request.user_id,
                "key_hash": key_hash,
                "name": request.name,
                "is_active": True,
                "created_at": datetime.now().isoformat(),
            }
        ).execute()

        return APIKeyResponse(
            success=True,
            api_key=api_key,
            key_id=key_id,
        )

    except Exception as e:
        print(f"API 키 발급 오류: {e}")
        return APIKeyResponse(success=False, error=str(e))


@app.get("/api/keys/{user_id}")
async def get_user_api_keys(user_id: str):
    try:
        result = (
            supabase.table("api_keys")
            .select("id, name, key_hash, is_active, created_at, last_used_at")
            .eq("user_id", user_id)
            .execute()
        )

        keys = []
        for key in result.data or []:
            key_hash = key.get("key_hash", "")
            key["key_preview"] = f"ap_****...{key_hash[-4:]}" if key_hash else "ap_****"
            del key["key_hash"]
            keys.append(key)

        return {"success": True, "keys": keys}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/keys/{key_id}")
async def delete_api_key(key_id: str):
    try:
        supabase.table("api_keys").update({"is_active": False}).eq(
            "id", key_id
        ).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def verify_api_key(api_key: str) -> Optional[str]:
    try:
        key_hash = hash_api_key(api_key)
        result = (
            supabase.table("api_keys")
            .select("user_id")
            .eq("key_hash", key_hash)
            .eq("is_active", True)
            .single()
            .execute()
        )

        if result.data:
            supabase.table("api_keys").update(
                {"last_used_at": datetime.now().isoformat()}
            ).eq("key_hash", key_hash).execute()
            return result.data["user_id"]
        return None
    except:
        return None


# ============================================================================
# 설치형 프로그램용 API
# ============================================================================


class DesktopGenerateRequest(BaseModel):
    image_base64: str
    mode: str = "product"
    model_type: str = "flash"
    gender: str = "female"
    category: str = "clothing"
    target: str = "사람"


@app.post("/api/v1/generate")
async def desktop_generate_image(
    request: DesktopGenerateRequest, x_api_key: str = Header(None, alias="X-API-Key")
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API 키가 필요합니다")

    rate_key = f"generate:{x_api_key[:20]}"
    if not rate_limiter.is_allowed(
        rate_key, RATE_LIMITS["generate"]["limit"], RATE_LIMITS["generate"]["window"]
    ):
        remaining = rate_limiter.get_remaining(
            rate_key, RATE_LIMITS["generate"]["limit"]
        )
        raise HTTPException(
            status_code=429,
            detail=f"요청 횟수 초과. 1분 후 다시 시도해주세요. (남은 횟수: {remaining})",
        )

    user_id = await verify_api_key(x_api_key)
    if not user_id:
        raise HTTPException(status_code=401, detail="유효하지 않은 API 키입니다")

    gen_request = GenerateRequest(
        user_id=user_id,
        image_base64=request.image_base64,
        mode=request.mode,
        model_type=request.model_type,
        gender=request.gender,
        category=request.category,
        target=request.target,
    )

    return await generate_image(gen_request)


@app.get("/api/v1/credits")
async def desktop_get_credits(x_api_key: str = Header(None, alias="X-API-Key")):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API 키가 필요합니다")

    rate_key = f"credits:{x_api_key[:20]}"
    if not rate_limiter.is_allowed(
        rate_key, RATE_LIMITS["api_key"]["limit"], RATE_LIMITS["api_key"]["window"]
    ):
        raise HTTPException(
            status_code=429, detail="요청 횟수 초과. 1분 후 다시 시도해주세요."
        )

    user_id = await verify_api_key(x_api_key)
    if not user_id:
        raise HTTPException(status_code=401, detail="유효하지 않은 API 키입니다")

    credits = await check_credits(user_id, 0)
    return {"credits": credits}


# ============================================================================
# AI 분석 API
# ============================================================================


class AnalyzeRequest(BaseModel):
    image_base64: str
    product_name: str = ""
    text_content: str = ""
    business_type: str = "luxury"
    categories: Dict[str, List[str]] = {}
    brands: List[str] = []


class AnalyzeResponse(BaseModel):
    success: bool
    brand: str = ""
    brand_kr: str = ""
    category1: str = ""
    category2: str = ""
    product_name: str = ""
    product_keyword: str = ""
    gender: str = ""
    target: str = "사람"
    seo_title: str = ""
    seo_description: str = ""
    seo_keywords: str = ""
    error: Optional[str] = None


BRAND_KR_MAP = {
    "GUCCI": "구찌",
    "LOUIS VUITTON": "루이비통",
    "CHANEL": "샤넬",
    "PRADA": "프라다",
    "HERMES": "에르메스",
    "DIOR": "디올",
    "BURBERRY": "버버리",
    "BALENCIAGA": "발렌시아가",
    "BOTTEGA VENETA": "보테가 베네타",
    "SAINT LAURENT": "생로랑",
    "CELINE": "셀린느",
    "LOEWE": "로에베",
    "FENDI": "펜디",
    "VALENTINO": "발렌티노",
    "GIVENCHY": "지방시",
    "MIU MIU": "미우미우",
    "VERSACE": "베르사체",
    "COACH": "코치",
    "MICHAEL KORS": "마이클코어스",
}


def build_analyze_prompt(
    business_type: str, categories: dict, brands: list, text_content: str = ""
) -> str:
    if categories:
        category_str = ""
        for primary, secondaries in categories.items():
            if secondaries:
                category_str += f"- {primary}: {', '.join(secondaries)}\n"
            else:
                category_str += f"- {primary}: (2차 없음)\n"
    else:
        category_str = """- 가방: 숄더백, 토트백, 크로스백, 백팩, 클러치
- 상의: 티셔츠, 블라우스, 니트, 스웨트셔츠, 셔츠
- 하의: 팬츠, 스커트, 반바지, 데님
- 아우터: 자켓, 코트, 점퍼, 가디건
- 신발: 스니커즈, 로퍼, 부츠, 샌들, 힐
- 액세서리: 벨트, 스카프, 모자, 주얼리, 선글라스
- 키즈: 아동복, 유아복, 아동신발
- 펫: 펫의류, 펫용품, 목줄
- 뷰티: 스킨케어, 메이크업, 향수
- 스포츠: 운동복, 요가웨어, 스포츠웨어"""

    text_section = ""
    if text_content:
        text_section = f"\n\n참고 텍스트 정보:\n{text_content[:1000]}\n"

    if business_type == "luxury":
        brand_str = ", ".join(brands) if brands else "자동 감지"
        return f"""이 상품의 정보를 분석해주세요.{text_section}

**중요: 아래 목록에 있는 카테고리만 사용하세요!**

사용 가능한 카테고리:
{category_str}

등록된 브랜드: {brand_str}

다음 형식으로만 응답해주세요:
BRAND: (브랜드명 영문. 예: GUCCI)
BRAND_KR: (브랜드명 한글. 예: 구찌)
CATEGORY1: (위 목록의 1차 카테고리만 사용)
CATEGORY2: (위 목록의 2차 카테고리만 사용)
PRODUCT_KEYWORD: (세련된 상품 키워드 - 브랜드명, 1차카테고리 제외)
GENDER: (여성/남성/공용)
TARGET: (이 상품의 착용/사용 대상 - 사람/아동/반려동물 중 하나만 선택)

TARGET 판단 기준:
- 반려동물: 강아지옷, 고양이옷, 펫용품, 목줄, 하네스 등 동물용 제품 (사이즈가 매우 작고 동물 전용 디자인)
- 아동: 아동복, 유아복, 키즈용품 등 어린이용 제품 (사이즈가 작은 아동용)
- 사람: 일반 성인용 의류, 가방, 신발, 액세서리 등

예시:
- 체인 자수 스웨트셔츠
- 더블G 레더 토트백"""
    else:
        return f"""이 상품의 정보를 분석해주세요.{text_section}

**중요: 아래 목록에 있는 카테고리만 사용하세요!**

사용 가능한 카테고리:
{category_str}

다음 형식으로만 응답해주세요:
CATEGORY1: (위 목록의 1차 카테고리만 사용)
CATEGORY2: (위 목록의 2차 카테고리만 사용)
PRODUCT_KEYWORD: (세련된 상품 키워드 - 1차카테고리 제외)
GENDER: (여성/남성/공용)
TARGET: (이 상품의 착용/사용 대상 - 사람/아동/반려동물 중 하나만 선택)

TARGET 판단 기준:
- 반려동물: 강아지옷, 고양이옷, 펫용품, 목줄, 하네스 등 동물용 제품 (사이즈가 매우 작고 동물 전용 디자인)
- 아동: 아동복, 유아복, 키즈용품 등 어린이용 제품 (사이즈가 작은 아동용)
- 사람: 일반 성인용 의류, 가방, 신발, 액세서리 등

예시:
- 코튼 오버핏 후드 티셔츠
- 레더 미니 크로스백"""


def build_seo_prompt(
    brand: str, category1: str, category2: str, product_name: str, gender: str
) -> str:
    return f"""다음 상품 정보를 바탕으로 SEO 최적화된 콘텐츠를 생성해주세요.

상품 정보:
- 브랜드: {brand or "없음"}
- 카테고리: {category1} > {category2}
- 상품명: {product_name}
- 성별: {gender}

다음 형식으로 JSON만 반환해주세요:
{{
    "seo_title": "검색 최적화된 상품 제목 (60자 이내)",
    "seo_description": "상품 설명 (150자 이내, 특징과 장점 포함)",
    "seo_keywords": "검색 키워드 (쉼표로 구분, 5-10개)"
}}"""


def parse_analyze_response(response: str, business_type: str) -> dict:
    result = {
        "brand": "",
        "brand_kr": "",
        "category1": "",
        "category2": "",
        "product_keyword": "",
        "gender": "공용",
        "target": "사람",
    }

    for line in response.strip().split("\n"):
        line = line.strip()
        if business_type == "luxury":
            if line.startswith("BRAND:"):
                result["brand"] = line.replace("BRAND:", "").strip()
            elif line.startswith("BRAND_KR:"):
                result["brand_kr"] = line.replace("BRAND_KR:", "").strip()
        if line.startswith("CATEGORY1:"):
            result["category1"] = line.replace("CATEGORY1:", "").strip()
        elif line.startswith("CATEGORY2:"):
            result["category2"] = line.replace("CATEGORY2:", "").strip()
        elif line.startswith("PRODUCT_KEYWORD:"):
            result["product_keyword"] = line.replace("PRODUCT_KEYWORD:", "").strip()
        elif line.startswith("GENDER:"):
            gender = line.replace("GENDER:", "").strip()
            if gender in ["여성", "남성", "공용"]:
                result["gender"] = gender
        elif line.startswith("TARGET:"):
            target = line.replace("TARGET:", "").strip()
            if target in ["사람", "아동", "반려동물"]:
                result["target"] = target

    if not result["brand_kr"] and result["brand"]:
        result["brand_kr"] = BRAND_KR_MAP.get(result["brand"].upper(), "")

    if business_type == "luxury" and result["brand_kr"]:
        result["product_name"] = f"{result['brand_kr']} {result['product_keyword']}"
    else:
        result["product_name"] = result["product_keyword"]

    return result


async def call_claude_api_text(
    prompt: str, image_base64: str = None, max_retries: int = 3
) -> str:
    if not CLAUDE_API_KEY:
        return ""

    for attempt in range(max_retries):
        try:
            headers = {
                "x-api-key": CLAUDE_API_KEY,
                "content-type": "application/json",
                "anthropic-version": "2023-06-01",
            }

            if image_base64:
                if "," in image_base64:
                    image_base64 = image_base64.split(",")[1]
                content = [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_base64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ]
            else:
                content = [{"type": "text", "text": prompt}]

            body = {
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": content}],
            }

            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages", headers=headers, json=body
                )

            if response.status_code == 200:
                data = response.json()
                result = data.get("content", [{}])[0].get("text", "")
                if result:
                    return result

            if response.status_code in [429, 500, 502, 503]:
                print(f"Claude API 재시도 {attempt + 1}/{max_retries}")
                await asyncio.sleep(2**attempt)
                continue

            print(f"Claude API 오류: {response.status_code}")
            return ""

        except httpx.TimeoutException:
            print(f"Claude API 타임아웃 재시도 {attempt + 1}/{max_retries}")
            await asyncio.sleep(2**attempt)
            continue
        except Exception as e:
            print(f"Claude API 오류: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2**attempt)
                continue
            return ""

    return ""


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze_product(
    request: AnalyzeRequest, x_api_key: str = Header(None, alias="X-API-Key")
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API 키가 필요합니다")

    user_id = await verify_api_key(x_api_key)
    if not user_id:
        raise HTTPException(status_code=401, detail="유효하지 않은 API 키입니다")

    try:
        analyze_prompt = build_analyze_prompt(
            request.business_type,
            request.categories,
            request.brands,
            request.text_content,
        )

        response_text = await call_claude_api_text(analyze_prompt, request.image_base64)

        if not response_text:
            return AnalyzeResponse(success=False, error="분석 API 오류")

        parsed = parse_analyze_response(response_text, request.business_type)

        seo_prompt = build_seo_prompt(
            parsed["brand"],
            parsed["category1"],
            parsed["category2"],
            parsed.get("product_name", parsed["product_keyword"]),
            parsed["gender"],
        )

        seo_response = await call_claude_api_text(seo_prompt)

        seo_data = {}
        if seo_response:
            try:
                import json as json_module

                if "```json" in seo_response:
                    seo_response = seo_response.split("```json")[1].split("```")[0]
                elif "```" in seo_response:
                    seo_response = seo_response.split("```")[1].split("```")[0]
                seo_data = json_module.loads(seo_response.strip())
            except:
                pass

        return AnalyzeResponse(
            success=True,
            brand=parsed["brand"],
            brand_kr=parsed["brand_kr"],
            category1=parsed["category1"],
            category2=parsed["category2"],
            product_name=parsed.get("product_name", parsed["product_keyword"]),
            product_keyword=parsed["product_keyword"],
            gender=parsed["gender"],
            target=parsed["target"],
            seo_title=seo_data.get("seo_title", ""),
            seo_description=seo_data.get("seo_description", ""),
            seo_keywords=seo_data.get("seo_keywords", ""),
        )

    except Exception as e:
        print(f"분석 오류: {e}")
        return AnalyzeResponse(success=False, error=str(e))


# ============================================================================
# 서버 실행
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
