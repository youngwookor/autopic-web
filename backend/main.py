# -*- coding: utf-8 -*-
"""
Autopic Backend - FastAPI
=========================
AI 이미지 생성 + 결제 API 서버
"""

import os
import io
import base64
import uuid
import httpx
import secrets
import hashlib
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
    title="Autopic API", description="AI 상품 이미지 생성 + 결제 API", version="1.0.0"
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
    """간단한 메모리 기반 Rate Limiter"""

    def __init__(self):
        # {key: [(timestamp, count), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 60  # 60초마다 정리
        self.last_cleanup = time.time()

    def _cleanup(self):
        """오래된 기록 정리"""
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return

        for key in list(self.requests.keys()):
            # 1분 이상 오래된 기록 제거
            self.requests[key] = [
                (ts, cnt) for ts, cnt in self.requests[key] if now - ts < 60
            ]
            if not self.requests[key]:
                del self.requests[key]

        self.last_cleanup = now

    def is_allowed(self, key: str, limit: int, window: int = 60) -> bool:
        """
        요청 허용 여부 확인

        Args:
            key: 제한 키 (API 키 또는 IP)
            limit: 제한 횟수
            window: 시간 창 (초)
        """
        self._cleanup()

        now = time.time()
        window_start = now - window

        # 현재 창 내 요청 수 계산
        recent_requests = [
            (ts, cnt) for ts, cnt in self.requests[key] if ts > window_start
        ]

        total_requests = sum(cnt for _, cnt in recent_requests)

        if total_requests >= limit:
            return False

        # 요청 기록
        self.requests[key].append((now, 1))
        return True

    def get_remaining(self, key: str, limit: int, window: int = 60) -> int:
        """남은 요청 횟수"""
        now = time.time()
        window_start = now - window

        recent_requests = [
            (ts, cnt) for ts, cnt in self.requests[key] if ts > window_start
        ]

        total_requests = sum(cnt for _, cnt in recent_requests)
        return max(0, limit - total_requests)


# Rate Limiter 인스턴스
rate_limiter = RateLimiter()

# Rate Limit 설정
RATE_LIMITS = {
    "generate": {"limit": 10, "window": 60},  # 분당 10회 이미지 생성
    "api_key": {"limit": 20, "window": 60},  # 분당 20회 API 호출
}

# 모델 설정 - 데스크탑 앱과 동일
MODEL_CONFIG = {
    "flash": {"model": "gemini-2.5-flash-image-preview", "credits": 1},
    "pro": {"model": "gemini-3-pro-image-preview", "credits": 3},
}

# 요금제 설정 - 메인페이지와 동일
PRICING_PLANS = {
    "light": {"credits": 50, "price": 19000, "name": "Light"},
    "standard": {"credits": 200, "price": 49000, "name": "Standard"},
    "plus": {"credits": 500, "price": 119000, "name": "Plus"},
    "mega": {"credits": 1500, "price": 349000, "name": "Mega"},
    "ultimate": {"credits": 5000, "price": 999000, "name": "Ultimate"},
}

# 현재 API 키 인덱스
current_key_index = 0


def get_gemini_client():
    """Gemini 클라이언트 생성 (키 로테이션)"""
    global current_key_index
    if not GEMINI_API_KEYS or not GEMINI_API_KEYS[0]:
        raise HTTPException(
            status_code=500, detail="Gemini API 키가 설정되지 않았습니다"
        )

    key = GEMINI_API_KEYS[current_key_index % len(GEMINI_API_KEYS)]
    return genai.Client(api_key=key)


def rotate_key():
    """다음 API 키로 전환"""
    global current_key_index
    current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)


# ============================================================================
# 프롬프트 - 데스크탑 앱과 동일
# ============================================================================

# ============================================================================
# 기본 프롬프트
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

# ============================================================================
# 화보 프롬프트 (Editorial)
# ============================================================================

PROMPT_PRODUCT_EDITORIAL = """Create luxury editorial product photos with dramatic lighting.
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

PROMPT_MODEL_EDITORIAL = """Create high-fashion editorial/lookbook photos of a model with this exact product.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

MODEL REQUIREMENTS:
- Use the SAME professional {gender_model} fashion model for ALL 4 shots
- Age: 20s, with refined elegant features
- Confident, sophisticated expression
- Natural pose like in Vogue or Harper's Bazaar editorial
- Model should show full face with artistic expression

STYLE & MOOD:
- High-fashion editorial/lookbook aesthetic
- Soft, diffused studio lighting with subtle shadows
- Clean, minimalist background (soft gray or off-white gradient)
- Professional fashion photography quality
- Atmosphere: elegant, aspirational, modern luxury

2x2 grid layout:
[top-left]: Full body front view - editorial pose
[top-right]: Full body side view - fashion pose
[bottom-left]: Full body back/3/4 view - elegant pose
[bottom-right]: Upper body detail - showing product clearly

CRITICAL: Product must match EXACTLY - same color, pattern, material, design"""

# 카테고리별 모델 프롬프트 설정
CATEGORY_CONFIG = {
    "clothing": {
        "name_en": "clothing",
        "pose_front": "full body FRONT view - model facing camera, showing outfit clearly",
        "pose_side": "full body SIDE view - profile or 3/4 angle showing silhouette",
        "pose_back": "full body BACK view - showing rear of the outfit",
        "pose_detail": "upper body DETAIL shot - closer view highlighting fabric and design",
    },
    "bag": {
        "name_en": "handbag/bag",
        "pose_front": "Model wearing bag on SHOULDER, FRONT view facing camera",
        "pose_side": "Model wearing bag, SIDE view showing bag profile and depth",
        "pose_back": "Model from BACK, bag worn CROSSBODY so bag's FRONT is visible",
        "pose_detail": "Close-up of model's hand HOLDING the bag handle - DETAIL shot",
    },
    "shoes": {
        "name_en": "shoes/footwear",
        "pose_front": "Full body FRONT view - model standing, shoes clearly visible on feet",
        "pose_side": "Full body SIDE view - showing shoe profile and heel",
        "pose_back": "Close-up of model's feet from BACK angle - showing heel design",
        "pose_detail": "Close-up DETAIL shot of model's feet wearing the shoes",
    },
    "watch": {
        "name_en": "wristwatch",
        "pose_front": "Model's wrist with watch, FRONT view - watch face clearly visible",
        "pose_side": "Model's wrist at natural angle - watch face and profile visible",
        "pose_back": "Model wearing watch, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of watch ON MODEL'S WRIST",
    },
    "jewelry": {
        "name_en": "jewelry",
        "pose_front": "Model wearing jewelry, FRONT view - jewelry clearly visible",
        "pose_side": "Model wearing jewelry, SIDE view showing profile",
        "pose_back": "Model wearing jewelry, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of jewelry ON THE MODEL",
    },
    "eyewear": {
        "name_en": "eyewear/sunglasses",
        "pose_front": "Model wearing eyewear, FRONT view - face and glasses clearly visible",
        "pose_side": "Model wearing eyewear, SIDE PROFILE view",
        "pose_back": "Model wearing eyewear, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of eyewear on model's face",
    },
    "hat": {
        "name_en": "hat/cap",
        "pose_front": "Model wearing hat, FRONT view",
        "pose_side": "Model wearing hat, SIDE view showing hat profile",
        "pose_back": "Model wearing hat, BACK view",
        "pose_detail": "Close-up DETAIL of hat ON THE MODEL'S HEAD",
    },
    "scarf": {
        "name_en": "scarf/muffler",
        "pose_front": "Model wearing scarf around neck, FRONT view",
        "pose_side": "Model wearing scarf, SIDE view",
        "pose_back": "Model wearing scarf, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of scarf ON THE MODEL'S NECK",
    },
    "belt": {
        "name_en": "belt",
        "pose_front": "Model WEARING the belt around waist, FRONT view - buckle visible",
        "pose_side": "Model wearing belt, SIDE view",
        "pose_back": "Model wearing belt, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of belt buckle ON THE MODEL'S WAIST",
    },
    "accessory": {
        "name_en": "accessory item",
        "pose_front": "Model HOLDING the item elegantly, FRONT view",
        "pose_side": "Model holding item, SIDE view",
        "pose_back": "Model holding item, 3/4 ANGLE view",
        "pose_detail": "Close-up DETAIL of item ON/WITH THE MODEL",
    },
}


def build_model_prompt(category: str, gender: str) -> str:
    """카테고리별 모델 프롬프트 생성"""
    config = CATEGORY_CONFIG.get(category, CATEGORY_CONFIG["clothing"])
    gender_str = "FEMALE" if gender == "female" else "MALE"

    return f"""Create professional luxury fashion e-commerce model photos with this exact {config['name_en']}.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

Requirements:
- Use the SAME single {gender_str} model for ALL 4 shots
- CRITICAL: Same face, same hair, same outfit in ALL 4 images
- Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout:
  [top-left]: {config['pose_front']}
  [top-right]: {config['pose_side']}
  [bottom-left]: {config['pose_back']}
  [bottom-right]: {config['pose_detail']}
- High-end luxury brand website style

CRITICAL:
- Product must match EXACTLY - same color, pattern, material, design, hardware
- The SAME model must appear in ALL 4 shots with consistent appearance"""


# ============================================================================
# API 모델
# ============================================================================


class GenerateRequest(BaseModel):
    user_id: str
    image_base64: str
    mode: str = "product"  # product, model, editorial_product, editorial_model
    model_type: str = "flash"
    gender: str = "female"
    category: str = "clothing"


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
    """이미지 전처리 (리사이즈, RGB 변환)"""
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
    """2x2 그리드 이미지를 4개로 분할"""
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
    """Supabase Storage에 이미지 업로드"""
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
    """크레딧 확인"""
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
    """크레딧 차감 (원자적 처리)"""
    try:
        # Supabase RPC 함수 호출 (동시 차감 방지)
        result = supabase.rpc(
            "deduct_credits_atomic", {"p_user_id": user_id, "p_amount": amount}
        ).execute()

        if result.data:
            data = result.data
            if data.get("success"):
                # 사용 내역 기록
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

        raise HTTPException(
            status_code=500, detail="크레딧 처리 중 오류가 발생했습니다"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"크레딧 차감 오류: {e}")
        raise HTTPException(
            status_code=500, detail="크레딧 처리 중 오류가 발생했습니다"
        )


async def add_credits(user_id: str, amount: int) -> int:
    """크레딧 추가 (원자적 처리)"""
    try:
        # Supabase RPC 함수 호출
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

        raise HTTPException(
            status_code=500, detail="크레딧 처리 중 오류가 발생했습니다"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"크레딧 추가 오류: {e}")
        raise HTTPException(
            status_code=500, detail="크레딧 처리 중 오류가 발생했습니다"
        )


async def save_generation(
    user_id: str, image_urls: List[str], mode: str, model_type: str, credits_used: int
):
    """생성 내역 저장"""
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
    return {"message": "Autopic API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/credits/{user_id}")
async def get_credits(user_id: str):
    """크레딧 조회"""
    credits = await check_credits(user_id, 0)
    return {"credits": credits}


# ============================================================================
# API 엔드포인트 - 이미지 생성
# ============================================================================


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """이미지 생성 API"""

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

        # 프롬프트 선택
        if request.mode == "model":
            prompt = build_model_prompt(request.category, request.gender)
        elif request.mode == "editorial_product":
            prompt = PROMPT_PRODUCT_EDITORIAL
        elif request.mode == "editorial_model":
            gender_str = "FEMALE" if request.gender == "female" else "MALE"
            prompt = PROMPT_MODEL_EDITORIAL.format(gender_model=gender_str)
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
    """결제 주문 생성"""

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
    """토스페이먼츠 결제 승인"""

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
    """결제 설정 정보 반환"""
    return {
        "client_key": TOSS_CLIENT_KEY,
        "plans": PRICING_PLANS,
    }


# ============================================================================
# API 키 발급 시스템 (설치형 프로그램용)
# ============================================================================


def generate_api_key() -> str:
    """안전한 API 키 생성"""
    return f"ap_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """API 키 해시"""
    return hashlib.sha256(api_key.encode()).hexdigest()


class APIKeyRequest(BaseModel):
    user_id: str
    name: str = "Default"


class APIKeyResponse(BaseModel):
    success: bool
    api_key: Optional[str] = None  # 최초 발급 시만 반환
    key_id: Optional[str] = None
    error: Optional[str] = None


@app.post("/api/keys/generate", response_model=APIKeyResponse)
async def generate_user_api_key(request: APIKeyRequest):
    """사용자 API 키 발급"""
    try:
        # 기존 키 확인 (활성 키 제한: 3개)
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

        # 새 API 키 생성
        api_key = generate_api_key()
        key_hash = hash_api_key(api_key)
        key_id = str(uuid.uuid4())

        # DB 저장 (해시만 저장)
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
            api_key=api_key,  # 최초 1회만 반환
            key_id=key_id,
        )

    except Exception as e:
        print(f"API 키 발급 오류: {e}")
        return APIKeyResponse(success=False, error=str(e))


@app.get("/api/keys/{user_id}")
async def get_user_api_keys(user_id: str):
    """사용자 API 키 목록 조회"""
    try:
        result = (
            supabase.table("api_keys")
            .select("id, name, key_hash, is_active, created_at, last_used_at")
            .eq("user_id", user_id)
            .execute()
        )

        # key_preview 추가 (해시 앞 8자리 + ... + 뒤 4자리)
        keys = []
        for key in result.data or []:
            key_hash = key.get("key_hash", "")
            key["key_preview"] = f"ap_****...{key_hash[-4:]}" if key_hash else "ap_****"
            del key["key_hash"]  # 해시 전체는 반환하지 않음
            keys.append(key)

        return {"success": True, "keys": keys}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/keys/{key_id}")
async def delete_api_key(key_id: str):
    """
    API 키 비활성화
    """
    try:
        supabase.table("api_keys").update({"is_active": False}).eq(
            "id", key_id
        ).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def verify_api_key(api_key: str) -> Optional[str]:
    """
    API 키 검증 및 사용자 ID 반환
    """
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
            # 마지막 사용 시간 업데이트
            supabase.table("api_keys").update(
                {"last_used_at": datetime.now().isoformat()}
            ).eq("key_hash", key_hash).execute()
            return result.data["user_id"]
        return None
    except:
        return None


# ============================================================================
# 설치형 프로그램용 API (헤더로 API 키 인증)
# ============================================================================


class DesktopGenerateRequest(BaseModel):
    image_base64: str
    mode: str = "product"
    model_type: str = "flash"
    gender: str = "female"
    category: str = "clothing"


@app.post("/api/v1/generate")
async def desktop_generate_image(
    request: DesktopGenerateRequest, x_api_key: str = Header(None, alias="X-API-Key")
):
    """설치형 프로그램용 이미지 생성 API"""

    if not x_api_key:
        raise HTTPException(status_code=401, detail="API 키가 필요합니다")

    # Rate Limiting 체크
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

    # 기존 generate 로직 재사용
    gen_request = GenerateRequest(
        user_id=user_id,
        image_base64=request.image_base64,
        mode=request.mode,
        model_type=request.model_type,
        gender=request.gender,
        category=request.category,
    )

    return await generate_image(gen_request)


@app.get("/api/v1/credits")
async def desktop_get_credits(x_api_key: str = Header(None, alias="X-API-Key")):
    """설치형 프로그램용 크레딧 조회"""

    if not x_api_key:
        raise HTTPException(status_code=401, detail="API 키가 필요합니다")

    # Rate Limiting 체크
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
# AI 분석 API (Claude 사용 - 내장)
# ============================================================================


class AnalyzeRequest(BaseModel):
    image_base64: str
    product_name: str = ""
    business_type: str = "luxury"  # luxury / fashion
    categories: Dict[str, List[str]] = {}  # 사용자 등록 카테고리
    brands: List[str] = []  # 사용자 등록 브랜드


class AnalyzeResponse(BaseModel):
    success: bool
    brand: str = ""
    brand_kr: str = ""
    category1: str = ""
    category2: str = ""
    product_name: str = ""
    product_keyword: str = ""
    gender: str = ""
    seo_title: str = ""
    seo_description: str = ""
    seo_keywords: str = ""
    error: Optional[str] = None


# 브랜드 한글 매핑
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


def build_analyze_prompt(business_type: str, categories: dict, brands: list) -> str:
    """분석 프롬프트 생성 (명품/일반 구분)"""

    # 카테고리 문자열 생성
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
- 액세서리: 벨트, 스카프, 모자, 주얼리, 선글라스"""

    if business_type == "luxury":
        brand_str = ", ".join(brands) if brands else "자동 감지"
        return f"""이 상품의 정보를 분석해주세요.

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

예시:
- 체인 자수 스웨트셔츠
- 더블G 레더 토트백"""
    else:
        return f"""이 상품의 정보를 분석해주세요.

**중요: 아래 목록에 있는 카테고리만 사용하세요!**

사용 가능한 카테고리:
{category_str}

다음 형식으로만 응답해주세요:
CATEGORY1: (위 목록의 1차 카테고리만 사용)
CATEGORY2: (위 목록의 2차 카테고리만 사용)
PRODUCT_KEYWORD: (세련된 상품 키워드 - 1차카테고리 제외)
GENDER: (여성/남성/공용)

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
    """분석 응답 파싱"""
    result = {
        "brand": "",
        "brand_kr": "",
        "category1": "",
        "category2": "",
        "product_keyword": "",
        "gender": "공용",
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

    # 한글 브랜드명 매핑
    if not result["brand_kr"] and result["brand"]:
        result["brand_kr"] = BRAND_KR_MAP.get(result["brand"].upper(), "")

    # 상품명 생성
    if business_type == "luxury" and result["brand_kr"]:
        result["product_name"] = f"{result['brand_kr']} {result['product_keyword']}"
    else:
        result["product_name"] = result["product_keyword"]

    return result


async def call_claude_api_text(prompt: str, image_base64: str = None) -> str:
    """Claude API 호출 - 텍스트 반환"""
    if not CLAUDE_API_KEY:
        return ""

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

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages", headers=headers, json=body
            )

        if response.status_code != 200:
            return ""

        data = response.json()
        return data.get("content", [{}])[0].get("text", "")

    except Exception as e:
        print(f"Claude API 오류: {e}")
        return ""


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze_product(
    request: AnalyzeRequest, x_api_key: str = Header(None, alias="X-API-Key")
):
    """상품 이미지 분석 API"""

    if not x_api_key:
        raise HTTPException(status_code=401, detail="API 키가 필요합니다")

    user_id = await verify_api_key(x_api_key)
    if not user_id:
        raise HTTPException(status_code=401, detail="유효하지 않은 API 키입니다")

    try:
        # 1단계: 이미지 분석
        analyze_prompt = build_analyze_prompt(
            request.business_type, request.categories, request.brands
        )

        response_text = await call_claude_api_text(analyze_prompt, request.image_base64)

        if not response_text:
            return AnalyzeResponse(success=False, error="분석 API 오류")

        parsed = parse_analyze_response(response_text, request.business_type)

        # 2단계: SEO 생성
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
