# -*- coding: utf-8 -*-
"""
설정 관리 모듈
=============
- 설정 파일 로드/저장
- 브랜드 관리
"""

import json
from pathlib import Path
from typing import Optional, List, Dict
from dataclasses import dataclass, field


# 업종 타입 정의
BUSINESS_TYPES = {
    "luxury": {"name": "명품 패션", "icon": "👜", "use_brand": True},
    "general": {"name": "일반 패션", "icon": "👕", "use_brand": False},
    "pet": {"name": "펫 용품", "icon": "🐕", "use_brand": False},
    "kids": {"name": "키즈 용품", "icon": "🧒", "use_brand": False},
}


@dataclass
class Settings:
    """앱 설정"""
    CLAUDE_API_KEY: str = ""
    GEMINI_API_KEYS: List[str] = field(default_factory=list)
    
    # 웹 API 연동 설정
    WEB_API_KEY: str = ""
    WEB_API_URL: str = "http://43.200.229.169:8000"
    USE_WEB_API: bool = False
    
    LAST_WORK_FOLDER: str = ""
    DEFAULT_GENDER: str = "auto"
    
    # 업종 설정 (luxury, general, pet, kids)
    BUSINESS_TYPE: str = "luxury"
    
    # 이미지 생성 모델 설정
    IMAGE_MODEL: str = "gemini-3-pro"
    
    GENERATE_BASIC_PRODUCT: bool = True
    GENERATE_BASIC_MODEL: bool = True
    GENERATE_EDITORIAL_PRODUCT: bool = False
    GENERATE_EDITORIAL_MODEL: bool = False
    
    UPSCALE_FACTOR: int = 4
    GEMINI_RETRY_COUNT: int = 3
    GEMINI_RETRY_DELAY: int = 5
    
    @property
    def use_brand(self) -> bool:
        """업종에 따라 브랜드 사용 여부 결정"""
        return BUSINESS_TYPES.get(self.BUSINESS_TYPE, {}).get("use_brand", False)
    
    @property
    def business_type_name(self) -> str:
        """업종 한글 이름"""
        return BUSINESS_TYPES.get(self.BUSINESS_TYPE, {}).get("name", "일반 패션")
    
    @property
    def target_type(self) -> str:
        """업종에 따른 TARGET 타입"""
        if self.BUSINESS_TYPE == "pet":
            return "반려동물"
        elif self.BUSINESS_TYPE == "kids":
            return "아동"
        else:
            return "사람"


@dataclass  
class Brands:
    """브랜드 설정"""
    data: List[str] = field(default_factory=list)
    
    def add(self, name: str):
        if name and name not in self.data:
            self.data.append(name)
            self.data.sort()
    
    def remove(self, name: str):
        if name in self.data:
            self.data.remove(name)
    
    def exists(self, name: str) -> bool:
        return name.upper() in [b.upper() for b in self.data]
    
    def to_list(self) -> List[str]:
        return self.data
    
    @classmethod
    def from_list(cls, data: list) -> "Brands":
        return cls(data=data if data else [])
    
    @classmethod
    def default(cls) -> "Brands":
        return cls(data=[
            "GUCCI", "LOUIS VUITTON", "CHANEL", "PRADA", "HERMES",
            "DIOR", "BURBERRY", "BALENCIAGA", "BOTTEGA VENETA",
            "SAINT LAURENT", "CELINE", "LOEWE", "FENDI"
        ])


class SettingsManager:
    """설정 관리자"""
    
    def __init__(self, config_path: Path = None):
        if config_path is None:
            config_path = Path.home() / ".autopic"
        
        self.config_path = config_path
        self.config_path.mkdir(parents=True, exist_ok=True)
        
        self.settings_file = self.config_path / "settings.json"
        self.brands_file = self.config_path / "brands.json"
        
        self.settings = Settings()
        self.brands = Brands.default()
        
        self.load_all()
    
    def load_all(self):
        self.load_settings()
        self.load_brands()
    
    def save_all(self):
        self.save_settings()
        self.save_brands()
    
    def load_settings(self):
        if self.settings_file.exists():
            try:
                with open(self.settings_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                self.settings.CLAUDE_API_KEY = data.get("claude_api_key", "")
                self.settings.GEMINI_API_KEYS = data.get("gemini_api_keys", [])
                self.settings.WEB_API_KEY = data.get("web_api_key", "")
                self.settings.WEB_API_URL = data.get("web_api_url", "http://43.200.229.169:8000")
                self.settings.USE_WEB_API = data.get("use_web_api", False)
                self.settings.LAST_WORK_FOLDER = data.get("last_work_folder", "")
                self.settings.DEFAULT_GENDER = data.get("default_gender", "auto")
                self.settings.BUSINESS_TYPE = data.get("business_type", "luxury")
                self.settings.IMAGE_MODEL = data.get("image_model", "gemini-3-pro")
                self.settings.GENERATE_BASIC_PRODUCT = data.get("generate_basic_product", True)
                self.settings.GENERATE_BASIC_MODEL = data.get("generate_basic_model", True)
                self.settings.GENERATE_EDITORIAL_PRODUCT = data.get("generate_editorial_product", False)
                self.settings.GENERATE_EDITORIAL_MODEL = data.get("generate_editorial_model", False)
                self.settings.UPSCALE_FACTOR = data.get("upscale_factor", 4)
                self.settings.GEMINI_RETRY_COUNT = data.get("gemini_retry_count", 3)
                self.settings.GEMINI_RETRY_DELAY = data.get("gemini_retry_delay", 5)
            except Exception as e:
                print(f"설정 로드 실패: {e}")
    
    def save_settings(self):
        try:
            data = {
                "claude_api_key": self.settings.CLAUDE_API_KEY,
                "gemini_api_keys": self.settings.GEMINI_API_KEYS,
                "web_api_key": self.settings.WEB_API_KEY,
                "web_api_url": self.settings.WEB_API_URL,
                "use_web_api": self.settings.USE_WEB_API,
                "last_work_folder": self.settings.LAST_WORK_FOLDER,
                "default_gender": self.settings.DEFAULT_GENDER,
                "business_type": self.settings.BUSINESS_TYPE,
                "image_model": self.settings.IMAGE_MODEL,
                "generate_basic_product": self.settings.GENERATE_BASIC_PRODUCT,
                "generate_basic_model": self.settings.GENERATE_BASIC_MODEL,
                "generate_editorial_product": self.settings.GENERATE_EDITORIAL_PRODUCT,
                "generate_editorial_model": self.settings.GENERATE_EDITORIAL_MODEL,
                "upscale_factor": self.settings.UPSCALE_FACTOR,
                "gemini_retry_count": self.settings.GEMINI_RETRY_COUNT,
                "gemini_retry_delay": self.settings.GEMINI_RETRY_DELAY,
            }
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"설정 저장 실패: {e}")
    
    def load_brands(self):
        if self.brands_file.exists():
            try:
                with open(self.brands_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.brands = Brands.from_list(data)
            except Exception as e:
                print(f"브랜드 로드 실패: {e}")
                self.brands = Brands.default()
        else:
            self.brands = Brands.default()
            self.save_brands()
    
    def save_brands(self):
        try:
            with open(self.brands_file, "w", encoding="utf-8") as f:
                json.dump(self.brands.to_list(), f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"브랜드 저장 실패: {e}")


_manager: Optional[SettingsManager] = None


def get_manager() -> SettingsManager:
    global _manager
    if _manager is None:
        _manager = SettingsManager()
    return _manager


def get_settings() -> Settings:
    return get_manager().settings


def get_brands() -> Brands:
    return get_manager().brands


def get_business_types() -> dict:
    return BUSINESS_TYPES
