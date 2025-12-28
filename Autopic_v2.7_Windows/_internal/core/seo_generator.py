# -*- coding: utf-8 -*-
"""
SEO 생성 모듈
=============
- SEO 제목, 설명, 키워드 생성
"""

from typing import Optional, Dict
from dataclasses import dataclass

from .claude_client import ClaudeClient
from .product_analyzer import ProductInfo


@dataclass
class SEOContent:
    """SEO 콘텐츠"""
    title: str = ""
    description: str = ""
    keywords: str = ""
    
    def is_complete(self) -> bool:
        return all([self.title, self.description, self.keywords])
    
    def to_dict(self) -> dict:
        return {
            "seo_title": self.title,
            "seo_description": self.description,
            "seo_keywords": self.keywords,
        }


class SEOGenerator:
    """SEO 콘텐츠 생성기"""
    
    def __init__(self, claude_client: ClaudeClient):
        self.client = claude_client
    
    def generate(self, product_info: ProductInfo, callback=None) -> SEOContent:
        """
        SEO 콘텐츠 생성
        
        Args:
            product_info: 상품 정보
            callback: 진행 콜백
        
        Returns:
            SEOContent 객체
        """
        if callback:
            callback("  📝 SEO 콘텐츠 생성 중...")
        
        result = self.client.generate_seo(
            brand=product_info.brand,
            category1=product_info.category1,
            category2=product_info.category2,
            product_name=product_info.product_name,
            gender=product_info.gender
        )
        
        if not result:
            if callback:
                callback("  ⚠️ SEO 생성 실패 - API 오류")
            return SEOContent()
        
        seo = SEOContent(
            title=result.get("seo_title", ""),
            description=result.get("seo_desc", ""),
            keywords=result.get("seo_keywords", "")
        )
        
        if callback:
            if seo.is_complete():
                callback(f"  ✅ SEO 생성 완료")
            else:
                callback(f"  ⚠️ SEO 일부 누락")
        
        return seo
    
    def generate_simple(
        self,
        brand: str,
        category1: str,
        category2: str,
        product_name: str,
        gender: str,
        callback=None
    ) -> SEOContent:
        """간단한 SEO 생성 (ProductInfo 없이)"""
        info = ProductInfo(
            brand=brand,
            category1=category1,
            category2=category2,
            product_name=product_name,
            gender=gender
        )
        return self.generate(info, callback)
