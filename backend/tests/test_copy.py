import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.copy.config import get_platform_config, load_platform_configs
from app.copy.edit_analyst import classify_edit, compute_text_diff, process_variant_edit
from app.copy.generator import PlatformCopyEngine, copy_engine
from app.copy.voice_scorer import compute_voice_match_score
from app.main import app
from db.connection import SessionLocal


@pytest.fixture
def client():
    return TestClient(app)


# -----------------------------------------------------------------------------
# 1. Platform Configuration & Constraints Tests
# -----------------------------------------------------------------------------
def test_load_platform_configs():
    """Verify platforms.yaml loads and enforces exact PRD section 6.3 constraints."""
    configs = load_platform_configs(force_reload=True)
    assert "linkedin" in configs
    assert "instagram_reels" in configs
    assert "youtube_shorts" in configs
    assert "twitter" in configs
    assert "tiktok" in configs

    # LinkedIn: 210-char cut-off before "see more", insight-led, 0-3 hashtags, conversational question CTA
    li = configs["linkedin"]
    assert li.cut_off_at == 210
    assert li.min_hashtags == 0
    assert li.max_hashtags == 3
    assert li.cta_style == "conversational_question"

    # Instagram Reels: caption hook, line breaks, 3-8 hashtags, on-screen text suggestion, save/comment CTA
    reels = configs["instagram_reels"]
    assert reels.max_characters == 2200
    assert reels.cut_off_at == 125
    assert reels.min_hashtags == 3
    assert reels.max_hashtags == 8
    assert reels.on_screen_text is True
    assert reels.cta_style == "save_or_comment"

    # YouTube Shorts: title <= 100 chars, SEO keyword description, pinned comment proposal
    shorts = configs["youtube_shorts"]
    assert shorts.max_title_characters == 100
    assert shorts.on_screen_text is True
    assert shorts.cta_style == "pinned_comment"

    # X (Twitter): <= 280 chars single post + 3-5 post thread
    x = configs["twitter"]
    assert x.max_characters == 280
    assert x.cut_off_at == 280
    assert x.thread_min_posts == 3
    assert x.thread_max_posts == 5
    assert x.max_hashtags == 2

    # TikTok: ultra-short hook, trending hashtag style, text beats
    tt = configs["tiktok"]
    assert tt.cut_off_at == 150
    assert tt.min_hashtags == 3
    assert tt.max_hashtags == 6
    assert tt.on_screen_text is True


def test_platform_aliases():
    """Verify alias mapping for platform names (reels, shorts, x)."""
    assert get_platform_config("reels").name == "Instagram Reels"
    assert get_platform_config("shorts").name == "YouTube Shorts"
    assert get_platform_config("x").name == "X (Twitter)"
    assert get_platform_config("linkedin").name == "LinkedIn"
    assert get_platform_config("tiktok").name == "TikTok"


# -----------------------------------------------------------------------------
# 2. Voice Match Score Calculation Tests
# -----------------------------------------------------------------------------
def test_voice_match_score_penalizes_banned_words():
    """Verify banned words significantly reduce the voice match score."""
    clean_text = "At $50k MRR, our compute bill was $42,000. What is your minimum margin floor?"
    banned_text = "At $50k MRR, our synergy created a revolutionary game-changer for AI workflows."

    score_clean = compute_voice_match_score(clean_text, "linkedin")
    score_banned = compute_voice_match_score(banned_text, "linkedin")

    assert score_clean > 90.0
    assert score_banned < score_clean - 15.0


def test_voice_match_score_penalizes_throat_clearing():
    """Verify opening throat-clearing reduces score."""
    direct_text = "At $50k MRR, our OpenAI bill was $42k. Never bill per seat when software delivers 10x value."
    fluff_text = "In today's fast-paced world of tech, it's no secret that pricing is super hard."

    score_direct = compute_voice_match_score(direct_text, "linkedin")
    score_fluff = compute_voice_match_score(fluff_text, "linkedin")

    assert score_direct > score_fluff


def test_voice_match_score_linkedin_emoji_discipline():
    """Verify emojis in first 3 lines of LinkedIn are penalized."""
    text_with_emojis = "🚀 At $50k MRR, our bills exploded! 💡 Check this out 👇\n\nAI agents change everything."
    text_plain = "At $50k MRR, our compute bill was $42,000.\n\nAI agents change everything."

    score_emojis = compute_voice_match_score(text_with_emojis, "linkedin")
    score_plain = compute_voice_match_score(text_plain, "linkedin")

    assert score_plain > score_emojis


# -----------------------------------------------------------------------------
# 3. Platform Variant Generation Engine Tests
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_generate_platform_variants_all_five():
    """Test generating 5 distinct platform variants for a clip."""
    engine = PlatformCopyEngine()
    result = await engine.generate_variants("clip_1")

    assert "clip_id" in result
    assert result["clip_id"] == "clip_1"
    variants = result["variants"]

    # Must contain all 5 platforms
    for p in ["linkedin", "reels", "shorts", "x", "tiktok"]:
        assert p in variants, f"Platform {p} missing from generated variants"

        v = variants[p]
        assert v["platform"] == p
        assert len(v["hook_options"]) == 2  # A/B testing
        assert v["hookA"] != ""
        assert v["hookB"] != ""
        assert v["caption"] != ""
        assert isinstance(v["hashtags"], list)
        assert v["cta"] != ""
        assert 60.0 <= v["voice_match_score"] <= 100.0
        assert v["character_count"] == len(v["caption"])
        assert v["creator_edited"] is False


@pytest.mark.asyncio
async def test_platform_constraints_enforced():
    """Verify specific character and hashtag bounds per platform."""
    engine = PlatformCopyEngine()
    result = await engine.generate_variants("clip_1")
    variants = result["variants"]

    # LinkedIn: 0-3 hashtags
    li = variants["linkedin"]
    assert 0 <= len(li["hashtags"]) <= 3
    assert li["cut_off_at"] == 210

    # Reels: 3-8 hashtags, on-screen text exists
    reels = variants["reels"]
    assert 3 <= len(reels["hashtags"]) <= 8
    assert reels["on_screen_text"] is not None
    assert len(reels["on_screen_text"]) > 0

    # YouTube Shorts: title <= 100 chars, pinned comment proposal exists
    shorts = variants["shorts"]
    assert shorts["title"] is not None
    assert len(shorts["title"]) <= 100
    assert shorts["pinned_comment"] is not None

    # X / Twitter: single post <= 280 chars, 3-5 thread posts
    x = variants["x"]
    assert x["character_count"] <= 280
    assert 0 <= len(x["hashtags"]) <= 2
    assert x["thread_posts"] is not None
    assert 3 <= len(x["thread_posts"]) <= 5

    # TikTok: 3-6 hashtags, on-screen text
    tiktok = variants["tiktok"]
    assert 3 <= len(tiktok["hashtags"]) <= 6
    assert tiktok["on_screen_text"] is not None


# -----------------------------------------------------------------------------
# 4. Edit Analyst Diff & Voice Memory Learning Tests
# -----------------------------------------------------------------------------
def test_edit_diff_and_classification():
    """Test text diff computation and rule classification on creator edits."""
    ai_draft = "In today's fast-paced tech world, 🚀 we are super excited to share our SaaS pricing breakdown! 💡"
    creator_final = "At $50k MRR, our compute bill was $42,000. Outcome pricing beat per-seat models by 3.4x."

    diff_str = compute_text_diff(ai_draft, creator_final)
    assert "[-]" in diff_str
    assert "[+]" in diff_str

    rule_text, category, confidence = classify_edit(ai_draft, creator_final, "linkedin")
    assert confidence >= 0.85
    assert category in ["formatting", "vocabulary", "structure", "length", "tone"]


def test_process_variant_edit_persists_and_updates_voice_memory():
    """Test full voice memory update flow when creator edits a variant."""
    db = SessionLocal()
    try:
        vid = "var_clip_1_linkedin"
        # Seed or ensure variant exists in DB
        db.execute(
            text("""
                INSERT OR REPLACE INTO platform_variants (id, clip_id, platform, hook, caption, voice_match_score, is_edited)
                VALUES (:vid, 'clip_1', 'linkedin', 'Initial AI hook', 'Initial AI draft caption', 90.0, 0)
            """),
            {"vid": vid},
        )
        db.commit()

        creator_final = "At $50k MRR, our compute bill was $42,000. What is your minimum gross margin floor?"
        res = process_variant_edit(
            variant_id=vid,
            creator_final=creator_final,
            ai_draft="In today's post we look at why computing power can cost a lot of money.",
            db=db,
        )

        assert res["variant_id"] == vid
        assert res["diff_analyzed"] is True
        assert "rule_extracted" in res
        assert res["rule_extracted"]["rule"] != ""
        assert res["rule_extracted"]["confidence"] > 0.8
        assert "voice_profile_version" in res

        # Verify DB was updated
        row = db.execute(
            text("SELECT final_text, is_edited FROM platform_variants WHERE id = :vid"),
            {"vid": vid},
        ).fetchone()
        assert row is not None
        assert row[0] == creator_final
        assert row[1] == 1

    finally:
        db.close()


# -----------------------------------------------------------------------------
# 5. FastAPI Integration Tests (POST & PATCH endpoints)
# -----------------------------------------------------------------------------
def test_api_generate_copy_endpoint(client):
    """Test POST /clips/{id}/copy generates all 5 variants."""
    resp = client.post("/clips/clip_1/copy")
    assert resp.status_code == 200
    data = resp.json()

    assert data["clip_id"] == "clip_1"
    assert "variants" in data
    variants = data["variants"]

    for platform_key in ["linkedin", "reels", "shorts", "x", "tiktok"]:
        assert platform_key in variants
        p_data = variants[platform_key]
        assert p_data["hookA"] != ""
        assert p_data["hookB"] != ""
        assert p_data["caption"] != ""
        assert len(p_data["hashtags"]) >= 0
        assert p_data["voice_match_score"] > 60.0


def test_api_patch_variant_edit_triggers_learning(client):
    """Test PATCH /variants/{id} saves change and returns extracted style rule."""
    payload = {
        "final_text": "At $50k MRR, our OpenAI bill was $42k. Never bill per seat when software delivers 10x value. What is your minimum margin floor?",
        "ai_draft": "In today's post we discuss our OpenAI compute bill and software pricing lessons.",
    }

    resp = client.patch("/variants/var_clip_1_linkedin", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["variant_id"] == "var_clip_1_linkedin"
    assert data["diff_analyzed"] is True
    assert "rule_extracted" in data
    assert data["rule_extracted"]["confidence"] >= 0.85
    assert "voice_profile_version" in data
    assert "[-] " in data["rule_extracted"]["evidence_diff"]
    assert "[+] " in data["rule_extracted"]["evidence_diff"]


def test_api_patch_variant_missing_payload_error(client):
    """Test PATCH /variants/{id} with missing payload returns 400 Bad Request."""
    resp = client.patch("/variants/var_clip_1_linkedin", json={})
    assert resp.status_code == 400
