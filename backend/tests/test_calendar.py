"""
Unit Tests for Content Calendar Engine (Req 5).
Covers:
1. Slot suggestions in IST (Indian Standard Time, UTC+05:30) with platform peak windows.
2. Feature weight incorporation (learned vs prior baseline rationales).
3. Cadence guardrails: daily platform caps, spacing buffers, same-topic back-to-back prevention.
4. 'Plan My Week' algorithm.
5. RFC 5545 .ics calendar generation and compliance.
6. API endpoints via FastAPI TestClient.
"""

from datetime import date, datetime, timedelta
import pytest
from starlette.testclient import TestClient

from app.calendar.ics_export import (
    escape_rfc5545_text,
    fold_line,
    generate_ics_calendar,
    parse_to_ist_datetime,
)
from app.calendar.models import (
    IST,
    CalendarItemCreate,
    CalendarItemResponse,
    CalendarItemUpdate,
    PlanWeekRequest,
    normalize_platform_name,
)
from app.calendar.scheduler import (
    PLATFORM_PEAK_WINDOWS,
    ContentScheduler,
    get_time_slot_label,
    infer_clip_topic,
    infer_hook_type,
    infer_length_bucket,
)
from app.core.db import SessionLocal
from app.main import app


# -----------------------------------------------------------------------------
# 1. IST Slot Suggestions & Timezone Tests
# -----------------------------------------------------------------------------
def test_ist_timezone_and_slot_time():
    """Verify all scheduler operations output valid IST timestamps (UTC+05:30)."""
    scheduler = ContentScheduler()
    suggestions = scheduler.suggest_optimal_slots(
        platform="linkedin",
        start_date=date(2026, 11, 2),  # Monday
        days_count=7,
        clip_hook_type="number",
        clip_length_bucket="medium_30-45s",
        clip_overall_score=9.0,
    )

    assert len(suggestions) == 7
    for s in suggestions:
        assert s.platform == "linkedin"
        # Parse timestamp and assert IST offset
        dt = datetime.fromisoformat(s.slot_time_ist)
        assert dt.tzinfo is not None
        assert dt.utcoffset() == timedelta(hours=5, minutes=30)
        # LinkedIn primary slot should be 08:30 AM IST
        assert dt.hour == 8
        assert dt.minute == 30


def test_platform_peak_windows_ist():
    """Verify optimal peak hours in IST for all supported social platforms."""
    # LinkedIn: 08:30 AM IST
    assert PLATFORM_PEAK_WINDOWS["linkedin"]["primary_slot"] == (8, 30)
    # Instagram Reels: 06:30 PM (18:30) IST
    assert PLATFORM_PEAK_WINDOWS["reels"]["primary_slot"] == (18, 30)
    # YouTube Shorts: 05:30 PM (17:30) IST
    assert PLATFORM_PEAK_WINDOWS["shorts"]["primary_slot"] == (17, 30)
    # X / Twitter: 11:30 AM IST
    assert PLATFORM_PEAK_WINDOWS["x"]["primary_slot"] == (11, 30)
    # TikTok: 07:30 PM (19:30) IST
    assert PLATFORM_PEAK_WINDOWS["tiktok"]["primary_slot"] == (19, 30)


def test_feature_weights_and_learned_rationale():
    """Verify performance loop weights elevate scores and produce learned rationale."""
    scheduler = ContentScheduler()
    mock_learned_weights = {
        "time_slot": {
            "morning_ist": {"weight": 1.35, "lift_pct": 35.0, "sample_count": 12, "is_learned": True},
            "evening_ist": {"weight": 1.05, "lift_pct": 5.0, "sample_count": 8, "is_learned": True},
            "afternoon_ist": {"weight": 0.70, "lift_pct": -30.0, "sample_count": 6, "is_learned": True},
        },
        "hook_type": {
            "number": {"weight": 1.45, "lift_pct": 45.0, "sample_count": 15, "is_learned": True},
            "question": {"weight": 0.75, "lift_pct": -25.0, "sample_count": 5, "is_learned": True},
        },
        "length_bucket": {
            "medium_30-45s": {"weight": 1.25, "lift_pct": 25.0, "sample_count": 14, "is_learned": True},
        },
    }

    slot_dt = datetime(2026, 11, 3, 8, 30, tzinfo=IST)  # Tuesday morning IST

    score_learned, is_learned, rationale_learned, conf = scheduler.score_slot_for_clip(
        platform="linkedin",
        slot_dt_ist=slot_dt,
        clip_hook_type="number",
        clip_length_bucket="medium_30-45s",
        clip_overall_score=9.2,
        weights=mock_learned_weights,
    )

    assert is_learned is True
    assert "Learned IST peak" in rationale_learned
    assert "+35.0%" in rationale_learned
    assert "+45.0%" in rationale_learned
    assert conf >= 0.85

    # Contrast with Prior baseline when no learned data exists
    mock_prior_weights = {
        "time_slot": {
            "morning_ist": {"weight": 1.10, "lift_pct": 10.0, "sample_count": 0, "is_learned": False},
        },
        "hook_type": {
            "number": {"weight": 1.00, "lift_pct": 0.0, "sample_count": 0, "is_learned": False},
        },
        "length_bucket": {
            "medium_30-45s": {"weight": 1.00, "lift_pct": 0.0, "sample_count": 0, "is_learned": False},
        },
    }

    score_prior, is_prior_learned, rationale_prior, conf_prior = scheduler.score_slot_for_clip(
        platform="linkedin",
        slot_dt_ist=slot_dt,
        clip_hook_type="number",
        clip_length_bucket="medium_30-45s",
        clip_overall_score=9.2,
        weights=mock_prior_weights,
    )

    assert is_prior_learned is False
    assert "Prior baseline" in rationale_prior


# -----------------------------------------------------------------------------
# 2. Cadence Guardrails & "Plan My Week" Tests
# -----------------------------------------------------------------------------
def test_cadence_guardrail_spacing_buffer():
    """Verify spacing buffer prevents scheduling same platform too closely."""
    scheduler = ContentScheduler()
    base_dt = datetime(2026, 11, 2, 8, 30, tzinfo=IST)
    existing_schedule = [
        {"dt": base_dt, "platform": "linkedin", "topic": "pricing_model"},
    ]

    # Attempt to place another LinkedIn post 6 hours later (LinkedIn requires >= 24h)
    candidate_dt = base_dt + timedelta(hours=6)
    allowed, reason = scheduler.check_cadence_guardrails(
        candidate_platform="linkedin",
        candidate_dt=candidate_dt,
        candidate_topic="unit_economics",
        existing_schedule=existing_schedule,
    )
    assert allowed is False
    assert "Spacing guardrail" in reason

    # 26 hours later should be allowed
    candidate_dt_ok = base_dt + timedelta(hours=26)
    allowed_ok, _ = scheduler.check_cadence_guardrails(
        candidate_platform="linkedin",
        candidate_dt=candidate_dt_ok,
        candidate_topic="unit_economics",
        existing_schedule=existing_schedule,
    )
    assert allowed_ok is True


def test_cadence_guardrail_prevent_same_topic_back_to_back():
    """Verify no duplicate topic is scheduled within 24 hours."""
    scheduler = ContentScheduler()
    base_dt = datetime(2026, 11, 2, 8, 30, tzinfo=IST)
    existing_schedule = [
        {"dt": base_dt, "platform": "linkedin", "topic": "pricing_model"},
    ]

    # Different platform (X) but same topic within 3 hours
    candidate_dt = base_dt + timedelta(hours=3)
    allowed, reason = scheduler.check_cadence_guardrails(
        candidate_platform="x",
        candidate_dt=candidate_dt,
        candidate_topic="pricing_model",
        existing_schedule=existing_schedule,
    )
    assert allowed is False
    assert "Topic guardrail" in reason

    # Different topic ("customer_retention") at same candidate time should pass
    allowed_diff, _ = scheduler.check_cadence_guardrails(
        candidate_platform="x",
        candidate_dt=candidate_dt,
        candidate_topic="customer_retention",
        existing_schedule=existing_schedule,
    )
    assert allowed_diff is True


def test_cadence_guardrail_max_daily_posts():
    """Verify total daily posts cap is strictly enforced."""
    scheduler = ContentScheduler()
    base_dt = datetime(2026, 11, 2, 8, 30, tzinfo=IST)
    existing_schedule = [
        {"dt": base_dt, "platform": "linkedin", "topic": "pricing_model"},
        {"dt": base_dt + timedelta(hours=4), "platform": "x", "topic": "unit_economics"},
    ]

    # Attempt 3rd post on same day when max_posts_per_day = 2
    candidate_dt = base_dt + timedelta(hours=9)
    allowed, reason = scheduler.check_cadence_guardrails(
        candidate_platform="reels",
        candidate_dt=candidate_dt,
        candidate_topic="founder_mindset",
        existing_schedule=existing_schedule,
        max_posts_per_day=2,
    )
    assert allowed is False
    assert "Daily cap reached" in reason


def test_plan_my_week_algorithm():
    """Verify automated week planning allocates clips across week obeying guardrails."""
    db = SessionLocal()
    scheduler = ContentScheduler(db=db)

    result = scheduler.plan_week(
        project_id="proj_founder_files_42",
        start_date="2026-11-02",
        target_platforms=["linkedin", "x", "reels", "shorts", "tiktok"],
        max_posts_per_day=2,
        persist=False,
    )
    db.close()

    assert result["scheduled_count"] >= 5
    assert result["time_zone"] == "Asia/Kolkata (IST, UTC+05:30)"
    assert result["guardrail_status"]["spacing_buffer_met"] is True
    assert result["guardrail_status"]["no_back_to_back_topic"] is True

    items = result["items"]
    # Check chronological ordering
    for i in range(len(items) - 1):
        dt_curr = datetime.fromisoformat(items[i].scheduled_for)
        dt_next = datetime.fromisoformat(items[i + 1].scheduled_for)
        assert dt_curr <= dt_next

    # Check that all items have valid IST timestamps
    for itm in items:
        dt = datetime.fromisoformat(itm.scheduled_for)
        assert dt.utcoffset() == timedelta(hours=5, minutes=30)
        assert itm.status == "scheduled"
        assert itm.slot_reason is not None


# -----------------------------------------------------------------------------
# 3. RFC 5545 .ics Export Tests
# -----------------------------------------------------------------------------
def test_ics_export_rfc5545_compliance():
    """Verify generated .ics file complies with RFC 5545 specifications."""
    try:
        import icalendar
    except ImportError:
        pytest.skip("icalendar library not available")

    items = [
        CalendarItemResponse(
            id="cal_test_01",
            project_id="proj_demo",
            clip_id="clip_01",
            title="The $42k OpenAI Bill That Almost Killed Us",
            platform="linkedin",
            scheduled_for="2026-11-02T08:30:00+05:30",
            slot_time_ist="2026-11-02T08:30:00+05:30",
            status="scheduled",
            slot_reason="Monday 08:30 AM IST executive peak",
            copy_text="Our OpenAI API bill hit $42,000 in month two. Here is how we fixed unit economics.",
            hook="Our OpenAI bill was $42,000.",
            hashtags=["#SaaS", "#Startups", "#AI"],
        ),
        CalendarItemResponse(
            id="cal_test_02",
            project_id="proj_demo",
            clip_id="clip_02",
            title="The 70% Gross Margin Rule for AI Startups",
            platform="reels",
            scheduled_for="2026-11-02T18:30:00+05:30",
            slot_time_ist="2026-11-02T18:30:00+05:30",
            status="scheduled",
            slot_reason="Evening Reels browse peak",
            copy_text="If your AI gross margin is under 70%, you are an agency.",
            hook="70% gross margin rule.",
            hashtags=["#Reels", "#StartupTips"],
        ),
    ]

    ics_content = generate_ics_calendar(items)

    # 1. Structural assertions
    assert "BEGIN:VCALENDAR" in ics_content
    assert "VERSION:2.0" in ics_content
    assert "PRODID:-//Reel Content Repurposing Studio" in ics_content
    assert "BEGIN:VTIMEZONE" in ics_content
    assert "TZID:Asia/Kolkata" in ics_content
    assert "BEGIN:VEVENT" in ics_content
    assert "END:VCALENDAR" in ics_content

    # 2. Assert CRLF line endings per RFC 5545
    assert "\r\n" in ics_content

    # 3. Parse with official icalendar parser
    cal = icalendar.Calendar.from_ical(ics_content)
    events = cal.walk("VEVENT")
    assert len(events) == 2

    event1 = events[0]
    assert "[LINKEDIN]" in str(event1.get("SUMMARY"))
    assert "cal_test_01@reelstudio.ai" in str(event1.get("UID"))
    assert "Platform: LINKEDIN" in str(event1.get("DESCRIPTION"))


def test_escape_and_folding_rfc5545():
    """Verify special character escaping and 75-octet line folding."""
    raw_text = "Line 1\nLine 2 with, commas; semicolons and \\ backslashes"
    escaped = escape_rfc5545_text(raw_text)
    assert r"\n" in escaped
    assert r"\," in escaped
    assert r"\;" in escaped
    assert r"\\" in escaped

    long_line = "DESCRIPTION:" + "A" * 150
    folded = fold_line(long_line, max_octets=75)
    lines = folded.split("\r\n")
    assert len(lines) >= 3
    # Every continuation line must begin with space or tab
    for continuation in lines[1:]:
        assert continuation.startswith(" ") or continuation.startswith("\t")


# -----------------------------------------------------------------------------
# 4. FastAPI Endpoints Integration Tests
# -----------------------------------------------------------------------------
def test_calendar_api_endpoints():
    """Test full suite of /calendar REST endpoints."""
    client = TestClient(app)

    # 1. GET /calendar
    res = client.get("/calendar")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    sample = items[0]
    assert "id" in sample
    assert "scheduled_for" in sample
    assert "slot_time_ist" in sample
    assert "platform" in sample

    # 2. POST /calendar (create new post slot)
    create_payload = {
        "project_id": "proj_founder_files_42",
        "clip_id": "clip_1",
        "platform": "linkedin",
        "scheduled_for": "2026-11-09T08:30:00+05:30",
        "title": "API Test Scheduled Post",
        "slot_reason": "Test Monday 08:30 AM IST slot",
    }
    post_res = client.post("/calendar", json=create_payload)
    assert post_res.status_code == 200
    created = post_res.json()
    new_id = created["id"]
    assert created["platform"] == "linkedin"
    assert created["scheduled_for"] == "2026-11-09T08:30:00+05:30"

    # 3. PATCH /calendar/{id} (drag-and-drop reschedule or status update)
    patch_payload = {
        "status": "posted",
        "scheduled_for": "2026-11-09T09:30:00+05:30",
    }
    patch_res = client.patch(f"/calendar/{new_id}", json=patch_payload)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "posted"
    assert updated["scheduled_for"] == "2026-11-09T09:30:00+05:30"

    # 4. POST /calendar/plan-week
    plan_res = client.post(
        "/calendar/plan-week",
        json={
            "project_id": "proj_founder_files_42",
            "start_date": "2026-11-02",
            "persist": False,
        },
    )
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    assert plan_data["scheduled_count"] >= 5
    assert "Asia/Kolkata" in plan_data["time_zone"]
    assert len(plan_data["items"]) >= 5

    # 5. GET /calendar/export.ics
    ics_res = client.get("/calendar/export.ics?project_id=proj_founder_files_42")
    assert ics_res.status_code == 200
    assert "text/calendar" in ics_res.headers["content-type"]
    assert 'attachment; filename="reel-calendar.ics"' in ics_res.headers.get("content-disposition", "")
    assert "BEGIN:VCALENDAR" in ics_res.text
    assert "END:VCALENDAR" in ics_res.text
