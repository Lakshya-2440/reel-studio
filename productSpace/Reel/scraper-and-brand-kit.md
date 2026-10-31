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

## Brand Kit Generation (Handoff to `brand-agent`)
- Inputs: `list[ScrapedPost]` from `scrape_profile(...)`.
- Voice profile extraction: tone, cadence, vocabulary, signature hooks, formatting style.
- Visual identity extraction: image palette analysis (dominant hex colors via `colorthief`/PIL), typography vibe, and aesthetic style notes via multimodal inference.
- Brand card exportable with hex swatches.
