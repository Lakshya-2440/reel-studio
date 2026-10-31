import re
from typing import Any, Dict, List, Optional
from app.copy.config import get_platform_config


DEFAULT_BANNED_WORDS = [
    "synergy",
    "game-changer",
    "delighted to announce",
    "leverage",
    "supercharge",
    "revolutionary",
    "paradigm shift",
    "deep dive",
]

DEFAULT_SIGNATURE_PHRASES = [
    "Here is the math:",
    "Stop measuring",
    "Taxing your customers",
    "Outcome-based",
    "Gross margin",
]

THROAT_CLEARING_PATTERNS = [
    r"^in today'?s (world|post|video|fast-paced)",
    r"^it'?s no secret that",
    r"^have you ever wondered",
    r"^(i am|we are) thrilled to (share|announce)",
    r"^(i am|we are) delighted to announce",
    r"^in this video we (will|are going to)",
]


def extract_emojis(text: str) -> List[str]:
    # Common Unicode emoji ranges
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE,
    )
    return emoji_pattern.findall(text)


def compute_voice_match_score(
    text: str,
    platform: str,
    active_rules: Optional[List[Dict[str, Any]]] = None,
    banned_words: Optional[List[str]] = None,
    signature_phrases: Optional[List[str]] = None,
    hashtags: Optional[List[str]] = None,
) -> float:
    """Compute a deterministic, explainable Voice Match Score (0.0 to 100.0%)
    against brand voice memory rules and platform constraints.
    """
    if not text or not text.strip():
        return 50.0

    score = 86.0
    text_lower = text.lower()
    lines = [line.strip() for line in text.strip().split("\n") if line.strip()]
    first_two_lines = " ".join(lines[:2]).lower() if lines else text_lower

    # 1. Banned words check (Heavy penalty)
    active_banned = banned_words or DEFAULT_BANNED_WORDS
    for banned in active_banned:
        if banned.lower() in text_lower:
            score -= 12.0

    # 2. Throat clearing detection (Penalty for throat clearing)
    has_throat_clearing = False
    for pat in THROAT_CLEARING_PATTERNS:
        if re.search(pat, first_two_lines):
            has_throat_clearing = True
            score -= 12.0
            break
    if not has_throat_clearing and len(lines) > 0:
        score += 3.0

    # 3. Quantitative / metric density in hook (Leading with concrete numbers)
    # Checks for $, %, x multiplier, or digits in hook
    has_metrics = bool(re.search(r"(\$\d+|\d+%\b|\b\d+(\.\d+)?[xX]\b|\b\d{2,}\b)", first_two_lines))
    if has_metrics:
        score += 5.0
    else:
        # Subtle deduction if B2B/Twitter/LinkedIn lacks numbers
        if platform in ("linkedin", "x", "twitter"):
            score -= 2.0

    # 4. Signature phrases presence (Reward)
    active_sigs = signature_phrases or DEFAULT_SIGNATURE_PHRASES
    for sig in active_sigs:
        if sig.lower() in text_lower:
            score += 3.5
            break

    # 5. Emoji discipline
    emojis = extract_emojis(text)
    if platform == "linkedin":
        # Rule: Zero emojis in first 3 lines
        opening_text = " ".join(lines[:3]) if len(lines) >= 3 else text
        opening_emojis = extract_emojis(opening_text)
        if opening_emojis:
            score -= 8.0
        elif len(emojis) <= 1:
            score += 4.0
        elif len(emojis) > 3:
            score -= 5.0
    elif platform in ("x", "twitter"):
        if len(emojis) > 2:
            score -= 4.0

    # 6. Sentence length & Punchiness
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    if sentences:
        word_counts = [len(s.split()) for s in sentences]
        avg_len = sum(word_counts) / len(word_counts)
        if avg_len <= 16:
            score += 4.0
        elif avg_len > 24:
            score -= 5.0

        # Longest sentence check
        if any(w > 30 for w in word_counts):
            score -= 4.0

    # 7. Conversational question / High-stakes CTA
    if lines and ("?" in lines[-1] or "below" in lines[-1].lower() or "share" in lines[-1].lower()):
        score += 4.0

    # 8. Platform constraints checks
    cfg = get_platform_config(platform)
    char_len = len(text)
    if char_len <= cfg.max_characters:
        score += 2.0
    else:
        score -= 10.0

    if hashtags is not None:
        if cfg.min_hashtags <= len(hashtags) <= cfg.max_hashtags:
            score += 2.0
        else:
            score -= 3.0

    # 9. Active rules from voice memory
    if active_rules:
        for r in active_rules:
            conf = float(r.get("confidence", 0.9))
            r_text = (r.get("rule_text") or r.get("rule") or "").lower()
            if "throat-clearing" in r_text and not has_throat_clearing:
                score += 2.0 * conf
            if "emoji" in r_text and len(emojis) <= 1:
                score += 2.0 * conf
            if ("metric" in r_text or "number" in r_text or "dollar" in r_text) and has_metrics:
                score += 2.5 * conf

    # Clamp between 60.0 and 99.5
    final_score = max(60.0, min(99.5, score))
    return round(final_score, 1)
