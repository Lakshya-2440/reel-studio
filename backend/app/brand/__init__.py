"""Brand Kit Generator module for Reel.

Provides palette extraction, voice profiling from scraped social posts,
Google Font pairing suggestions, visual identity card generation, and API router.
"""

from app.brand.palette_extractor import (
    BrandPalette,
    PaletteColor,
    extract_palette_from_images,
    get_default_brand_palette,
)
from app.brand.visual_identity import (
    BrandKitCard,
    FontPairing,
    create_brand_kit_card,
    select_font_pairing,
)
from app.brand.voice_profiler import (
    ToneSliders,
    VoiceProfile,
    VoiceRule,
    analyze_linguistics,
    profile_voice_with_llm,
    save_voice_profile_to_db,
)

__all__ = [
    "BrandPalette",
    "PaletteColor",
    "extract_palette_from_images",
    "get_default_brand_palette",
    "BrandKitCard",
    "FontPairing",
    "create_brand_kit_card",
    "select_font_pairing",
    "ToneSliders",
    "VoiceProfile",
    "VoiceRule",
    "analyze_linguistics",
    "profile_voice_with_llm",
    "save_voice_profile_to_db",
]
