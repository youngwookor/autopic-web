# -*- coding: utf-8 -*-
"""
Claude API 클라이언트
====================
- 상품 분석
- SEO 생성
"""

import base64
import httpx
from pathlib import Path
from typing import Optional, Dict, Any


class ClaudeClient:
    """Claude API 클라이언트"""
    
    API_URL = "https://api.anthropic.com/v1/messages"
    
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.api_key = api_key
        self.model = model
        self.timeout = 120  # 2분 타임아웃
    
    def _make_request(
        self,
        messages: list,
        max_tokens: int = 2000,
        system: str = None
    ) -> Optional[str]:
        """API 요청"""
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": messages
        }
        
        if system:
            payload["system"] = system
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.API_URL, headers=headers, json=payload)
                response.raise_for_status()
                
                result = response.json()
                if result.get("content"):
                    return result["content"][0]["text"]
                return None
                
        except Exception as e:
            print(f"[Claude API 오류] {e}")
            return None
    
    def analyze_with_image(
        self,
        image_path: Path,
        text_content: str,
        prompt: str
    ) -> Optional[str]:
        """이미지 + 텍스트 분석"""
        
        # 이미지 로드
        try:
            with open(image_path, "rb") as f:
                image_data = base64.standard_b64encode(f.read()).decode("utf-8")
            
            # 확장자로 mime type 결정
            ext = image_path.suffix.lower()
            mime_type = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".gif": "image/gif",
                ".webp": "image/webp"
            }.get(ext, "image/jpeg")
            
        except Exception as e:
            print(f"[이미지 로드 오류] {e}")
            return None
        
        # 메시지 구성
        content = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": mime_type,
                    "data": image_data
                }
            },
            {
                "type": "text",
                "text": f"상품 설명:\n{text_content}\n\n{prompt}"
            }
        ]
        
        messages = [{"role": "user", "content": content}]
        
        return self._make_request(messages)
    
    def analyze_text_only(self, text_content: str, prompt: str) -> Optional[str]:
        """텍스트만 분석"""
        messages = [
            {
                "role": "user",
                "content": f"{text_content}\n\n{prompt}"
            }
        ]
        
        return self._make_request(messages)
    
    def generate_seo(
        self,
        brand: str,
        category1: str,
        category2: str,
        product_name: str,
        gender: str
    ) -> Optional[Dict[str, str]]:
        """SEO 콘텐츠 생성"""
        
        prompt = f"""다음 상품 정보를 바탕으로 SEO 콘텐츠를 생성해주세요.

상품 정보:
- 브랜드: {brand}
- 1차 카테고리: {category1}
- 2차 카테고리: {category2}
- 상품명: {product_name}
- 성별: {gender}

다음 형식으로만 응답해주세요 (다른 설명 없이):
SEO_TITLE: (50자 내외의 검색 최적화 제목)
SEO_DESC: (150자 내외의 상품 설명)
SEO_KEYWORDS: (쉼표로 구분된 검색 키워드 10개)"""

        messages = [{"role": "user", "content": prompt}]
        
        response = self._make_request(messages, max_tokens=500)
        
        if not response:
            return None
        
        # 파싱
        result = {}
        for line in response.strip().split("\n"):
            if line.startswith("SEO_TITLE:"):
                result["seo_title"] = line.replace("SEO_TITLE:", "").strip()
            elif line.startswith("SEO_DESC:"):
                result["seo_desc"] = line.replace("SEO_DESC:", "").strip()
            elif line.startswith("SEO_KEYWORDS:"):
                result["seo_keywords"] = line.replace("SEO_KEYWORDS:", "").strip()
        
        return result if result else None
