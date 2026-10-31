"""
Reel Scraper Adapter — Scrapling Integration with Reliable Fallbacks
=====================================================================
Wraps the Scrapling framework for Instagram and LinkedIn social profile scraping.
Standardizes output into ScrapedPost Pydantic models.
Provides mandatory reliability fallbacks:
  1. Pre-cached realistic demo creator profile (15 tech/YC founder posts)
  2. Paste-fallback parser for manual creator post ingestion
"""

import json
import logging
import re
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from pydantic import BaseModel, Field

# Configure logging
logger = logging.getLogger("reel.scraper.adapter")

# Add Scrapling repository to sys.path if available locally
_CURRENT_DIR = Path(__file__).resolve().parent
_WORKSPACE_ROOT = _CURRENT_DIR.parents[3]
_SCRAPLING_PATH = _WORKSPACE_ROOT / "Scrapling"

if _SCRAPLING_PATH.exists() and str(_SCRAPLING_PATH) not in sys.path:
    sys.path.insert(0, str(_SCRAPLING_PATH))

# Attempt importing Scrapling components
try:
    from scrapling.fetchers import Fetcher
    from scrapling.parser import Selector
    SCRAPLING_AVAILABLE = True
except Exception as _import_err:
    logger.warning("Scrapling import unavailable (%s). Fallbacks will be active.", _import_err)
    Fetcher = None
    Selector = None
    SCRAPLING_AVAILABLE = False


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class ScrapedPost(BaseModel):
    """Standardized representation of a single scraped social post."""
    id: str = Field(description="Unique post identifier")
    platform: str = Field(description="Platform source: instagram, linkedin, x, or custom")
    post_url: str = Field(description="Canonical URL of the post or profile anchor")
    text: str = Field(description="Raw caption or text content of the post")
    image_urls: List[str] = Field(default_factory=list, description="Extracted media/image URLs")
    likes: int = Field(default=0, description="Like count if publicly visible")
    comments: int = Field(default=0, description="Comment count if publicly visible")
    timestamp: Optional[str] = Field(default=None, description="ISO 8601 publication timestamp")
    hashtags: List[str] = Field(default_factory=list, description="Extracted hashtag strings")
    raw_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Platform-specific metadata")

    @property
    def date(self) -> Optional[str]:
        """Convenience alias for timestamp."""
        return self.timestamp

    @property
    def media_urls(self) -> List[str]:
        """Convenience alias for image_urls."""
        return self.image_urls


class CreatorProfile(BaseModel):
    """Metadata describing a creator's public profile."""
    handle: str
    name: str
    title: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    follower_count: int = 0
    following_count: int = 0
    total_posts: int = 0
    profile_image_url: Optional[str] = None
    brand_colors: Optional[Dict[str, str]] = None


class ScrapeResult(BaseModel):
    """Complete scraping execution envelope with fallback audit trail."""
    platform: str
    handle: str
    profile_url: str
    is_fallback: bool = False
    fallback_reason: Optional[str] = None
    creator_profile: Optional[CreatorProfile] = None
    posts: List[ScrapedPost] = Field(default_factory=list)


class AntiBotBlockedException(Exception):
    """Raised when an anti-bot challenge or unauthenticated wall blocks scraping."""
    pass


# ---------------------------------------------------------------------------
# Utility Helpers
# ---------------------------------------------------------------------------

def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags with '#' prefix from text."""
    if not text:
        return []
    matches = re.findall(r"(#[A-Za-z0-9_]+)", text)
    return sorted(list(dict.fromkeys(matches)))


def normalize_handle_or_url(platform: str, handle_or_url: str) -> Tuple[str, str]:
    """
    Normalizes a social handle or profile URL into (clean_handle, canonical_url).
    Supports Instagram and LinkedIn conventions.
    """
    clean_input = handle_or_url.strip()
    norm_platform = platform.strip().lower()

    if clean_input.startswith("http://") or clean_input.startswith("https://"):
        parsed = urlparse(clean_input)
        path_parts = [p for p in parsed.path.strip("/").split("/") if p]
        
        if norm_platform == "instagram":
            # https://www.instagram.com/username/
            handle = path_parts[0] if path_parts else "creator"
            canonical = f"https://www.instagram.com/{handle}/"
        elif norm_platform == "linkedin":
            # https://www.linkedin.com/in/username/ or /company/username/
            if len(path_parts) >= 2 and path_parts[0] in ("in", "company"):
                handle = path_parts[1]
                canonical = f"https://www.linkedin.com/{path_parts[0]}/{handle}/"
            elif path_parts:
                handle = path_parts[0]
                canonical = f"https://www.linkedin.com/in/{handle}/"
            else:
                handle = "creator"
                canonical = clean_input
        else:
            handle = path_parts[-1] if path_parts else "creator"
            canonical = clean_input
    else:
        # Bare handle provided, e.g. @alex_founder or alex_founder
        handle = clean_input.lstrip("@")
        if norm_platform == "instagram":
            canonical = f"https://www.instagram.com/{handle}/"
        elif norm_platform == "linkedin":
            canonical = f"https://www.linkedin.com/in/{handle}/"
        else:
            canonical = f"https://example.com/{handle}"

    return handle, canonical


# ---------------------------------------------------------------------------
# Demo Cache & Paste Fallbacks
# ---------------------------------------------------------------------------

def get_demo_cache_path() -> Path:
    """Return path to cached_demo_profile.json."""
    return _CURRENT_DIR / "cached_demo_profile.json"


def get_demo_creator_profile() -> CreatorProfile:
    """Load the pre-seeded demo creator profile metadata."""
    cache_path = get_demo_cache_path()
    if not cache_path.exists():
        return CreatorProfile(
            handle="alex_founder",
            name="Alex Rivera",
            title="Founder & Host @ The Founder Files",
            bio="Building TheContentCompany. Tech, AI agents, podcast soundbites.",
            follower_count=48500,
        )
    try:
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            prof_data = data.get("creator_profile", {})
            return CreatorProfile(**prof_data)
    except Exception as exc:
        logger.error("Failed to read demo creator profile: %s", exc)
        return CreatorProfile(handle="alex_founder", name="Alex Rivera")


def load_demo_profile(platform: Optional[str] = None, limit: int = 30) -> List[ScrapedPost]:
    """
    Load realistic pre-cached creator posts.
    If platform is specified, prioritizes matching platform posts or adapts them.
    Guarantees rich realistic posts for zero-friction demo evaluation.
    """
    cache_path = get_demo_cache_path()
    if not cache_path.exists():
        logger.warning("Demo cache file %s not found. Generating inline fallback.", cache_path)
        return _generate_emergency_fallback_posts(platform, limit)

    try:
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            raw_posts = data.get("posts", [])
            
            posts: List[ScrapedPost] = []
            norm_plat = platform.lower() if platform else None
            
            # Convert raw items to ScrapedPost
            for p in raw_posts:
                post = ScrapedPost(**p)
                posts.append(post)

            # If a specific platform was requested, align platform field for consistency
            if norm_plat:
                matching = [p for p in posts if p.platform.lower() == norm_plat]
                non_matching = [p for p in posts if p.platform.lower() != norm_plat]
                
                # If we have matches, use them first, then adapt remaining up to limit
                if matching:
                    combined = matching + non_matching
                else:
                    combined = posts

                adapted: List[ScrapedPost] = []
                for p in combined:
                    p_copy = p.model_copy()
                    p_copy.platform = norm_plat
                    adapted.append(p_copy)
                return adapted[:limit]

            return posts[:limit]
    except Exception as exc:
        logger.error("Error reading cached demo profile: %s", exc)
        return _generate_emergency_fallback_posts(platform, limit)


def _generate_emergency_fallback_posts(platform: Optional[str], limit: int) -> List[ScrapedPost]:
    """Safety net generator if disk reads ever fail."""
    plat = platform.lower() if platform else "linkedin"
    return [
        ScrapedPost(
            id="emergency-post-01",
            platform=plat,
            post_url="https://example.com/post-01",
            text="The single biggest leverage point in 2026: turning long-form thinking into multi-platform voice assets without AI slop.",
            image_urls=["https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"],
            likes=420,
            comments=32,
            timestamp=datetime.now(timezone.utc).isoformat(),
            hashtags=["#ai", "#founders", "#startups"],
        )
    ]


def parse_pasted_posts(text: str, platform: str = "custom") -> List[ScrapedPost]:
    """
    Parses manually pasted creator text into a list of ScrapedPost models.
    Supports delimiters:
      - '---' or '===' divider lines
      - Numbered blocks ('1.', 'Post 1:', '[1]')
      - Double or triple newline paragraph blocks
    """
    clean_text = text.strip()
    if not clean_text:
        return []

    norm_plat = platform.lower()

    # Split by explicit horizontal rules first
    if re.search(r"\n\s*[-=_*]{3,}\s*\n", clean_text):
        raw_chunks = re.split(r"\n\s*[-=_*]{3,}\s*\n", clean_text)
    # Check for numbered markers e.g. "Post 1:" or "1. " or "[1]"
    elif re.search(r"(?:^|\n)(?:Post\s*\d+[:.]|\d+[.)]\s+|\[\d+\])", clean_text):
        raw_chunks = re.split(r"(?:^|\n)(?:Post\s*\d+[:.]|\d+[.)]\s+|\[\d+\])", clean_text)
    else:
        # Paragraph blocks separated by 2+ blank lines
        raw_chunks = re.split(r"\n\s*\n\s*\n+", clean_text)
        if len(raw_chunks) <= 1:
            raw_chunks = re.split(r"\n\s*\n+", clean_text)

    # Filter out empty or whitespace chunks
    valid_chunks = [c.strip() for c in raw_chunks if len(c.strip()) >= 20]
    
    # If chunks couldn't be cleanly separated, treat whole text as 1 post
    if not valid_chunks and clean_text:
        valid_chunks = [clean_text]

    posts: List[ScrapedPost] = []
    base_time = datetime.now(timezone.utc)

    # Stock aesthetic founder imagery to seed visual palette extraction
    stock_images = [
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    ]

    for idx, chunk in enumerate(valid_chunks):
        # Extract embedded image URLs from chunk if present
        img_matches = re.findall(r"https?://\S+\.(?:png|jpg|jpeg|webp|gif)\S*", chunk)
        # Remove matched URLs from body text
        cleaned_body = chunk
        for img_url in img_matches:
            cleaned_body = cleaned_body.replace(img_url, "")
        cleaned_body = cleaned_body.strip()

        # If no image in text, rotate from stock founder workspace images for palette extraction
        images = img_matches if img_matches else [stock_images[idx % len(stock_images)]]

        tags = extract_hashtags(cleaned_body)
        post_timestamp = (base_time - timedelta(days=idx * 2, hours=idx * 3)).isoformat()
        
        post = ScrapedPost(
            id=f"pasted-post-{idx+1:02d}-{uuid.uuid4().hex[:6]}",
            platform=norm_plat,
            post_url=f"https://thecontentcompany.ai/creator/pasted-post-{idx+1}",
            text=cleaned_body,
            image_urls=images,
            likes=max(120, 850 - (idx * 35)),
            comments=max(12, 65 - (idx * 3)),
            timestamp=post_timestamp,
            hashtags=tags,
            raw_metadata={"source": "manual_paste", "chunk_index": idx},
        )
        posts.append(post)

    return posts


# ---------------------------------------------------------------------------
# Live Scrapling Scraping Engines
# ---------------------------------------------------------------------------

def _scrape_instagram_live(handle: str, profile_url: str, limit: int = 30) -> List[ScrapedPost]:
    """
    Attempts live fetch of public Instagram profile via Scrapling Fetcher.
    Detects login walls and anti-bot responses.
    """
    if not SCRAPLING_AVAILABLE or Fetcher is None:
        raise AntiBotBlockedException("Scrapling Fetcher is not installed or available.")

    logger.info("Attempting live Instagram fetch for @%s (%s)", handle, profile_url)
    
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }
    
    try:
        response = Fetcher.get(
            profile_url,
            headers=headers,
            timeout=10,
            follow_redirects=True,
        )
    except Exception as exc:
        raise AntiBotBlockedException(f"Network error during Instagram fetch: {exc}")

    # Check for empty body or redirect to login
    html_text = response.text or ""
    if response.status != 200 or len(html_text) < 500:
        raise AntiBotBlockedException(
            f"Instagram anti-bot challenge encountered (Status: {response.status}, HTML length: {len(html_text)})"
        )
    
    if "/accounts/login/" in html_text or "Login • Instagram" in html_text:
        raise AntiBotBlockedException("Instagram redirected to unauthenticated login wall.")

    # Parse with Scrapling Selector
    selector = Selector(text=html_text)
    posts: List[ScrapedPost] = []

    # 1. Search for embedded JSON scripts
    scripts = selector.xpath("//script[@type='application/json']/text()").getall()
    for script_content in scripts:
        if "edge_owner_to_timeline_media" in script_content:
            try:
                data = json.loads(script_content)
                # Traverse JSON structure
                edges = (
                    data.get("entry_data", {})
                    .get("ProfilePage", [{}])[0]
                    .get("graphql", {})
                    .get("user", {})
                    .get("edge_owner_to_timeline_media", {})
                    .get("edges", [])
                )
                for edge in edges[:limit]:
                    node = edge.get("node", {})
                    caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
                    caption = caption_edges[0].get("node", {}).get("text", "") if caption_edges else ""
                    shortcode = node.get("shortcode", "")
                    post_url = f"https://www.instagram.com/p/{shortcode}/" if shortcode else profile_url
                    display_url = node.get("display_url", "")
                    likes = node.get("edge_liked_by", {}).get("count", 0)
                    comments = node.get("edge_media_to_comment", {}).get("count", 0)
                    ts = node.get("taken_at_timestamp")
                    iso_time = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None

                    posts.append(
                        ScrapedPost(
                            id=f"ig-{node.get('id', uuid.uuid4().hex[:8])}",
                            platform="instagram",
                            post_url=post_url,
                            text=caption,
                            image_urls=[display_url] if display_url else [],
                            likes=likes,
                            comments=comments,
                            timestamp=iso_time,
                            hashtags=extract_hashtags(caption),
                            raw_metadata={"shortcode": shortcode},
                        )
                    )
            except Exception as parse_err:
                logger.debug("Failed parsing IG JSON script: %s", parse_err)

    # 2. OpenGraph fallback if no posts found via JSON
    if not posts:
        og_desc = selector.xpath("//meta[@property='og:description']/@content").get()
        og_image = selector.xpath("//meta[@property='og:image']/@content").get()
        if og_desc and len(og_desc) > 20:
            posts.append(
                ScrapedPost(
                    id=f"ig-og-{uuid.uuid4().hex[:8]}",
                    platform="instagram",
                    post_url=profile_url,
                    text=og_desc,
                    image_urls=[og_image] if og_image else [],
                    likes=100,
                    comments=10,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    hashtags=extract_hashtags(og_desc),
                    raw_metadata={"source": "og_meta"},
                )
            )

    if not posts:
        raise AntiBotBlockedException("Instagram rendered dynamic shell without public post markup.")

    return posts[:limit]


def _scrape_linkedin_live(handle: str, profile_url: str, limit: int = 30) -> List[ScrapedPost]:
    """
    Attempts live fetch of public LinkedIn profile via Scrapling Fetcher.
    LinkedIn aggressively enforces authwall (HTTP 999 or authwall redirect).
    """
    if not SCRAPLING_AVAILABLE or Fetcher is None:
        raise AntiBotBlockedException("Scrapling Fetcher is not installed or available.")

    logger.info("Attempting live LinkedIn fetch for %s (%s)", handle, profile_url)
    
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
    }
    
    try:
        response = Fetcher.get(
            profile_url,
            headers=headers,
            timeout=10,
            follow_redirects=True,
        )
    except Exception as exc:
        raise AntiBotBlockedException(f"Network error during LinkedIn fetch: {exc}")

    html_text = response.text or ""
    
    # LinkedIn returns 999 or authwall for automated headless/curl clients
    if response.status in (999, 403, 429) or len(html_text) < 500:
        raise AntiBotBlockedException(
            f"LinkedIn authwall/anti-bot protection active (HTTP {response.status}, HTML len: {len(html_text)})"
        )

    if "authwall" in html_text or "Sign In | LinkedIn" in html_text:
        raise AntiBotBlockedException("LinkedIn redirected to mandatory authwall.")

    selector = Selector(text=html_text)
    posts: List[ScrapedPost] = []

    # Attempt to extract public posts or activity items
    activity_cards = selector.css(".base-main-card, .feed-shared-update-v2, .core-section-container")
    for idx, card in enumerate(activity_cards):
        text_content = card.css(".attributed-text-segment-list__content, .break-words::text").getall()
        body = "\n".join(t.strip() for t in text_content if t.strip())
        img = card.css("img::attr(src)").get()
        if body and len(body) > 20:
            posts.append(
                ScrapedPost(
                    id=f"li-card-{idx+1}-{uuid.uuid4().hex[:6]}",
                    platform="linkedin",
                    post_url=profile_url,
                    text=body,
                    image_urls=[img] if img else [],
                    likes=150,
                    comments=18,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    hashtags=extract_hashtags(body),
                )
            )

    # Check ld+json schema as secondary parsing source
    if not posts:
        json_scripts = selector.xpath("//script[@type='application/ld+json']/text()").getall()
        for sc in json_scripts:
            try:
                doc = json.loads(sc)
                if isinstance(doc, dict) and "headline" in doc:
                    posts.append(
                        ScrapedPost(
                            id=f"li-ld-{uuid.uuid4().hex[:6]}",
                            platform="linkedin",
                            post_url=profile_url,
                            text=f"{doc.get('name', '')}: {doc.get('headline', '')} - {doc.get('description', '')}",
                            image_urls=[doc.get("image", "")] if doc.get("image") else [],
                            timestamp=datetime.now(timezone.utc).isoformat(),
                            hashtags=extract_hashtags(doc.get("description", "")),
                        )
                    )
            except Exception:
                pass

    if not posts:
        raise AntiBotBlockedException("LinkedIn public profile does not expose posts without session cookies.")

    return posts[:limit]


# ---------------------------------------------------------------------------
# Public Facade API
# ---------------------------------------------------------------------------

def scrape_profile(platform: str, handle_or_url: str, limit: int = 30) -> List[ScrapedPost]:
    """
    Main scraping entry point.
    Attempts live scrape via Scrapling. If blocked by anti-bot walls or missing credentials,
    seamlessly falls back to the pre-cached realistic demo creator profile.
    Guarantees no runtime crash or blank output during hackathon live demos.
    """
    result = scrape_profile_with_metadata(platform=platform, handle_or_url=handle_or_url, limit=limit)
    return result.posts


def scrape_profile_with_metadata(platform: str, handle_or_url: str, limit: int = 30) -> ScrapeResult:
    """
    Detailed scraping entry point providing audit information (whether fallback was used and why).
    """
    norm_platform = platform.strip().lower()
    handle, canonical_url = normalize_handle_or_url(norm_platform, handle_or_url)

    posts: List[ScrapedPost] = []
    is_fallback = False
    fallback_reason: Optional[str] = None
    creator_profile: Optional[CreatorProfile] = None

    try:
        if not SCRAPLING_AVAILABLE:
            raise AntiBotBlockedException("Scrapling framework is not installed in the environment.")

        if norm_platform in ("instagram", "ig"):
            posts = _scrape_instagram_live(handle=handle, profile_url=canonical_url, limit=limit)
        elif norm_platform in ("linkedin", "li"):
            posts = _scrape_linkedin_live(handle=handle, profile_url=canonical_url, limit=limit)
        else:
            raise AntiBotBlockedException(f"Platform '{platform}' requires paste fallback or demo profile.")

        if not posts:
            raise AntiBotBlockedException(f"Zero posts extracted from live {platform} profile.")

    except Exception as exc:
        is_fallback = True
        fallback_reason = str(exc)
        logger.warning(
            "Live scrape for %s (%s) triggered fallback: %s. Using cached demo creator profile.",
            norm_platform, handle, fallback_reason
        )
        posts = load_demo_profile(platform=norm_platform, limit=limit)
        creator_profile = get_demo_creator_profile()

    return ScrapeResult(
        platform=norm_platform,
        handle=handle,
        profile_url=canonical_url,
        is_fallback=is_fallback,
        fallback_reason=fallback_reason,
        creator_profile=creator_profile,
        posts=posts,
    )
