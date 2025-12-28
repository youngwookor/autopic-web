# -*- coding: utf-8 -*-
"""
웹 API 클라이언트
================
Autopic 웹 서버 API 연동
+ TARGET 자동 감지 지원
"""

import base64
import requests
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


@dataclass
class WebApiResponse:
    """웹 API 응답"""

    success: bool
    images: List[bytes] = None
    credits_used: int = 0
    remaining_credits: int = 0
    error: str = ""


@dataclass
class AnalyzeResponse:
    """분석 API 응답"""

    success: bool
    brand: str = ""
    brand_kr: str = ""
    category1: str = ""
    category2: str = ""
    product_name: str = ""
    product_keyword: str = ""
    gender: str = ""
    target: str = "사람"  # 사람/아동/반려동물
    seo_title: str = ""
    seo_description: str = ""
    seo_keywords: str = ""
    error: str = ""


class WebApiClient:
    """Autopic 웹 API 클라이언트"""

    def __init__(self, api_key: str, api_url: str = "http://43.200.229.169:8000"):
        self.api_key = api_key
        self.api_url = api_url.rstrip("/")
        self.timeout = 120

    def _get_headers(self) -> Dict[str, str]:
        return {"X-API-Key": self.api_key, "Content-Type": "application/json"}

    def check_credits(self) -> Dict[str, Any]:
        try:
            url = f"{self.api_url}/api/v1/credits"
            print(f"[WebAPI] 크레딧 조회: {url}")
            print(f"[WebAPI] API Key: {self.api_key[:20]}...")

            response = requests.get(url, headers=self._get_headers(), timeout=10)
            print(f"[WebAPI] 응답 코드: {response.status_code}")

            if response.status_code == 401:
                return {
                    "success": False,
                    "error": "유효하지 않은 API 키입니다",
                    "credits": 0,
                }
            if response.status_code == 200:
                data = response.json()
                print(f"[WebAPI] 크레딧: {data.get('credits', 0)}, 키 이름: {data.get('key_name', '')}")
                return {
                    "success": True,
                    "credits": data.get("credits", 0),
                    "key_name": data.get("key_name", ""),
                }
            return {
                "success": False,
                "error": f"서버 오류: {response.status_code}",
                "credits": 0,
            }
        except requests.exceptions.ConnectionError as e:
            print(f"[WebAPI] 연결 오류: {e}")
            return {
                "success": False,
                "error": "서버에 연결할 수 없습니다",
                "credits": 0,
            }
        except requests.exceptions.Timeout:
            return {"success": False, "error": "요청 시간 초과", "credits": 0}
        except Exception as e:
            print(f"[WebAPI] 예외: {e}")
            return {"success": False, "error": str(e), "credits": 0}

    def generate_images(
        self,
        image_data: bytes,
        mode: str = "product",
        model_type: str = "flash",
        gender: str = "female",
        category: str = "clothing",
        target: str = "사람",
    ) -> WebApiResponse:
        try:
            image_base64 = base64.b64encode(image_data).decode("utf-8")
            payload = {
                "image_base64": image_base64,
                "mode": mode,
                "model_type": model_type,
                "gender": gender,
                "category": category,
                "target": target,
            }
            response = requests.post(
                f"{self.api_url}/api/v1/generate",
                headers=self._get_headers(),
                json=payload,
                timeout=self.timeout,
            )
            if response.status_code == 401:
                return WebApiResponse(success=False, error="유효하지 않은 API 키입니다")
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    images = [
                        base64.b64decode(img_b64) for img_b64 in data.get("images", [])
                    ]
                    return WebApiResponse(
                        success=True,
                        images=images,
                        credits_used=data.get("credits_used", 0),
                        remaining_credits=data.get("remaining_credits", 0),
                    )
                else:
                    return WebApiResponse(
                        success=False, error=data.get("error", "이미지 생성 실패")
                    )
            return WebApiResponse(
                success=False, error=f"서버 오류: {response.status_code}"
            )
        except requests.exceptions.ConnectionError:
            return WebApiResponse(success=False, error="서버에 연결할 수 없습니다")
        except requests.exceptions.Timeout:
            return WebApiResponse(success=False, error="요청 시간 초과 (2분)")
        except Exception as e:
            return WebApiResponse(success=False, error=str(e))

    def analyze_product(
        self,
        image_data: bytes,
        product_name: str = "",
        text_content: str = "",
        business_type: str = "luxury",
        categories: Dict[str, List[str]] = None,
        brands: List[str] = None,
    ) -> AnalyzeResponse:
        """
        상품 분석 API 호출 (브랜드, 카테고리, 성별, TARGET, SEO)

        Args:
            image_data: 원본 이미지 바이트
            product_name: 폴더명/상품코드
            text_content: 텍스트 파일 내용 (상품 설명 등)
            business_type: 업종 (luxury / fashion)
            categories: 사용자 등록 카테고리
            brands: 사용자 등록 브랜드

        Returns:
            AnalyzeResponse: 분석 결과 (target 포함)
        """
        try:
            image_base64 = base64.b64encode(image_data).decode("utf-8")

            payload = {
                "image_base64": image_base64,
                "product_name": product_name,
                "text_content": text_content,
                "business_type": business_type,
                "categories": categories or {},
                "brands": brands or [],
            }

            response = requests.post(
                f"{self.api_url}/api/v1/analyze",
                headers=self._get_headers(),
                json=payload,
                timeout=60,
            )

            if response.status_code == 401:
                return AnalyzeResponse(
                    success=False, error="유효하지 않은 API 키입니다"
                )

            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    return AnalyzeResponse(
                        success=True,
                        brand=data.get("brand", ""),
                        brand_kr=data.get("brand_kr", ""),
                        category1=data.get("category1", ""),
                        category2=data.get("category2", ""),
                        product_name=data.get("product_name", ""),
                        product_keyword=data.get("product_keyword", ""),
                        gender=data.get("gender", ""),
                        target=data.get("target", "사람"),
                        seo_title=data.get("seo_title", ""),
                        seo_description=data.get("seo_description", ""),
                        seo_keywords=data.get("seo_keywords", ""),
                        error=data.get("error", ""),
                    )
                else:
                    return AnalyzeResponse(
                        success=False, error=data.get("error", "분석 실패")
                    )

            return AnalyzeResponse(
                success=False, error=f"서버 오류: {response.status_code}"
            )

        except requests.exceptions.ConnectionError:
            return AnalyzeResponse(success=False, error="서버에 연결할 수 없습니다")
        except requests.exceptions.Timeout:
            return AnalyzeResponse(success=False, error="요청 시간 초과")
        except Exception as e:
            return AnalyzeResponse(success=False, error=str(e))

    def verify_api_key(self) -> bool:
        result = self.check_credits()
        return result.get("success", False)
