"""Visual Identity Generator for Reel Brand Kit.

Produces aesthetic style notes (photography vs graphics, text overlays, framing),
suggests curated Google Font pairings (e.g. Syne + Inter, Plus Jakarta Sans + JetBrains Mono),
and generates exportable Brand Card JSON and visual metadata for social preview theming.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.brand.palette_extractor import BrandPalette, PaletteColor


# -----------------------------------------------------------------------------
# Typography & Visual Identity Schemas
# -----------------------------------------------------------------------------
class FontPairing(BaseModel):
    """Google Font pairing specification."""
    headline_font: str = Field(description="Primary display or headline typeface")
    body_font: str = Field(description="Body reading typeface")
    mono_font: str = Field(default="JetBrains Mono", description="Monospace font for timestamps and scores")
    vibe: str = Field(description="Aesthetic description of the typography pairing")
    google_fonts_url: str = Field(description="Direct Google Fonts embed/preview URL")


class VisualRules(BaseModel):
    """Actionable do's and don'ts for branded post generation."""
    dos: List[str] = Field(default_factory=list)
    donts: List[str] = Field(default_factory=list)


class PostCardMockupTheme(BaseModel):
    """Theme configuration for rendering social card previews and thumbnails."""
    card_background: str
    card_border: str
    headline_color: str
    body_color: str
    accent_badge_bg: str
    accent_badge_text: str
    badge_style: str = "font-mono text-xs uppercase px-2 py-0.5 rounded border"
    overlay_gradient: str = "radial-gradient(circle at top right, rgba(242,101,34,0.08), transparent 70%)"


class BrandKitCard(BaseModel):
    """Complete exportable Brand Card JSON."""
    name: str = Field(description="Brand or show name")
    brand_name: str = Field(description="Alias for name")
    tagline: str = Field(description="Brand positioning tagline")
    palette: List[Dict[str, str]] = Field(description="Frontend-compatible list of palette swatches")
    palette_hex: List[str] = Field(description="Ordered list of 5 hex strings")
    typography: Dict[str, str] = Field(description="Typography pairing and vibe")
    visual_rules: Dict[str, List[str]] = Field(description="Visual styling guidelines")
    visual_style_notes: str = Field(description="Synthesized aesthetic directive")
    voice_summary: str = Field(description="Condensed brand voice posture")
    mockup_theme: PostCardMockupTheme = Field(description="Styling tokens for preview cards")


# -----------------------------------------------------------------------------
# Curated Google Font Pairings Library
# -----------------------------------------------------------------------------
CURATED_FONT_PAIRINGS: List[FontPairing] = [
    FontPairing(
        headline_font="Syne",
        body_font="Inter",
        mono_font="JetBrains Mono",
        vibe="Editorial Brutalist / High-velocity tech startup aesthetic",
        google_fonts_url="https://fonts.google.com/share?selection.family=Inter:wght@400;600&family=JetBrains+Mono:wght@500&family=Syne:wght@700;800",
    ),
    FontPairing(
        headline_font="Inter Tight",
        body_font="Geist Sans",
        mono_font="Geist Mono",
        vibe="High-density editorial / Investor memo aesthetic. Zero fluff.",
        google_fonts_url="https://fonts.google.com/share?selection.family=Inter+Tight:wght@600;700&family=Inter:wght@400;500",
    ),
    FontPairing(
        headline_font="Plus Jakarta Sans",
        body_font="Inter",
        mono_font="JetBrains Mono",
        vibe="Modern Crisp Sans / High legibility with bold geometric presence",
        google_fonts_url="https://fonts.google.com/share?selection.family=Inter:wght@400;500&family=Plus+Jakarta+Sans:wght@700;800",
    ),
    FontPairing(
        headline_font="Space Grotesk",
        body_font="Inter",
        mono_font="Fira Code",
        vibe="Developer-first / Sharp technical authority with monospace anchors",
        google_fonts_url="https://fonts.google.com/share?selection.family=Inter:wght@400;500&family=Space+Grotesk:wght@600;700",
    ),
    FontPairing(
        headline_font="Newsreader",
        body_font="Inter",
        mono_font="JetBrains Mono",
        vibe="Authoritative Long-form / Editorial serif headline with clean modernist body",
        google_fonts_url="https://fonts.google.com/share?selection.family=Inter:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,600;1,6..72,400",
    ),
]


def select_font_pairing(bold_score: float = 0.8, formal_score: float = 0.35) -> FontPairing:
    """Select the ideal Google Font pairing based on tone attributes."""
    if bold_score >= 0.8:
        # High boldness: Syne or Space Grotesk
        return CURATED_FONT_PAIRINGS[0]
    elif formal_score >= 0.6:
        # High formality: Newsreader editorial serif
        return CURATED_FONT_PAIRINGS[4]
    elif bold_score <= 0.4:
        # Balanced: Inter Tight / Geist
        return CURATED_FONT_PAIRINGS[1]
    else:
        # Modern all-rounder
        return CURATED_FONT_PAIRINGS[2]


# -----------------------------------------------------------------------------
# Visual Rules & Style Notes Synthesis
# -----------------------------------------------------------------------------
def generate_visual_rules(palette: BrandPalette) -> VisualRules:
    """Generate high-contrast, production-ready visual rules tailored to the brand palette."""
    dos = [
        "Single high-contrast statement per carousel slide or video cover",
        "Render episode metadata, timestamps, and quantitative metrics in monospace font",
        f"Apply high-contrast dark canvas ({palette.primary}) for quote cards with crisp 1px borders",
        f"Highlight key numbers, metrics, and callouts using accent color ({palette.accent})",
        "Use authentic creator photography or documentary framing without artificial beauty filters",
    ]

    donts = [
        "No bubbly purple/cyan gradient blobs or generic AI sparkles",
        "No cartoon illustrated avatars or floating 3D icons",
        f"No low-contrast gray text on tinted backgrounds (maintain >= 4.5:1 ratio against {palette.surface})",
        "No cluttered multi-column layouts on 9:16 vertical viewports",
        "No stock photography of corporate handshakes or empty office spaces",
    ]

    return VisualRules(dos=dos, donts=donts)


def generate_aesthetic_style_notes(
    palette: BrandPalette,
    font_pairing: FontPairing,
    has_photography: bool = True,
) -> str:
    """Generate comprehensive aesthetic guidance for thumbnail and social post design."""
    media_vibe = (
        "High-contrast documentary photography with natural ambient lighting and close crop framing."
        if has_photography
        else "Clean geometric graphic layout with high typographic contrast and restrained grid alignment."
    )

    return (
        f"{media_vibe} "
        f"Background utilizes {palette.surface} for light canvas or {palette.primary} for high-authority dark cards. "
        f"Accent {palette.accent} is reserved strictly for focal numbers, metric badges, and interactive CTAs. "
        f"Typography pairs {font_pairing.headline_font} (display headlines) with {font_pairing.body_font} and "
        f"{font_pairing.mono_font} for numerical evidence and timestamps."
    )


# -----------------------------------------------------------------------------
# Brand Card Assembler
# -----------------------------------------------------------------------------
def create_brand_kit_card(
    name: str,
    tagline: str,
    palette: BrandPalette,
    voice_summary: str,
    bold_score: float = 0.8,
    formal_score: float = 0.35,
    has_photography: bool = True,
) -> BrandKitCard:
    """Assemble complete exportable Brand Card JSON matching Reel frontend and database expectations."""
    font_pairing = select_font_pairing(bold_score, formal_score)
    rules = generate_visual_rules(palette)
    style_notes = generate_aesthetic_style_notes(palette, font_pairing, has_photography)

    # Determine if surface is light or dark
    is_dark_surface = palette.surface.lower() in ("#0f172a", "#0b0b0c", "#161618", "#1a1a1a", "#1e1e24")
    card_bg = palette.surface if not is_dark_surface else "#FFFFFF"
    card_border = "#E5E5E5" if not is_dark_surface else "#27272A"
    headline_color = palette.primary if not is_dark_surface else "#09090B"
    body_color = palette.secondary if not is_dark_surface else "#71717A"

    mockup_theme = PostCardMockupTheme(
        card_background=card_bg,
        card_border=card_border,
        headline_color=headline_color,
        body_color=body_color,
        accent_badge_bg=palette.accent,
        accent_badge_text="#FFFFFF",
    )

    frontend_typography = {
        "headline_font": font_pairing.headline_font,
        "headlineFont": font_pairing.headline_font,  # camelCase alias for React components
        "body_font": font_pairing.body_font,
        "bodyFont": font_pairing.body_font,
        "mono_font": font_pairing.mono_font,
        "vibe": font_pairing.vibe,
        "google_fonts_url": font_pairing.google_fonts_url,
    }

    frontend_visual_rules = {
        "dos": rules.dos,
        "donts": rules.donts,
    }

    return BrandKitCard(
        name=name,
        brand_name=name,
        tagline=tagline,
        palette=palette.to_frontend_format(),
        palette_hex=palette.hex_list,
        typography=frontend_typography,
        visual_rules=frontend_visual_rules,
        visual_style_notes=style_notes,
        voice_summary=voice_summary,
        mockup_theme=mockup_theme,
    )
