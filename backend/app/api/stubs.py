from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.jobs import job_manager

router = APIRouter()


# -----------------------------------------------------------------------------
# 1. Projects
# -----------------------------------------------------------------------------
class ProjectCreate(BaseModel):
    name: str = "The Founder Files — Ep. 42"


class ProjectResponse(BaseModel):
    id: str
    name: str
    created_at: str


@router.post("/projects", response_model=ProjectResponse, tags=["Projects"])
async def create_project(payload: ProjectCreate):
    """Create a new repurposing project."""
    return ProjectResponse(
        id="proj-demo-founder-42",
        name=payload.name,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
async def get_project(project_id: str):
    """Get project details."""
    return ProjectResponse(
        id=project_id,
        name="The Founder Files — Ep. 42",
        created_at=datetime.now(timezone.utc).isoformat(),
    )


# -----------------------------------------------------------------------------
# 2. Ingestion & Transcripts (Moved to real app.ingest.router)
# -----------------------------------------------------------------------------


# -----------------------------------------------------------------------------
# 3. Clips & Multi-Signal Scoring
# -----------------------------------------------------------------------------
class ClipFindRequest(BaseModel):
    project_id: str = "proj-demo-founder-42"
    min_duration: int = 25
    max_duration: int = 90


class ClipFeedbackRequest(BaseModel):
    reason: str = "Pacing too slow in opening 5 seconds"
    rating: Optional[int] = 3


# Note: Clip endpoints (/clips/find, /projects/{id}/clips, /clips/{id}, /clips/{id}/feedback)
# are implemented in app.clips.router (Req 2 Clip Selection with Reasons).


# -----------------------------------------------------------------------------
# 4. Copy Engine & Platform Variants (Implemented in app.copy.router)
# -----------------------------------------------------------------------------
class VariantUpdateRequest(BaseModel):
    creator_final: str
    instruction: Optional[str] = None

# Real implementations mounted via app.copy.router in app/api/router.py



# -----------------------------------------------------------------------------
# 5. Brand-Voice Memory
# -----------------------------------------------------------------------------
class VoiceCompareRequest(BaseModel):
    clip_id: str = "clip-pricing-01"
    platform: str = "linkedin"


@router.get("/voice/profile", tags=["Voice Memory"])
async def get_voice_profile():
    """Retrieve active brand-voice profile, tone sliders, and signature rules."""
    return {
        "version": "v3",
        "summary": "Direct, authoritative B2B founder voice. Leads with quantitative contrast or contrarian observations. Zero emoji fluff on LinkedIn. Crisp short sentences with max 14 words.",
        "tone_sliders": {
            "formal_vs_casual": 0.35,  # 0=casual, 1=formal
            "bold_vs_measured": 0.85,
            "short_vs_long": 0.25,
        },
        "signature_phrases": [
            "Here is the math:",
            "Stop measuring DAU/MAU",
            "Taxing your customers",
        ],
        "banned_words": ["synergy", "game-changer", "delighted to announce", "leverage"],
        "active_rules_count": 8,
    }


@router.get("/voice/rules", tags=["Voice Memory"])
async def get_voice_rules():
    """List all extracted style rules with diff evidence and confidence scores."""
    return [
        {
            "id": "rule-01",
            "rule": "Opens LinkedIn copy with a concrete metric or contrarian one-liner",
            "confidence": 0.94,
            "edits_count": 6,
            "status": "active",
            "evidence_diff": "[-] In today's post we look at SaaS... [+] Per-seat SaaS pricing is dead. Here is the math:",
        },
        {
            "id": "rule-02",
            "rule": "Strips all emojis from LinkedIn posts except directional arrows",
            "confidence": 0.91,
            "edits_count": 5,
            "status": "active",
            "evidence_diff": "[-] 🚀 Big news founders! 🔥 [+] Outcome-based pricing isn't theoretical.",
        },
        {
            "id": "rule-03",
            "rule": "Bans corporate buzzwords like 'leverage' and 'seamless'",
            "confidence": 0.87,
            "edits_count": 4,
            "status": "active",
            "evidence_diff": "[-] leverage your existing stack [+] use your existing stack",
        },
    ]


@router.patch("/voice/rules/{rule_id}", tags=["Voice Memory"])
async def toggle_voice_rule(rule_id: str, updates: Dict[str, Any]):
    """Toggle, pin, or adjust rule confidence."""
    return {
        "rule_id": rule_id,
        "status": updates.get("status", "active"),
        "confidence": updates.get("confidence", 0.9),
    }


@router.post("/voice/compare", tags=["Voice Memory"])
async def compare_voice_memory(payload: VoiceCompareRequest):
    """Side-by-side comparison of generation with Brand Voice Memory OFF vs ON."""
    return {
        "clip_id": payload.clip_id,
        "platform": payload.platform,
        "memory_off": {
            "caption": "🚀 Exciting thoughts on SaaS pricing! Are you optimizing your per-seat licenses for synergy in 2026? Check out this clip for tips! 💡 #leadership #innovation",
            "voice_match_score": 58.2,
            "fluff_detected": ["rocket emoji", "synergy", "generic CTA"],
        },
        "memory_on": {
            "caption": "Per-seat SaaS pricing is dead. Here is the math:\n\nWhen AI cuts team hours by 60%, per-seat billing penalizes your own efficiency.\n\nTeams charging per verified outcome saw 3.4x higher NRR.\n\nAre you still selling seats or selling results?",
            "voice_match_score": 94.7,
            "rules_applied": ["Lead with quantitative contrast", "Zero fluff emojis", "Short punchy lines"],
        },
    }


# -----------------------------------------------------------------------------
# 6. Voice Intake & Cleanup (Wispr Flow)
# -----------------------------------------------------------------------------
class VoiceInterpretRequest(BaseModel):
    raw_text: str
    context: Optional[Dict[str, Any]] = None


@router.post("/voice/interpret", tags=["Voice Intake"])
async def interpret_voice_intake(payload: VoiceInterpretRequest):
    """Messy speech-to-structured-intent interpreter removing fillers and self-corrections."""
    raw = payload.raw_text
    return {
        "clean_text": "Schedule the pricing clip on LinkedIn for Thursday morning at 9:00 AM IST with no emojis.",
        "intent": "schedule",
        "entities": {
            "platform": "linkedin",
            "clip_ref": "pricing clip",
            "when": "2026-11-05T09:00:00+05:30",
            "modifiers": ["no_emojis"],
        },
        "corrections_applied": [
            {"from": "Instagram", "to": "LinkedIn"},
            {"from": "Wednesday", "to": "Thursday morning"},
        ],
        "fillers_removed": ["um", "uh", "actually wait", "I mean"],
        "confidence": 0.94,
        "needs_clarification": None,
        "raw_dictation": raw,
    }


# -----------------------------------------------------------------------------
# 7. Content Calendar
# -----------------------------------------------------------------------------
class CalendarItemCreate(BaseModel):
    clip_id: str
    platform: str
    scheduled_time: str
    variant_id: Optional[str] = None


@router.get("/calendar", tags=["Calendar"])
async def get_calendar_items():
    """Get scheduled posts across week/month views."""
    return [
        {
            "id": "cal-01",
            "clip_id": "clip-pricing-01",
            "title": "Per-Seat Pricing is a Tax on AI",
            "platform": "linkedin",
            "scheduled_time": "2026-11-05T09:00:00+05:30",
            "status": "scheduled",
            "ai_slot_rationale": "Thursday 9:00 AM IST has 2.4x higher B2B engagement based on your performance history",
        },
        {
            "id": "cal-02",
            "clip_id": "clip-retention-02",
            "title": "The One Metric That Predicts B2B Churn",
            "platform": "x",
            "scheduled_time": "2026-11-06T18:30:00+05:30",
            "status": "scheduled",
            "ai_slot_rationale": "Friday evening IST tech audience peak",
        },
    ]


@router.post("/calendar", tags=["Calendar"])
async def create_calendar_item(payload: CalendarItemCreate):
    """Schedule a post."""
    return {
        "id": "cal-new-03",
        **payload.model_dump(),
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@router.patch("/calendar/{item_id}", tags=["Calendar"])
async def update_calendar_item(item_id: str, updates: Dict[str, Any]):
    """Drag-and-drop reschedule or status update."""
    return {
        "id": item_id,
        "updated": list(updates.keys()),
        "status": updates.get("status", "scheduled"),
    }


@router.post("/calendar/plan-week", tags=["Calendar"])
async def plan_week_auto():
    """Auto-fill upcoming week with accepted clips matching audience peak slots in IST."""
    return {
        "scheduled_count": 5,
        "time_zone": "Asia/Kolkata (IST)",
        "message": "Week planned with optimal spacing: no duplicate topics within 48 hours",
        "items": [
            {"day": "Monday 9:00 IST", "platform": "linkedin", "clip": "clip-pricing-01"},
            {"day": "Tuesday 20:00 IST", "platform": "reels", "clip": "clip-pricing-01"},
            {"day": "Wednesday 18:30 IST", "platform": "x", "clip": "clip-retention-02"},
            {"day": "Thursday 9:00 IST", "platform": "linkedin", "clip": "clip-retention-02"},
            {"day": "Friday 17:00 IST", "platform": "shorts", "clip": "clip-pricing-01"},
        ],
    }


@router.get("/calendar/export.ics", tags=["Calendar"])
async def export_calendar_ics():
    """Export calendar to standard iCalendar (.ics) format."""
    ics_content = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//Reel Content Repurposing Studio//EN\r\n"
        "BEGIN:VEVENT\r\n"
        "SUMMARY:Reel Post: Per-Seat Pricing is a Tax on AI (LinkedIn)\r\n"
        "DTSTART:20261105T033000Z\r\n"
        "DTEND:20261105T040000Z\r\n"
        "DESCRIPTION:Scheduled via Reel Studio\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )
    return Response(content=ics_content, media_type="text/calendar")


# -----------------------------------------------------------------------------
# 8. Performance Feedback Loop (Implemented in app.performance.router)
# -----------------------------------------------------------------------------


# -----------------------------------------------------------------------------
# 9. Brand Identity & Scraper Adapter
# -----------------------------------------------------------------------------
class BrandScrapeRequest(BaseModel):
    platform: str = "linkedin"
    handle: str = "founderfiles"


@router.post("/brand/scrape", tags=["Brand"])
async def scrape_brand_profile(payload: BrandScrapeRequest):
    """Scrape social profile to extract voice profile and visual identity palette."""
    job = job_manager.create_job(type="brand_scrape", initial_stage="scraping", detail=f"Scraping @{payload.handle} on {payload.platform}")
    job_manager.update_progress(job.id, stage="palette_extraction", progress=60, detail="Extracting dominant colors and typography vibe")
    return {
        "job_id": job.id,
        "platform": payload.platform,
        "handle": payload.handle,
        "status": "processing",
        "message": "Scraper adapter running. SSE events available.",
    }


@router.get("/brand/kit", tags=["Brand"])
async def get_brand_kit():
    """Retrieve extracted brand kit: palette swatches, fonts, and visual rules."""
    return {
        "brand_name": "The Founder Files",
        "tagline": "Unpacking the hardest decisions in tech",
        "palette": {
            "primary": "#1A1A1A",
            "accent": "#F26522",
            "background": "#FAF9F6",
            "card_bg": "#FFFFFF",
            "border": "#E5E5E5",
        },
        "typography": {
            "heading": "Geist Sans",
            "mono": "Geist Mono",
            "vibe": "Editorial Minimalist / YC Aesthetic",
        },
        "visual_rules": {
            "do": ["Use high contrast dark backgrounds for quote cards", "Lead with bold serif headline in previews"],
            "dont": ["No decorative gradient blobs", "No AI-generated stock character illustrations"],
        },
        "voice_summary": "Crisp, metric-first, analytical tone with founder empathy.",
    }


# (Debug router is provided by app.api.debug from llm-router)

