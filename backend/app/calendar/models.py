"""
Calendar Models and Schemas.
Pydantic schemas for calendar slot requests, scheduling, updates,
responses, and week planning.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, model_validator

# Indian Standard Time (UTC+05:30)
IST = timezone(timedelta(hours=5, minutes=30), name="Asia/Kolkata")

PlatformType = Literal[
    "linkedin",
    "reels",
    "instagram_reels",
    "shorts",
    "youtube_shorts",
    "x",
    "twitter",
    "tiktok",
]

StatusType = Literal["idea", "draft", "scheduled", "posted", "skipped"]


def normalize_platform_name(p: Optional[str]) -> str:
    """Normalize input platform name to canonical key."""
    if not p:
        return "linkedin"
    clean = p.strip().lower().replace(" ", "_").replace("-", "_")
    if "linked" in clean:
        return "linkedin"
    if "reel" in clean or "instagram" in clean or clean == "ig":
        return "reels"
    if "short" in clean or "youtube" in clean or clean == "yt":
        return "shorts"
    if clean in ("x", "twitter"):
        return "x"
    if "tiktok" in clean or clean == "tt":
        return "tiktok"
    return clean


class CalendarItemBase(BaseModel):
    project_id: str = Field(default="proj_founder_files_42", description="Project ID")
    clip_id: Optional[str] = Field(default=None, description="Clip ID reference")
    variant_id: Optional[str] = Field(default=None, description="Platform variant ID reference")
    platform: str = Field(default="linkedin", description="Target platform")
    scheduled_for: str = Field(..., description="ISO 8601 timestamp in IST")
    status: str = Field(default="scheduled", description="idea, draft, scheduled, posted, skipped")
    slot_reason: Optional[str] = Field(default=None, description="Slot allocation rationale")
    title: Optional[str] = Field(default=None, description="Display title for calendar event")


class CalendarItemCreate(BaseModel):
    """Payload to create or schedule a new calendar item."""
    project_id: Optional[str] = Field(default="proj_founder_files_42")
    clip_id: Optional[str] = None
    variant_id: Optional[str] = None
    platform: str = Field(default="linkedin")
    scheduled_for: Optional[str] = None
    scheduled_time: Optional[str] = None  # Alias for backward compatibility
    slot_time_ist: Optional[str] = None   # Alias for frontend compatibility
    status: Optional[str] = "scheduled"
    slot_reason: Optional[str] = None
    ai_rationale: Optional[str] = None
    title: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Resolve scheduled time alias
            time_val = (
                data.get("scheduled_for")
                or data.get("scheduled_time")
                or data.get("slot_time_ist")
            )
            if time_val:
                data["scheduled_for"] = str(time_val)
            # Resolve rationale alias
            reason_val = data.get("slot_reason") or data.get("ai_rationale")
            if reason_val:
                data["slot_reason"] = str(reason_val)
                data["ai_rationale"] = str(reason_val)
        return data


class CalendarItemUpdate(BaseModel):
    """Payload to update an existing calendar slot (e.g. drag & drop, status change)."""
    scheduled_for: Optional[str] = None
    scheduled_time: Optional[str] = None
    slot_time_ist: Optional[str] = None
    platform: Optional[str] = None
    status: Optional[str] = None
    slot_reason: Optional[str] = None
    ai_rationale: Optional[str] = None
    title: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            time_val = (
                data.get("scheduled_for")
                or data.get("scheduled_time")
                or data.get("slot_time_ist")
            )
            if time_val:
                data["scheduled_for"] = str(time_val)
            reason_val = data.get("slot_reason") or data.get("ai_rationale")
            if reason_val:
                data["slot_reason"] = str(reason_val)
        return data


class CalendarItemResponse(BaseModel):
    """
    Standard calendar item returned by API.
    Provides dual aliases (scheduled_for / slot_time_ist, slot_reason / ai_rationale)
    for seamless compatibility with database, stubs, and frontend interfaces.
    """
    id: str
    project_id: str
    clip_id: Optional[str] = None
    variant_id: Optional[str] = None
    title: str = "Untitled Repurposed Clip"
    platform: str
    scheduled_for: str  # ISO string in IST (e.g. 2026-11-02T08:30:00+05:30)
    slot_time_ist: str  # Alias identical to scheduled_for
    status: str = "scheduled"
    slot_reason: Optional[str] = None
    ai_rationale: Optional[str] = None
    is_ai_recommended: bool = True
    ai_confidence: float = 0.85
    is_learned: bool = False
    copy_text: Optional[str] = None
    hook: Optional[str] = None
    hashtags: Optional[List[str]] = None
    topic: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: Optional[str] = None


class SlotSuggestion(BaseModel):
    """Optimal slot recommendation for a single clip/platform in IST."""
    day_name: str
    date_str: str
    slot_time_ist: str
    platform: str
    score: float
    is_learned: bool
    rationale: str
    time_slot_label: str  # morning_ist, afternoon_ist, evening_ist


class PlanWeekRequest(BaseModel):
    """Payload to trigger automated week planning algorithm."""
    project_id: Optional[str] = Field(default="proj_founder_files_42")
    start_date: Optional[str] = Field(
        default=None,
        description="Target week start date in YYYY-MM-DD or ISO format (defaults to upcoming Monday in IST)",
    )
    target_platforms: Optional[List[str]] = Field(
        default=None,
        description="List of platforms to schedule across (defaults to [linkedin, twitter, reels, shorts, tiktok])",
    )
    max_posts_per_day: Optional[int] = Field(
        default=2,
        ge=1,
        le=5,
        description="Maximum posts scheduled per calendar day across all platforms",
    )
    persist: Optional[bool] = Field(
        default=True,
        description="Whether to commit scheduled slots into calendar_items table",
    )


class PlanWeekResponse(BaseModel):
    """Response returned by automated week planning algorithm."""
    scheduled_count: int
    time_zone: str = "Asia/Kolkata (IST, UTC+05:30)"
    message: str
    items: List[CalendarItemResponse]
    distribution_summary: Dict[str, int] = Field(default_factory=dict)
    guardrail_status: Dict[str, Any] = Field(default_factory=dict)
