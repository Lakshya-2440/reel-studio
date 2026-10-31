"""Unit tests for Brand Kit Generator module in Reel.

Covers:
- Dominant 5-color palette extraction on synthetic and fallback images.
- Voice profile linguistic analysis and version 1 rule generation.
- Visual identity and Google Font pairing synthesis.
- FastAPI endpoints: POST /brand/scrape and GET /brand/kit.
"""

from __future__ import annotations

import io
from PIL import Image
import pytest
from starlette.testclient import TestClient

from app.brand.palette_extractor import (
    BrandPalette,
    extract_palette_from_images,
    get_default_brand_palette,
    hex_to_rgb,
    rgb_to_hex,
    rgb_to_hsl,
)
from app.brand.visual_identity import create_brand_kit_card, select_font_pairing
from app.brand.voice_profiler import analyze_linguistics, VoiceProfile
from app.main import app
from app.scraper.adapter import ScrapedPost, load_demo_profile


@pytest.fixture
def api_client():
    """TestClient fixture for Reel backend FastAPI application."""
    return TestClient(app)


# -----------------------------------------------------------------------------
# 1. Palette Extraction Tests
# -----------------------------------------------------------------------------
def test_palette_extraction_synthetic_image():
    """Verify K-means palette extraction correctly identifies semantic roles on a known image."""
    # Create synthetic test canvas with distinct color regions
    img = Image.new("RGB", (120, 120), (30, 30, 36))  # Executive charcoal primary

    # Paint high-saturation orange accent in center
    for x in range(30, 80):
        for y in range(30, 80):
            img.putpixel((x, y), (242, 101, 34))  # #F26522

    # Paint emerald highlight
    for x in range(80, 110):
        for y in range(80, 110):
            img.putpixel((x, y), (16, 185, 129))  # #10B981

    palette = extract_palette_from_images([img])

    assert isinstance(palette, BrandPalette)
    assert len(palette.colors) == 5
    assert len(palette.hex_list) == 5

    # Check that each role is assigned
    roles = {c.role for c in palette.colors}
    assert "primary" in roles
    assert "accent" in roles

    # Hex strings must be valid #RRGGBB
    for c in palette.colors:
        assert c.hex.startswith("#")
        assert len(c.hex) == 7

    # Accent should have high saturation
    accent_rgb = hex_to_rgb(palette.accent)
    _, s, _ = rgb_to_hsl(*accent_rgb)
    assert s > 0.40, f"Accent saturation expected > 0.40, got {s}"


def test_palette_extraction_fallback_behavior():
    """Verify graceful zero-crash fallback when image sources are empty or invalid."""
    # 1. Empty list
    empty_res = extract_palette_from_images([])
    assert isinstance(empty_res, BrandPalette)
    assert len(empty_res.colors) == 5
    assert empty_res.primary.startswith("#")
    assert empty_res.accent.startswith("#")

    # 2. Invalid network URL
    bad_url_res = extract_palette_from_images(["http://invalid-nonexistent-domain-999.test/fake.jpg"])
    assert isinstance(bad_url_res, BrandPalette)
    assert len(bad_url_res.colors) == 5
    assert bad_url_res.surface.startswith("#")

    # 3. Custom fallback override
    custom_colors = {"primary": "#0A0A0B", "accent": "#6366F1"}
    custom_res = get_default_brand_palette(custom_colors)
    assert custom_res.primary == "#0A0A0B"
    assert custom_res.accent == "#6366F1"


def test_color_utilities():
    """Verify RGB to Hex and HSL conversions."""
    assert rgb_to_hex(255, 255, 255) == "#FFFFFF"
    assert rgb_to_hex(0, 0, 0) == "#000000"
    assert rgb_to_hex(242, 101, 34) == "#F26522"

    assert hex_to_rgb("#F26522") == (242, 101, 34)
    assert hex_to_rgb("F26522") == (242, 101, 34)

    h, s, l = rgb_to_hsl(242, 101, 34)
    assert 0.0 < h < 0.1
    assert s > 0.8
    assert 0.4 < l < 0.6


# -----------------------------------------------------------------------------
# 2. Voice Profiler Tests
# -----------------------------------------------------------------------------
def test_voice_profiler_linguistics():
    """Verify linguistic analysis extracts tone attributes, signature phrases, and rules."""
    posts = [
        ScrapedPost(
            id="p1",
            platform="linkedin",
            post_url="https://linkedin.com/posts/p1",
            text="The biggest mistake first-time founders make: they treat content like marketing instead of customer discovery. Content is asynchronous sales engineering.",
            hashtags=["#buildinpublic", "#startups"],
            likes=420,
            comments=32,
        ),
        ScrapedPost(
            id="p2",
            platform="linkedin",
            post_url="https://linkedin.com/posts/p2",
            text="We spent 6 months building 14 features. Churn dropped 18% when we deleted 6,000 lines of code and doubled down on one core loop. Stop building in a vacuum.",
            hashtags=["#startups", "#saas", "#growth"],
            likes=610,
            comments=45,
        ),
        ScrapedPost(
            id="p3",
            platform="linkedin",
            post_url="https://linkedin.com/posts/p3",
            text="If you charge per seat in 2026, you are taxing customers for adopting AI. Here is the exact value-based pricing formula we used to reach $4M ARR.",
            hashtags=["#ai", "#pricing"],
            likes=890,
            comments=78,
        ),
    ]

    profile = analyze_linguistics(posts)

    assert isinstance(profile, VoiceProfile)
    assert len(profile.summary) > 20
    assert 0.0 <= profile.tone_attributes.formal_vs_casual <= 1.0
    assert 0.0 <= profile.tone_attributes.bold_vs_measured <= 1.0
    assert profile.typical_sentence_length > 5.0
    assert len(profile.signature_phrases) >= 1
    assert len(profile.top_topics) >= 1
    assert len(profile.banned_words) >= 1

    # Check Voice Memory v1 style rules
    assert len(profile.rules) >= 3
    for r in profile.rules:
        assert r.rule_text
        assert r.category in ("Vocabulary", "Hooks", "Tone", "Formatting")
        assert r.confidence >= 0.85
        assert "before" in r.evidence_diff
        assert "after" in r.evidence_diff


def test_voice_profiler_demo_profile_corpus():
    """Verify voice profiler functions robustly on full 15-post demo creator profile."""
    posts = load_demo_profile()
    assert len(posts) >= 10

    profile = analyze_linguistics(posts)
    assert profile.typical_sentence_length > 0
    assert profile.tone_attributes.data_density >= 5
    assert len(profile.rules) == 4


# -----------------------------------------------------------------------------
# 3. Visual Identity Tests
# -----------------------------------------------------------------------------
def test_visual_identity_card_synthesis():
    """Verify complete Brand Kit Card is assembled with typography and visual rules."""
    palette = get_default_brand_palette()
    card = create_brand_kit_card(
        name="The Founder Files",
        tagline="Unvarnished perspective on scaling B2B companies.",
        palette=palette,
        voice_summary="Direct, battle-tested operator voice with high contrarian clarity.",
        bold_score=0.88,
        formal_score=0.32,
    )

    assert card.name == "The Founder Files"
    assert card.brand_name == "The Founder Files"
    assert len(card.palette) == 5
    assert len(card.palette_hex) == 5

    # Typography checks
    assert card.typography["headline_font"] in ("Syne", "Plus Jakarta Sans", "Inter Tight", "Newsreader", "Space Grotesk")
    assert card.typography["body_font"] == "Inter"
    assert "google_fonts_url" in card.typography

    # Visual rules checks
    assert len(card.visual_rules["dos"]) >= 3
    assert len(card.visual_rules["donts"]) >= 3

    # Post mockup theme checks
    assert card.mockup_theme.card_background.startswith("#")
    assert card.mockup_theme.headline_color.startswith("#")


def test_font_pairing_selection():
    """Verify font pairings adapt to tone sliders."""
    bold_pairing = select_font_pairing(bold_score=0.9, formal_score=0.3)
    assert bold_pairing.headline_font == "Syne"

    formal_pairing = select_font_pairing(bold_score=0.5, formal_score=0.8)
    assert formal_pairing.headline_font == "Newsreader"


# -----------------------------------------------------------------------------
# 4. API Endpoints Tests
# -----------------------------------------------------------------------------
def test_get_brand_kit_endpoint(api_client: TestClient):
    """Verify GET /brand/kit returns active brand kit matching frontend schema."""
    response = api_client.get("/brand/kit")
    assert response.status_code == 200, response.text
    data = response.json()

    assert "name" in data or "brand_name" in data
    assert "tagline" in data
    assert "palette" in data
    assert isinstance(data["palette"], list)
    assert len(data["palette"]) == 5

    # Check palette structure matches frontend BrandKit.palette
    for swatch in data["palette"]:
        assert "name" in swatch
        assert "hex" in swatch
        assert swatch["hex"].startswith("#")
        assert "role" in swatch

    # Check typography
    assert "typography" in data
    assert "headline_font" in data["typography"] or "headlineFont" in data["typography"]
    assert "vibe" in data["typography"]

    # Check visual rules
    assert "visual_rules" in data
    assert "dos" in data["visual_rules"]
    assert "donts" in data["visual_rules"]

    # Check voice summary
    assert "voice_summary" in data


def test_post_brand_scrape_endpoint(api_client: TestClient):
    """Verify POST /brand/scrape executes pipeline and returns complete brand kit."""
    payload = {
        "platform": "linkedin",
        "handle_or_url": "alex_founder",
        "project_id": "proj_founder_files_42",
        "limit": 5,
    }

    response = api_client.post("/brand/scrape", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["status"] == "completed"
    assert data["name"]
    assert len(data["palette"]) == 5
    assert len(data["palette_hex"]) == 5
    assert data["post_count"] > 0
    assert "typography" in data
    assert "visual_rules" in data
    assert "voice_summary" in data


def test_post_brand_scrape_with_alias_handle(api_client: TestClient):
    """Verify POST /brand/scrape accepts 'handle' as alias for 'handle_or_url'."""
    payload = {
        "platform": "instagram",
        "handle": "founderfiles",
        "limit": 3,
    }

    response = api_client.post("/brand/scrape", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "completed"
    assert len(data["palette"]) == 5
