"""
Schemas for Performance Feedback Loop (Req 6)
Pydantic models for metric logging, feature tagging, weight tracking, and causal insights.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


class PerformanceMetricInput(BaseModel):
    """
    Input model for logging actual post performance metrics.
    Can originate from manual UI form, CSV parser, or voice intake pipeline.
    """
    project_id: str = Field(default="proj_founder_files_42", description="Project identifier")
    post_id: Optional[str] = Field(default=None, description="Optional clip or post ID")
    platform: str = Field(default="linkedin", description="Target platform: linkedin, reels, shorts, x, tiktok")
    views: int = Field(default=0, ge=0, description="Impression or view count")
    likes: int = Field(default=0, ge=0, description="Like or reaction count")
    comments: int = Field(default=0, ge=0, description="Comment or reply count")
    shares: int = Field(default=0, ge=0, description="Share or repost count")
    saves: int = Field(default=0, ge=0, description="Bookmark or save count")
    retention_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Average watch-time retention %")
    followers_gained: int = Field(default=0, ge=0, description="Attributed follower conversions")
    
    # Optional content and explicit feature tags (auto-extracted if omitted)
    content: Optional[str] = Field(default=None, description="Post hook or caption text for feature extraction")
    hook_type: Optional[str] = Field(default=None, description="number, question, contrarian, story, listicle")
    length_bucket: Optional[str] = Field(default=None, description="short_<30s, medium_30-45s, long_>45s")
    topic: Optional[str] = Field(default=None, description="Topic tag or chapter theme")
    time_slot: Optional[str] = Field(default=None, description="morning_ist, afternoon_ist, evening_ist")
    day_of_week: Optional[str] = Field(default=None, description="Monday, Tuesday, etc.")
    posted_at: Optional[str] = Field(default=None, description="ISO timestamp of publication")


# Alias for backward compatibility with existing stubs and frontend payloads
class PerformanceLogRequest(PerformanceMetricInput):
    pass


class PostFeatures(BaseModel):
    """Extracted or tagged qualitative and temporal features of a post."""
    hook_type: str = Field(..., description="number, question, contrarian, story, general")
    length_bucket: str = Field(..., description="short_<30s, medium_30-45s, long_>45s")
    platform: str = Field(..., description="Platform identifier")
    time_slot: str = Field(..., description="morning_ist, afternoon_ist, evening_ist, night_ist")
    day_of_week: str = Field(..., description="Day name")
    topic: Optional[str] = Field(default="general", description="Topic/chapter classification")
    has_cta: bool = Field(default=False, description="Whether post contains call to action")
    caption_length: str = Field(default="medium", description="short, medium, long")


class FeatureLift(BaseModel):
    """Calculated statistical performance lift for a given feature."""
    feature_name: str
    feature_value: str
    sample_count: int
    avg_engagement: float
    baseline_engagement: float
    lift_ratio: float = Field(..., description="Relative multiplier vs baseline, e.g. 2.4x")
    lift_pct: float = Field(..., description="Percentage change vs baseline, e.g. +140%")
    confidence: Literal["high", "moderate", "low", "prior"]
    direction: Literal["positive", "negative", "neutral"]
    contrast_summary: Optional[str] = None


class WeightUpdate(BaseModel):
    """Delta record for a feature weight update."""
    feature_key: str
    old_weight: float
    new_weight: float
    delta: float
    lift_pct: float
    summary: str


class CausalInsight(BaseModel):
    """
    Rich causal narrative describing what changed in suggestion weights and why.
    Satisfies PRD 6.6 "What changed and why" feed.
    """
    id: str
    project_id: str
    timestamp: str
    headline: str
    explanation: str
    impact_action: str
    metric_lift: str
    confidence: Literal["high", "moderate", "low", "prior"] = "high"
    feature: Optional[str] = None
    next_experiment: Optional[str] = None

    # Backward compatibility aliases
    @property
    def title(self) -> str:
        return self.headline

    @property
    def description(self) -> str:
        return self.explanation

    @property
    def recommendation(self) -> str:
        return self.impact_action

    @property
    def action(self) -> str:
        return self.impact_action

    @property
    def lift(self) -> str:
        return self.metric_lift

    @property
    def insight(self) -> str:
        return self.explanation


class PerformanceLogResponse(BaseModel):
    """API response after logging a single post performance record."""
    status: str = "recorded"
    log_id: str
    project_id: str
    post_id: Optional[str] = None
    engagement_score: float
    features_tagged: Dict[str, Any]
    weight_updates: Dict[str, str]
    insight_generated: Optional[str] = None
    updated_weights: Dict[str, Any]
    new_insights: List[Dict[str, Any]] = Field(default_factory=list)


class CSVUploadResponse(BaseModel):
    """API response after batch uploading CSV metrics."""
    filename: str
    rows_processed: int
    platforms_detected: List[str]
    status: str = "success"
    message: str
    new_insights_count: int = 0
    updated_weights: Dict[str, Any] = Field(default_factory=dict)


class FeatureWeightItem(BaseModel):
    """Item in weights table."""
    feature_name: str
    feature_category: str
    lift_ratio: float
    sample_size: int
    confidence: Literal["high", "moderate", "low", "prior"]
    direction: Literal["positive", "negative", "neutral"]
    description: str
    weight: float


class FeatureWeightsTableResponse(BaseModel):
    """Hierarchical and flat table view of current learned suggestion weights."""
    hook_types: Dict[str, float]
    length_buckets: Dict[str, float]
    time_slots: Dict[str, float]
    best_times_ist: Dict[str, List[str]]
    weights_table: List[FeatureWeightItem]
