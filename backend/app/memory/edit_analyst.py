"""Edit Analyst that extracts actionable brand-voice rules from creator diffs using LLMRouter with deterministic fallbacks."""

import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.llm.router import llm_router
from app.memory.diff_engine import DiffMetadata

logger = logging.getLogger(__name__)

# Known corporate buzzwords and filler phrases targeted for elimination
KNOWN_BUZZWORDS = [
    "synergy", "synergies", "leverage", "leveraged", "game-changer", "gamechanger",
    "delve", "supercharge", "supercharged", "delighted to announce", "thrilled to share",
    "excited to announce", "groundbreaking", "unleash", "seamless", "seamlessly",
    "cutting-edge", "robust", "paradigm shift", "fast-paced world", "in today's world",
    "it's no secret that", "without further ado"
]


class EditRuleClassification(BaseModel):
    """Actionable brand voice rule extracted from creator's edits."""
    category: str = Field(
        description="Category: tone, length, structure, formatting, banned, or vocabulary"
    )
    pattern: str = Field(description="Short machine-readable pattern tag")
    rule_text: str = Field(description="Concrete actionable directive for future generations")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0.0 to 1.0")
    evidence_citation: str = Field(description="Inline diff citation: '[-] ... [+] ...'")
    evidence_diff: Dict[str, str] = Field(
        default_factory=dict,
        description="Structured snippet with before and after"
    )
    explanation: str = Field(default="", description="Why this edit reflects brand voice")
    banned_phrases: List[str] = Field(default_factory=list)
    preferred_phrases: List[str] = Field(default_factory=list)


class EditAnalyst:
    """Analyzes text diffs to infer brand voice rules and confidence scores."""

    def __init__(self, router=None):
        self.router = router or llm_router

    async def analyze_diff(
        self,
        diff: DiffMetadata,
        platform: str = "linkedin",
        context: Optional[str] = None,
    ) -> EditRuleClassification:
        """Classify creator edit into an actionable style rule.
        
        Tries LLMRouter first; falls back to deterministic rule extraction if offline.
        """
        # 1. Attempt LLM-based analysis
        try:
            prompt = self._build_analysis_prompt(diff, platform, context)
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are TheContentCompany's Edit Analyst. You inspect creator revisions to AI drafts "
                        "and extract precise, actionable style rules that govern tone, formatting, "
                        "length, hook structure, and banned vocabulary. Output must be actionable."
                    ),
                },
                {"role": "user", "content": prompt},
            ]

            result_dict = await self.router.chat(
                messages=messages,
                schema=EditRuleClassification,
                task="edit_analysis",
            )

            if (
                isinstance(result_dict, dict)
                and result_dict.get("rule_text")
                and not result_dict.get("rule_text", "").startswith("Fallback ")
            ):
                # Ensure evidence fields are properly backfilled from diff if empty
                if not result_dict.get("evidence_citation") or "Fallback" in str(result_dict.get("evidence_citation")):
                    result_dict["evidence_citation"] = diff.evidence_citation
                if not result_dict.get("evidence_diff"):
                    result_dict["evidence_diff"] = diff.evidence_diff
                return EditRuleClassification(**result_dict)

        except Exception as err:
            logger.warning(f"LLM edit analysis failed: {err}. Engaging deterministic analyst.")

        # 2. Deterministic Rule Analysis Fallback
        return self.deterministic_analysis(diff, platform=platform)

    def deterministic_analysis(
        self,
        diff: DiffMetadata,
        platform: str = "linkedin",
    ) -> EditRuleClassification:
        """Deterministic classifier that inspects diff metadata when LLM is unavailable."""
        platform_title = platform.capitalize()

        # Check A: Emojis removed and no emojis remain in creator text
        if diff.emoji_removed and len(diff.emoji_added) == 0:
            removed_str = " ".join(diff.emoji_removed[:4])
            return EditRuleClassification(
                category="formatting",
                pattern="no_emojis",
                rule_text=f"Never use emojis in {platform_title} post body; maintain crisp typography.",
                confidence=0.95,
                evidence_citation=diff.evidence_citation,
                evidence_diff=diff.evidence_diff,
                explanation=f"Creator purged emojis ({removed_str}) to establish authoritative seriousness.",
                banned_phrases=diff.emoji_removed,
            )

        # Check B: Concrete number or financial metric added to the opening hook
        if diff.number_in_hook or (diff.numbers_added and any(n in diff.creator_final[:90] for n in diff.numbers_added)):
            metric = diff.numbers_added[0] if diff.numbers_added else "metrics"
            return EditRuleClassification(
                category="structure",
                pattern="lead_with_number",
                rule_text="Open hooks with concrete numbers, dollar metrics, or quantified unit economics.",
                confidence=0.94,
                evidence_citation=diff.evidence_citation,
                evidence_diff=diff.evidence_diff,
                explanation=f"Added specific quantitative figure ({metric}) in opening line.",
                preferred_phrases=diff.numbers_added[:3],
            )

        # Check C: Known corporate buzzwords removed
        removed_lower = [w.lower() for w in diff.removed_words]
        detected_banned: List[str] = []
        for bw in KNOWN_BUZZWORDS:
            bw_words = bw.split()
            if all(w in removed_lower for w in bw_words) or bw in diff.ai_draft.lower() and bw not in diff.creator_final.lower():
                detected_banned.append(bw)

        if detected_banned:
            banned_str = ", ".join(f"'{b}'" for b in detected_banned[:3])
            return EditRuleClassification(
                category="banned",
                pattern="ban_buzzwords",
                rule_text=f"Ban corporate buzzwords like {banned_str} in favor of concrete operational reality.",
                confidence=0.93,
                evidence_citation=diff.evidence_citation,
                evidence_diff=diff.evidence_diff,
                explanation="Eliminated generic corporate marketing jargon.",
                banned_phrases=detected_banned,
            )

        # Check D: Sentence length significantly shortened
        if diff.sentence_length_delta <= -3.0 or diff.creator_avg_sentence_length <= 15.0:
            target_len = max(12, int(round(diff.creator_avg_sentence_length + 2)))
            return EditRuleClassification(
                category="length",
                pattern="shorter_sentences",
                rule_text=f"Keep sentences short and punchy (target max {target_len} words per line).",
                confidence=0.90,
                evidence_citation=diff.evidence_citation,
                evidence_diff=diff.evidence_diff,
                explanation=f"Reduced average sentence length from {diff.ai_avg_sentence_length} to {diff.creator_avg_sentence_length} words.",
            )

        # Check E: Throat-clearing or rhetorical question replaced with declarative statement
        draft_lower = diff.ai_draft.lower()
        if any(tc in draft_lower for tc in ["in today's", "it's no secret", "we are excited", "supercharge"]):
            return EditRuleClassification(
                category="tone",
                pattern="drop_throat_clearing",
                rule_text="Drop introductory throat-clearing; lead directly with a contrarian observation or key takeaway.",
                confidence=0.92,
                evidence_citation=diff.evidence_citation,
                evidence_diff=diff.evidence_diff,
                explanation="Removed rhetorical preamble and jumped straight into core insight.",
            )

        # Check F: Closing question or high-stakes debate CTA added
        final_sentences = diff.creator_final.strip().split("\n")
        last_line = final_sentences[-1].strip() if final_sentences else ""
        if "?" in last_line and any(w in last_line.lower() for w in ["what", "how", "floor", "margin", "disagree"]):
            return EditRuleClassification(
                category="structure",
                pattern="debate_cta",
                rule_text="End posts with a high-stakes binary debate prompt instead of passive engagement bait.",
                confidence=0.88,
                evidence_citation=diff.evidence_citation,
                evidence_diff=diff.evidence_diff,
                explanation="Swapped generic CTA for provocative debate prompt.",
            )

        # Default fallback: Founder authentic tone
        return EditRuleClassification(
            category="tone",
            pattern="founder_authenticity",
            rule_text="Write from a first-person battle-tested operator perspective with specific war stories.",
            confidence=0.86,
            evidence_citation=diff.evidence_citation,
            evidence_diff=diff.evidence_diff,
            explanation="Creator personalized copy with firsthand operator framing.",
        )

    def _build_analysis_prompt(
        self,
        diff: DiffMetadata,
        platform: str,
        context: Optional[str],
    ) -> str:
        """Construct structured prompt for LLM edit analyst."""
        return f"""Analyze this creator revision on {platform.upper()}:

[ORIGINAL AI DRAFT]
{diff.ai_draft}

[CREATOR FINAL COPY]
{diff.creator_final}

[DIFF METRICS]
- Added words: {', '.join(diff.added_words[:10]) or 'None'}
- Removed words: {', '.join(diff.removed_words[:10]) or 'None'}
- Emojis removed: {', '.join(diff.emoji_removed) or 'None'}
- Numbers added: {', '.join(diff.numbers_added) or 'None'}
- Number added in opening hook: {diff.number_in_hook}
- Sentence length delta: {diff.sentence_length_delta} (Draft avg: {diff.ai_avg_sentence_length}, Final avg: {diff.creator_avg_sentence_length})
- Evidence citation: {diff.evidence_citation}
{f"- Additional Context: {context}" if context else ""}

Formulate ONE actionable, high-confidence style rule for future generations.
Categorize as: tone, length, structure, formatting, banned, or vocabulary.
Ensure the rule is specific and directly cited by the diff."""

    @staticmethod
    def adjust_confidence(
        current_conf: float,
        is_repeated: bool = True,
        is_reversed: bool = False,
    ) -> float:
        """Adjust confidence score based on repeated verification or reversal."""
        if is_reversed:
            # Decay confidence if creator reversed the rule
            return max(0.20, round(current_conf - 0.15, 2))
        if is_repeated:
            # Strengthen confidence with repeated edits
            return min(0.99, round(current_conf + 0.05, 2))
        return current_conf
