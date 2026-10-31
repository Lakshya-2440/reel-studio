---
tags:
  - "#req/5-content-calendar"
  - "#agent/calendar-agent"
---

# Req 5: Content Calendar & AI Slot Allocation

## 1. Summary
Interactive schedule management for generated video clips and multi-platform copy variants. Dynamically calculates optimal audience peak slots in **Indian Standard Time (IST, UTC+05:30)** by synthesizing baseline platform priors with learned empirical performance weights from [[req-6-performance-loop]]. Enforces deterministic cadence guardrails (spacing buffers, daily platform caps, and anti-clustering for identical topics) and exports valid RFC 5545 `.ics` calendars.

---

## 2. Platform Peak Windows (IST) & Baseline Priors

| Platform | Peak Days | Primary IST Slot | Secondary IST Slot | Min Spacing | Daily Cap | Target Audience Window |
|---|---|---|---|---|---|---|
| **LinkedIn** | Tuesday, Thursday | 08:30 – 10:00 IST | 17:00 – 18:30 IST | 24 hours | 1 post/day | Executive morning commute & desk arrival |
| **Instagram Reels** | Friday, Saturday, Sunday | 18:30 – 20:30 IST | 13:00 – 14:00 IST | 16 hours | 1 post/day | Peak evening leisure mobile browse |
| **YouTube Shorts** | Wednesday, Friday, Saturday | 17:30 – 19:00 IST | 12:30 – 13:30 IST | 16 hours | 1 post/day | Commute & after-work creator tutorials |
| **X / Twitter** | Monday – Friday | 11:30 – 13:30 IST | 20:30 – 22:00 IST | 4 hours | 2 posts/day | Midday founder & tech debate peak |
| **TikTok** | Friday – Sunday | 19:30 – 21:30 IST | 14:00 – 15:00 IST | 16 hours | 1 post/day | Evening short-form entertainment |

---

## 3. Performance Loop Integration & Rationale Transparency

In accordance with PRD 6.5, slot recommendations explicitly separate **Learned IST Lift** from **Prior Baseline**:
- **Learned Lift:** Activated when `feature_weights` contains >= 3 empirical observations for temporal (`time_slot`: `morning_ist`, `evening_ist`, `afternoon_ist`) and structural features (`hook_type`: `number`, `contrarian`, `question`; `length_bucket`: `medium_30-45s`, `short_<30s`).
  - *Example Rationale:* `"Learned IST peak: LinkedIn on Tuesday at 08:30 AM IST. morning_ist shows +22.5% engagement lift; number hook yields +38.5% lift."`
- **Prior Baseline:** Fallback when insufficient empirical observations exist.
  - *Example Rationale:* `"Prior baseline: Instagram Reels peak engagement window on Friday at 06:30 PM IST."`

---

## 4. Cadence Guardrails Engine (`check_cadence_guardrails`)

1. **Daily Platform Cap:** Limits posts to maximum allowed per day per platform (`max_per_day`: 1 for LinkedIn/Reels/Shorts/TikTok, 2 for X).
2. **Spacing Buffer:** Enforces minimum temporal separation between consecutive posts on the same platform (e.g. 24h for LinkedIn long-form).
3. **Anti-Topic Clustering:** Prevents posts sharing the same topic or chapter theme (e.g. `pricing_model`, `unit_economics`, `customer_retention`) from being scheduled within 24 hours of each other.
4. **Daily Volume Cap:** Restricts total scheduled posts across all platforms to a configurable threshold (default: 2 posts/day).

---

## 5. "Plan My Week" Algorithm

`ContentScheduler.plan_week(project_id, start_date, target_platforms, max_posts_per_day, persist)`:
1. Identifies accepted and candidate clips for the project.
2. Generates candidate slots across the 7-day target window in IST.
3. Calculates composite score:
   $$\text{Score} = \text{BaseQuality} \times W_{\text{Day}} \times W_{\text{TimeSlot}} \times W_{\text{HookType}} \times W_{\text{LengthBucket}}$$
4. Prioritizes candidate (clip, slot) pairings descending by score.
5. Greedily allocates slots subject to cadence guardrails.
6. Persists approved allocations in `calendar_items` table and formats response models with dual alias compatibility (`scheduled_for` / `slot_time_ist`).

---

## 6. RFC 5545 iCalendar Exporter (`ics_export.py`)

- **Standard Conformance:** Full RFC 5545 compliance validated with `icalendar.Calendar.from_ical`.
- **Timezone Block:** Explicit `BEGIN:VTIMEZONE` for `TZID:Asia/Kolkata` with standard UTC+05:30 offset (`TZOFFSETFROM:+0530`, `TZOFFSETTO:+0530`).
- **Formatting Rules:** CRLF (`\r\n`) line endings, 75-octet line folding with leading whitespace continuation, character escaping for commas (`\,`), semicolons (`\;`), backslashes (`\\`), and newlines (`\n`).
- **Event Metadata:** Includes platform tags in summary, clean description containing copy hook, caption text, hashtags, and AI slot allocation rationale.

---

## 7. API Endpoints

- `GET /calendar`: Returns scheduled items for week or month views with clip details and rationale.
- `POST /calendar`: Manually schedules a clip or updates an existing slot.
- `PATCH /calendar/{id}`: Supports drag-and-drop rescheduling and status changes (`idea`, `draft`, `scheduled`, `posted`, `skipped`).
- `POST /calendar/plan-week`: Runs automated week planning algorithm with cadence constraints.
- `GET /calendar/export.ics`: Generates and streams standard `.ics` file with `Content-Disposition: attachment`.

---

## 8. Verification & Acceptance Proof

- **Unit Tests:** `backend/tests/test_calendar.py` (10/10 tests passing).
- **Full Suite:** 107/107 pytest tests passing across all backend modules.
- **RFC 5545 Parsing:** Successfully verified round-trip parsing with `icalendar` parser.
- **Frontend Compatibility:** Schema matches TypeScript `CalendarItem` interface in `frontend/lib/api.ts` and `app/app/calendar/page.tsx`.
