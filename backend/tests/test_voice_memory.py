"""Unit tests for Voice Memory & Edit Learning engine (Req 4)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.memory.diff_engine import DiffEngine, DiffMetadata
from app.memory.edit_analyst import EditAnalyst
from app.memory.profile_manager import ProfileManager, cosine_similarity


@pytest.fixture
def client():
    return TestClient(app)


# -----------------------------------------------------------------------------
# 1. Diff Engine Tests
# -----------------------------------------------------------------------------

def test_diff_engine_computation_basic():
    """Verify DiffEngine accurately identifies word additions, deletions, and opcodes."""
    draft = "🚀 Big news founders! 🔥 We are super excited to share our new AI tool today."
    final = "At $50k MRR, our compute bill was $42,000. Stop burning cash."

    diff = DiffEngine.compute_diff(draft, final)

    assert isinstance(diff, DiffMetadata)
    assert diff.similarity_ratio < 0.5
    # Check emoji extraction
    assert "🚀" in diff.emoji_removed
    assert "🔥" in diff.emoji_removed
    assert len(diff.emoji_added) == 0

    # Check number extraction
    assert any("$50k" in n or "50k" in n for n in diff.numbers_added)
    assert any("$42,000" in n or "42,000" in n for n in diff.numbers_added)
    assert diff.number_in_hook is True

    # Check evidence citations
    assert "[-]" in diff.evidence_citation
    assert "[+]" in diff.evidence_citation
    assert "before" in diff.evidence_diff
    assert "after" in diff.evidence_diff


def test_diff_engine_sentence_cadence():
    """Verify sentence length metrics and delta calculations."""
    draft = (
        "When you are looking at building your initial go-to-market strategy for enterprise "
        "customers you want to make sure everyone is aligned. Furthermore, having great documentation "
        "is critical to achieving product-market fit."
    )
    final = "Test raw thoughts first. See who signals back."

    diff = DiffEngine.compute_diff(draft, final)

    assert diff.ai_avg_sentence_length > 15.0
    assert diff.creator_avg_sentence_length < 10.0
    assert diff.sentence_length_delta < -8.0


# -----------------------------------------------------------------------------
# 2. Edit Analyst Rule Generation Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rule_generation_from_emoji_removal():
    """Verify EditAnalyst creates a formatting rule when emojis are stripped."""
    analyst = EditAnalyst()
    draft = "🚀 Super excited founders! 💡 Here are 3 tips to level up your workflow 🔥"
    final = "Here are 3 rules we live by when scaling enterprise workflows."

    diff = DiffEngine.compute_diff(draft, final)
    rule = await analyst.analyze_diff(diff, platform="linkedin")

    assert rule.category in ("formatting", "tone")
    assert "emoji" in rule.rule_text.lower() or "typography" in rule.rule_text.lower()
    assert rule.confidence >= 0.90
    assert "[-]" in rule.evidence_citation


@pytest.mark.asyncio
async def test_rule_generation_from_number_hook():
    """Verify EditAnalyst detects quantitative figures added to the hook."""
    analyst = EditAnalyst()
    draft = "Compute bills can be quite challenging when scaling AI solutions in production."
    final = "At $50k MRR, our compute bill was $42,000. We were subsidizing pilots on personal cards."

    diff = DiffEngine.compute_diff(draft, final)
    rule = await analyst.analyze_diff(diff, platform="linkedin")

    assert rule.category in ("structure", "vocabulary", "tone")
    assert any(term in rule.rule_text.lower() for term in ["number", "metric", "dollar", "unit", "concrete"])
    assert rule.confidence >= 0.90


@pytest.mark.asyncio
async def test_rule_generation_from_buzzwords():
    """Verify EditAnalyst bans buzzwords when removed from draft."""
    analyst = EditAnalyst()
    draft = "You should leverage your existing stack to supercharge enterprise synergies."
    final = "Use simple tools that your engineers can actually debug."

    diff = DiffEngine.compute_diff(draft, final)
    rule = await analyst.analyze_diff(diff, platform="linkedin")

    assert rule.category in ("banned", "vocabulary")
    assert any(w in rule.rule_text.lower() for w in ["buzzword", "leverage", "synerg", "supercharge"])
    assert rule.confidence >= 0.90


def test_confidence_adjustment():
    """Verify confidence strengthens on repeated edits and decays on reversal."""
    conf = 0.90
    boosted = EditAnalyst.adjust_confidence(conf, is_repeated=True)
    assert boosted == 0.95

    decayed = EditAnalyst.adjust_confidence(conf, is_reversed=True)
    assert decayed == 0.75


# -----------------------------------------------------------------------------
# 3. Profile Manager & Prompt Context Tests
# -----------------------------------------------------------------------------

def test_cosine_similarity():
    """Test vector math for exemplar retrieval."""
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]

    assert cosine_similarity(v1, v2) == pytest.approx(1.0)
    assert cosine_similarity(v1, v3) == pytest.approx(0.0)


def test_build_voice_prompt_context():
    """Verify prompt context contains active rules, banned phrases, and exemplars."""
    manager = ProfileManager()
    ctx = manager.build_voice_prompt_context(platform="linkedin")

    assert "BRAND VOICE MEMORY ACTIVE" in ctx
    assert "ACTIVE RULES LEARNED FROM CREATOR EDITS" in ctx
    assert "BANNED BUZZWORDS" in ctx
    assert "HUMAN FINAL EXEMPLARS" in ctx


# -----------------------------------------------------------------------------
# 4. API Endpoints Tests
# -----------------------------------------------------------------------------

def test_api_get_voice_profile(client):
    """GET /voice/profile returns version, summary, tone sliders, and rules."""
    resp = client.get("/voice/profile")
    assert resp.status_code == 200

    data = resp.json()
    assert "version" in data
    assert "version_label" in data
    assert "summary" in data
    assert "tone_sliders" in data
    assert "rules" in data
    assert isinstance(data["rules"], list)
    assert len(data["rules"]) > 0


def test_api_get_and_patch_voice_rules(client):
    """GET /voice/rules and PATCH /voice/rules/{id} update status and confidence."""
    rules_resp = client.get("/voice/rules")
    assert rules_resp.status_code == 200
    rules = rules_resp.json()
    assert len(rules) > 0

    target_rule = rules[0]
    rule_id = target_rule["id"]

    # Toggle inactive
    patch_resp = client.patch(
        f"/voice/rules/{rule_id}",
        json={"is_active": False, "confidence": 0.81},
    )
    assert patch_resp.status_code == 200
    res_data = patch_resp.json()
    assert res_data["is_active"] is False
    assert res_data["confidence"] == 0.81

    # Restore active
    restore_resp = client.patch(
        f"/voice/rules/{rule_id}",
        json={"is_active": True, "confidence": 0.95},
    )
    assert restore_resp.status_code == 200
    assert restore_resp.json()["is_active"] is True


def test_api_voice_compare_endpoint(client):
    """POST /voice/compare visibly shows memory OFF vs ON with voice match scores."""
    resp = client.post(
        "/voice/compare",
        json={"clip_id": "clip_pricing_01", "platform": "linkedin"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert "memory_off" in data
    assert "memory_on" in data

    off = data["memory_off"]
    on = data["memory_on"]

    # Visibly prove learning: ON score must beat OFF score significantly
    assert off["voice_match_score"] < 65.0
    assert on["voice_match_score"] > 90.0
    assert len(off["fluff_detected"]) > 0
    assert len(on["rules_applied"]) > 0


def test_api_voice_learn_endpoint(client):
    """POST /voice/learn extracts rule, updates version, and returns diff evidence."""
    payload = {
        "ai_draft": "🚀 Hey founders! Super excited to delve into how to leverage new workflows! 🔥",
        "creator_final": "At $50k MRR, our compute bill was $42,000. Stop subsidizing pilots on credit cards.",
        "platform": "linkedin",
    }
    resp = client.post("/voice/learn", json=payload)
    assert resp.status_code == 200

    data = resp.json()
    assert data["success"] is True
    assert "rule_extracted" in data
    assert "voice_profile_version" in data
    assert "diff_summary" in data

    rule = data["rule_extracted"]
    assert "rule" in rule
    assert rule["confidence"] > 0.80
    assert "evidence_citation" in rule
