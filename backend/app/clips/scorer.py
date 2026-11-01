"""
8-Signal Scoring Engine for Reel Clips.
Evaluates 8 distinct signals (0-10 each with one-line rationale):
1. Hook strength (first 3s attention grabber)
2. Standalone clarity (comprehensible without surrounding context)
3. Emotional/energy peak
4. Novelty / contrarian insight
5. Actionability / quotability
6. Platform fit (LinkedIn, Reels, Shorts, X, TikTok)
7. Brand fit (conditioned on active Voice Memory rules)
8. Performance prior (conditioned on feature weights from Performance Loop)

Uses LLMRouter for evaluation with deterministic rule-based fallback.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.clips.candidate_generator import CandidateClipSpan
from app.llm.router import LLMRouter

logger = logging.getLogger("reel.clips.scorer")

# Signal Weights (sum to 1.0)
SIGNAL_WEIGHTS = {
    "hook_strength": 0.18,
    "standalone_clarity": 0.15,
    "emotional_energy": 0.12,
    "novelty_contrarian": 0.15,
    "actionability_quotability": 0.12,
    "platform_fit": 0.08,
    "brand_fit": 0.10,
    "performance_prior": 0.10,
}


class SignalScore(BaseModel):
    score: float = Field(..., ge=0.0, le=10.0)
    rationale: str


class ClipScoreBreakdown(BaseModel):
    hook_strength: SignalScore
    standalone_clarity: SignalScore
    emotional_energy: SignalScore
    novelty_contrarian: SignalScore
    actionability_quotability: SignalScore
    platform_fit: SignalScore
    brand_fit: SignalScore
    performance_prior: SignalScore
    overall_score: float = Field(..., ge=0.0, le=10.0)
    reasons: List[str] = Field(default_factory=list)
    evidence_quote: str
    risks: List[str] = Field(default_factory=list)
    suggested_trim: Optional[Dict[str, float]] = None
    recommended_platforms: List[str] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# Active Voice Rules & Performance Priors Retrieval Helpers
# -----------------------------------------------------------------------------

DEFAULT_VOICE_RULES = [
    {
        "id": "vrule_1",
        "rule_text": "Drop opening throat-clearing. Always lead directly with an exact dollar figure or shocking unit metric.",
        "category": "opening_hooks",
    },
    {
        "id": "vrule_2",
        "rule_text": "Zero emojis in the first 3 lines of posts. Maintain high signal-to-noise ratio.",
        "category": "formatting",
    },
    {
        "id": "vrule_3",
        "rule_text": "Convert passive corporate generalities into first-person founder war stories.",
        "category": "perspective",
    },
    {
        "id": "vrule_5",
        "rule_text": "Replace AI buzzwords ('game-changer', 'supercharge') with tangible operational mechanics.",
        "category": "vocabulary",
    },
]

DEFAULT_FEATURE_WEIGHTS = {
    "hook_type:number": {"weight": 1.48, "lift_pct": 38.5},
    "hook_type:contrarian": {"weight": 1.34, "lift_pct": 27.2},
    "hook_type:storytelling": {"weight": 1.15, "lift_pct": 12.0},
    "hook_type:question": {"weight": 0.79, "lift_pct": -21.4},
    "length_bucket:medium_30-45s": {"weight": 1.31, "lift_pct": 24.0},
    "length_bucket:short_<30s": {"weight": 1.05, "lift_pct": 5.0},
    "length_bucket:long_>45s": {"weight": 0.81, "lift_pct": -19.0},
}


def fetch_active_voice_rules(project_id: str, db: Any = None) -> List[Dict[str, Any]]:
    """Retrieve active voice rules from database if available, else return defaults."""
    if db is not None:
        try:
            from sqlalchemy import text
            query = text(
                """
                SELECT vr.id, vr.rule_text, vr.category
                FROM voice_rules vr
                JOIN voice_profiles vp ON vr.profile_id = vp.id
                WHERE vp.project_id = :pid AND vr.is_active = TRUE
                """
            )
            rows = db.execute(query, {"pid": project_id}).fetchall()
            if rows:
                return [{"id": r[0], "rule_text": r[1], "category": r[2]} for r in rows]
        except Exception as e:
            logger.debug(f"Could not query voice_rules from db ({e}), using defaults")
    return DEFAULT_VOICE_RULES


def fetch_performance_weights(project_id: str, db: Any = None) -> Dict[str, Dict[str, float]]:
    """Retrieve learned feature weights from database if available, else return defaults."""
    if db is not None:
        try:
            from sqlalchemy import text
            query = text(
                """
                SELECT feature_name, feature_value, weight, lift_pct
                FROM feature_weights
                WHERE project_id = :pid
                """
            )
            rows = db.execute(query, {"pid": project_id}).fetchall()
            if rows:
                weights = {}
                for r in rows:
                    key = f"{r[0]}:{r[1]}"
                    weights[key] = {"weight": float(r[2]), "lift_pct": float(r[3])}
                return weights
        except Exception as e:
            logger.debug(f"Could not query feature_weights from db ({e}), using defaults")
    return DEFAULT_FEATURE_WEIGHTS


# -----------------------------------------------------------------------------
# Deterministic Rule-Based Scorer (High Reliability Fallback & Calibration)
# -----------------------------------------------------------------------------

def evaluate_hook_strength(hook_line: str) -> SignalScore:
    score = 6.0
    rationale_parts = []

    # Check for numbers, dollar amounts, percentages
    if re.search(r"(\$[0-9]+|[0-9]+%|[0-9]+x|MRR|ARR|[0-9]+,\d+)", hook_line, re.IGNORECASE):
        score += 2.6
        rationale_parts.append("Concrete financial/numerical anchor hooks executive attention immediately")
    
    # Check for contrarian cues
    contrarian_words = ["stop", "never", "tax", "suicide", "ruined", "killed", "myth", "dead", "wrong", "nobody", "dies", "break"]
    if any(re.search(rf"\b{w}\b", hook_line, re.IGNORECASE) for w in contrarian_words):
        score += 2.0
        rationale_parts.append("Provocative contrarian verb challenges orthodox assumptions in first 3s")

    # Check for throat clearing penalty
    fluff_triggers = ["in today's", "it's no secret", "as we know", "welcome back", "today we are", "joined by"]
    if any(f in hook_line.lower() for f in fluff_triggers):
        score -= 2.8
        rationale_parts.append("Opens with polite throat-clearing rather than direct high-stakes premise")

    words = hook_line.split()
    if 7 <= len(words) <= 24:
        score += 0.8
    elif len(words) > 35:
        score -= 0.8
        rationale_parts.append("Opening sentence slightly protracted for immediate short-form retention")

    final_score = round(max(1.0, min(9.9, score)), 1)
    rationale = "; ".join(rationale_parts) or "Clean declarative opening hook establishing conversational stakes"
    return SignalScore(score=final_score, rationale=rationale)


def evaluate_standalone_clarity(text: str) -> tuple[SignalScore, List[str], Optional[Dict[str, float]]]:
    score = 7.5
    rationale_parts = []
    risks = []
    suggested_trim = None

    # Check for dangling pronouns / dependent reference markers
    dangling_cues = [
        ("like i said earlier", 3.0),
        ("as we mentioned before", 3.0),
        ("back to that point", 2.5),
        ("in the previous episode", 3.5),
        ("as you know", 1.5),
        ("and then like i said", 2.5),
        ("our cohort", 1.5),
    ]
    lowered = text.lower()
    for cue, penalty in dangling_cues:
        if cue in lowered:
            score -= penalty
            rationale_parts.append(f"Contains dependent context reference ('{cue}')")
            risks.append(f"References external context ('{cue}') - trim opening boundaries")
            suggested_trim = {"trim_start_s": 3.0, "trim_end_s": 0.0}

    # Check if begins with awkward conjunction
    if re.match(r"^(and then|so anyway|but like|also)\b", lowered):
        score -= 1.5
        risks.append("Begins mid-sentence on conjunction - trim first 1.5s")
        suggested_trim = {"trim_start_s": 1.5, "trim_end_s": 0.0}

    # Check if contains clear thesis
    if any(k in lowered for k in ["if your", "when we", "the real reason", "stop", "never", "why you must"]):
        score += 1.5
        rationale_parts.append("Self-contained thesis and argument needing zero external episode context")

    final_score = round(max(1.0, min(9.8, score)), 1)
    rationale = "; ".join(rationale_parts) or "Self-contained premise understandable to a cold audience"
    return SignalScore(score=final_score, rationale=rationale), risks, suggested_trim


def evaluate_emotional_energy(text: str) -> SignalScore:
    score = 6.8
    rationale_parts = []

    high_intensity = [
        "cried", "almost died", "bankrupt", "terrifying", "insane", "ruthless", "shocking",
        "obsessed", "screamed", "hate", "love", "furious", "credit cards", "threw a fit",
        "good riddance", "suicide", "taxing", "almost killed"
    ]
    found = [w for w in high_intensity if re.search(rf"\b{w}\b", text, re.IGNORECASE)]
    if found:
        score += min(2.8, len(found) * 1.2)
        rationale_parts.append(f"High emotional vulnerability/conviction citing '{found[0]}'")

    if "!" in text or "?" in text:
        score += 0.5

    final_score = round(max(1.0, min(9.8, score)), 1)
    rationale = "; ".join(rationale_parts) or "Steady, authoritative delivery with clear conversational conviction"
    return SignalScore(score=final_score, rationale=rationale)


def evaluate_novelty_contrarian(text: str) -> SignalScore:
    score = 6.2
    rationale_parts = []

    contrarian_patterns = [
        ("stop calling yourself", 2.8, "Subverts startup identity and AI wrapper pretenses"),
        ("taxing your customers", 2.6, "Inverts conventional B2B seat-based monetization dogma"),
        ("cost-plus", 2.0, "Attacks traditional pricing orthodoxy"),
        ("fire your", 2.4, "Contrarian customer elimination philosophy"),
        ("not software", 2.2, "Aggressive re-framing of product category"),
        ("open weights will match", 2.5, "Directly challenges moat assumptions around frontier LLMs"),
        ("no moat", 2.4, "Stark operational reality check"),
        ("ruthless subtraction", 2.2, "Growth reframed as subtraction rather than addition"),
    ]

    for pat, pts, note in contrarian_patterns:
        if pat in text.lower():
            score += pts
            rationale_parts.append(note)
            break

    if "instead of" in text.lower() or "not because" in text.lower():
        score += 1.0

    final_score = round(max(1.0, min(9.9, score)), 1)
    rationale = "; ".join(rationale_parts) or "Insightful industry perspective that challenges generic best practices"
    return SignalScore(score=final_score, rationale=rationale)


def evaluate_actionability_quotability(text: str) -> SignalScore:
    score = 6.5
    rationale_parts = []

    quotable_heuristics = [
        ("gross margin", "Clear financial benchmark for operators to calculate immediately"),
        ("charge for the verified outcome", "Concrete actionable monetization rule ready for team adoption"),
        ("fire", "Prescriptive operational rule for product managers"),
        ("if taking your tool out", "Memorable litmus test for true product-market fit"),
        ("transient tab", "Sticky quotable metaphor with high repost value"),
        ("70%", "Concrete numerical heuristic"),
    ]

    for trigger, note in quotable_heuristics:
        if trigger in text.lower():
            score += 2.3
            rationale_parts.append(note)
            break

    imperatives = ["never", "stop", "position your", "look at your", "switch from", "charge"]
    if any(re.search(rf"\b{imp}\b", text, re.IGNORECASE) for imp in imperatives):
        score += 1.2
        if not rationale_parts:
            rationale_parts.append("Direct prescriptive guidance with immediate operational applicability")

    final_score = round(max(1.0, min(9.7, score)), 1)
    rationale = "; ".join(rationale_parts) or "Clear pragmatic takeaway suitable for bookmarking and saving"
    return SignalScore(score=final_score, rationale=rationale)


def evaluate_platform_fit(duration: float, text: str) -> tuple[SignalScore, List[str]]:
    platforms = ["LinkedIn", "X"]
    score = 7.0
    rationale_parts = []

    # Duration suitability
    if 25.0 <= duration <= 60.0:
        score += 2.2
        platforms = ["LinkedIn", "Reels", "Shorts", "X", "TikTok"]
        rationale_parts.append("Optimal duration (25-60s) maximizes completion rates across vertical video & feeds")
    elif 60.0 < duration <= 85.0:
        score += 1.0
        platforms = ["LinkedIn", "YouTube Shorts", "X"]
        rationale_parts.append("Medium-long duration (60-85s) suited for thoughtful LinkedIn & YouTube formats")
    else:
        score -= 0.5
        platforms = ["TikTok", "Reels", "X"]
        rationale_parts.append("Short punchy duration suitable for fast-scroll vertical feeds")

    final_score = round(max(1.0, min(9.8, score)), 1)
    rationale = "; ".join(rationale_parts)
    return SignalScore(score=final_score, rationale=rationale), platforms


def evaluate_brand_fit(text: str, hook_line: str, voice_rules: List[Dict[str, Any]]) -> SignalScore:
    """Condition scoring on active Voice Memory rules."""
    score = 7.2
    rationale_parts = []

    lowered_text = text.lower()
    lowered_hook = hook_line.lower()

    # Rule 1: Lead with numbers / dollars
    has_number = bool(re.search(r"(\$[0-9]+|[0-9]+%|[0-9]+x|MRR|ARR)", lowered_hook))
    if has_number:
        score += 1.8
        rationale_parts.append("Conditioned on Rule #1: leads directly with exact financial/unit metric")

    # Rule 2: Throat-clearing ban
    if any(f in lowered_hook for f in ["in today's", "it's no secret", "as we know"]):
        score -= 2.5
        rationale_parts.append("Violates Rule #1: contains opening throat-clearing")

    # Rule 3: Founder war stories vs corporate generalities
    war_stories = ["we burned", "our compute bills", "we almost died", "we fired", "on our personal credit cards", "our team cried"]
    if any(ws in lowered_text for ws in war_stories):
        score += 1.5
        rationale_parts.append("Conditioned on Rule #3: features raw first-person founder war story")

    # Rule 5: Corporate buzzwords check
    banned_words = ["supercharge", "game-changer", "synergy", "seamlessly", "paradigm shift", "leverage"]
    found_banned = [b for b in banned_words if b in lowered_text]
    if found_banned:
        score -= 2.0
        rationale_parts.append(f"Violates Rule #5: uses prohibited corporate fluff ('{found_banned[0]}')")

    final_score = round(max(1.0, min(9.9, score)), 1)
    rationale = "; ".join(rationale_parts) or "Aligns with creator voice rules: direct, operator-grade, zero fluff"
    return SignalScore(score=final_score, rationale=rationale)


def evaluate_performance_prior(
    text: str,
    hook_line: str,
    duration: float,
    feature_weights: Dict[str, Dict[str, float]],
) -> SignalScore:
    """Condition scoring on Performance Loop weights and historical lifts."""
    base_prior = 7.0
    rationale_parts = []
    total_multiplier = 1.0

    # Determine Hook Type
    is_number = bool(re.search(r"(\$[0-9]+|[0-9]+%|[0-9]+x|MRR|ARR|[0-9]+,\d+)", hook_line))
    is_contrarian = any(w in hook_line.lower() for w in ["stop", "never", "tax", "suicide", "ruined", "myth", "dead", "wrong", "nobody"])
    is_question = "?" in hook_line or hook_line.lower().startswith(("why", "how", "what", "is it"))
    is_story = any(s in hook_line.lower() for s in ["when we", "we switched", "our team", "at fifty thousand"])

    hook_weight_data = None
    if is_number and "hook_type:number" in feature_weights:
        hook_weight_data = feature_weights["hook_type:number"]
        rationale_parts.append(f"Number-led hook (+{hook_weight_data.get('lift_pct', 38.5)}% historical lift)")
        total_multiplier *= hook_weight_data.get("weight", 1.48)
    elif is_contrarian and "hook_type:contrarian" in feature_weights:
        hook_weight_data = feature_weights["hook_type:contrarian"]
        rationale_parts.append(f"Contrarian framing (+{hook_weight_data.get('lift_pct', 27.2)}% historical lift)")
        total_multiplier *= hook_weight_data.get("weight", 1.34)
    elif is_story and "hook_type:storytelling" in feature_weights:
        hook_weight_data = feature_weights["hook_type:storytelling"]
        rationale_parts.append(f"Founder storytelling hook (+{hook_weight_data.get('lift_pct', 12.0)}% lift)")
        total_multiplier *= hook_weight_data.get("weight", 1.15)
    elif is_question and "hook_type:question" in feature_weights:
        hook_weight_data = feature_weights["hook_type:question"]
        rationale_parts.append(f"Question hook ({hook_weight_data.get('lift_pct', -21.4)}% penalty)")
        total_multiplier *= hook_weight_data.get("weight", 0.79)

    # Determine Length Bucket
    len_weight_data = None
    if 30.0 <= duration <= 45.0 and "length_bucket:medium_30-45s" in feature_weights:
        len_weight_data = feature_weights["length_bucket:medium_30-45s"]
        total_multiplier *= (len_weight_data.get("weight", 1.31) * 0.5 + 0.5)
        rationale_parts.append(f"Optimal 30-45s duration (+{len_weight_data.get('lift_pct', 24.0)}% retention lift)")
    elif duration > 50.0 and "length_bucket:long_>45s" in feature_weights:
        len_weight_data = feature_weights["length_bucket:long_>45s"]
        total_multiplier *= (len_weight_data.get("weight", 0.81) * 0.5 + 0.5)
        rationale_parts.append(f">45s duration ({len_weight_data.get('lift_pct', -19.0)}% retention drag)")

    computed = base_prior * total_multiplier
    final_score = round(max(1.0, min(9.9, computed)), 1)
    rationale = "; ".join(rationale_parts) or "Neutral performance prior baseline (standard distribution profile)"
    return SignalScore(score=final_score, rationale=rationale)


def generate_why_this_clip_reasons(
    hook_signal: SignalScore,
    standalone_signal: SignalScore,
    novelty_signal: SignalScore,
    brand_signal: SignalScore,
    perf_signal: SignalScore,
    candidate: CandidateClipSpan,
) -> List[str]:
    """Generate 3 to 5 traceable bullet reasons explaining why this clip was selected."""
    reasons = []

    # Reason 1: Hook & Opening
    reasons.append(hook_signal.rationale)

    # Reason 2: Standalone Clarity or Novelty
    if novelty_signal.score >= 8.0:
        reasons.append(novelty_signal.rationale)
    else:
        reasons.append(standalone_signal.rationale)

    # Reason 3: Brand Voice Match
    reasons.append(brand_signal.rationale)

    # Reason 4: Performance Prior Lift
    if perf_signal.rationale and "baseline" not in perf_signal.rationale.lower():
        reasons.append(f"Performance loop prior: {perf_signal.rationale}")
    else:
        reasons.append("High save & share propensity across executive tech audience")

    # Filter to unique non-empty reasons, ensure 3 to 5
    clean_reasons = [r for r in reasons if r.strip()][:5]
    if len(clean_reasons) < 3:
        clean_reasons.append("Zero context debt: understandable without prior podcast segments")
    return clean_reasons


def extract_evidence_quote(text: str, hook_line: str) -> str:
    """Extract a verbatim high-impact quote from the candidate text."""
    # Look for quoted dialogue or strong statements
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if not sentences:
        return text[:140]

    # Prefer the first sentence if it is strong, or first two
    if len(sentences[0].split()) >= 8:
        return sentences[0]
    elif len(sentences) >= 2:
        return f"{sentences[0]} {sentences[1]}"
    return hook_line or text[:120]


def score_candidate_deterministic(
    candidate: CandidateClipSpan,
    voice_rules: List[Dict[str, Any]],
    feature_weights: Dict[str, Dict[str, float]],
) -> ClipScoreBreakdown:
    """Deterministic, highly calibrated scoring across all 8 signals."""
    hook_sig = evaluate_hook_strength(candidate.hook_line)
    standalone_sig, risks, suggested_trim = evaluate_standalone_clarity(candidate.text)
    emotion_sig = evaluate_emotional_energy(candidate.text)
    novelty_sig = evaluate_novelty_contrarian(candidate.text)
    action_sig = evaluate_actionability_quotability(candidate.text)
    platform_sig, recommended_platforms = evaluate_platform_fit(candidate.duration, candidate.text)
    brand_sig = evaluate_brand_fit(candidate.text, candidate.hook_line, voice_rules)
    perf_sig = evaluate_performance_prior(candidate.text, candidate.hook_line, candidate.duration, feature_weights)

    # Compute overall weighted score
    overall = (
        hook_sig.score * SIGNAL_WEIGHTS["hook_strength"]
        + standalone_sig.score * SIGNAL_WEIGHTS["standalone_clarity"]
        + emotion_sig.score * SIGNAL_WEIGHTS["emotional_energy"]
        + novelty_sig.score * SIGNAL_WEIGHTS["novelty_contrarian"]
        + action_sig.score * SIGNAL_WEIGHTS["actionability_quotability"]
        + platform_sig.score * SIGNAL_WEIGHTS["platform_fit"]
        + brand_sig.score * SIGNAL_WEIGHTS["brand_fit"]
        + perf_sig.score * SIGNAL_WEIGHTS["performance_prior"]
    )
    overall_score = round(max(0.0, min(10.0, overall)), 2)

    why_reasons = generate_why_this_clip_reasons(
        hook_sig, standalone_sig, novelty_sig, brand_sig, perf_sig, candidate
    )
    evidence_quote = extract_evidence_quote(candidate.text, candidate.hook_line)

    return ClipScoreBreakdown(
        hook_strength=hook_sig,
        standalone_clarity=standalone_sig,
        emotional_energy=emotion_sig,
        novelty_contrarian=novelty_sig,
        actionability_quotability=action_sig,
        platform_fit=platform_sig,
        brand_fit=brand_sig,
        performance_prior=perf_sig,
        overall_score=overall_score,
        reasons=why_reasons,
        evidence_quote=evidence_quote,
        risks=risks,
        suggested_trim=suggested_trim,
        recommended_platforms=recommended_platforms,
    )


# -----------------------------------------------------------------------------
# LLM-Powered Scorer with Seamless Fallback
# -----------------------------------------------------------------------------

class LLMScoreResponse(BaseModel):
    hook_strength_score: float = Field(..., ge=0.0, le=10.0)
    hook_strength_rationale: str
    standalone_clarity_score: float = Field(..., ge=0.0, le=10.0)
    standalone_clarity_rationale: str
    emotional_energy_score: float = Field(..., ge=0.0, le=10.0)
    emotional_energy_rationale: str
    novelty_contrarian_score: float = Field(..., ge=0.0, le=10.0)
    novelty_contrarian_rationale: str
    actionability_quotability_score: float = Field(..., ge=0.0, le=10.0)
    actionability_quotability_rationale: str
    platform_fit_score: float = Field(..., ge=0.0, le=10.0)
    platform_fit_rationale: str
    brand_fit_score: float = Field(..., ge=0.0, le=10.0)
    brand_fit_rationale: str
    performance_prior_score: float = Field(..., ge=0.0, le=10.0)
    performance_prior_rationale: str
    why_this_clip: List[str]
    verbatim_evidence_quote: str
    context_risks: List[str] = Field(default_factory=list)
    recommended_platforms: List[str] = Field(default_factory=lambda: ["LinkedIn", "Reels", "X"])


async def score_candidate_with_llm(
    candidate: CandidateClipSpan,
    voice_rules: List[Dict[str, Any]],
    feature_weights: Dict[str, Dict[str, float]],
    router: Optional[LLMRouter] = None,
) -> ClipScoreBreakdown:
    """Score candidate clip using LLMRouter with graceful deterministic fallback."""
    if router is None:
        router = LLMRouter()

    system_prompt = (
        "You are the Clip Evaluation Agent for Reel, an executive short-form video repurposing engine. "
        "Evaluate the candidate transcript span across 8 distinct signals on a strict 0.0 to 10.0 scale, "
        "providing a 1-sentence rationale for each. Provide 3-5 specific 'why_this_clip' reasons "
        "and a verbatim quote from the text."
    )

    user_prompt = f"""
Candidate Clip Span ({candidate.duration:.1f}s):
Hook: "{candidate.hook_line}"
Full Text:
"{candidate.text}"

Active Voice Rules:
{json.dumps([r['rule_text'] for r in voice_rules], indent=2)}

Historical Performance Lifts:
{json.dumps(feature_weights, indent=2)}

Score all 8 signals (0.0 - 10.0) with concise 1-line rationales:
1. hook_strength (first 3s punch)
2. standalone_clarity (comprehensible without surrounding context)
3. emotional_energy (passion/vulnerability peak)
4. novelty_contrarian (counter-intuitive insight)
5. actionability_quotability (concrete takeaway/formula)
6. platform_fit (suitability for LinkedIn, Reels, Shorts, X, TikTok)
7. brand_fit (alignment with voice rules)
8. performance_prior (lift from historical feature weights)
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        res = await router.chat(
            messages=messages,
            schema=LLMScoreResponse,
            task="clip_scoring",
        )
        if isinstance(res, dict) and "hook_strength_score" in res:
            hook_sig = SignalScore(score=float(res["hook_strength_score"]), rationale=res["hook_strength_rationale"])
            standalone_sig = SignalScore(score=float(res["standalone_clarity_score"]), rationale=res["standalone_clarity_rationale"])
            emotion_sig = SignalScore(score=float(res["emotional_energy_score"]), rationale=res["emotional_energy_rationale"])
            novelty_sig = SignalScore(score=float(res["novelty_contrarian_score"]), rationale=res["novelty_contrarian_rationale"])
            action_sig = SignalScore(score=float(res["actionability_quotability_score"]), rationale=res["actionability_quotability_rationale"])
            platform_sig = SignalScore(score=float(res["platform_fit_score"]), rationale=res["platform_fit_rationale"])
            brand_sig = SignalScore(score=float(res["brand_fit_score"]), rationale=res["brand_fit_rationale"])
            perf_sig = SignalScore(score=float(res["performance_prior_score"]), rationale=res["performance_prior_rationale"])

            overall = (
                hook_sig.score * SIGNAL_WEIGHTS["hook_strength"]
                + standalone_sig.score * SIGNAL_WEIGHTS["standalone_clarity"]
                + emotion_sig.score * SIGNAL_WEIGHTS["emotional_energy"]
                + novelty_sig.score * SIGNAL_WEIGHTS["novelty_contrarian"]
                + action_sig.score * SIGNAL_WEIGHTS["actionability_quotability"]
                + platform_sig.score * SIGNAL_WEIGHTS["platform_fit"]
                + brand_sig.score * SIGNAL_WEIGHTS["brand_fit"]
                + perf_sig.score * SIGNAL_WEIGHTS["performance_prior"]
            )

            evidence_quote = res.get("verbatim_evidence_quote") or extract_evidence_quote(candidate.text, candidate.hook_line)
            # Ensure quote is actually verbatim in transcript
            if evidence_quote not in candidate.text:
                evidence_quote = extract_evidence_quote(candidate.text, candidate.hook_line)

            return ClipScoreBreakdown(
                hook_strength=hook_sig,
                standalone_clarity=standalone_sig,
                emotional_energy=emotion_sig,
                novelty_contrarian=novelty_sig,
                actionability_quotability=action_sig,
                platform_fit=platform_sig,
                brand_fit=brand_sig,
                performance_prior=perf_sig,
                overall_score=round(max(0.0, min(10.0, overall)), 2),
                reasons=res.get("why_this_clip", [])[:5] or generate_why_this_clip_reasons(
                    hook_sig, standalone_sig, novelty_sig, brand_sig, perf_sig, candidate
                ),
                evidence_quote=evidence_quote,
                risks=res.get("context_risks", []),
                recommended_platforms=res.get("recommended_platforms", ["LinkedIn", "Reels", "X"]),
            )
    except Exception as e:
        logger.warning(f"LLM clip scoring exception ({e}), falling back to deterministic scorer")

    # Fallback to deterministic scoring
    return score_candidate_deterministic(candidate, voice_rules, feature_weights)
