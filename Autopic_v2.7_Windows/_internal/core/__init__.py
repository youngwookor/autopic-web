# -*- coding: utf-8 -*-
"""
Autopic Desktop - Core Package
"""

from .settings import (
    Settings,
    Brands,
    SettingsManager,
    get_manager,
    get_settings,
    get_brands,
    get_business_types,
    BUSINESS_TYPES,
)

from .gemini_client import GeminiClient
from .claude_client import ClaudeClient

from .image_generator import (
    ImageGenerator,
    get_category_group,
    build_model_prompt,
    CATEGORY_CONFIG,
    CATEGORY1_TO_GROUP,
    CATEGORY2_TO_GROUP,
)
from .product_analyzer import ProductAnalyzer, ProductInfo, ImageSorter
from .seo_generator import SEOGenerator, SEOContent

from .processor import MainProcessor, ProcessResult

__all__ = [
    "Settings",
    "Brands",
    "SettingsManager",
    "get_manager",
    "get_settings",
    "get_brands",
    "get_business_types",
    "BUSINESS_TYPES",
    "GeminiClient",
    "ClaudeClient",
    "ImageGenerator",
    "get_category_group",
    "build_model_prompt",
    "CATEGORY_CONFIG",
    "CATEGORY1_TO_GROUP",
    "CATEGORY2_TO_GROUP",
    "ProductAnalyzer",
    "ProductInfo",
    "ImageSorter",
    "SEOGenerator",
    "SEOContent",
    "MainProcessor",
    "ProcessResult",
]
