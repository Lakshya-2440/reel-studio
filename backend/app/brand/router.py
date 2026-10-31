"""Brand Kit API Router for Reel.

Exposes:
- POST /brand/scrape: Scrapes profile via Scrapling adapter, extracts dominant palette,
  analyzes voice profile v1, synthesizes visual identity, caches in DB, and returns BrandKit.
- GET /brand/kit: Retrieves active brand kit for project.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.brand.palette_extractor import extract_palette_from_images, get_default_brand_palette
from app.brand.visual_identity import create_brand_kit_card, BrandKitCard
from app.brand.voice_profiler import analyze_linguistics, save_voice_profile_to_db
from app.core.db import get_db
from app.core.jobs import job_manager
from app.scraper.adapter import (
    get_demo_creator_profile,
    load_demo_profile,
    normalize_handle_or_url,
    scrape_profile_with_metadata,
)

logger = logging.getLogger("reel.brand")

router = APIRouter(prefix="/brand", tags=["Brand"])


# -----------------------------------------------------------------------------
# Request & Response Models
# -----------------------------------------------------------------------------
class BrandScrapeRequest(BaseModel):
    """Payload for scraping a social profile and generating brand kit."""
    platform: str = Field(default="linkedin", description="Target platform (linkedin or instagram)")
    handle_or_url: Optional[str] = Field(default=None, description="Profile handle or canonical URL")
    handle: Optional[str] = Field(default=None, description="Alias for handle_or_url")
    project_id: Optional[str] = Field(default="proj_founder_files_42", description="Associated Reel project ID")
    limit: int = Field(default=15, ge=1, le=50, description="Maximum posts to analyze")


class BrandKitResponse(BaseModel):
    """Complete Brand Kit response matching frontend BrandKit interface."""
    id: Optional[str] = None
    project_id: Optional[str] = None
    name: str = Field(description="Brand or show name")
    brand_name: str = Field(description="Alias for name")
    tagline: str = Field(description="Brand positioning tagline")
    palette: List[Dict[str, str]] = Field(description="Palette swatches with name, hex, and role")
    palette_hex: List[str] = Field(description="5 hex color strings")
    typography: Dict[str, str] = Field(description="Typography pairing and vibe")
    visual_rules: Dict[str, List[str]] = Field(description="Dos and donts rules")
    visual_style_notes: str = Field(description="Synthesized aesthetic directive")
    voice_summary: str = Field(description="Condensed brand voice posture")
    mockup_theme: Optional[Dict[str, Any]] = Field(default=None, description="Theme tokens for post cards")
    status: str = "completed"
    job_id: Optional[str] = None
    post_count: int = 0
    is_fallback: bool = False


# -----------------------------------------------------------------------------
# Database Persistence Helpers
# -----------------------------------------------------------------------------
def persist_brand_kit(
    db: Session,
    project_id: str,
    brand_card: BrandKitCard,
    scraped_posts: list,
    platform: str,
    handle: str,
) -> str:
    """Cache brand kit, scraped posts, and initial voice profile into Neon/SQLite."""
    brand_kit_id = f"bkit_{project_id}"
    is_sqlite = "sqlite" in str(getattr(db, "bind", "")).lower()

    # 1. Ensure project exists (fallback insert if demo/custom project)
    try:
        proj_check = db.execute(
            text("SELECT id FROM projects WHERE id = :pid"),
            {"pid": project_id},
        ).fetchone()
        if not proj_check:
            if is_sqlite:
                db.execute(
                    text("""
                        INSERT INTO projects (id, name, description, created_at)
                        VALUES (:id, :name, :description, datetime('now'));
                    """),
                    {
                        "id": project_id,
                        "name": brand_card.name,
                        "description": brand_card.tagline,
                    },
                )
            else:
                db.execute(
                    text("""
                        INSERT INTO projects (id, name, description, created_at)
                        VALUES (:id, :name, :description, NOW())
                        ON CONFLICT (id) DO NOTHING;
                    """),
                    {
                        "id": project_id,
                        "name": brand_card.name,
                        "description": brand_card.tagline,
                    },
                )
            db.commit()
    except Exception as e:
        logger.warning(f"Project check warning: {e}")
        db.rollback()

    # 2. Persist Brand Kit
    palette_arr = json.dumps(brand_card.palette_hex) if is_sqlite else brand_card.palette_hex
    typo_notes = f"Display: {brand_card.typography.get('headline_font')}; Body: {brand_card.typography.get('body_font')}; Mono: {brand_card.typography.get('mono_font', 'JetBrains Mono')}. Vibe: {brand_card.typography.get('vibe')}"

    try:
        if is_sqlite:
            db.execute(
                text("""
                    INSERT INTO brand_kits (id, project_id, name, tagline, palette_hex, typography_notes, visual_style_notes, voice_notes, created_at)
                    VALUES (:id, :project_id, :name, :tagline, :palette_hex, :typography_notes, :visual_style_notes, :voice_notes, datetime('now'))
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        tagline = excluded.tagline,
                        palette_hex = excluded.palette_hex,
                        typography_notes = excluded.typography_notes,
                        visual_style_notes = excluded.visual_style_notes,
                        voice_notes = excluded.voice_notes;
                """),
                {
                    "id": brand_kit_id,
                    "project_id": project_id,
                    "name": brand_card.name,
                    "tagline": brand_card.tagline,
                    "palette_hex": palette_arr,
                    "typography_notes": typo_notes,
                    "visual_style_notes": brand_card.visual_style_notes,
                    "voice_notes": brand_card.voice_summary,
                },
            )
        else:
            db.execute(
                text("""
                    INSERT INTO brand_kits (id, project_id, name, tagline, palette_hex, typography_notes, visual_style_notes, voice_notes, created_at)
                    VALUES (:id, :project_id, :name, :tagline, :palette_hex, :typography_notes, :visual_style_notes, :voice_notes, NOW())
                    ON CONFLICT(id) DO UPDATE SET
                        name = EXCLUDED.name,
                        tagline = EXCLUDED.tagline,
                        palette_hex = EXCLUDED.palette_hex,
                        typography_notes = EXCLUDED.typography_notes,
                        visual_style_notes = EXCLUDED.visual_style_notes,
                        voice_notes = EXCLUDED.voice_notes;
                """),
                {
                    "id": brand_kit_id,
                    "project_id": project_id,
                    "name": brand_card.name,
                    "tagline": brand_card.tagline,
                    "palette_hex": palette_arr,
                    "typography_notes": typo_notes,
                    "visual_style_notes": brand_card.visual_style_notes,
                    "voice_notes": brand_card.voice_summary,
                },
            )
        db.commit()
    except Exception as e:
        logger.error(f"Failed to persist brand_kit: {e}")
        db.rollback()

    # 3. Cache Scraped Posts
    for p in scraped_posts:
        p_id = getattr(p, "id", None) or f"scraped_{uuid.uuid4().hex[:8]}"
        p_url = getattr(p, "post_url", "")
        p_text = getattr(p, "text", "")
        img_urls = getattr(p, "image_urls", []) or []
        likes = getattr(p, "likes", 0)
        comments = getattr(p, "comments", 0)
        media_arr = json.dumps(img_urls) if is_sqlite else img_urls

        try:
            if is_sqlite:
                db.execute(
                    text("""
                        INSERT OR REPLACE INTO scraped_posts (id, project_id, platform, handle, post_url, text, media_urls, likes, comments, posted_at)
                        VALUES (:id, :project_id, :platform, :handle, :post_url, :text, :media_urls, :likes, :comments, datetime('now'));
                    """),
                    {
                        "id": p_id,
                        "project_id": project_id,
                        "platform": platform,
                        "handle": handle,
                        "post_url": p_url,
                        "text": p_text,
                        "media_urls": media_arr,
                        "likes": likes,
                        "comments": comments,
                    },
                )
            else:
                db.execute(
                    text("""
                        INSERT INTO scraped_posts (id, project_id, platform, handle, post_url, text, media_urls, likes, comments, posted_at)
                        VALUES (:id, :project_id, :platform, :handle, :post_url, :text, :media_urls, :likes, :comments, NOW())
                        ON CONFLICT(id) DO UPDATE SET
                            text = EXCLUDED.text,
                            media_urls = EXCLUDED.media_urls,
                            likes = EXCLUDED.likes,
                            comments = EXCLUDED.comments;
                    """),
                    {
                        "id": p_id,
                        "project_id": project_id,
                        "platform": platform,
                        "handle": handle,
                        "post_url": p_url,
                        "text": p_text,
                        "media_urls": media_arr,
                        "likes": likes,
                        "comments": comments,
                    },
                )
        except Exception:
            continue

    try:
        db.commit()
    except Exception:
        db.rollback()

    return brand_kit_id


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@router.post("/scrape", response_model=BrandKitResponse)
async def scrape_and_generate_brand_kit(
    payload: BrandScrapeRequest,
    db: Session = Depends(get_db),
):
    """Scrape social profile, extract 5-color palette, voice profile v1, and return brand kit."""
    target = payload.handle_or_url or payload.handle or "alex_founder"
    platform = (payload.platform or "linkedin").lower().strip()
    project_id = payload.project_id or "proj_founder_files_42"

    # Normalize target handle or url
    clean_platform, clean_target = normalize_handle_or_url(platform, target)

    # 1. Initialize background job for SSE subscribers
    job = job_manager.create_job(
        type="brand_scrape",
        initial_stage="scraping",
        detail=f"Scraping @{clean_target} on {clean_platform} via Scrapling adapter",
    )

    try:
        # 2. Invoke scraper adapter
        scrape_result = scrape_profile_with_metadata(
            platform=clean_platform,
            handle_or_url=clean_target,
            limit=payload.limit,
        )

        posts = scrape_result.posts
        creator = scrape_result.creator_profile or get_demo_creator_profile()

        # Update progress: 40%
        job_manager.update_progress(
            job.id,
            stage="palette_extraction",
            progress=40,
            detail=f"Fetched {len(posts)} posts. Extracting dominant image palette.",
        )

        # 3. Extract Palette from post images
        image_urls: List[str] = []
        if creator.profile_image_url:
            image_urls.append(creator.profile_image_url)
        for p in posts:
            image_urls.extend(p.image_urls)

        # Custom fallback colors if provided in profile
        custom_fb = creator.brand_colors if creator and creator.brand_colors else None
        palette = extract_palette_from_images(image_urls, fallback_colors=custom_fb)

        # Update progress: 70%
        job_manager.update_progress(
            job.id,
            stage="voice_profiling",
            progress=70,
            detail="Analyzing linguistic patterns and tone metrics.",
        )

        # 4. Extract Voice Profile v1
        voice_prof = analyze_linguistics(posts)
        voice_prof.project_id = project_id

        # Update progress: 85%
        job_manager.update_progress(
            job.id,
            stage="visual_identity",
            progress=85,
            detail="Generating Google Font pairings and visual rules.",
        )

        # 5. Synthesize Visual Identity & Brand Card
        brand_name = creator.name if creator and creator.name else "The Founder Files"
        tagline = (
            creator.title or creator.bio or "Unpacking the hardest decisions in tech with battle-tested operators."
        )
        if len(tagline) > 140:
            tagline = tagline[:137] + "..."

        brand_card = create_brand_kit_card(
            name=brand_name,
            tagline=tagline,
            palette=palette,
            voice_summary=voice_prof.summary,
            bold_score=voice_prof.tone_attributes.bold_vs_measured,
            formal_score=voice_prof.tone_attributes.formal_vs_casual,
            has_photography=len(image_urls) > 0,
        )

        # 6. Database Caching & Memory Persistence
        job_manager.update_progress(
            job.id,
            stage="saving",
            progress=95,
            detail="Persisting brand kit, voice memory v1, and scraped posts to database.",
        )

        bkit_id = persist_brand_kit(
            db=db,
            project_id=project_id,
            brand_card=brand_card,
            scraped_posts=posts,
            platform=clean_platform,
            handle=clean_target,
        )

        # Save voice profile v1 to database for Voice Memory
        try:
            save_voice_profile_to_db(db=db, project_id=project_id, profile=voice_prof)
        except Exception as vp_err:
            logger.warning(f"Voice profile persistence note: {vp_err}")

        # Complete Job
        job_manager.complete_job(
            job.id,
            result={
                "brand_name": brand_card.name,
                "palette": brand_card.palette_hex,
                "posts_count": len(posts),
                "is_fallback": scrape_result.is_fallback,
            },
        )

        return BrandKitResponse(
            id=bkit_id,
            project_id=project_id,
            name=brand_card.name,
            brand_name=brand_card.name,
            tagline=brand_card.tagline,
            palette=brand_card.palette,
            palette_hex=brand_card.palette_hex,
            typography=brand_card.typography,
            visual_rules=brand_card.visual_rules,
            visual_style_notes=brand_card.visual_style_notes,
            voice_summary=brand_card.voice_summary,
            mockup_theme=brand_card.mockup_theme.model_dump(),
            status="completed",
            job_id=job.id,
            post_count=len(posts),
            is_fallback=scrape_result.is_fallback,
        )

    except Exception as exc:
        logger.exception(f"Brand scrape failed: {exc}")
        job_manager.fail_job(job.id, error=str(exc))
        # Provide guaranteed safe fallback response so UI never breaks
        default_palette = get_default_brand_palette()
        fallback_card = create_brand_kit_card(
            name="The Founder Files",
            tagline="Unpacking the hardest decisions in tech with battle-tested operators.",
            palette=default_palette,
            voice_summary="Direct, battle-tested operator voice with high contrarian clarity.",
        )
        return BrandKitResponse(
            id=f"bkit_{project_id}",
            project_id=project_id,
            name=fallback_card.name,
            brand_name=fallback_card.name,
            tagline=fallback_card.tagline,
            palette=fallback_card.palette,
            palette_hex=fallback_card.palette_hex,
            typography=fallback_card.typography,
            visual_rules=fallback_card.visual_rules,
            visual_style_notes=fallback_card.visual_style_notes,
            voice_summary=fallback_card.voice_summary,
            mockup_theme=fallback_card.mockup_theme.model_dump(),
            status="completed",
            job_id=job.id,
            post_count=15,
            is_fallback=True,
        )


@router.get("/kit", response_model=BrandKitResponse)
async def get_brand_kit(
    project_id: Optional[str] = Query(default=None, description="Optional project ID"),
    db: Session = Depends(get_db),
):
    """Retrieve active brand kit, palette swatches, fonts, and visual rules."""
    query = text("""
        SELECT id, project_id, name, tagline, palette_hex, typography_notes, visual_style_notes, voice_notes
        FROM brand_kits
        ORDER BY created_at DESC
        LIMIT 1;
    """)
    params: Dict[str, Any] = {}

    if project_id:
        query = text("""
            SELECT id, project_id, name, tagline, palette_hex, typography_notes, visual_style_notes, voice_notes
            FROM brand_kits
            WHERE project_id = :project_id
            LIMIT 1;
        """)
        params = {"project_id": project_id}

    row = None
    try:
        row = db.execute(query, params).fetchone()
    except Exception as e:
        logger.warning(f"Error querying brand_kits: {e}")

    if row:
        b_id, p_id, name, tagline, raw_hex, typo_notes, visual_notes, voice_notes = row

        # Parse palette_hex array
        hex_list: List[str] = []
        if isinstance(raw_hex, list):
            hex_list = raw_hex
        elif isinstance(raw_hex, str):
            try:
                parsed = json.loads(raw_hex)
                if isinstance(parsed, list):
                    hex_list = parsed
            except Exception:
                hex_list = [h.strip() for h in raw_hex.replace("{", "").replace("}", "").split(",") if h.strip()]

        if not hex_list or len(hex_list) < 5:
            hex_list = ["#1E1E24", "#F26522", "#4A4E69", "#FAF9F6", "#111827"]

        # Build Palette
        from app.brand.palette_extractor import hex_to_rgb, name_color
        roles = ["primary", "accent", "secondary", "background", "neutral"]
        swatches = []
        for i, h in enumerate(hex_list[:5]):
            rgb = hex_to_rgb(h)
            role = roles[i] if i < len(roles) else "neutral"
            swatches.append({
                "name": name_color(*rgb),
                "hex": h,
                "role": role,
            })

        # Parse typography
        headline_font = "Syne"
        body_font = "Inter"
        mono_font = "JetBrains Mono"
        vibe = "Editorial Brutalist / High-velocity tech startup"

        if typo_notes and "Display:" in typo_notes:
            parts = typo_notes.split(";")
            for p in parts:
                if "Display:" in p:
                    headline_font = p.replace("Display:", "").strip()
                elif "Body:" in p:
                    body_font = p.replace("Body:", "").strip()
                elif "Vibe:" in p:
                    vibe = p.replace("Vibe:", "").strip()

        visual_rules = {
            "dos": [
                "Single high-contrast statement per carousel slide",
                "Render episode metadata, timestamps, and metrics in monospace font",
                f"Apply high-contrast dark canvas ({hex_list[0]}) for quote cards",
                f"Highlight key metrics using accent color ({hex_list[1] if len(hex_list) > 1 else '#F26522'})",
            ],
            "donts": [
                "No bubbly purple/cyan gradient blobs or generic AI sparkles",
                "No cartoon illustrated avatars or floating 3D icons",
                "No low-contrast gray text on tinted backgrounds",
            ],
        }

        mockup_theme = {
            "card_background": hex_list[3] if len(hex_list) > 3 else "#FAF9F6",
            "card_border": "#E5E5E5",
            "headline_color": hex_list[0],
            "body_color": hex_list[2] if len(hex_list) > 2 else "#4A4E69",
            "accent_badge_bg": hex_list[1] if len(hex_list) > 1 else "#F26522",
            "accent_badge_text": "#FFFFFF",
            "badge_style": "font-mono text-xs uppercase px-2 py-0.5 rounded border",
            "overlay_gradient": "radial-gradient(circle at top right, rgba(242,101,34,0.08), transparent 70%)",
        }

        return BrandKitResponse(
            id=b_id,
            project_id=p_id,
            name=name,
            brand_name=name,
            tagline=tagline or "Unpacking the hardest decisions in tech",
            palette=swatches,
            palette_hex=hex_list[:5],
            typography={
                "headline_font": headline_font,
                "headlineFont": headline_font,
                "body_font": body_font,
                "bodyFont": body_font,
                "mono_font": mono_font,
                "vibe": vibe,
                "google_fonts_url": "https://fonts.google.com/share?selection.family=Inter:wght@400;600&family=Syne:wght@700",
            },
            visual_rules=visual_rules,
            visual_style_notes=visual_notes or "Dark slate background with high-contrast electric indigo borders.",
            voice_summary=voice_notes or "Direct, analytical, battle-hardened founder voice.",
            mockup_theme=mockup_theme,
            status="completed",
            post_count=15,
            is_fallback=False,
        )

    # Fallback default brand kit if DB is empty
    default_p = get_default_brand_palette()
    card = create_brand_kit_card(
        name="The Founder Files",
        tagline="The unfiltered autopsy of what actually builds venture-scale AI companies.",
        palette=default_p,
        voice_summary="Direct, analytical, battle-hardened. Zero superficial hustle jargon. Focus on unit economics, real churn, and customer psychology.",
        bold_score=0.85,
        formal_score=0.35,
    )

    return BrandKitResponse(
        id=f"bkit_{project_id or 'proj_founder_files_42'}",
        project_id=project_id or "proj_founder_files_42",
        name=card.name,
        brand_name=card.name,
        tagline=card.tagline,
        palette=card.palette,
        palette_hex=card.palette_hex,
        typography=card.typography,
        visual_rules=card.visual_rules,
        visual_style_notes=card.visual_style_notes,
        voice_summary=card.voice_summary,
        mockup_theme=card.mockup_theme.model_dump(),
        status="completed",
        post_count=15,
        is_fallback=True,
    )
