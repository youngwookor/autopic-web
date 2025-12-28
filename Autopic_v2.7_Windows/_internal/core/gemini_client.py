# -*- coding: utf-8 -*-
"""
Gemini API 클라이언트
====================
- 이미지 생성: gemini-3-pro-image-preview
- 카테고리 감지: gemini-2.0-flash
- API 키 로테이션
"""

import time
import base64
from typing import Optional, List

USE_NEW_API = False
try:
    from google import genai
    from google.genai import types
    USE_NEW_API = True
except ImportError:
    try:
        import google.generativeai as genai_old
        USE_NEW_API = False
    except ImportError:
        raise ImportError("google-genai 패키지를 설치하세요: pip install google-genai")


class GeminiClient:
    """Gemini API 클라이언트 - 키 로테이션 지원"""
    
    # 모델 매핑
    MODEL_MAP = {
        "gemini-3-pro": "gemini-3-pro-image-preview",
        "gemini-2.5-flash": "gemini-2.5-flash-image-preview"
    }
    MODEL_FLASH = "gemini-2.0-flash"
    
    def __init__(self, api_keys: List[str], retry_count: int = 3, retry_delay: int = 5, image_model: str = "gemini-3-pro"):
        self.api_keys = api_keys if api_keys else []
        self.retry_count = retry_count
        self.retry_delay = retry_delay
        self.current_key_index = 0
        self.client = None
        self.failed_keys = set()
        self.image_model = self.MODEL_MAP.get(image_model, "gemini-3-pro-image-preview")
        if self.api_keys:
            self._init_client()
    
    def set_image_model(self, model_key: str):
        """이미지 생성 모델 변경"""
        self.image_model = self.MODEL_MAP.get(model_key, "gemini-3-pro-image-preview")
    
    def _init_client(self):
        if not self.api_keys:
            raise ValueError("API 키가 없습니다.")
        key = self.api_keys[self.current_key_index]
        if USE_NEW_API:
            self.client = genai.Client(api_key=key)
        else:
            genai_old.configure(api_key=key)
            self.client = genai_old
    
    def _rotate_key(self) -> bool:
        if len(self.api_keys) <= 1:
            return False
        original_index = self.current_key_index
        while True:
            self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
            if self.current_key_index == original_index:
                return False
            if self.current_key_index not in self.failed_keys:
                self._init_client()
                return True
        return False
    
    def generate_image(self, prompt: str, input_images: List[dict] = None, callback=None) -> Optional[bytes]:
        if not self.client:
            if callback:
                callback("❌ API 클라이언트가 초기화되지 않았습니다.")
            return None
        
        for attempt in range(self.retry_count):
            try:
                if USE_NEW_API:
                    parts = [{"text": prompt}]
                    if input_images:
                        for img in input_images:
                            parts.append({"inline_data": img})
                    
                    response = self.client.models.generate_content(
                        model=self.image_model,
                        contents=[{"parts": parts}],
                        config=types.GenerateContentConfig(
                            response_modalities=["IMAGE", "TEXT"],
                            temperature=0.4
                        )
                    )
                    
                    if not response.candidates:
                        if callback:
                            callback(f"  재시도 {attempt+1}/{self.retry_count} - 응답 없음")
                        time.sleep(self.retry_delay)
                        continue
                    
                    candidate = response.candidates[0]
                    if not candidate.content or not candidate.content.parts:
                        if callback:
                            callback(f"  재시도 {attempt+1}/{self.retry_count} - 컨텐츠 없음")
                        time.sleep(self.retry_delay)
                        continue
                    
                    for part in candidate.content.parts:
                        if hasattr(part, "inline_data") and part.inline_data:
                            data = part.inline_data.data
                            if isinstance(data, str):
                                return base64.b64decode(data)
                            return data
                else:
                    contents = [prompt]
                    if input_images:
                        for img in input_images:
                            img_data = base64.b64decode(img["data"])
                            contents.append({"mime_type": img["mime_type"], "data": img_data})
                    
                    response = self.client.generate_content(contents)
                    if not response.candidates:
                        if callback:
                            callback(f"  재시도 {attempt+1}/{self.retry_count} - 응답 없음")
                        time.sleep(self.retry_delay)
                        continue
                    
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, "inline_data") and part.inline_data:
                            return part.inline_data.data
                
                if callback:
                    callback(f"  재시도 {attempt+1}/{self.retry_count} - 이미지 없음")
                time.sleep(self.retry_delay)
                
            except Exception as e:
                error_str = str(e).lower()
                if "quota" in error_str or "429" in error_str or "resource_exhausted" in error_str:
                    if callback:
                        callback(f"  ⚠️ API 할당량 초과, 키 전환 시도...")
                    self.failed_keys.add(self.current_key_index)
                    if self._rotate_key():
                        if callback:
                            callback(f"  ✅ 새 API 키로 전환됨 (키 #{self.current_key_index + 1})")
                        continue
                    else:
                        if callback:
                            callback(f"  ❌ 사용 가능한 API 키 없음")
                        return None
                if callback:
                    callback(f"  재시도 {attempt+1}/{self.retry_count} - 오류: {e}")
                time.sleep(self.retry_delay)
        return None
    
    def analyze_image(self, prompt: str, image_data: str, callback=None) -> Optional[str]:
        """이미지 분석 (gemini-2.0-flash 사용)"""
        if not self.client:
            return None
        
        try:
            if USE_NEW_API:
                parts = [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": image_data}}
                ]
                response = self.client.models.generate_content(
                    model=self.MODEL_FLASH,
                    contents=[{"parts": parts}]
                )
                if response.candidates and response.candidates[0].content:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, "text"):
                            return part.text
            return None
        except Exception as e:
            if callback:
                callback(f"  ⚠️ 분석 오류: {e}")
            return None
    
    def reset_failed_keys(self):
        self.failed_keys.clear()
    
    def get_current_key_info(self) -> str:
        if not self.api_keys:
            return "키 없음"
        return f"키 #{self.current_key_index + 1}/{len(self.api_keys)}"
