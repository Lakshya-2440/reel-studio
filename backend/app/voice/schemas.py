"""Pydantic schemas for Voice Intake & Cleanup Engine."""

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class IntentEnum(str, Enum):
    create_brief = "create_brief"
    edit_caption = "edit_caption"
    schedule = "schedule"
    log_performance = "log_performance"
    brand_note = "brand_note"
    question = "question"


class Correction(BaseModel):
    """Represents a speech self-correction with discarded phrase and replacement."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    from_: str = Field(..., alias="from", description="Original spoken phrase being corrected")
    to: str = Field(..., description="Target corrected phrase")

    @model_validator(mode="before")
    @classmethod
    def handle_legacy_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            d = dict(data)
            if "original" in d and "from" not in d and "from_" not in d:
                d["from"] = d["original"]
            if "corrected" in d and "to" not in d:
                d["to"] = d["corrected"]
            return d
        return data


class VoiceInterpretRequest(BaseModel):
    """Payload for POST /voice/interpret."""

    text: Optional[str] = Field(
        None, description="Spoken raw dictation text (e.g. from Wispr Flow)"
    )
    raw_text: Optional[str] = Field(
        None, description="Backward-compatible alias for text"
    )
    context: Optional[dict[str, Any]] = Field(
        default=None,
        description="Optional execution context (e.g. current_screen, selected_clip, project_id)",
    )

    @model_validator(mode="after")
    def validate_and_populate_text(self) -> "VoiceInterpretRequest":
        if not self.text and not self.raw_text:
            raise ValueError("Either 'text' or 'raw_text' must be provided.")
        if not self.text:
            self.text = self.raw_text
        if not self.raw_text:
            self.raw_text = self.text
        return self


class VoiceInterpretResponse(BaseModel):
    """Clean structured intent and entities produced from messy voice dictation."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, use_enum_values=True)

    clean_text: str = Field(
        ..., description="Cleaned, grammatically natural directive with fillers excised and corrections applied"
    )
    intent: IntentEnum = Field(
        ..., description="Structured intent: create_brief | edit_caption | schedule | log_performance | brand_note | question"
    )
    entities: dict[str, Any] = Field(
        default_factory=dict,
        description="Extracted entities such as platform, clip_ref, when (IST +05:30), and metrics",
    )
    corrections_applied: list[Correction] = Field(
        default_factory=list,
        description="List of detected and applied speech self-corrections",
    )
    fillers_removed: list[str] = Field(
        default_factory=list,
        description="List of conversational filler words identified and removed",
    )
    confidence: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Confidence score between 0.0 and 1.0",
    )
    needs_clarification: Optional[str] = Field(
        default=None,
        description="Inline clarification question if intent or target entity is ambiguous",
    )
    raw_dictation: Optional[str] = Field(
        default=None,
        description="Original unmodified speech transcript",
    )
