"""
Tests for Performance Feedback Loop (Req 6)
Covers:
  - Engagement score normalization across platforms and retention scaling
  - Feature extraction (number, question, contrarian, story, length buckets, IST time slots)
  - Feature lift computation and confidence guardrails
  - EMA weight update math and boundary clamping
  - Causal insight generation ('What changed and why')
  - Flexible CSV parser with column alias mapping and formatted numbers
  - End-to-end API endpoints (/performance/log, /performance/csv, /performance/insights, /performance/weights)
"""

import io
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.performance.analyzer import (
    calculate_engagement_score,
    compute_feature_lifts,
    extract_features,
    generate_causal_insights,
    normalize_platform,
    update_feature_weights,
)
from app.performance.csv_parser import (
    map_columns,
    parse_numeric_value,
    parse_performance_csv,
)
from app.performance.schemas import (
    FeatureLift,
    PerformanceMetricInput,
    WeightUpdate,
)

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Engagement Normalization Tests
# -----------------------------------------------------------------------------
def test_calculate_engagement_score_linkedin():
    """Verify weighted interaction calculation and normalization on LinkedIn."""
    # High-performing post: 10k views, 400 likes, 100 comments, 80 shares, 120 saves
    metrics = {
        "views": 10000,
        "likes": 400,
        "comments": 100,
        "shares": 80,
        "saves": 120,
        "followers_gained": 25,
        "platform": "linkedin",
    }
    res = calculate_engagement_score(metrics)
    assert "normalized_score" in res
    assert "raw_rate_pct" in res
    # Weighted actions: 400*1 + 100*3 + 80*3.5 + 120*4 + 25*5 = 400 + 300 + 280 + 480 + 125 = 1585
    # Raw rate: 1585 / 10000 = 15.85%
    assert res["raw_rate_pct"] == 15.85
    assert res["normalized_score"] >= 85.0
    assert res["normalized_score"] <= 99.0


def test_calculate_engagement_score_with_retention():
    """Verify video watch-time retention scales engagement score on Reels."""
    base_metrics = {
        "views": 5000,
        "likes": 200,
        "comments": 40,
        "shares": 50,
        "saves": 60,
        "platform": "reels",
    }
    # High retention (78%) vs Low retention (35%)
    res_high = calculate_engagement_score({**base_metrics, "retention_pct": 78.0})
    res_low = calculate_engagement_score({**base_metrics, "retention_pct": 35.0})

    assert res_high["normalized_score"] > res_low["normalized_score"]


def test_calculate_engagement_score_zero_views():
    """Verify zero views edge case does not divide by zero."""
    res = calculate_engagement_score({"views": 0, "likes": 15, "comments": 3, "platform": "x"})
    assert res["normalized_score"] >= 5.0
    assert res["raw_rate_pct"] >= 0.0


# -----------------------------------------------------------------------------
# 2. Feature Extraction Tests
# -----------------------------------------------------------------------------
def test_extract_features_number_hook():
    """Detects numeric / financial metric hook."""
    text = "$50k MRR was the trap that almost killed our company. Here are 3 lessons."
    features = extract_features(content=text, platform="linkedin")
    assert features.hook_type == "number"
    assert features.platform == "linkedin"


def test_extract_features_question_hook():
    """Detects question hook."""
    text = "Why do 90% of B2B founders fail at enterprise pricing?"
    features = extract_features(content=text, platform="linkedin")
    assert features.hook_type == "question"


def test_extract_features_contrarian_hook():
    """Detects contrarian / paradox statement hook."""
    text = "Never build an AI agent without human-in-the-loop validation. It is suicide."
    features = extract_features(content=text, platform="x")
    assert features.hook_type == "contrarian"


def test_extract_features_story_hook():
    """Detects narrative opening hook."""
    text = "Three months later, our average contract value went from eighty dollars to fourteen thousand dollars."
    features = extract_features(content=text, platform="linkedin")
    assert features.hook_type == "story"


def test_extract_features_length_buckets():
    """Verifies duration and word count length bucketing."""
    f_short = extract_features(content="Short text under thirty words", duration_seconds=22.0)
    assert f_short.length_bucket == "short_<30s"

    f_med = extract_features(content="Medium length post text", duration_seconds=38.0)
    assert f_med.length_bucket == "medium_30-45s"

    f_long = extract_features(content="Long comprehensive teardown text", duration_seconds=65.0)
    assert f_long.length_bucket == "long_>45s"


def test_extract_features_ist_time_slot():
    """Verifies publication timestamp maps into correct IST time slot."""
    # 09:30 AM IST = 04:00 AM UTC
    dt_morning = datetime(2026, 11, 5, 4, 0, 0, tzinfo=timezone.utc)
    f_morn = extract_features(content="Morning post", posted_at=dt_morning)
    assert f_morn.time_slot == "morning_ist"
    assert f_morn.day_of_week == "Thursday"

    # 18:30 IST = 13:00 UTC
    dt_eve = datetime(2026, 11, 6, 13, 0, 0, tzinfo=timezone.utc)
    f_eve = extract_features(content="Evening post", posted_at=dt_eve)
    assert f_eve.time_slot == "evening_ist"
    assert f_eve.day_of_week == "Friday"


# -----------------------------------------------------------------------------
# 3. Feature Lift Computation Tests
# -----------------------------------------------------------------------------
def test_compute_feature_lifts():
    """Verifies lift computation, sample count, and confidence guardrails."""
    logs = [
        # Number hooks: high engagement (90)
        {"engagement_score": 92.0, "hook_type": "number", "length_bucket": "medium_30-45s"},
        {"engagement_score": 88.0, "hook_type": "number", "length_bucket": "medium_30-45s"},
        {"engagement_score": 90.0, "hook_type": "number", "length_bucket": "medium_30-45s"},
        # Question hooks: lower engagement (50)
        {"engagement_score": 52.0, "hook_type": "question", "length_bucket": "short_<30s"},
        {"engagement_score": 48.0, "hook_type": "question", "length_bucket": "short_<30s"},
        {"engagement_score": 50.0, "hook_type": "question", "length_bucket": "short_<30s"},
    ]
    # Baseline avg = (92+88+90+52+48+50)/6 = 70.0
    lifts = compute_feature_lifts(logs)
    lift_map = {l.feature_value: l for l in lifts}

    assert "number" in lift_map
    num_lift = lift_map["number"]
    assert num_lift.sample_count == 3
    assert num_lift.avg_engagement == 90.0
    assert num_lift.lift_ratio > 1.25
    assert num_lift.direction == "positive"
    assert num_lift.confidence == "low"  # sample 3 is 'low' (< 5)

    assert "question" in lift_map
    q_lift = lift_map["question"]
    assert q_lift.avg_engagement == 50.0
    assert q_lift.lift_ratio < 0.8
    assert q_lift.direction == "negative"


# -----------------------------------------------------------------------------
# 4. Weight Updates Math Tests
# -----------------------------------------------------------------------------
def test_update_feature_weights_ema():
    """Verifies exponential moving average weight adjustment and clamping."""
    current_weights = {
        ("hook_type", "number"): 1.10,
        ("hook_type", "question"): 1.00,
    }
    lifts = [
        FeatureLift(
            feature_name="hook_type",
            feature_value="number",
            sample_count=12,
            avg_engagement=92.0,
            baseline_engagement=60.0,
            lift_ratio=1.53,
            lift_pct=53.3,
            confidence="high",
            direction="positive",
        ),
        FeatureLift(
            feature_name="hook_type",
            feature_value="question",
            sample_count=10,
            avg_engagement=45.0,
            baseline_engagement=60.0,
            lift_ratio=0.75,
            lift_pct=-25.0,
            confidence="high",
            direction="negative",
        ),
    ]

    new_weights, updates = update_feature_weights(current_weights, lifts, alpha=0.20)

    # Number hook should increase: (1 - 0.20)*1.10 + 0.20*1.53 = 0.88 + 0.306 = 1.186 -> 1.19
    assert new_weights[("hook_type", "number")] > 1.10
    # Question hook should decrease: (1 - 0.20)*1.00 + 0.20*0.75 = 0.80 + 0.15 = 0.95
    assert new_weights[("hook_type", "question")] < 1.00

    assert len(updates) == 2
    assert updates[0].delta > 0
    assert updates[1].delta < 0


# -----------------------------------------------------------------------------
# 5. Causal Insight Generation Tests
# -----------------------------------------------------------------------------
def test_generate_causal_insights():
    """Verifies that causal insights explain the exact why and link to weights."""
    lifts = [
        FeatureLift(
            feature_name="hook_type",
            feature_value="number",
            sample_count=14,
            avg_engagement=94.0,
            baseline_engagement=65.0,
            lift_ratio=1.45,
            lift_pct=44.6,
            confidence="high",
            direction="positive",
        ),
        FeatureLift(
            feature_name="hook_type",
            feature_value="question",
            sample_count=8,
            avg_engagement=40.0,
            baseline_engagement=65.0,
            lift_ratio=0.62,
            lift_pct=-38.5,
            confidence="moderate",
            direction="negative",
        ),
    ]
    weight_updates = [
        WeightUpdate(
            feature_key="hook_type_number",
            old_weight=1.10,
            new_weight=1.45,
            delta=0.35,
            lift_pct=44.6,
            summary="+0.35 (lift +44.6%)",
        )
    ]

    insights = generate_causal_insights(lifts, weight_updates, platform="linkedin")
    assert len(insights) > 0
    top = insights[0]
    # Check explicit causal explanation required by PRD 6.6
    assert "Because number-led hooks outperformed questions" in top.explanation
    assert "ranking weights increased from 1.10 to 1.45" in top.explanation
    assert "Copy generator now prioritizes numeric hooks" in top.impact_action
    assert top.next_experiment is not None


# -----------------------------------------------------------------------------
# 6. CSV Parser Tests
# -----------------------------------------------------------------------------
def test_parse_numeric_value():
    """Tests parsing k/M abbreviations, commas, and percentage characters."""
    assert parse_numeric_value("12k") == 12000.0
    assert parse_numeric_value("1.5M") == 1500000.0
    assert parse_numeric_value("$50,000") == 50000.0
    assert parse_numeric_value("72.5%") == 72.5
    assert parse_numeric_value(450) == 450.0
    assert parse_numeric_value(None, default=0.0) == 0.0


def test_map_columns():
    """Tests fuzzy header alias resolution."""
    headers = ["Impressions", "Reactions", "Replies", "Reposts", "Bookmarks", "Completion_Rate", "Caption"]
    col_map = map_columns(headers)
    assert col_map["views"] == "Impressions"
    assert col_map["likes"] == "Reactions"
    assert col_map["comments"] == "Replies"
    assert col_map["shares"] == "Reposts"
    assert col_map["saves"] == "Bookmarks"
    assert col_map["retention_pct"] == "Completion_Rate"
    assert col_map["content"] == "Caption"


def test_parse_performance_csv():
    """Tests parsing complete CSV text into validated records."""
    csv_text = """Network,Impressions,Reactions,Replies,Reposts,Bookmarks,Completion_Rate,Post_Text
LinkedIn,14.5k,420,85,60,110,68%,$50k MRR was the trap that almost killed our company.
X,28k,650,45,210,180,,Never launch without talking to 50 prospective buyers first.
"""
    records, platforms, warnings = parse_performance_csv(csv_text)
    assert len(records) == 2
    assert "linkedin" in platforms
    assert "x" in platforms
    
    rec1 = records[0]
    assert rec1.views == 14500
    assert rec1.likes == 420
    assert rec1.retention_pct == 68.0
    assert rec1.hook_type == "number"

    rec2 = records[1]
    assert rec2.views == 28000
    assert rec2.hook_type == "contrarian"


# -----------------------------------------------------------------------------
# 7. End-to-End API Endpoint Tests
# -----------------------------------------------------------------------------
def test_api_log_performance():
    """Tests POST /performance/log endpoint."""
    payload = {
        "project_id": "proj_founder_files_42",
        "post_id": "test_post_001",
        "platform": "linkedin",
        "views": 18200,
        "likes": 460,
        "comments": 92,
        "shares": 115,
        "saves": 180,
        "retention_pct": 74.0,
        "followers_gained": 38,
        "content": "$14k ARR in 30 days: why seat-based SaaS pricing is dead.",
    }
    response = client.post("/performance/log", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "recorded"
    assert data["engagement_score"] > 70.0
    assert "hook_type" in data["features_tagged"]
    assert data["features_tagged"]["hook_type"] == "number"
    assert "updated_weights" in data
    assert "weight_updates" in data
    assert data["insight_generated"] is not None


def test_api_upload_csv():
    """Tests POST /performance/csv multipart file upload."""
    csv_content = (
        "Channel,Views,Likes,Comments,Shares,Saves,Text\n"
        "LinkedIn,12000,340,65,40,90,3 rules for B2B pricing that 10x your margins\n"
        "Reels,25000,800,120,240,310,Stop selling features. Sell personal career safety.\n"
    )
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))
    files = {"file": ("demo_metrics.csv", file_bytes, "text/csv")}
    
    response = client.post("/performance/csv", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["rows_processed"] == 2
    assert "linkedin" in data["platforms_detected"]
    assert "reels" in data["platforms_detected"]


def test_api_get_insights():
    """Tests GET /performance/insights endpoint."""
    response = client.get("/performance/insights")
    assert response.status_code == 200
    data = response.json()
    assert "feed" in data
    assert len(data["feed"]) > 0
    first = data["feed"][0]
    assert "headline" in first or "title" in first
    assert "explanation" in first or "description" in first
    assert "impact_action" in first or "recommendation" in first

    # Test list format option
    res_list = client.get("/performance/insights?format=list")
    assert res_list.status_code == 200
    assert isinstance(res_list.json(), list)


def test_api_get_weights():
    """Tests GET /performance/weights endpoint."""
    response = client.get("/performance/weights")
    assert response.status_code == 200
    data = response.json()
    assert "hook_types" in data
    assert "length_buckets" in data
    assert "time_slots" in data
    assert "number" in data["hook_types"]

    # Test list format option
    res_list = client.get("/performance/weights?format=list")
    assert res_list.status_code == 200
    assert isinstance(res_list.json(), list)
