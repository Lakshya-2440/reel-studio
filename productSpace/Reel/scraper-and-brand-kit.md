---
tags:
  - "#feature/scraper"
  - "#agent/scraper-adapter"
  - "#agent/brand-agent"
---

# Scraper Adapter & Brand Kit Extraction

## Status: Scraper Adapter Complete ✅

Implemented in `/backend/app/scraper/adapter.py`:
- Wrapped user's `Scrapling` repository (`scrapling.fetchers.Fetcher` and `scrapling.parser.Selector`).
- Standardized Pydantic models:
  - `ScrapedPost`: `{id, platform, post_url, text, image_urls, likes, comments, timestamp, hashtags, raw_metadata}` + alias properties `date`, `media_urls`.
  - `CreatorProfile`: `{handle, name, title, bio, website, follower_count, following_count, total_posts, profile_image_url, brand_colors}`.
  - `ScrapeResult`: `{platform, handle, profile_url, is_fallback, fallback_reason, creator_profile, posts}`.
- Core functions:
  - `scrape_profile(platform: str, handle_or_url: str, limit: int = 30) -> list[ScrapedPost]`
  - `scrape_profile_with_metadata(platform: str, handle_or_url: str, limit: int = 30) -> ScrapeResult`
  - `load_demo_profile(platform: Optional[str] = None, limit: int = 30) -> list[ScrapedPost]`
  - `parse_pasted_posts(text: str, platform: str = "custom") -> list[ScrapedPost]`
  - `normalize_handle_or_url(platform: str, handle_or_url: str) -> tuple[str, str]`
  - `get_demo_creator_profile() -> CreatorProfile`

## Reliability Safeguards & Zero-Failure Demo Path
1. **Pre-seeded Demo Profile Cache (`backend/app/scraper/cached_demo_profile.json`)**:
   - 15 realistic posts across tech, media, and YC founder themes (The Founder Files / Alex Rivera).
   - High-quality Unsplash photography URLs suitable for `colorthief`/PIL palette extraction.
   - Rich engagement counts, timestamps, and hashtags.
2. **Automatic Anti-Bot Fallback**:
   - Instagram and LinkedIn require session auth or block unauthenticated crawlers (HTTP 999 / login walls / empty bodies).
   - If live scrape returns < 500 bytes, redirects to authwall/login, or raises network/bot exceptions, the adapter transparently falls back to `cached_demo_profile.json`.
   - Never crashes in front of judges during live demos.
3. **Manual Paste Parser (`parse_pasted_posts`)**:
   - Accepts multi-post text chunks delimited by `---`, numbered markers (`1.`, `Post 1:`), or paragraph breaks.
   - Extracts hashtags and image URLs automatically.

## Verification
- Unit test suite: `backend/tests/test_scraper.py` (5/5 tests passing).
- Tests cover demo profile loading, creator metadata, handle normalization, anti-bot fallback, and pasted post parsing.

## Brand Kit Generator Implementation (Brand-Agent Complete ✅)

Implemented in `/backend/app/brand`:
1. **Dominant Palette Extractor (`palette_extractor.py`)**:
   - PIL K-means clustering with K-means++ seeding and Lloyd's iterative refinement (sub-25ms execution). Optional `colorthief` support.
   - Categorizes extracted dominant clusters into 5 semantic roles:
     - `primary`: Bold brand anchor tone (Executive Charcoal `#1E1E24`).
     - `secondary`: Supporting structure tone (Steel Slate `#4A4E69`).
     - `accent`: Highest saturation pop hue (YC Flame Amber `#F26522`).
     - `surface`: Light canvas background (`#FAF9F6`) or dark authority background.
     - `text`: High-contrast reading font color (`#111827`).
   - Generates human-friendly color names by HSL angle and lightness (`name_color`).
   - Zero-crash fallback engine (`get_default_brand_palette`) handling network errors, missing media, and corrupted files.

2. **Voice Profiler (`voice_profiler.py`)**:
   - Analyzes scraped social posts via `LLMRouter` (with deterministic linguistic fallback).
   - Computes quantitative metrics:
     - `formal_vs_casual` (0.0 - 1.0) via contraction frequency and conversational markers.
     - `bold_vs_measured` (0.0 - 1.0) via assertion/loss framing words.
     - `short_vs_long` (0.0 - 1.0) and `typical_sentence_length` (target words/sentence).
     - `data_density` (1-10) and `punchiness` (1-10).
   - Extracts recurring signature phrases (e.g., *"The biggest mistake first-time founders make"*, *"Here is the math"*).
   - Identifies top domain topics and auto-flags corporate buzzwords to ban (`synergy`, `leverage`, `game-changer`, `delve`).
   - Generates 4 initial actionable style rules with before/after evidence diffs.
   - Persists `VoiceProfile` (version 1) and initial rules into database (`voice_profiles` and `voice_rules` tables) to bootstrap Brand Voice Memory.

3. **Visual Identity & Font Pairing Engine (`visual_identity.py`)**:
   - Suggests curated Google Font pairings matched to creator tone sliders:
     - `Syne` (display) + `Inter` (body) + `JetBrains Mono` (metadata) for tech startups / high-velocity founders.
     - `Inter Tight` + `Geist Sans` for high-density investor memo aesthetics.
     - `Plus Jakarta Sans` + `Inter` for modern clean contrast.
     - `Newsreader` + `Inter` for editorial thought leadership.
   - Synthesizes comprehensive visual rules (`dos` and `donts`) and aesthetic style notes.
   - Generates preview card mockup tokens (`PostCardMockupTheme`) to theme social post previews.
   - Assembles exportable Brand Card JSON matching frontend `BrandKit` interface.

4. **API Router (`router.py`)**:
   - `POST /brand/scrape`: Accepts `{platform, handle_or_url, project_id, limit}`. Runs Scrapling adapter, extracts image palette and voice profile, synthesizes brand card, caches scraped posts and brand kit into Neon Postgres / SQLite, and returns complete Brand Kit response.
   - `GET /brand/kit`: Retrieves active brand kit for project from database with zero-empty-state fallback.
   - Mounted in `backend/app/api/router.py`.

## Verification & Test Suite
- `backend/tests/test_brand.py` (10/10 tests passing):
  - `test_palette_extraction_synthetic_image`: Verifies K-means cluster extraction and role assignment on synthetic multi-color image.
  - `test_palette_extraction_fallback_behavior`: Verifies graceful fallback on empty sources and invalid URLs.
  - `test_color_utilities`: Tests RGB to Hex, Hex to RGB, and HSL conversions.
  - `test_voice_profiler_linguistics`: Tests tone sliders, sentence length, signature phrases, and v1 style rules.
  - `test_voice_profiler_demo_profile_corpus`: Tests linguistic profiler against 15-post cached demo profile.
  - `test_visual_identity_card_synthesis`: Verifies BrandKitCard schema, typography, and visual rules.
  - `test_font_pairing_selection`: Tests tone-adaptive Google Font pairing selection.
  - `test_get_brand_kit_endpoint`: Tests GET /brand/kit API endpoint response schema.
  - `test_post_brand_scrape_endpoint`: Tests POST /brand/scrape full pipeline execution.
  - `test_post_brand_scrape_with_alias_handle`: Tests POST /brand/scrape with alias `handle` parameter.
- Overall backend test suite: 85/85 tests passing.
