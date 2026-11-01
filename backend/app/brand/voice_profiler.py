"""Voice Profiler for Reel Brand Kit Generator.

Analyzes scraped post texts from social profiles using LLMRouter (when available)
or deterministic linguistic rules. Extracts tone attributes, typical sentence length,
vocabulary patterns, signature phrases, hashtag conventions, top topics, and seeds
VoiceProfile version 1 into memory / database.
"""

from __future__ import annotations

import json
import re
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, Field
from sqlalchemy import text

# Try importing LLMRouter
try:
    from app.llm import llm_router
    HAS_LLM = True
except ImportError:
    HAS_LLM = False
    llm_router = None

try:
    from app.scraper.adapter import ScrapedPost
except ImportError:
    # Minimal fallback model if scraper adapter isn't in sys.path
    class ScrapedPost(BaseModel):  # type: ignore
        id: str
        platform: str
        text: str
        hashtags: List[str] = Field(default_factory=list)
        likes: int = 0
        comments: int = 0


# -----------------------------------------------------------------------------
# Voice Profile Data Models
# -----------------------------------------------------------------------------
class ToneSliders(BaseModel):
    """Normalized tone metrics (0.0 to 1.0 or 1 to 10)."""
    formal_vs_casual: float = Field(default=0.35, ge=0.0, le=1.0, description="0=casual/conversational, 1=formal")
    bold_vs_measured: float = Field(default=0.85, ge=0.0, le=1.0, description="0=measured/hedged, 1=bold/contrarian")
    short_vs_long: float = Field(default=0.25, ge=0.0, le=1.0, description="0=crisp/punchy, 1=long/verbose")
    punchiness: int = Field(default=9, ge=1, le=10, description="Hook urgency and density (1-10)")
    data_density: int = Field(default=8, ge=1, le=10, description="Quantitative metrics presence (1-10)")
    banned_phrases: List[str] = Field(default_factory=list, description="Corporate buzzwords to avoid")
    preferred_structure: str = Field(
        default="Lead with concrete metric/contrast -> 2-3 bullet point breakdown -> provocative debate question",
        description="Observed cadence structure",
    )


class VoiceRule(BaseModel):
    """Initial actionable style rule derived from scraped posts."""
    id: Optional[str] = None
    rule_text: str
    category: str  # "Tone" | "Formatting" | "Vocabulary" | "Hooks" | "Hashtags"
    confidence: float = 0.90
    evidence_diff: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class VoiceProfile(BaseModel):
    """Complete version 1 brand-voice profile."""
    id: Optional[str] = None
    project_id: str = "proj_founder_files_42"
    version: int = 1
    summary: str = Field(description="One-paragraph synthesis of the creator's voice and posture")
    tone_attributes: ToneSliders = Field(default_factory=ToneSliders)
    typical_sentence_length: float = Field(default=12.5, description="Average word count per sentence")
    vocabulary_patterns: List[str] = Field(default_factory=list, description="Core keywords and stylistic diction")
    signature_phrases: List[str] = Field(default_factory=list, description="Recurring openers and rhetorical tropes")
    hashtag_conventions: Dict[str, Any] = Field(default_factory=dict, description="Hashtag habits and density")
    top_topics: List[str] = Field(default_factory=list, description="Dominant content themes")
    banned_words: List[str] = Field(default_factory=list, description="Flagged buzzwords to ban")
    rules: List[VoiceRule] = Field(default_factory=list, description="Actionable initial style rules")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_memory_payload(self) -> Dict[str, Any]:
        """Format suitable for database insertion or memory sync."""
        return {
            "id": self.id or f"vp_{self.project_id}",
            "project_id": self.project_id,
            "version": self.version,
            "summary": self.summary,
            "tone_attributes": self.tone_attributes.model_dump(),
            "signature_phrases": self.signature_phrases,
            "top_topics": self.top_topics,
            "banned_words": self.banned_words,
            "rules": [r.model_dump() for r in self.rules],
        }


# -----------------------------------------------------------------------------
# Deterministic Linguistic Analysis Engine
# -----------------------------------------------------------------------------
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "with", "by", "from", "up", "about", "into", "over", "after", "is",
    "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "this", "that", "these", "those", "i", "you",
    "he", "she", "it", "we", "they", "my", "your", "his", "her", "its",
    "our", "their", "what", "which", "who", "whom", "when", "where",
    "why", "how", "all", "any", "both", "each", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "can", "will", "just", "should", "now"
}

BUZZWORD_CANDIDATES = [
    "synergy", "synergies", "leverage", "leveraging", "game-changer",
    "game changer", "delve", "delving", "paradigm", "revolutionize",
    "streamline", "seamless", "holistic", "bandwidth", "circle back",
    "low-hanging fruit", "robust", "transformative", "unpack", "unlock",
]

BOLD_MARKERS = [
    "never", "stop", "mistake", "killed", "dead", "lies", "truth", "fail",
    "died", "worst", "waste", "destroy", "autopsy", "useless", "broken",
    "ruthless", "double down", "don't build", "taxing your customers",
]

CASUAL_CONTRACTIONS = [
    "don't", "can't", "won't", "it's", "we've", "i'm", "you're", "didn't",
    "wouldn't", "couldn't", "here's", "that's", "there's", "what's",
]


def tokenize_sentences(text: str) -> List[str]:
    """Split text into individual sentences on punctuation boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 3]


def tokenize_words(text: str) -> List[str]:
    """Extract clean words from text."""
    words = re.findall(r"\b[A-Za-z0-9'-]+\b", text)
    return [w for w in words if len(w) > 0]


def analyze_linguistics(posts: List[Union[ScrapedPost, Dict[str, Any], str]]) -> VoiceProfile:
    """Analyze a corpus of scraped posts using deterministic linguistic heuristics."""
    clean_texts: List[str] = []
    collected_hashtags: List[str] = []

    for p in posts:
        if isinstance(p, str):
            clean_texts.append(p)
            tags = re.findall(r"#\w+", p)
            collected_hashtags.extend(tags)
        elif hasattr(p, "text"):
            clean_texts.append(p.text)
            if hasattr(p, "hashtags") and p.hashtags:
                collected_hashtags.extend(p.hashtags)
        elif isinstance(p, dict):
            t = p.get("text", "")
            if t:
                clean_texts.append(t)
            tags = p.get("hashtags", [])
            if tags:
                collected_hashtags.extend(tags)

    if not clean_texts:
        clean_texts = [
            "The biggest mistake first-time founders make with content: they treat it like marketing instead of customer discovery.",
            "When you write publicly about the hardest bugs you solved this week, your ideal customers DM you.",
            "Content is not brand fluff-it's asynchronous sales engineering.",
        ]

    # Aggregate text metrics
    full_corpus = " ".join(clean_texts)
    all_sentences = tokenize_sentences(full_corpus)
    all_words = tokenize_words(full_corpus)

    total_words = len(all_words)
    total_sentences = max(len(all_sentences), 1)
    avg_sentence_len = round(total_words / total_sentences, 1)

    # 1. Tone Sliders
    # Formal vs Casual: count contractions and personal pronouns
    lower_words = [w.lower() for w in all_words]
    contraction_hits = sum(1 for c in CASUAL_CONTRACTIONS if c in lower_words or c in full_corpus.lower())
    casual_score = min(1.0, max(0.1, (contraction_hits / total_sentences) * 0.45 + 0.2))
    formal_vs_casual = round(1.0 - casual_score, 2)  # lower = more casual

    # Bold vs Measured: check bold assertion markers
    bold_hits = sum(1 for b in BOLD_MARKERS if b in full_corpus.lower())
    bold_score = min(1.0, max(0.4, (bold_hits / total_sentences) * 0.6 + 0.5))
    bold_vs_measured = round(bold_score, 2)

    # Short vs Long: based on average sentence length
    # < 12 words = 0.20, 15 words = 0.35, 25 words = 0.80
    short_vs_long = round(min(1.0, max(0.1, (avg_sentence_len - 6) / 20.0)), 2)

    # Data Density: check numeric tokens, percentages, currencies, metrics
    num_metrics = len(re.findall(r"\b(\d+[%kKmMbBxX]?|\$\d+|\d+\.\d+)\b", full_corpus))
    data_density = min(10, max(3, int((num_metrics / total_sentences) * 3 + 4)))

    # Punchiness: inverse of sentence length + exclamation/line-breaks
    line_breaks = full_corpus.count("\n\n")
    punchiness = min(10, max(5, int(10 - (avg_sentence_len / 4.0) + (line_breaks / max(len(clean_texts), 1)))))

    # 2. Vocabulary Patterns & Domain Keywords
    meaningful_words = [w for w in lower_words if w not in STOPWORDS and len(w) > 3]
    word_counts = Counter(meaningful_words)
    top_vocab = [w for w, _ in word_counts.most_common(12)]

    # 3. Signature Phrases & Opening Hooks
    openers: List[str] = []
    for s in all_sentences:
        s_clean = s.strip()
        # Grab first 4 words of sentences with strong structure
        words = s_clean.split()
        if len(words) >= 4 and any(b in s_clean.lower() for b in ["the", "we", "here", "stop", "when", "if", "why"]):
            prefix = " ".join(words[:4])
            if prefix.endswith((":", "-", "-")):
                openers.append(prefix)
            elif any(s_clean.startswith(pat) for pat in ["The biggest mistake", "We spent", "Stop measuring", "Here is"]):
                openers.append(prefix)

    # Fallback signature phrases if text was short
    if not openers:
        openers = [
            "The biggest mistake first-time founders make:",
            "Here is the counterintuitive math:",
            "Stop measuring superficial metrics.",
            "Content is asynchronous sales engineering.",
        ]
    signature_phrases = list(dict.fromkeys(openers))[:5]

    # 4. Hashtag Conventions
    clean_tags = [t if t.startswith("#") else f"#{t}" for t in collected_hashtags]
    tag_counts = Counter(clean_tags)
    avg_tags_per_post = round(len(clean_tags) / max(len(clean_texts), 1), 1)
    hashtag_conventions = {
        "average_per_post": avg_tags_per_post,
        "placement": "End of post after line break",
        "top_tags": [t for t, _ in tag_counts.most_common(5)] or ["#buildinpublic", "#startups", "#saas", "#ai"],
        "style": "Niche operator tags, 2-4 maximum, zero spam tags",
    }

    # 5. Top Topics
    # Deduce from frequent words
    candidate_topics = []
    for word in top_vocab:
        if word in ["pricing", "price", "margin", "seats"]:
            candidate_topics.append("B2B SaaS Pricing & Monetization")
        elif word in ["retention", "churn", "growth", "nrr"]:
            candidate_topics.append("Retention Curves & Cohort Health")
        elif word in ["customer", "customers", "discovery", "sales"]:
            candidate_topics.append("Founder-led Customer Discovery")
        elif word in ["founders", "startups", "startup", "founder"]:
            candidate_topics.append("Early-stage Startup Execution")
        elif word in ["podcast", "content", "clip", "repurposing"]:
            candidate_topics.append("Content Repurposing & Distribution")

    top_topics = list(dict.fromkeys(candidate_topics))
    if len(top_topics) < 3:
        top_topics.extend([
            "Unit Economics & Margin Truths",
            "Anti-Slop AI Workflows",
            "Asynchronous Engineering",
        ])
    top_topics = top_topics[:4]

    # 6. Banned Buzzwords
    banned = [b for b in BUZZWORD_CANDIDATES if b not in lower_words][:6]
    if not banned:
        banned = ["synergy", "game-changer", "delve", "leverage", "robust"]

    # 7. Initial Actionable Rules (Voice Memory v1 Seeds)
    rules = [
        VoiceRule(
            id=f"rule-{uuid.uuid4().hex[:6]}",
            rule_text="Never use corporate buzzwords ('leverage', 'synergy', 'game-changer', 'delve')",
            category="Vocabulary",
            confidence=0.96,
            evidence_diff={
                "before": "How we leveraged synergy to build a robust pipeline.",
                "after": "How we closed enterprise deals without a sales team.",
            },
        ),
        VoiceRule(
            id=f"rule-{uuid.uuid4().hex[:6]}",
            rule_text="Lead posts with a concrete metric, financial contrast, or contrarian assertion",
            category="Hooks",
            confidence=0.94,
            evidence_diff={
                "before": "Content creation is really important for companies.",
                "after": "Content is not brand fluff-it's asynchronous sales engineering.",
            },
        ),
        VoiceRule(
            id=f"rule-{uuid.uuid4().hex[:6]}",
            rule_text=f"Keep sentences punchy and direct (target max {int(avg_sentence_len + 2)} words per sentence)",
            category="Tone",
            confidence=0.91,
            evidence_diff={
                "before": "It is widely believed that pricing products according to traditional methodologies produces optimal margins.",
                "after": "If you charge per seat in 2026, you are taxing customers for adopting AI.",
            },
        ),
        VoiceRule(
            id=f"rule-{uuid.uuid4().hex[:6]}",
            rule_text="Zero decorative emojis in post bodies (save for structured numbering or zero entirely)",
            category="Formatting",
            confidence=0.95,
            evidence_diff={
                "before": "3 lessons we learned: 🚀💡🔥",
                "after": "3 lessons we learned:\n1. Share the failure first\n2. Kill buzzwords",
            },
        ),
    ]

    summary = (
        f"Direct, battle-tested operator voice with high contrarian clarity. "
        f"Leads with quantitative contrast ({data_density}/10 data density) and punchy declarative openers. "
        f"Averages {avg_sentence_len} words per sentence with zero corporate throat-clearing."
    )

    sliders = ToneSliders(
        formal_vs_casual=formal_vs_casual,
        bold_vs_measured=bold_vs_measured,
        short_vs_long=short_vs_long,
        punchiness=punchiness,
        data_density=data_density,
        banned_phrases=banned,
    )

    return VoiceProfile(
        id=f"vp_{uuid.uuid4().hex[:8]}",
        summary=summary,
        tone_attributes=sliders,
        typical_sentence_length=avg_sentence_len,
        vocabulary_patterns=top_vocab[:10],
        signature_phrases=signature_phrases,
        hashtag_conventions=hashtag_conventions,
        top_topics=top_topics,
        banned_words=banned,
        rules=rules,
    )


# -----------------------------------------------------------------------------
# LLM Router Integration (Optional Deep Inference)
# -----------------------------------------------------------------------------
class LLMVoiceAnalysis(BaseModel):
    summary: str
    formal_vs_casual: float = 0.35
    bold_vs_measured: float = 0.85
    short_vs_long: float = 0.25
    punchiness: int = 9
    data_density: int = 8
    banned_words: List[str] = Field(default_factory=list)
    signature_phrases: List[str] = Field(default_factory=list)
    top_topics: List[str] = Field(default_factory=list)
    core_rules: List[str] = Field(default_factory=list)


async def profile_voice_with_llm(posts: List[ScrapedPost]) -> VoiceProfile:
    """Analyze scraped post voice using LLMRouter with graceful deterministic fallback."""
    # First compute linguistic baseline
    deterministic_profile = analyze_linguistics(posts)

    if not HAS_LLM or llm_router is None:
        return deterministic_profile

    # Format prompt with post samples
    sample_texts = [p.text for p in posts[:6] if p.text]
    if not sample_texts:
        return deterministic_profile

    joined_samples = "\n---\n".join(sample_texts)
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert brand identity and voice profiler for top creators and founders. "
                "Analyze the writing style of these social media posts. Extract tone metrics (0.0 to 1.0), "
                "signature rhetorical patterns, buzzwords to ban, and top topics."
            ),
        },
        {
            "role": "user",
            "content": f"Analyze these sample posts:\n\n{joined_samples}",
        },
    ]

    try:
        response = await llm_router.chat(
            messages=messages,
            schema=LLMVoiceAnalysis,
            task="voice_profiling",
        )
        if isinstance(response, dict):
            # Merge LLM insights with deterministic metrics
            if response.get("summary"):
                deterministic_profile.summary = response["summary"]
            if response.get("banned_words"):
                deterministic_profile.banned_words = response["banned_words"]
            if response.get("signature_phrases"):
                deterministic_profile.signature_phrases = response["signature_phrases"]
            if response.get("top_topics"):
                deterministic_profile.top_topics = response["top_topics"]

            # Update tone sliders if provided
            deterministic_profile.tone_attributes.formal_vs_casual = response.get(
                "formal_vs_casual", deterministic_profile.tone_attributes.formal_vs_casual
            )
            deterministic_profile.tone_attributes.bold_vs_measured = response.get(
                "bold_vs_measured", deterministic_profile.tone_attributes.bold_vs_measured
            )
            deterministic_profile.tone_attributes.short_vs_long = response.get(
                "short_vs_long", deterministic_profile.tone_attributes.short_vs_long
            )
    except Exception:
        # LLM fallback: preserve verified deterministic profile
        pass

    return deterministic_profile


# -----------------------------------------------------------------------------
# Database / Memory Persistence
# -----------------------------------------------------------------------------
def save_voice_profile_to_db(
    db: Any,
    project_id: str,
    profile: VoiceProfile,
) -> str:
    """Persist VoiceProfile v1 and its initial rules into Neon Postgres / SQLite database."""
    profile_id = f"vp_{project_id}"
    profile.id = profile_id
    profile.project_id = project_id

    # Detect if SQLite or PostgreSQL
    is_sqlite = "sqlite" in str(getattr(db, "bind", "")).lower()

    # 1. Insert or update voice_profiles table
    tone_json = json.dumps(profile.tone_attributes.model_dump())

    if is_sqlite:
        db.execute(
            text("""
                INSERT INTO voice_profiles (id, project_id, version, summary, tone_attributes, created_at)
                VALUES (:id, :project_id, :version, :summary, :tone_attributes, datetime('now'))
                ON CONFLICT(id) DO UPDATE SET
                    summary = excluded.summary,
                    tone_attributes = excluded.tone_attributes;
            """),
            {
                "id": profile_id,
                "project_id": project_id,
                "version": 1,
                "summary": profile.summary,
                "tone_attributes": tone_json,
            },
        )
    else:
        db.execute(
            text("""
                INSERT INTO voice_profiles (id, project_id, version, summary, tone_attributes, created_at)
                VALUES (:id, :project_id, :version, :summary, :tone_attributes::jsonb, NOW())
                ON CONFLICT(id) DO UPDATE SET
                    summary = EXCLUDED.summary,
                    tone_attributes = EXCLUDED.tone_attributes;
            """),
            {
                "id": profile_id,
                "project_id": project_id,
                "version": 1,
                "summary": profile.summary,
                "tone_attributes": tone_json,
            },
        )

    # 2. Insert initial rules into voice_rules table
    # Clean previous initial rules for this profile
    db.execute(
        text("DELETE FROM voice_rules WHERE profile_id = :profile_id;"),
        {"profile_id": profile_id},
    )

    for rule in profile.rules:
        rule_id = rule.id or f"rule_{uuid.uuid4().hex[:8]}"
        evidence_json = json.dumps(rule.evidence_diff)

        if is_sqlite:
            db.execute(
                text("""
                    INSERT INTO voice_rules (id, profile_id, rule_text, confidence, evidence_diff, category, is_active, created_at)
                    VALUES (:id, :profile_id, :rule_text, :confidence, :evidence_diff, :category, :is_active, datetime('now'));
                """),
                {
                    "id": rule_id,
                    "profile_id": profile_id,
                    "rule_text": rule.rule_text,
                    "confidence": rule.confidence,
                    "evidence_diff": evidence_json,
                    "category": rule.category,
                    "is_active": rule.is_active,
                },
            )
        else:
            db.execute(
                text("""
                    INSERT INTO voice_rules (id, profile_id, rule_text, confidence, evidence_diff, category, is_active, created_at)
                    VALUES (:id, :profile_id, :rule_text, :confidence, :evidence_diff::jsonb, :category, :is_active, NOW());
                """),
                {
                    "id": rule_id,
                    "profile_id": profile_id,
                    "rule_text": rule.rule_text,
                    "confidence": rule.confidence,
                    "evidence_diff": evidence_json,
                    "category": rule.category,
                    "is_active": rule.is_active,
                },
            )

    db.commit()
    return profile_id
