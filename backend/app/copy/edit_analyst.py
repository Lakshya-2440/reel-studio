import difflib
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import text
from db.connection import SessionLocal
from app.copy.voice_scorer import extract_emojis, DEFAULT_BANNED_WORDS


def compute_text_diff(ai_draft: str, creator_final: str) -> str:
    """Generate a clean inline evidence diff string between AI draft and creator edit."""
    ai_lines = [line.strip() for line in ai_draft.strip().split("\n") if line.strip()]
    final_lines = [line.strip() for line in creator_final.strip().split("\n") if line.strip()]

    matcher = difflib.SequenceMatcher(None, ai_draft.split(), creator_final.split())
    diff_parts = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "replace":
            diff_parts.append(f"[-] {' '.join(ai_draft.split()[i1:i2])} [+] {' '.join(creator_final.split()[j1:j2])}")
        elif tag == "delete":
            diff_parts.append(f"[-] {' '.join(ai_draft.split()[i1:i2])}")
        elif tag == "insert":
            diff_parts.append(f"[+] {' '.join(creator_final.split()[j1:j2])}")

    if diff_parts:
        return " ".join(diff_parts[:3])

    # Fallback to line diff
    if ai_lines and final_lines and ai_lines[0] != final_lines[0]:
        return f"[-] {ai_lines[0]} [+] {final_lines[0]}"
    return f"[-] {ai_draft[:50]}... [+] {creator_final[:50]}..."


def classify_edit(ai_draft: str, creator_final: str, platform: str) -> Tuple[str, str, float]:
    """Classify the edit and return (rule_text, category, confidence)."""
    ai_emojis = extract_emojis(ai_draft)
    final_emojis = extract_emojis(creator_final)

    # 1. Emoji removal
    if len(ai_emojis) > 0 and len(final_emojis) == 0:
        return (
            f"Never use emojis in {platform.capitalize()} body paragraphs; prefer clean plain-text styling.",
            "formatting",
            0.94,
        )

    # 2. Metric / Number addition
    ai_numbers = re.findall(r"(\$\d+|\d+%\b|\b\d+x\b|\b\d{2,}\b)", ai_draft)
    final_numbers = re.findall(r"(\$\d+|\d+%\b|\b\d+x\b|\b\d{2,}\b)", creator_final)
    if len(final_numbers) > len(ai_numbers):
        return (
            "Opens hooks with concrete metrics, dollar figures, or unit economics rather than general observations.",
            "vocabulary",
            0.96,
        )

    # 3. Throat-clearing removal
    fluff_words = ["in today's", "it's no secret", "excited to share", "super excited", "delighted to announce"]
    had_fluff = any(w in ai_draft.lower() for w in fluff_words)
    has_fluff_now = any(w in creator_final.lower() for w in fluff_words)
    if had_fluff and not has_fluff_now:
        return (
            "Eliminates opening throat-clearing; hooks reader directly with first-sentence tension.",
            "structure",
            0.95,
        )

    # 4. Sentence shortening & Punchiness
    ai_words = ai_draft.split()
    final_words = creator_final.split()
    if len(final_words) < len(ai_words) * 0.75:
        return (
            "Strips conversational padding. Enforces concise, high-density sentences under 15 words.",
            "length",
            0.91,
        )

    # 5. Jargon replacement
    for banned in DEFAULT_BANNED_WORDS:
        if banned in ai_draft.lower() and banned not in creator_final.lower():
            return (
                f"Prohibits corporate jargon like '{banned}'; favors direct, operational terminology.",
                "vocabulary",
                0.93,
            )

    # 6. Question CTA
    if "?" in creator_final and "?" not in ai_draft:
        return (
            "Closes posts with an open, high-stakes debate prompt instead of passive engagement bait.",
            "structure",
            0.90,
        )

    # Default general tone refinement
    return (
        f"Prefers direct, authoritative tone tailored to founder audience on {platform.capitalize()}.",
        "tone",
        0.88,
    )


def process_variant_edit(
    variant_id: str,
    creator_final: str,
    ai_draft: Optional[str] = None,
    db: Optional[Any] = None,
) -> Dict[str, Any]:
    """Executes the voice-memory edit analysis pipeline:
    1. Look up variant & AI draft if missing
    2. Compute word/sentence diff
    3. Classify edit patterns & generate rule
    4. Persist variant update, voice example, rule, and profile version
    5. Return updated state
    """
    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        # 1. Fetch variant from DB if exists
        row = db.execute(
            text("SELECT id, clip_id, platform, caption, hook FROM platform_variants WHERE id = :vid"),
            {"vid": variant_id},
        ).fetchone()

        platform = "linkedin"
        clip_id = "clip_1"
        stored_caption = ""

        if row:
            platform = row[2] or "linkedin"
            clip_id = row[1] or "clip_1"
            stored_caption = row[3] or ""

        # Resolve AI draft
        effective_ai_draft = ai_draft or stored_caption or "AI-generated baseline caption draft"

        # 2. Compute diff
        evidence_diff = compute_text_diff(effective_ai_draft, creator_final)

        # 3. Classify edit
        rule_text, category, confidence = classify_edit(effective_ai_draft, creator_final, platform)

        # 4. Persist updates
        # Update variant
        db.execute(
            text("""
                UPDATE platform_variants
                SET is_edited = 1, final_text = :final_txt, caption = :final_txt
                WHERE id = :vid
            """),
            {"final_txt": creator_final, "vid": variant_id},
        )

        # Find active profile id
        profile_row = db.execute(
            text("SELECT id, version FROM voice_profiles ORDER BY version DESC LIMIT 1")
        ).fetchone()

        profile_id = profile_row[0] if profile_row else "vp_founder_files"
        current_version = profile_row[1] if profile_row else 2
        new_version_str = f"v{current_version + 1}"

        # Record Voice Example
        vex_id = f"vex_{uuid.uuid4().hex[:8]}"
        try:
            db.execute(
                text("""
                    INSERT INTO voice_examples (id, profile_id, platform, ai_draft, creator_final, diff_summary)
                    VALUES (:id, :pid, :platform, :ai_draft, :creator_final, :diff)
                """),
                {
                    "id": vex_id,
                    "pid": profile_id,
                    "platform": platform,
                    "ai_draft": effective_ai_draft,
                    "creator_final": creator_final,
                    "diff": evidence_diff,
                },
            )
        except Exception:
            pass  # Handle table schema differences gracefully

        # Check existing rule or insert new
        rule_id = f"vrule_{uuid.uuid4().hex[:8]}"
        existing_rule = db.execute(
            text("SELECT id, confidence FROM voice_rules WHERE profile_id = :pid AND category = :cat LIMIT 1"),
            {"pid": profile_id, "cat": category},
        ).fetchone()

        if existing_rule:
            rule_id = existing_rule[0]
            new_conf = min(0.99, float(existing_rule[1] or 0.85) + 0.02)
            db.execute(
                text("""
                    UPDATE voice_rules
                    SET confidence = :conf, rule_text = :rtext
                    WHERE id = :rid
                """),
                {"conf": new_conf, "rtext": rule_text, "rid": rule_id},
            )
            confidence = new_conf
        else:
            try:
                db.execute(
                    text("""
                        INSERT INTO voice_rules (id, profile_id, rule_text, confidence, category, is_active)
                        VALUES (:id, :pid, :rtext, :conf, :cat, 1)
                    """),
                    {
                        "id": rule_id,
                        "pid": profile_id,
                        "rtext": rule_text,
                        "conf": confidence,
                        "cat": category,
                    },
                )
            except Exception:
                pass

        # Update voice profile version
        try:
            db.execute(
                text("UPDATE voice_profiles SET version = version + 1 WHERE id = :pid"),
                {"pid": profile_id},
            )
        except Exception:
            pass

        db.commit()

        return {
            "variant_id": variant_id,
            "creator_final": creator_final,
            "final_text": creator_final,
            "diff_analyzed": True,
            "rule_extracted": {
                "id": rule_id,
                "rule": rule_text,
                "category": category,
                "confidence": round(confidence, 2),
                "evidence_diff": evidence_diff,
            },
            "voice_profile_version": new_version_str,
            "message": "Voice Memory updated with fresh creator diff rule.",
        }
    finally:
        if should_close_db:
            db.close()
