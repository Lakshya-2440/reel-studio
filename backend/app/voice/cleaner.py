"""Voice Intake Cleaner & Natural Speech Interpreter for Reel.

Provides dual-engine capability:
1. LLM-assisted structured interpretation via LLMRouter (HF primary, Gemini fallback).
2. Deterministic, zero-config rule-based cleaning engine:
   - Removes speech fillers ("um", "uh", "like", "you know", "actually wait", "so yeah", "basically").
   - Resolves speech self-corrections ("make that for Instagram, actually no, LinkedIn").
   - Extracts platform, clip references (with fuzzy DB matching), metrics, and IST (+05:30) timestamps.
"""

import difflib
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.llm.router import LLMRouter
from app.voice.schemas import Correction, IntentEnum, VoiceInterpretResponse

logger = logging.getLogger("reel.voice.cleaner")

# India Standard Time (+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

# Baseline simulation date for relative IST date calculations (Saturday, 31 Oct 2026)
DEFAULT_BASE_DATETIME = datetime(2026, 10, 31, 9, 0, 0, tzinfo=IST)

# Pre-seeded catalog fallback if DB is unreachable
FALLBACK_CLIPS = [
    {
        "id": "clip_1",
        "title": "The $42k OpenAI Bill That Almost Killed Us",
        "hook_line": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.",
    },
    {
        "id": "clip_2",
        "title": "The 70% Gross Margin Rule for AI Startups",
        "hook_line": "If your gross margin is under 70%, you didn't build software—you built a glorified consultancy with an API key.",
    },
    {
        "id": "clip_3",
        "title": "Why Per-Token Pricing Kills Conversion",
        "hook_line": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.",
    },
    {
        "id": "clip_4",
        "title": "What Happens When You 10x Price Overnight",
        "hook_line": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.",
    },
    {
        "id": "clip_5",
        "title": "The Most Dangerous Customer in Early Stage",
        "hook_line": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.",
    },
    {
        "id": "clip_6",
        "title": "Firing 12 Customers in One Afternoon",
        "hook_line": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.",
    },
    {
        "id": "clip_7",
        "title": "What Enterprise Procurement Actually Fears",
        "hook_line": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.",
    },
    {
        "id": "clip_8",
        "title": "Sell the Shield, Never the Sword",
        "hook_line": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.",
    },
    {
        "id": "clip_9",
        "title": "The Multi-Million Dollar Moat Delusion",
        "hook_line": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.",
    },
    {
        "id": "clip_10",
        "title": "The Monday Morning Retention Test",
        "hook_line": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product—you have a bookmark.",
    },
    {
        "id": "clip_11",
        "title": "Out-Shipping Big Tech Aircraft Carriers",
        "hook_line": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.",
    },
    {
        "id": "clip_12",
        "title": "The Brutal Math of Founder Survival",
        "hook_line": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.",
    },
]

# Conversational speech filler patterns
FILLER_DEFINITIONS = [
    (r"\bactually\s+wait\b", "actually wait"),
    (r"\bwait\s+actually\b", "wait actually"),
    (r"\byou\s+know\b", "you know"),
    (r"\bso\s+yeah\b", "so yeah"),
    (r"\bbasically\b", "basically"),
    (r"\bum+\b", "um"),
    (r"\buh+\b", "uh"),
    (r"\bah+\b", "ah"),
    (r"\ber+\b", "er"),
    (r"\bi\s+mean\b", "i mean"),
    (r"\bsort\s+of\b", "sort of"),
    (r"\bkinda\b", "kinda"),
    (r"(?:^|[,\s])like\s+(?=[a-z0-9])", "like"),
]

# Self-correction cues
CORRECTION_CUE_REGEX = re.compile(
    r"(?P<before>.*?)(?:,\s*|\s+)(?P<cue>actually no|actually not|wait no|no wait|scratch that|wait actually|actually wait|or rather)(?:,\s*|\s+)(?P<after>.*)",
    re.IGNORECASE,
)


class VoiceCleaner:
    """Interprets messy voice dictation into clean, structured actions."""

    def __init__(
        self,
        llm_router: Optional[LLMRouter] = None,
        base_datetime: Optional[datetime] = None,
    ):
        self.llm_router = llm_router or LLMRouter()
        self.base_datetime = base_datetime or DEFAULT_BASE_DATETIME

    # -------------------------------------------------------------------------
    # Database Clip Retrieval & Fuzzy Matching
    # -------------------------------------------------------------------------
    @staticmethod
    def get_database_clips() -> list[dict[str, Any]]:
        """Fetch clips from Postgres/SQLite with static catalog fallback."""
        try:
            from db.connection import SessionLocal
            from sqlalchemy import text

            with SessionLocal() as session:
                rows = session.execute(
                    text("SELECT id, title, hook_line FROM clips")
                ).fetchall()
                if rows:
                    return [
                        {
                            "id": str(r[0]),
                            "title": str(r[1]),
                            "hook_line": str(r[2] or ""),
                        }
                        for r in rows
                    ]
        except Exception as exc:
            logger.debug("Failed querying clips from database: %s", exc)

        return FALLBACK_CLIPS

    def fuzzy_resolve_clip(
        self, clip_reference: str, clips: Optional[list[dict[str, Any]]] = None
    ) -> Optional[dict[str, Any]]:
        """Match a spoken clip reference (e.g. 'the pricing clip') against clips catalog."""
        if not clip_reference:
            return None

        candidates = clips or self.get_database_clips()
        ref_clean = (
            clip_reference.lower()
            .replace("clip", "")
            .replace("the", "")
            .replace("one", "")
            .replace("about", "")
            .strip()
        )

        if ref_clean in ("podcast", "first", "latest", "recent"):
            return candidates[0] if candidates else None

        best_match = None
        best_score = -1.0

        for candidate in candidates:
            score = 0.0
            title_low = candidate["title"].lower()
            hook_low = candidate["hook_line"].lower()

            # Exact keyword match
            if ref_clean and ref_clean in title_low:
                score += 2.5
            if ref_clean and ref_clean in hook_low:
                score += 1.5

            # Token overlap
            ref_words = set(ref_clean.split())
            title_words = set(title_low.split())
            hook_words = set(hook_low.split())
            overlap = len(ref_words & (title_words | hook_words))
            score += overlap * 1.8

            # SequenceMatcher similarity
            ratio = difflib.SequenceMatcher(None, ref_clean, title_low).ratio()
            score += ratio * 1.2

            if score > best_score:
                best_score = score
                best_match = candidate

        if best_score >= 0.4:
            return best_match
        return None

    # -------------------------------------------------------------------------
    # IST Datetime Resolver
    # -------------------------------------------------------------------------
    def resolve_ist_datetime(
        self, text: str, base_dt: Optional[datetime] = None
    ) -> Optional[str]:
        """Convert relative weekday/time expressions into ISO 8601 string with +05:30 IST offset."""
        text_lower = text.lower()
        base = base_dt or self.base_datetime
        days = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }

        matched_day = None
        for day_name, day_num in days.items():
            if day_name in text_lower:
                matched_day = day_num
                break

        target_dt = base
        if matched_day is not None:
            current_day = base.weekday()
            days_ahead = (matched_day - current_day) % 7
            if days_ahead == 0:
                days_ahead = 7
            target_dt = base + timedelta(days=days_ahead)
        elif "tomorrow" in text_lower:
            target_dt = base + timedelta(days=1)
        elif not any(
            t in text_lower
            for t in ["morning", "afternoon", "evening", "am", "pm", "today", "schedule"]
        ):
            # No timing tokens present
            return None

        # Determine target hour & minute
        hour = 9
        minute = 0
        if "morning" in text_lower:
            hour = 9
        elif "afternoon" in text_lower:
            hour = 14
        elif "evening" in text_lower:
            hour = 19

        # Match specific hour: e.g. "9am", "5pm", "9:30 AM", "at 5"
        m_ampm = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", text_lower)
        m_at = re.search(r"(?:at|around)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", text_lower)
        time_target = m_ampm or m_at

        if time_target:
            h = int(time_target.group(1))
            minute = int(time_target.group(2) or 0)
            ampm = (time_target.group(3) or "").lower()
            if ampm == "pm" and h < 12:
                h += 12
            elif ampm == "am" and h == 12:
                h = 0
            elif not ampm:
                if h <= 7:  # Interpret "at 5" as 5:00 PM
                    h += 12
            hour = h

        resolved = target_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return resolved.isoformat()

    # -------------------------------------------------------------------------
    # Metrics Extractor
    # -------------------------------------------------------------------------
    @staticmethod
    def extract_metrics(text: str) -> dict[str, int]:
        """Extract performance metrics like views, likes, comments, and saves."""
        metrics: dict[str, int] = {}

        # Views
        m_views = re.search(
            r"(\d+(?:[.,]\d+)?)\s*(k|m|million|thousand)?\s*(?:views|view|impressions)",
            text,
            re.IGNORECASE,
        )
        if m_views:
            val = float(m_views.group(1).replace(",", ""))
            mult = (m_views.group(2) or "").lower()
            if mult in ("k", "thousand"):
                val *= 1000
            elif mult in ("m", "million"):
                val *= 1000000
            metrics["views"] = int(val)

        # Likes
        m_likes = re.search(
            r"(\d+(?:[.,]\d+)?)\s*(k|m|million|thousand)?\s*(?:likes|like)",
            text,
            re.IGNORECASE,
        )
        if m_likes:
            val = float(m_likes.group(1).replace(",", ""))
            mult = (m_likes.group(2) or "").lower()
            if mult in ("k", "thousand"):
                val *= 1000
            elif mult in ("m", "million"):
                val *= 1000000
            metrics["likes"] = int(val)

        # Comments
        m_comm = re.search(
            r"(\d+(?:[.,]\d+)?)\s*(k|m|million|thousand)?\s*(?:comments|comment)",
            text,
            re.IGNORECASE,
        )
        if m_comm:
            val = float(m_comm.group(1).replace(",", ""))
            metrics["comments"] = int(val)

        # Saves
        m_saves = re.search(
            r"(\d+(?:[.,]\d+)?)\s*(k|m|million|thousand)?\s*(?:saves|save)",
            text,
            re.IGNORECASE,
        )
        if m_saves:
            val = float(m_saves.group(1).replace(",", ""))
            metrics["saves"] = int(val)

        return metrics

    # -------------------------------------------------------------------------
    # Speech Self-Correction Engine
    # -------------------------------------------------------------------------
    def apply_self_corrections(self, text: str) -> tuple[str, list[Correction]]:
        """Detect and apply conversational self-corrections."""
        match = CORRECTION_CUE_REGEX.search(text)
        if not match:
            # Check for "actually make that" pattern
            m_make = re.match(
                r"(?P<before>.*?)(?:,\s*|\s+)(?:actually make that\s+)(?P<after>.*)",
                text,
                re.IGNORECASE,
            )
            if not m_make:
                return text, []
            before = m_make.group("before").strip()
            after = m_make.group("after").strip()
        else:
            before = match.group("before").strip()
            after = match.group("after").strip()

        corrections: list[Correction] = []
        clean_text = text

        # 1. Day / Time replacement (e.g. Thursday morning -> Friday on LinkedIn)
        days = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]
        d_before = [d for d in days if d in before.lower()]
        d_after = [d for d in days if d in after.lower()]

        # 2. Platform replacement (e.g. Instagram -> LinkedIn)
        platforms = [
            "linkedin",
            "instagram",
            "reels",
            "shorts",
            "youtube",
            "tiktok",
            "x",
            "twitter",
        ]
        p_before = [p for p in platforms if p in before.lower()]
        p_after = [p for p in platforms if p in after.lower()]

        # 3. Time replacement (e.g. 5pm -> 9am / morning at 9am)
        t_before = re.findall(
            r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b", before, re.IGNORECASE
        )
        t_after = re.findall(
            r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b", after, re.IGNORECASE
        )

        replaced_from = None
        replaced_to = None

        if d_before and d_after:
            m_phrase = re.search(
                r"\b" + d_before[0] + r"(?:\s+morning|\s+afternoon|\s+evening)?\b",
                before,
                re.IGNORECASE,
            )
            replaced_from = m_phrase.group(0) if m_phrase else d_before[0]
            m_after_day = re.search(
                r"\b" + d_after[0] + r"(?:\s+morning|\s+afternoon|\s+evening)?\b",
                after,
                re.IGNORECASE,
            )
            replaced_to = m_after_day.group(0) if m_after_day else d_after[0]
            clean_text = before[: m_phrase.start()] + after if m_phrase else f"{before} {after}"

        elif p_before and p_after:
            m_plat = re.search(r"\b" + p_before[0] + r"\b", before, re.IGNORECASE)
            replaced_from = m_plat.group(0) if m_plat else p_before[0]
            m_after_plat = re.search(r"\b" + p_after[0] + r"\b", after, re.IGNORECASE)
            replaced_to = m_after_plat.group(0) if m_after_plat else p_after[0]
            clean_text = before[: m_plat.start()] + after if m_plat else f"{before} {after}"

        elif t_before and (t_after or "morning" in after.lower() or "afternoon" in after.lower()):
            m_time = re.search(
                r"(?:at\s+)?\b" + re.escape(t_before[0]) + r"\b", before, re.IGNORECASE
            )
            replaced_from = m_time.group(0) if m_time else t_before[0]
            replaced_to = after
            clean_text = before[: m_time.start()] + after if m_time else f"{before} {after}"

        else:
            # Fallback phrase replacement
            before_chunks = [c.strip() for c in before.split(",") if c.strip()]
            replaced_from = before_chunks[-1] if before_chunks else before
            replaced_to = after
            prefix = ", ".join(before_chunks[:-1])
            clean_text = f"{prefix} {after}".strip() if prefix else after

        if replaced_from and replaced_to:
            corrections.append(Correction(from_=replaced_from, to=replaced_to))

        return clean_text, corrections

    # -------------------------------------------------------------------------
    # Conversational Filler Removal
    # -------------------------------------------------------------------------
    @staticmethod
    def remove_fillers(text: str) -> tuple[str, list[str]]:
        """Remove spoken fillers while preserving nouns, metrics, and genuine uses."""
        fillers_removed: list[str] = []
        cleaned = text

        for pattern, label in FILLER_DEFINITIONS:
            if re.search(pattern, cleaned, re.IGNORECASE):
                # Guard 'like' from being removed if it refers to likes metric or verb
                if label == "like":
                    # If sentence is '400 likes' or 'I like', skip removing that word
                    if not re.search(r"(?:^|[,\s])like\s+(?=[a-z0-9])", cleaned, re.IGNORECASE):
                        continue
                if label not in fillers_removed:
                    fillers_removed.append(label)
                cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)

        # Clean punctuation and whitespace artifacts
        cleaned = re.sub(r"\s*,\s*,+", ",", cleaned)
        cleaned = re.sub(r"^\s*,\s*", "", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        # Ensure trailing period and capitalized start
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:]
            if not cleaned.endswith((".", "!", "?")):
                cleaned += "."

        return cleaned, fillers_removed

    # -------------------------------------------------------------------------
    # Intent Classifier
    # -------------------------------------------------------------------------
    @staticmethod
    def classify_intent(text: str, context: Optional[dict[str, Any]] = None) -> IntentEnum:
        """Classify user intent into one of 6 canonical IntentEnum categories."""
        lower = text.lower()

        # 1. Schedule
        if any(w in lower for w in ["schedule", "calendar", "slot", "queue", "post on", "publish on"]):
            return IntentEnum.schedule

        # 2. Performance Logging
        if any(w in lower for w in ["views", "likes", "impressions", "flopped", "metrics", "stats", "retention"]):
            return IntentEnum.log_performance

        # 3. Brand Voice Note / Guideline
        if any(w in lower for w in ["rule", "brand note", "voice", "ban ", "banned", "never use", "don't use", "always use", "tone"]):
            return IntentEnum.brand_note

        # 4. Edit Caption / Copy
        if any(w in lower for w in ["caption", "hook", "punchier", "rewrite", "make it", "lead with", "emojis", "variant", "make that for"]):
            return IntentEnum.edit_caption

        # 5. Question
        if any(lower.startswith(q) for q in ["what", "how", "why", "where", "can you", "could you"]) or lower.endswith("?"):
            return IntentEnum.question

        # 6. Create Brief
        if any(w in lower for w in ["brief", "new project", "create project", "episode", "ingest"]):
            return IntentEnum.create_brief

        # Context-aware fallback
        if context:
            screen = context.get("current_screen", "")
            if screen == "calendar":
                return IntentEnum.schedule
            if screen == "performance":
                return IntentEnum.log_performance
            if screen in ("copy", "clips"):
                return IntentEnum.edit_caption
            if screen == "voice-memory":
                return IntentEnum.brand_note

        return IntentEnum.edit_caption

    # -------------------------------------------------------------------------
    # Rule-Based Pipeline (Offline / Deterministic Fallback)
    # -------------------------------------------------------------------------
    def clean_rule_based(
        self, raw_text: str, context: Optional[dict[str, Any]] = None
    ) -> VoiceInterpretResponse:
        """Clean dictation and extract structured intent using deterministic rules."""
        # 1. Apply self-corrections
        after_corrections, corrections = self.apply_self_corrections(raw_text)

        # 2. Remove filler words
        clean_text, fillers = self.remove_fillers(after_corrections)

        # 3. Classify intent
        intent = self.classify_intent(clean_text, context)

        # 4. Extract entities
        entities: dict[str, Any] = {}
        clean_lower = clean_text.lower()

        # Platform
        if "linkedin" in clean_lower:
            entities["platform"] = "linkedin"
        elif any(p in clean_lower for p in ["instagram", "reels", "ig"]):
            entities["platform"] = "reels"
        elif any(p in clean_lower for p in ["youtube", "shorts"]):
            entities["platform"] = "shorts"
        elif any(p in clean_lower for p in ["twitter", " x "]) or clean_lower.endswith(" x") or clean_lower.startswith("x "):
            entities["platform"] = "x"
        elif "tiktok" in clean_lower:
            entities["platform"] = "tiktok"

        # Clip Reference & Fuzzy DB Resolution
        m_clip = re.search(
            r"(?:the\s+)?([a-z0-9$_\-\s]+?)\s+(?:clip|video|segment|one)",
            clean_text,
            re.IGNORECASE,
        )
        if m_clip:
            clip_ref_raw = m_clip.group(0).strip()
            # Clean up leading verbs and prepositions
            clip_ref = clip_ref_raw
            while True:
                new_ref = re.sub(
                    r"^(?:on|at|for|the|schedule|post|make|log|edit)\s+",
                    "",
                    clip_ref,
                    flags=re.IGNORECASE,
                ).strip()
                if new_ref == clip_ref:
                    break
                clip_ref = new_ref

            entities["clip_ref"] = clip_ref

            resolved = self.fuzzy_resolve_clip(clip_ref)
            if resolved:
                entities["resolved_clip_id"] = resolved["id"]
                entities["resolved_clip_title"] = resolved["title"]

        # Date & Time in IST
        when_ist = self.resolve_ist_datetime(clean_text)
        if when_ist:
            entities["when"] = when_ist

        # Performance Metrics
        metrics = self.extract_metrics(raw_text)
        if metrics:
            entities["metrics"] = metrics

        # Modifiers
        modifiers = []
        if "no emoji" in clean_lower or "drop the emoji" in clean_lower:
            modifiers.append("no_emojis")
        if "punchier" in clean_lower:
            modifiers.append("punchier")
        if "lead with the number" in clean_lower:
            modifiers.append("lead_with_number")
        if modifiers:
            entities["modifiers"] = modifiers

        confidence = 0.94 if (intent and (entities or clean_text)) else 0.55
        needs_clarification = (
            None
            if confidence >= 0.6
            else "Could you clarify the exact clip title or platform target?"
        )

        return VoiceInterpretResponse(
            clean_text=clean_text,
            intent=intent,
            entities=entities,
            corrections_applied=corrections,
            fillers_removed=fillers,
            confidence=confidence,
            needs_clarification=needs_clarification,
            raw_dictation=raw_text,
        )

    # -------------------------------------------------------------------------
    # Main Interpretation Entrypoint (Async with LLMRouter + Fallback)
    # -------------------------------------------------------------------------
    async def interpret(
        self, raw_text: str, context: Optional[dict[str, Any]] = None
    ) -> VoiceInterpretResponse:
        """Interpret dictation into structured intent via LLM Router or rule engine."""
        raw_text_clean = raw_text.strip()
        if not raw_text_clean:
            return VoiceInterpretResponse(
                clean_text="",
                intent=IntentEnum.question,
                entities={},
                corrections_applied=[],
                fillers_removed=[],
                confidence=0.0,
                needs_clarification="Voice input was empty. Please speak your instruction.",
                raw_dictation=raw_text,
            )

        # Attempt LLM processing if API tokens are available
        has_llm_credentials = bool(self.llm_router.hf_token or self.llm_router.gemini_api_key)

        if has_llm_credentials and not self.llm_router.force_fail_hf:
            system_prompt = (
                "You are the Voice Intake & Cleanup Engine for Reel, a content studio.\n"
                "Your role is to process messy conversational speech into clean structured intents.\n"
                "1. Remove fillers: um, uh, like, you know, actually wait, so yeah, basically.\n"
                "2. Apply self-corrections (e.g. 'Instagram, actually no, LinkedIn' -> 'LinkedIn').\n"
                "3. Classify intent: create_brief | edit_caption | schedule | log_performance | brand_note | question.\n"
                "4. Extract entities: platform, clip_ref, when (ISO 8601 with +05:30 IST timezone), metrics ({views, likes, ...}).\n"
                "5. Return strictly valid JSON conforming to the requested schema."
            )
            user_msg = (
                f"Raw Speech Input:\n\"{raw_text_clean}\"\n"
                f"Context: {json.dumps(context or {})}\n"
                f"Base IST Time: {self.base_datetime.isoformat()}"
            )

            try:
                result = await self.llm_router.chat(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                    schema=VoiceInterpretResponse,
                    task="voice_interpret",
                )
                if isinstance(result, dict):
                    # Augment with raw_dictation
                    result["raw_dictation"] = raw_text_clean
                    # If when is present, ensure IST timezone offset
                    if "when" in result.get("entities", {}) and result["entities"]["when"]:
                        when_val = result["entities"]["when"]
                        if "+05:30" not in when_val:
                            ist_dt = self.resolve_ist_datetime(raw_text_clean)
                            if ist_dt:
                                result["entities"]["when"] = ist_dt

                    # Run fuzzy resolution if clip_ref exists but not resolved
                    clip_ref = result.get("entities", {}).get("clip_ref")
                    if clip_ref and "resolved_clip_id" not in result.get("entities", {}):
                        resolved = self.fuzzy_resolve_clip(clip_ref)
                        if resolved:
                            result["entities"]["resolved_clip_id"] = resolved["id"]
                            result["entities"]["resolved_clip_title"] = resolved["title"]

                    return VoiceInterpretResponse.model_validate(result)

            except Exception as exc:
                logger.warning("LLM voice cleanup failed, falling back to rule engine: %s", exc)

        # Fallback to deterministic rule engine
        return self.clean_rule_based(raw_text_clean, context)

    def interpret_sync(
        self, raw_text: str, context: Optional[dict[str, Any]] = None
    ) -> VoiceInterpretResponse:
        """Synchronous helper for rule-based interpretation."""
        return self.clean_rule_based(raw_text.strip(), context)
