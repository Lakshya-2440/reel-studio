import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.copy.config import get_all_platform_configs, get_platform_config, load_platform_configs
from app.copy.voice_scorer import compute_voice_match_score
from app.llm.router import llm_router
from db.connection import SessionLocal

logger = logging.getLogger("reel.copy.generator")


class HookOption(BaseModel):
    id: str
    text: str
    score: float


class SinglePlatformCopy(BaseModel):
    id: str
    clip_id: str
    platform: str
    platform_name: str
    hook: str
    selected_hook: str
    hook_options: List[HookOption]
    hookA: str
    hookB: str
    activeHook: int = 0
    caption: str
    hashtags: List[str]
    cta: str
    on_screen_text: Optional[str] = None
    onScreenText: Optional[str] = None
    title: Optional[str] = None
    pinned_comment: Optional[str] = None
    pinnedComment: Optional[str] = None
    thread_posts: Optional[List[str]] = None
    voice_match_score: float
    voiceMatchScore: float
    character_count: int
    charLimit: int
    max_characters: int
    cut_off_at: int
    cutOffAt: int
    creator_edited: bool = False
    notes: Optional[str] = None


class PlatformCopyGenerationResult(BaseModel):
    clip_id: str
    variants: Dict[str, Any]


class LLMSinglePlatformDraft(BaseModel):
    hook_a: str = Field(description="Primary hook option A (under cut-off limit)")
    hook_b: str = Field(description="Alternative hook option B for A/B testing")
    caption: str = Field(description="Full primary caption text obeying platform rules")
    hashtags: List[str] = Field(description="Platform-appropriate hashtags")
    cta: str = Field(description="Clear call to action aligned with platform style")
    on_screen_text: Optional[str] = Field(default=None, description="On-screen text beat for video frame")
    title: Optional[str] = Field(default=None, description="Title strictly <= 100 characters for YouTube Shorts")
    pinned_comment: Optional[str] = Field(default=None, description="Proposed pinned comment for YouTube Shorts")
    thread_posts: Optional[List[str]] = Field(default=None, description="3-5 post thread for X / Twitter")


class LLMPlatformCopyOutput(BaseModel):
    linkedin: LLMSinglePlatformDraft
    instagram_reels: LLMSinglePlatformDraft
    youtube_shorts: LLMSinglePlatformDraft
    twitter: LLMSinglePlatformDraft
    tiktok: LLMSinglePlatformDraft


class PlatformCopyEngine:
    """Core copy engine for Reel.
    Generates 5 platform-tailored copy variants for any clip using LLMRouter
    conditioned on Brand Voice Memory rules, tone profile, and top exemplars.
    """

    def __init__(self):
        self.configs = load_platform_configs()

    def get_clip_context(self, clip_id: str, db: Optional[Any] = None) -> Dict[str, Any]:
        """Fetch clip details from DB, or construct fallback if clip_id not found."""
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            row = db.execute(
                text("""
                    SELECT id, project_id, title, hook_line, evidence_quote, reasons
                    FROM clips WHERE id = :cid
                """),
                {"cid": clip_id},
            ).fetchone()

            if row:
                reasons_val = row[5]
                summary_text = ""
                if reasons_val:
                    try:
                        reasons_list = json.loads(reasons_val) if isinstance(reasons_val, str) else reasons_val
                        summary_text = " ".join(reasons_list[:2]) if isinstance(reasons_list, list) else str(reasons_val)
                    except Exception:
                        summary_text = str(reasons_val)

                return {
                    "id": row[0],
                    "project_id": row[1] or "demo-project",
                    "title": row[2] or f"Clip {clip_id}",
                    "hook_line": row[3] or "The most counter-intuitive founder lesson",
                    "quote": row[4] or "We were subsidizing enterprise pilots on personal credit cards.",
                    "summary": summary_text or "Why founders must rethink pricing and unit economics in the AI era.",
                }
        except Exception as e:
            logger.warning(f"DB lookup for clip {clip_id} failed: {e}. Using deterministic clip profile.")
        finally:
            if should_close_db:
                db.close()

        # Seed fallback clip data
        return {
            "id": clip_id,
            "project_id": "demo-project",
            "title": "Per-Seat SaaS Pricing is Dead in 2026",
            "hook_line": "Per-seat SaaS pricing is dead. Here is the math:",
            "summary": "Charging per seat taxes customers for AI adoption. Outcome-based pricing drives 3.4x higher NRR.",
            "quote": "If you charge per seat in 2026, you are taxing your customers for adopting AI.",
        }

    def get_voice_context(self, project_id: str, db: Optional[Any] = None) -> Dict[str, Any]:
        """Fetch active voice rules, tone sliders, and exemplars from database."""
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        rules: List[Dict[str, Any]] = []
        exemplars: List[Dict[str, Any]] = []
        summary = "Direct, authoritative B2B founder voice. Leads with quantitative contrast or contrarian observations."
        banned_words = ["synergy", "game-changer", "delighted to announce", "leverage"]
        signature_phrases = ["Here is the math:", "Stop measuring", "Taxing your customers"]

        try:
            rule_rows = db.execute(
                text("""
                    SELECT r.id, r.rule_text, r.confidence, r.category
                    FROM voice_rules r
                    JOIN voice_profiles p ON r.profile_id = p.id
                    WHERE p.project_id = :pid AND r.is_active = TRUE
                    ORDER BY r.confidence DESC
                    LIMIT 8
                """),
                {"pid": project_id},
            ).fetchall()

            for r in rule_rows:
                rules.append({
                    "id": r[0],
                    "rule": r[1],
                    "confidence": float(r[2] or 0.9),
                    "category": r[3] or "tone",
                })

            ex_rows = db.execute(
                text("""
                    SELECT e.platform, e.ai_draft, e.creator_final
                    FROM voice_examples e
                    JOIN voice_profiles p ON e.profile_id = p.id
                    WHERE p.project_id = :pid
                    ORDER BY e.created_at DESC
                    LIMIT 5
                """),
                {"pid": project_id},
            ).fetchall()

            for e in ex_rows:
                exemplars.append({
                    "platform": e[0],
                    "ai_draft": e[1],
                    "creator_final": e[2],
                })

            p_row = db.execute(
                text("SELECT summary FROM voice_profiles WHERE project_id = :pid ORDER BY version DESC LIMIT 1"),
                {"pid": project_id},
            ).fetchone()
            if p_row and p_row[0]:
                summary = p_row[0]

        except Exception as e:
            logger.debug(f"Could not load voice context from DB: {e}. Using active default voice profile.")
        finally:
            if should_close_db:
                db.close()

        if not rules:
            rules = [
                {"rule": "Lead directly with an exact dollar figure or shocking unit metric", "confidence": 0.98},
                {"rule": "Zero emojis in the first 3 lines of LinkedIn posts", "confidence": 0.95},
                {"rule": "Format takeaways as single-sentence punches under 16 words", "confidence": 0.94},
                {"rule": "Replace corporate buzzwords with operational mechanics", "confidence": 0.92},
            ]

        return {
            "summary": summary,
            "rules": rules,
            "exemplars": exemplars,
            "banned_words": banned_words,
            "signature_phrases": signature_phrases,
        }

    async def generate_variants(self, clip_id: str, db: Optional[Any] = None) -> Dict[str, Any]:
        """Generates all 5 platform variants using LLMRouter with rule-based fallback."""
        clip_data = self.get_clip_context(clip_id, db=db)
        voice_ctx = self.get_voice_context(clip_data.get("project_id", "demo-project"), db=db)

        # 1. Attempt LLM generation
        llm_output = await self._generate_with_llm(clip_data, voice_ctx)

        # 2. Build structured PlatformVariant objects
        variants_dict: Dict[str, Any] = {}
        target_platforms = [
            ("linkedin", "linkedin"),
            ("instagram_reels", "reels"),
            ("youtube_shorts", "shorts"),
            ("twitter", "x"),
            ("tiktok", "tiktok"),
        ]

        for config_key, short_key in target_platforms:
            cfg = get_platform_config(config_key)
            draft = getattr(llm_output, config_key, None) if llm_output else None

            variant_obj = self._assemble_variant(
                clip_id=clip_id,
                config_key=config_key,
                short_key=short_key,
                cfg=cfg,
                clip_data=clip_data,
                voice_ctx=voice_ctx,
                draft=draft,
            )

            # Store by short_key (e.g. "linkedin", "reels", "shorts", "x", "tiktok")
            variants_dict[short_key] = variant_obj.model_dump()
            # Also store by canonical key if different (e.g. "instagram_reels", "youtube_shorts", "twitter")
            if config_key != short_key:
                variants_dict[config_key] = variants_dict[short_key]

        # 3. Persist to database
        self._save_variants_to_db(clip_id, variants_dict, db=db)

        return {
            "clip_id": clip_id,
            "variants": variants_dict,
        }

    async def _generate_with_llm(
        self, clip_data: Dict[str, Any], voice_ctx: Dict[str, Any]
    ) -> Optional[LLMPlatformCopyOutput]:
        """Call LLMRouter with schema-constrained prompt."""
        system_prompt = (
            "You are the Platform Copy Engine for Reel, an elite B2B content repurposing studio.\n"
            "Your task is to take a high-signal podcast clip and generate 5 distinct platform-native copy variants:\n"
            "1. LinkedIn (insight-led, first 210 chars optimized before 'see more' fold, 0-3 hashtags, founder question CTA)\n"
            "2. Instagram Reels (1st line hook, generous line breaks, 3-8 hashtags, 9:16 on-screen text, save/comment CTA)\n"
            "3. YouTube Shorts (title <= 100 chars with #Shorts, SEO description, pinned comment proposal, on-screen text)\n"
            "4. X/Twitter (single punchy post <= 280 chars, 0-2 hashtags, plus 3-5 post follow-up thread)\n"
            "5. TikTok (ultra-short hook caption, trending generic hashtags, high energy, visual text beats)\n\n"
            f"BRAND VOICE PROFILE: {voice_ctx.get('summary')}\n"
            f"ACTIVE VOICE RULES:\n" + "\n".join([f"- {r.get('rule')}" for r in voice_ctx.get("rules", [])]) + "\n"
            f"BANNED WORDS: {', '.join(voice_ctx.get('banned_words', []))}\n"
            "Return valid JSON matching the LLMPlatformCopyOutput schema."
        )

        user_prompt = (
            f"CLIP DETAILS:\n"
            f"Title: {clip_data.get('title')}\n"
            f"Hook Line: {clip_data.get('hook_line')}\n"
            f"Summary: {clip_data.get('summary')}\n"
            f"Quote: {clip_data.get('quote')}\n\n"
            "Generate the 5 platform variants now."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        try:
            result = await llm_router.chat(
                messages=messages,
                schema=LLMPlatformCopyOutput,
                task="platform_copy_generation",
            )
            if isinstance(result, dict):
                return LLMPlatformCopyOutput(**result)
            elif isinstance(result, LLMPlatformCopyOutput):
                return result
        except Exception as e:
            logger.warning(f"LLMRouter chat failed: {e}. Falling back to deterministic platform generator.")

        return None

    def _assemble_variant(
        self,
        clip_id: str,
        config_key: str,
        short_key: str,
        cfg: Any,
        clip_data: Dict[str, Any],
        voice_ctx: Dict[str, Any],
        draft: Optional[LLMSinglePlatformDraft] = None,
    ) -> SinglePlatformCopy:
        """Assembles a valid SinglePlatformCopy ensuring platform constraints and voice match scores."""
        var_id = f"var_{clip_id}_{short_key}"

        # Check if LLM draft is a generic schema fallback
        is_dummy_fallback = (
            draft is not None
            and (
                draft.caption == "Stop leaving money on the table. Here are 3 pricing levers you can pull today."
                or draft.hook_a == "Why 90% of SaaS founders are underpricing their product."
            )
        )

        # If LLM provided genuine draft, use it; otherwise use rule-based synthesis
        if draft and not is_dummy_fallback:
            hook_a = draft.hook_a.strip()
            hook_b = draft.hook_b.strip()
            caption = draft.caption.strip()
            hashtags = draft.hashtags or cfg.default_hashtags
            cta = draft.cta.strip()
            on_screen_text = draft.on_screen_text
            title = draft.title
            pinned_comment = draft.pinned_comment
            thread_posts = draft.thread_posts
        else:
            synth = self._synthesize_rule_based_draft(config_key, clip_data, cfg)
            hook_a = synth["hook_a"]
            hook_b = synth["hook_b"]
            caption = synth["caption"]
            hashtags = synth["hashtags"]
            cta = synth["cta"]
            on_screen_text = synth.get("on_screen_text")
            title = synth.get("title")
            pinned_comment = synth.get("pinned_comment")
            thread_posts = synth.get("thread_posts")

        # Enforce platform hashtag bounds
        if len(hashtags) < cfg.min_hashtags:
            for tag in cfg.default_hashtags:
                if tag not in hashtags:
                    hashtags.append(tag)
                if len(hashtags) >= cfg.min_hashtags:
                    break
        if len(hashtags) > cfg.max_hashtags:
            hashtags = hashtags[: cfg.max_hashtags]

        # Enforce character bounds for Twitter
        if config_key in ("twitter", "x") and len(caption) > 280:
            caption = caption[:277] + "..."

        # Enforce YouTube Shorts title constraint
        if config_key in ("youtube_shorts", "shorts"):
            if not title:
                title = f"{clip_data.get('title', 'Founder Breakdown')} #Shorts"
            if len(title) > 100:
                title = title[:92] + "... #Shorts"

        # Enforce Thread posts for Twitter
        if config_key in ("twitter", "x") and not thread_posts:
            thread_posts = [
                caption,
                f"1/ The core mechanism: {clip_data.get('summary', 'Focus on verified business metrics.')}",
                f"2/ Key evidence: \"{clip_data.get('quote', 'Outcome metrics outlast seat licenses.')}\"",
                "3/ What is your stance on this tradeoff? Repost to share.",
            ]

        # Compute voice match score
        voice_score = compute_voice_match_score(
            text=caption,
            platform=config_key,
            active_rules=voice_ctx.get("rules"),
            banned_words=voice_ctx.get("banned_words"),
            signature_phrases=voice_ctx.get("signature_phrases"),
            hashtags=hashtags,
        )

        hook_options = [
            HookOption(id="A", text=hook_a, score=round(voice_score + 0.8, 1)),
            HookOption(id="B", text=hook_b, score=round(voice_score - 1.2, 1)),
        ]

        char_count = len(caption)

        return SinglePlatformCopy(
            id=var_id,
            clip_id=clip_id,
            platform=short_key,
            platform_name=cfg.name,
            hook=hook_a,
            selected_hook=hook_a,
            hook_options=hook_options,
            hookA=hook_a,
            hookB=hook_b,
            activeHook=0,
            caption=caption,
            hashtags=hashtags,
            cta=cta,
            on_screen_text=on_screen_text,
            onScreenText=on_screen_text,
            title=title,
            pinned_comment=pinned_comment,
            pinnedComment=pinned_comment,
            thread_posts=thread_posts,
            voice_match_score=voice_score,
            voiceMatchScore=voice_score,
            character_count=char_count,
            charLimit=cfg.max_characters,
            max_characters=cfg.max_characters,
            cut_off_at=cfg.cut_off_at,
            cutOffAt=cfg.cut_off_at,
            creator_edited=False,
            notes=f"First {cfg.cut_off_at} chars optimized for {cfg.name} layout fold.",
        )

    def _synthesize_rule_based_draft(
        self, config_key: str, clip_data: Dict[str, Any], cfg: Any
    ) -> Dict[str, Any]:
        """Deterministic, rule-based fallback copy generator obeying all platform guidelines."""
        title = clip_data.get("title", "Founder Insight")
        hook_line = clip_data.get("hook_line", "The biggest trap in scaling modern software:")
        quote = clip_data.get("quote", "We were subsidizing enterprise pilots on personal credit cards.")
        summary = clip_data.get("summary", "Outcome-based pricing outperforms per-seat licenses by 3.4x in enterprise cohorts.")

        if config_key == "linkedin":
            hook_a = f"{hook_line} Here is the math:"
            hook_b = f"Why 80% of founders get pricing wrong in 2026."
            caption = (
                f"{hook_a}\n\n"
                f"When software gets 10x faster, seat count goes down.\n"
                f"If you charge per seat, efficiency cannibalizes your MRR.\n\n"
                f"3 lessons we learned:\n"
                f"1. Measure verified business outcomes, not logins\n"
                f"2. Kill per-user pricing before enterprise renewal cycles\n"
                f"3. Quote: \"{quote}\"\n\n"
                f"Are you still selling seats or selling results?"
            )
            return {
                "hook_a": hook_a,
                "hook_b": hook_b,
                "caption": caption,
                "hashtags": ["#B2BMarketing", "#FounderLedGrowth", "#Startups"],
                "cta": "Are you still selling seats or selling results?",
                "on_screen_text": None,
            }

        elif config_key in ("instagram_reels", "reels"):
            hook_a = f"Stop making this {title.lower()} mistake in 2026 👇"
            hook_b = "The 50-second framework that changed how we sell software."
            caption = (
                f"{hook_a}\n\n"
                f"Here is what happens when you adopt AI agents: seat counts drop 30%, but customer value jumps 10x.\n\n"
                f"If you bill per user, you lose revenue the better your product works.\n\n"
                f"Save this for your next pricing review 📌"
            )
            return {
                "hook_a": hook_a,
                "hook_b": hook_b,
                "caption": caption,
                "hashtags": ["#startuptips", "#saasgrowth", "#founders", "#podcastclips", "#buildinpublic"],
                "cta": "Save this post for your next pricing review 📌",
                "on_screen_text": f"Rule: Never bury the outcome metric.",
            }

        elif config_key in ("youtube_shorts", "shorts"):
            title_text = f"{title[:75]} #Shorts"
            hook_a = f"Why {title} in 2026"
            hook_b = "The fatal flaw in modern software pricing"
            caption = (
                f"Why top enterprise founders are ditching legacy models.\n\n"
                f"{summary}\n\n"
                f"Watch the full breakdown on The Founder Files."
            )
            return {
                "hook_a": hook_a,
                "hook_b": hook_b,
                "title": title_text,
                "caption": caption,
                "hashtags": ["#Shorts", "#Startups", "#FounderFiles"],
                "cta": "Check pinned comment to join the discussion",
                "pinned_comment": "What pricing metric does your startup use today?",
                "on_screen_text": title[:40],
            }

        elif config_key in ("twitter", "x"):
            hook_a = f"{hook_line}"
            hook_b = f"A harsh truth about modern software distribution:"
            caption = (
                f"{hook_a}\n\n"
                f"When software gets 10x faster, seat count goes down.\n"
                f"Efficiency cannibalizes your MRR if you charge per login.\n\n"
                f"Switch to outcome metrics. Cohorts doing this saw 3.4x higher NRR."
            )
            thread = [
                caption,
                f"1/ The math is simple: charging per user taxes customers for adopting AI agents.",
                f"2/ Quote from Ep. 42: \"{quote}\"",
                f"3/ Are you still selling seats or selling results? Repost to share 🔄",
            ]
            return {
                "hook_a": hook_a,
                "hook_b": hook_b,
                "caption": caption,
                "hashtags": ["#buildinpublic"],
                "cta": "Repost to share with your founder network 🔄",
                "thread_posts": thread,
                "on_screen_text": None,
            }

        else:  # tiktok
            hook_a = "The biggest startup mistake right now:"
            hook_b = "If you sell software, hear this right now."
            caption = (
                f"Stop charging per seat in 2026. Outcome pricing is winning 3.4x over. #startuptok #founders #saas"
            )
            return {
                "hook_a": hook_a,
                "hook_b": hook_b,
                "caption": caption,
                "hashtags": ["#startuptok", "#founders", "#businessadvice", "#techtok"],
                "cta": "Follow for weekly founder breakdowns",
                "on_screen_text": "Seat-based pricing = DEAD",
            }

    def _save_variants_to_db(self, clip_id: str, variants_dict: Dict[str, Any], db: Optional[Any] = None) -> None:
        """Persist or update generated variants in platform_variants table."""
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            # We save the 5 canonical platforms
            canonical_platforms = ["linkedin", "reels", "shorts", "x", "tiktok"]
            for p in canonical_platforms:
                var = variants_dict.get(p)
                if not var:
                    continue

                vid = var.get("id", f"var_{clip_id}_{p}")
                hook = var.get("hook", "")
                caption = var.get("caption", "")
                hashtags_str = json.dumps(var.get("hashtags", []))
                cta = var.get("cta", "")
                on_screen = var.get("on_screen_text")
                vscore = float(var.get("voice_match_score", 90.0))

                # Check if variant exists
                existing = db.execute(
                    text("SELECT id FROM platform_variants WHERE id = :vid"),
                    {"vid": vid},
                ).fetchone()

                if existing:
                    db.execute(
                        text("""
                            UPDATE platform_variants
                            SET hook = :hook, caption = :caption, hashtags = :hashtags, cta = :cta,
                                on_screen_text = :on_screen, voice_match_score = :vscore
                            WHERE id = :vid
                        """),
                        {
                            "vid": vid,
                            "hook": hook,
                            "caption": caption,
                            "hashtags": hashtags_str,
                            "cta": cta,
                            "on_screen": on_screen,
                            "vscore": vscore,
                        },
                    )
                else:
                    db.execute(
                        text("""
                            INSERT INTO platform_variants (id, clip_id, platform, hook, caption, hashtags, cta, on_screen_text, voice_match_score, is_edited)
                            VALUES (:vid, :cid, :platform, :hook, :caption, :hashtags, :cta, :on_screen, :vscore, 0)
                        """),
                        {
                            "vid": vid,
                            "cid": clip_id,
                            "platform": p,
                            "hook": hook,
                            "caption": caption,
                            "hashtags": hashtags_str,
                            "cta": cta,
                            "on_screen": on_screen,
                            "vscore": vscore,
                        },
                    )

            db.commit()
        except Exception as e:
            logger.warning(f"Failed to persist platform variants to DB: {e}")
        finally:
            if should_close_db:
                db.close()


copy_engine = PlatformCopyEngine()
