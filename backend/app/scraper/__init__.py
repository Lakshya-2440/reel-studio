"""
Reel Scraper Package
====================
Provides Scrapling adapter for social media scraping with built-in
fallbacks to cached demo profiles and manual post paste parser.
"""

from .adapter import (
    ScrapedPost,
    CreatorProfile,
    ScrapeResult,
    AntiBotBlockedException,
    scrape_profile,
    scrape_profile_with_metadata,
    load_demo_profile,
    parse_pasted_posts,
    get_demo_creator_profile,
    normalize_handle_or_url,
    extract_hashtags,
)

__all__ = [
    "ScrapedPost",
    "CreatorProfile",
    "ScrapeResult",
    "AntiBotBlockedException",
    "scrape_profile",
    "scrape_profile_with_metadata",
    "load_demo_profile",
    "parse_pasted_posts",
    "get_demo_creator_profile",
    "normalize_handle_or_url",
    "extract_hashtags",
]
