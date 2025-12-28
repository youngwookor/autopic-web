# -*- coding: utf-8 -*-
"""
상품 분석 모듈
=============
- 이미지 + 텍스트로 상품 정보 추출
- 브랜드, 상품명, 성별 분석
"""

import json
import re
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass

from .claude_client import ClaudeClient
from .settings import get_brands, get_settings


BRAND_KR_MAP = {
    "GUCCI": "구찌", "LOUIS VUITTON": "루이비통", "CHANEL": "샤넬",
    "PRADA": "프라다", "HERMES": "에르메스", "DIOR": "디올",
    "BURBERRY": "버버리", "BALENCIAGA": "발렌시아가",
    "BOTTEGA VENETA": "보테가 베네타", "SAINT LAURENT": "생로랑",
    "CELINE": "셀린느", "LOEWE": "로에베", "FENDI": "펜디",
    "VALENTINO": "발렌티노", "GIVENCHY": "지방시", "MIU MIU": "미우미우",
    "VERSACE": "베르사체", "COACH": "코치", "MICHAEL KORS": "마이클코어스",
    "TORY BURCH": "토리버치", "CHROME HEARTS": "크롬하츠",
    "THOM BROWNE": "톰브라운", "ALEXANDER MCQUEEN": "알렉산더맥퀸",
    "DOLCE & GABBANA": "돌체앤가바나", "JIMMY CHOO": "지미추",
    "ROGER VIVIER": "로저비비에", "BRUNELLO CUCINELLI": "브루넬로 쿠치넬리",
}


@dataclass
class ProductInfo:
    brand: str = ""
    brand_kr: str = ""
    product_name: str = ""
    product_keyword: str = ""
    gender: str = "공용"
    brand_is_new: bool = False
    
    def is_complete(self) -> bool:
        return bool(self.product_name)
    
    def build_product_name(self) -> str:
        """상품명 생성: 한글브랜드 + 고유키워드"""
        parts = []
        
        # 한글 브랜드명
        if self.brand_kr:
            parts.append(self.brand_kr)
        elif self.brand:
            kr_name = BRAND_KR_MAP.get(self.brand.upper(), self.brand)
            parts.append(kr_name)
        
        # 고유 키워드
        if self.product_keyword:
            parts.append(self.product_keyword)
        
        return " ".join(parts)
    
    def to_dict(self) -> dict:
        return {
            "brand": self.brand, 
            "brand_kr": self.brand_kr,
            "product_name": self.product_name, 
            "product_keyword": self.product_keyword,
            "gender": self.gender,
        }


class ProductAnalyzer:
    def __init__(self, claude_client: ClaudeClient):
        self.client = claude_client
    
    def _build_analysis_prompt(self, analyze_brand: bool = True) -> str:
        brands = get_brands()
        settings = get_settings()
        
        # 업종별 프롬프트
        if analyze_brand:
            # 명품 패션 모드
            brand_str = ", ".join(brands.data) if brands.data else "자동 감지"
            
            prompt = f"""이 상품의 정보를 분석해주세요.

등록된 브랜드: {brand_str}

다음 형식으로만 응답해주세요:
BRAND: (브랜드명 영문. 예: GUCCI)
BRAND_KR: (브랜드명 한글. 예: 구찌)
PRODUCT_KEYWORD: (세련된 상품 키워드)
GENDER: (여성/남성/공용)

PRODUCT_KEYWORD 작성 규칙:
1. 브랜드명 제외
2. 모델명/시그니처 + 소재/특징 + 상품유형 형태
3. 자연스럽고 세련된 한글 표현 사용

예시:
- 체인 자수 스웨트셔츠 (O)
- 더블G 레더 토트백 (O)
- 모노그램 캔버스 크로스백 (O)"""
        else:
            # 일반/펫/키즈 패션 모드 (브랜드 없음)
            business_type = settings.BUSINESS_TYPE
            
            if business_type == 'pet':
                prompt = """이 반려동물 용품의 정보를 분석해주세요.

다음 형식으로만 응답해주세요:
PRODUCT_KEYWORD: (세련된 상품 키워드)
GENDER: (공용)

PRODUCT_KEYWORD 작성 규칙:
1. 소재/특징 + 상품유형 형태
2. 반려동물 관련 키워드 포함

예시:
- 귀여운 패딩 강아지 옷 (O)
- 캐주얼 체크 펫 조끼 (O)"""
            elif business_type == 'kids':
                prompt = """이 아동복의 정보를 분석해주세요.

다음 형식으로만 응답해주세요:
PRODUCT_KEYWORD: (세련된 상품 키워드)
GENDER: (여아/남아/공용)

PRODUCT_KEYWORD 작성 규칙:
1. 소재/특징 + 상품유형 형태
2. 아동 관련 키워드 포함

예시:
- 귀여운 프릴 원피스 (O)
- 캐주얼 면 티셔츠 (O)"""
            else:
                # 일반 패션
                prompt = """이 상품의 정보를 분석해주세요.

다음 형식으로만 응답해주세요:
PRODUCT_KEYWORD: (세련된 상품 키워드)
GENDER: (여성/남성/공용)

PRODUCT_KEYWORD 작성 규칙:
1. 소재/특징 + 상품유형 형태
2. 자연스럽고 세련된 한글 표현 사용

예시:
- 코튼 오버핏 후드 티셔츠 (O)
- 레더 미니 크로스백 (O)"""
        
        return prompt
    
    def analyze(self, image_path: Path, text_content: str, callback=None, analyze_brand: bool = True) -> ProductInfo:
        if callback:
            callback("  🔍 상품 분석 중...")
        
        prompt = self._build_analysis_prompt(analyze_brand=analyze_brand)
        response = self.client.analyze_with_image(image_path, text_content, prompt)
        
        if not response:
            if callback:
                callback("  ⚠️ 상품 분석 실패 - API 오류")
            return ProductInfo()
        
        info = self._parse_response(response, analyze_brand=analyze_brand)
        
        # 브랜드 검증 (브랜드 분석 활성화 시만)
        if analyze_brand:
            brands = get_brands()
            if info.brand and not brands.exists(info.brand):
                info.brand_is_new = True
                if callback:
                    callback(f"  ⚠️ 새 브랜드 발견: {info.brand}")
        
        if callback:
            if analyze_brand:
                callback(f"  ✅ 분석 완료: {info.brand}")
                callback(f"  📝 상품명: {info.product_name}")
            else:
                callback(f"  ✅ 분석 완료")
                callback(f"  📝 상품명: {info.product_name}")
        
        return info
    
    def _parse_response(self, response: str, analyze_brand: bool = True) -> ProductInfo:
        info = ProductInfo()
        
        for line in response.strip().split("\n"):
            line = line.strip()
            if analyze_brand and line.startswith("BRAND:"):
                info.brand = line.replace("BRAND:", "").strip()
            elif analyze_brand and line.startswith("BRAND_KR:"):
                info.brand_kr = line.replace("BRAND_KR:", "").strip()
            elif line.startswith("PRODUCT_KEYWORD:"):
                info.product_keyword = line.replace("PRODUCT_KEYWORD:", "").strip()
            elif line.startswith("GENDER:"):
                gender = line.replace("GENDER:", "").strip()
                if gender in ["여성", "남성", "공용", "여아", "남아"]:
                    info.gender = gender
        
        # 상품명 생성
        if not info.product_name:
            if analyze_brand:
                info.product_name = info.build_product_name()
            else:
                info.product_name = info.product_keyword or ""
        
        # 한글 브랜드명 매핑
        if analyze_brand and not info.brand_kr and info.brand:
            info.brand_kr = BRAND_KR_MAP.get(info.brand.upper(), "")
        
        return info


class ImageSorter:
    """이미지 자동 정렬 (5.jpg, 6.jpg 등)"""
    def __init__(self, claude_client: ClaudeClient):
        self.client = claude_client
    
    def sort_images(self, folder_path: Path, callback=None) -> bool:
        """폴더 내 이미지를 분석하여 정렬"""
        # 이미 정렬된 경우 스킵
        if (folder_path / "5.jpg").exists():
            return True
        
        img_ext = ['.jpg', '.jpeg', '.png', '.webp']
        images = sorted([f for f in folder_path.glob("*") if f.suffix.lower() in img_ext])
        
        if not images:
            return False
        
        if callback:
            callback(f"  📷 이미지 {len(images)}개 발견")
        
        # 첫 번째 이미지를 5.jpg로
        if images:
            first = images[0]
            new_name = folder_path / f"5{first.suffix.lower()}"
            if first != new_name:
                first.rename(new_name)
        
        # 두 번째 이미지를 6.jpg로
        if len(images) > 1:
            second = images[1]
            new_name = folder_path / f"6{second.suffix.lower()}"
            if second != new_name:
                second.rename(new_name)
        
        return True
