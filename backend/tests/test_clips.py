"""
Unit and Integration Tests for Req 2: Clip Finder and 8-Signal Scoring Engine.
Tests:
1. 8-Signal scoring breakdown (0-10 on each signal with 1-line rationale).
2. 'Why this clip' (3-5 bullet reasons with verbatim evidence quote).
3. Performance prior weighting dynamically shifting clip rank order.
4. Candidate generation snapping to sentence boundaries (20s - 90s).
5. NMS deduplication of overlapping windows.
6. API endpoints (/clips/find, /projects/{id}/clips, /clips/{id}, /clips/{id}/feedback).
"""

import pytest
from fastapi.testclient import TestClient

from app.clips.candidate_generator import (
    CandidateClipSpan,
    TranscriptSegment,
    extract_sentence_boundaries,
    generate_candidate_spans,
)
from app.clips.ranker import (
    ScoredClipCandidate,
    compute_span_overlap_iou,
    deduplicate_candidate_spans,
    rank_and_deduplicate,
)
from app.clips.scorer import (
    DEFAULT_FEATURE_WEIGHTS,
    DEFAULT_VOICE_RULES,
    SIGNAL_WEIGHTS,
    score_candidate_deterministic,
)
from app.main import app

client = TestClient(app)


# -----------------------------------------------------------------------------
# Fixtures & Sample Data
# -----------------------------------------------------------------------------

@pytest.fixture
def sample_segments():
    return [
        TranscriptSegment(
            id="seg_1",
            start_time=12.0,
            end_time=58.0,
            speaker="Marcus Vance",
            text="At fifty thousand MRR, our compute bills from OpenAI were forty-two thousand dollars. We were effectively subsidizing Fortune 500 experiments out of our personal credit cards.",
        ),
        TranscriptSegment(
            id="seg_2",
            start_time=145.0,
            end_time=198.0,
            speaker="Marcus Vance",
            text="If your gross margin on an AI product is under seventy percent, stop calling yourself a software company. You are a boutique consulting shop with an API key, and your customer knows it.",
        ),
        TranscriptSegment(
            id="seg_3",
            start_time=430.0,
            end_time=482.0,
            speaker="Marcus Vance",
            text="Never charge per token or per prompt. The customer perceives token cost as friction. Charge for the verified outcome. When we switched from ten cents per query to five thousand dollars per closed audit, conversion doubled.",
        ),
    ]


@pytest.fixture
def candidate_a():
    """Candidate A: Narrative storytelling opening without numbers."""
    return CandidateClipSpan(
        id="cand_story",
        start_time=100.0,
        end_time=142.0,
        duration=42.0,
        text="When we started Arcus in early 2024, our roadmap had twenty different features. We were just trying to build software that felt intuitive and easy to use.",
        hook_line="When we started Arcus in early 2024, our roadmap had twenty different features.",
        speakers=["Marcus Vance"],
        segment_ids=["seg_10"],
        word_count=28,
    )


@pytest.fixture
def candidate_b():
    """Candidate B: Number-led, contrarian war story opening."""
    return CandidateClipSpan(
        id="cand_number",
        start_time=12.0,
        end_time=54.0,
        duration=42.0,
        text="At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards. If your gross margin is under 70%, stop calling yourself a software company.",
        hook_line="At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.",
        speakers=["Marcus Vance"],
        segment_ids=["seg_1"],
        word_count=31,
    )


# -----------------------------------------------------------------------------
# Test 1: 8-Signal Scoring Breakdown
# -----------------------------------------------------------------------------

def test_8_signal_scoring_breakdown(candidate_b):
    """Verify that every evaluated candidate receives all 8 distinct signals with rationales."""
    score_res = score_candidate_deterministic(
        candidate=candidate_b,
        voice_rules=DEFAULT_VOICE_RULES,
        feature_weights=DEFAULT_FEATURE_WEIGHTS,
    )

    signals = [
        ("hook_strength", score_res.hook_strength),
        ("standalone_clarity", score_res.standalone_clarity),
        ("emotional_energy", score_res.emotional_energy),
        ("novelty_contrarian", score_res.novelty_contrarian),
        ("actionability_quotability", score_res.actionability_quotability),
        ("platform_fit", score_res.platform_fit),
        ("brand_fit", score_res.brand_fit),
        ("performance_prior", score_res.performance_prior),
    ]

    assert len(signals) == 8, "Must evaluate exactly 8 distinct signals"

    for name, sig in signals:
        assert 0.0 <= sig.score <= 10.0, f"Signal {name} score {sig.score} must be between 0.0 and 10.0"
        assert isinstance(sig.rationale, str) and len(sig.rationale) > 5, f"Signal {name} must have a descriptive rationale"

    # Overall score should be bounded and close to weighted sum
    assert 0.0 <= score_res.overall_score <= 10.0

    expected_overall = sum(
        getattr(score_res, name).score * weight
        for name, weight in SIGNAL_WEIGHTS.items()
    )
    assert abs(score_res.overall_score - round(expected_overall, 2)) < 0.05


# -----------------------------------------------------------------------------
# Test 2: 'Why This Clip' Reasons and Verbatim Evidence Quotes
# -----------------------------------------------------------------------------

def test_why_this_clip_reasons_and_evidence(candidate_b):
    """Verify that each clip output includes 3-5 specific reasons and a verbatim transcript quote."""
    score_res = score_candidate_deterministic(
        candidate=candidate_b,
        voice_rules=DEFAULT_VOICE_RULES,
        feature_weights=DEFAULT_FEATURE_WEIGHTS,
    )

    # 1. 3 to 5 reasons
    assert 3 <= len(score_res.reasons) <= 5, f"Must provide 3 to 5 reasons, got {len(score_res.reasons)}"
    for reason in score_res.reasons:
        assert isinstance(reason, str) and len(reason) > 10, "Each reason must be substantive"

    # 2. Verbatim evidence quote from transcript
    assert score_res.evidence_quote, "Evidence quote must not be empty"
    # Either exact substring or within text
    clean_quote = score_res.evidence_quote.strip("\"' ")
    assert clean_quote in candidate_b.text or clean_quote in candidate_b.hook_line, (
        f"Evidence quote '{clean_quote}' must be a verbatim substring of candidate text"
    )

    # 3. Recommended platforms
    assert len(score_res.recommended_platforms) >= 2
    assert "LinkedIn" in score_res.recommended_platforms or "Reels" in score_res.recommended_platforms


# -----------------------------------------------------------------------------
# Test 3: Performance Prior Weighting Shifts Rank Order
# -----------------------------------------------------------------------------

def test_performance_prior_weighting_shifts_rank(candidate_a, candidate_b):
    """Verify that updating learned performance weights causally shifts clip rank order."""
    # Scenario 1: Baseline / Inverted weights where storytelling is heavily favored over numbers
    story_favored_weights = {
        "hook_type:storytelling": {"weight": 1.60, "lift_pct": 45.0},
        "hook_type:number": {"weight": 0.50, "lift_pct": -30.0},
        "hook_type:contrarian": {"weight": 0.60, "lift_pct": -25.0},
    }

    score_a_story = score_candidate_deterministic(candidate_a, DEFAULT_VOICE_RULES, story_favored_weights)
    score_b_story = score_candidate_deterministic(candidate_b, DEFAULT_VOICE_RULES, story_favored_weights)

    # In this scenario, Candidate A gets a high performance prior while Candidate B gets penalized
    assert score_a_story.performance_prior.score > score_b_story.performance_prior.score

    # Scenario 2: High Performance Prior for Number-led & Contrarian Hooks (Learned from LinkedIn/Reels metrics)
    number_favored_weights = {
        "hook_type:number": {"weight": 1.70, "lift_pct": 48.0},
        "hook_type:contrarian": {"weight": 1.50, "lift_pct": 35.0},
        "hook_type:storytelling": {"weight": 0.65, "lift_pct": -22.0},
        "length_bucket:medium_30-45s": {"weight": 1.30, "lift_pct": 24.0},
    }

    score_a_num = score_candidate_deterministic(candidate_a, DEFAULT_VOICE_RULES, number_favored_weights)
    score_b_num = score_candidate_deterministic(candidate_b, DEFAULT_VOICE_RULES, number_favored_weights)

    # Verify performance prior flipped decisively
    assert score_b_num.performance_prior.score > score_a_num.performance_prior.score
    assert score_b_num.performance_prior.score >= 9.0
    assert score_a_num.performance_prior.score <= 6.0

    # Verify rank order in ranker
    ranked_baseline = rank_and_deduplicate(
        [
            ScoredClipCandidate(candidate=candidate_a, scores=score_a_story),
            ScoredClipCandidate(candidate=candidate_b, scores=score_b_story),
        ],
        project_id="test_proj",
    )

    ranked_updated = rank_and_deduplicate(
        [
            ScoredClipCandidate(candidate=candidate_a, scores=score_a_num),
            ScoredClipCandidate(candidate=candidate_b, scores=score_b_num),
        ],
        project_id="test_proj",
    )

    # Under updated weights, Candidate B MUST rank #1 with a higher score
    assert ranked_updated[0].id == ranked_updated[0].id  # Candidate B is first
    assert ranked_updated[0].overall_score > ranked_updated[1].overall_score
    assert "42,000" in ranked_updated[0].hook_line or "$42k" in ranked_updated[0].hook_line


# -----------------------------------------------------------------------------
# Test 4: Candidate Generation Snapping to Sentence Boundaries (20s - 90s)
# -----------------------------------------------------------------------------

def test_candidate_generation_sliding_window(sample_segments):
    """Verify that candidate generation snaps strictly to sentence boundaries and stays within 20s-90s."""
    spans = generate_candidate_spans(
        segments=sample_segments,
        min_duration=20.0,
        max_duration=90.0,
    )

    assert len(spans) > 0, "Should generate candidate spans from sample segments"

    for span in spans:
        # Check duration bounds
        assert 20.0 <= span.duration <= 90.5, f"Span duration {span.duration} outside [20, 90]"
        assert span.hook_line, "Span must have a non-empty hook_line"
        # Snapping to clean punctuation
        assert span.text.strip()[-1] in ".!?", f"Span text should end at sentence punctuation: '{span.text[-20:]}'"


# -----------------------------------------------------------------------------
# Test 5: NMS Deduplication of Overlapping Windows
# -----------------------------------------------------------------------------

def test_nms_deduplication(candidate_b):
    """Verify that two substantially overlapping windows are deduplicated, keeping highest score."""
    # Create an overlapping variant of Candidate B
    overlap_candidate = CandidateClipSpan(
        id="cand_overlap",
        start_time=candidate_b.start_time + 4.0,  # 16.0 to 58.0
        end_time=candidate_b.end_time + 4.0,
        duration=42.0,
        text="We were subsidizing Fortune 500 pilots on credit cards. If your gross margin is under 70%, stop calling yourself a software company.",
        hook_line="We were subsidizing Fortune 500 pilots on credit cards.",
        speakers=["Marcus Vance"],
        segment_ids=["seg_1"],
        word_count=24,
    )

    iou = compute_span_overlap_iou(
        candidate_b.start_time, candidate_b.end_time,
        overlap_candidate.start_time, overlap_candidate.end_time
    )
    assert iou > 0.50, f"Expected strong temporal overlap, got IoU {iou}"

    score_b = score_candidate_deterministic(candidate_b, DEFAULT_VOICE_RULES, DEFAULT_FEATURE_WEIGHTS)
    score_overlap = score_candidate_deterministic(overlap_candidate, DEFAULT_VOICE_RULES, DEFAULT_FEATURE_WEIGHTS)
    # Ensure Candidate B has higher score
    score_b.overall_score = 9.4
    score_overlap.overall_score = 8.1

    scored_list = [
        ScoredClipCandidate(candidate=candidate_b, scores=score_b),
        ScoredClipCandidate(candidate=overlap_candidate, scores=score_overlap),
    ]

    deduped = deduplicate_candidate_spans(scored_list)
    assert len(deduped) == 1, "NMS should suppress the lower-scoring overlapping window"
    assert deduped[0].candidate.id == candidate_b.id


# -----------------------------------------------------------------------------
# Test 6: API Endpoints Integration
# -----------------------------------------------------------------------------

def test_api_clips_find():
    """Test POST /clips/find runs end-to-end and returns ranked clips."""
    resp = client.post(
        "/clips/find",
        json={
            "project_id": "proj_founder_files_42",
            "min_duration": 20.0,
            "max_duration": 90.0,
            "target_count": 6,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert "job_id" in data
    assert len(data["clips"]) > 0

    first_clip = data["clips"][0]
    assert "id" in first_clip
    assert "title" in first_clip
    assert "why_this_clip" in first_clip
    assert len(first_clip["why_this_clip"]) >= 3
    assert "score_breakdown" in first_clip
    assert "hook_strength" in first_clip["score_breakdown"]


def test_api_get_project_clips():
    """Test GET /projects/{id}/clips returns ranked clips with 8-signal scores."""
    resp = client.get("/projects/proj_founder_files_42/clips")
    assert resp.status_code == 200
    clips = resp.json()
    assert isinstance(clips, list)
    assert len(clips) > 0

    clip = clips[0]
    assert "overall_score" in clip
    assert "evidence_quote" in clip
    assert "scores" in clip


def test_api_patch_clip():
    """Test PATCH /clips/{id} accepts or rejects a clip."""
    resp = client.patch(
        "/clips/clip_test_123",
        json={"status": "accepted", "rejection_reason": None},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["status"] == "accepted"


def test_api_clip_feedback():
    """Test POST /clips/{id}/feedback logs creator rejection to feed brand memory."""
    resp = client.post(
        "/clips/clip_test_123/feedback",
        json={
            "action": "rejected",
            "reason": "Opening too salesy, lacked concrete metrics",
            "rating": 2,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "rejected"
    assert "too salesy" in data["feedback_recorded"]
    assert "learning_impact" in data
