"""
Tests for Reel Scraper Adapter & Reliability Fallbacks
"""

import pytest
from app.scraper.adapter import (
    ScrapedPost,
    scrape_profile,
    scrape_profile_with_metadata,
    load_demo_profile,
    parse_pasted_posts,
    normalize_handle_or_url,
    get_demo_creator_profile,
)


def test_load_demo_profile():
    posts = load_demo_profile(limit=15)
    assert len(posts) == 15
    first = posts[0]
    assert first.id == "demo-post-01"
    assert first.text
    assert len(first.hashtags) > 0
    assert first.date == first.timestamp
    assert first.media_urls == first.image_urls


def test_get_demo_creator_profile():
    creator = get_demo_creator_profile()
    assert creator.handle == "alex_founder"
    assert creator.name == "Alex Rivera"
    assert creator.follower_count > 0


def test_normalize_handle_or_url():
    h1, u1 = normalize_handle_or_url("instagram", "@alex_founder")
    assert h1 == "alex_founder"
    assert u1 == "https://www.instagram.com/alex_founder/"

    h2, u2 = normalize_handle_or_url("linkedin", "https://www.linkedin.com/in/alex-rivera-tech/")
    assert h2 == "alex-rivera-tech"
    assert u2 == "https://www.linkedin.com/in/alex-rivera-tech/"


def test_scrape_profile_graceful_fallback():
    # Public unauthenticated request triggers fallback automatically
    result = scrape_profile_with_metadata("instagram", "@alex_founder", limit=5)
    assert len(result.posts) == 5
    assert result.is_fallback is True
    assert result.fallback_reason is not None
    assert result.creator_profile is not None

    posts = scrape_profile("linkedin", "alex_founder", limit=10)
    assert len(posts) == 10
    assert posts[0].platform == "linkedin"


def test_parse_pasted_posts():
    pasted_text = """
    Post 1:
    The shift from prompt engineering to diff-based memory is the real unlock.
    #ai #engineering

    ---

    Post 2:
    How we cut churn by 18% in one week with ruthless prioritization.
    https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80
    #saas #startups
    """
    posts = parse_pasted_posts(pasted_text, platform="linkedin")
    assert len(posts) == 2
    assert "#ai" in posts[0].hashtags
    assert len(posts[1].image_urls) == 1
