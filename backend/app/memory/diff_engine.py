"""Token and character-level diff engine for creator edits against AI drafts."""

import difflib
import re
import unicodedata
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Comprehensive regex for modern emojis across unicode planes
EMOJI_PATTERN = re.compile(
    r"[\U0001F000-\U0001FAFF]"
    r"|[\U00002600-\U000027BF]"
    r"|[\U0001F300-\U0001F5FF]"
    r"|[\U0001F680-\U0001F6FF]"
    r"|[\U0001F600-\U0001F64F]"
    r"|[\U0001F1E0-\U0001F1FF]"
    r"|[\U00002300-\U000023FF]"
    r"|[\U00002B50\U0000200D\U0000FE0F]"
)

# Regex matching numbers, dollar amounts, percentages, multiples, and units ($50k, $42,000, 18 months, 60%, 3.4x)
NUMBER_PATTERN = re.compile(
    r"[\$€£]?\d+(?:[\.,]\d+)*(?:%|[kKmMbB]|x|X)?"
)

WORD_TOKEN_PATTERN = re.compile(r"\b[\w'-]+\b")


class ChangedSpan(BaseModel):
    change_type: str = Field(description="replace, delete, or insert")
    original: str = ""
    revised: str = ""
    start_pos: int = 0
    end_pos: int = 0


class DiffMetadata(BaseModel):
    """Structured diff representation between AI draft and creator's final version."""
    ai_draft: str
    creator_final: str
    similarity_ratio: float
    added_words: List[str] = Field(default_factory=list)
    removed_words: List[str] = Field(default_factory=list)
    changed_spans: List[Dict[str, Any]] = Field(default_factory=list)
    emoji_removed: List[str] = Field(default_factory=list)
    emoji_added: List[str] = Field(default_factory=list)
    numbers_added: List[str] = Field(default_factory=list)
    numbers_removed: List[str] = Field(default_factory=list)
    number_in_hook: bool = False
    sentence_length_delta: float = 0.0
    ai_avg_sentence_length: float = 0.0
    creator_avg_sentence_length: float = 0.0
    max_sentence_length_final: int = 0
    evidence_citation: str = ""
    evidence_diff: Dict[str, str] = Field(default_factory=dict)
    diff_html: str = ""


class DiffEngine:
    """Computes character, token, and semantic diffs between AI drafts and creator edits."""

    @staticmethod
    def extract_emojis(text: str) -> List[str]:
        """Extract all emojis from text in encounter order."""
        if not text:
            return []
        # Match regex emojis plus unicodedata symbol category
        matches = EMOJI_PATTERN.findall(text)
        # Also catch any stray pictographs
        results = []
        for ch in text:
            cat = unicodedata.category(ch)
            if cat in ("So", "Sk") and ord(ch) > 127:
                if ch not in matches:
                    results.append(ch)
        return matches + results

    @staticmethod
    def extract_numbers(text: str) -> List[str]:
        """Extract numerical figures, currency, metrics, and percentages."""
        if not text:
            return []
        matches = [m.group().strip() for m in NUMBER_PATTERN.finditer(text)]
        return [m for m in matches if any(c.isdigit() for c in m)]

    @staticmethod
    def split_sentences(text: str) -> List[str]:
        """Split text into sentences handling periods, exclamation, questions, and double newlines."""
        if not text:
            return []
        raw_parts = re.split(r"(?<=[.!?])\s+|\n+", text)
        sentences = [p.strip() for p in raw_parts if p.strip()]
        return sentences if sentences else [text.strip()]

    @classmethod
    def compute_sentence_stats(cls, text: str) -> tuple[float, int]:
        """Return average sentence length (in words) and max sentence length."""
        sentences = cls.split_sentences(text)
        if not sentences:
            return 0.0, 0
        word_counts = [len(WORD_TOKEN_PATTERN.findall(s)) for s in sentences]
        avg = sum(word_counts) / len(word_counts) if word_counts else 0.0
        max_words = max(word_counts) if word_counts else 0
        return round(avg, 2), max_words

    @classmethod
    def compute_diff(cls, ai_draft: str, creator_final: str) -> DiffMetadata:
        """Analyze full diff between ai_draft and creator_final."""
        draft_clean = (ai_draft or "").strip()
        final_clean = (creator_final or "").strip()

        # 1. Similarity Ratio
        sm = difflib.SequenceMatcher(None, draft_clean, final_clean)
        similarity = round(sm.ratio(), 3)

        # 2. Tokenized word comparison
        draft_words_lower = WORD_TOKEN_PATTERN.findall(draft_clean.lower())
        final_words_lower = WORD_TOKEN_PATTERN.findall(final_clean.lower())

        draft_set = set(draft_words_lower)
        final_set = set(final_words_lower)

        # Preserve order of appearance
        added_words: List[str] = []
        for w in WORD_TOKEN_PATTERN.findall(final_clean):
            wl = w.lower()
            if wl not in draft_set and wl not in [x.lower() for x in added_words]:
                added_words.append(w)

        removed_words: List[str] = []
        for w in WORD_TOKEN_PATTERN.findall(draft_clean):
            wl = w.lower()
            if wl not in final_set and wl not in [x.lower() for x in removed_words]:
                removed_words.append(w)

        # 3. Emoji Analysis
        draft_emojis = cls.extract_emojis(draft_clean)
        final_emojis = cls.extract_emojis(final_clean)

        emoji_removed: List[str] = []
        for e in draft_emojis:
            if final_emojis.count(e) < draft_emojis.count(e) and e not in emoji_removed:
                emoji_removed.append(e)

        emoji_added: List[str] = []
        for e in final_emojis:
            if draft_emojis.count(e) < final_emojis.count(e) and e not in emoji_added:
                emoji_added.append(e)

        # 4. Number & Metric Analysis
        draft_nums = cls.extract_numbers(draft_clean)
        final_nums = cls.extract_numbers(final_clean)

        numbers_added: List[str] = [n for n in final_nums if n not in draft_nums]
        numbers_removed: List[str] = [n for n in draft_nums if n not in final_nums]

        # Check if numbers were introduced in the hook (first sentence or first 100 characters)
        final_sentences = cls.split_sentences(final_clean)
        hook_text = final_sentences[0] if final_sentences else final_clean[:100]
        number_in_hook = any(n in hook_text for n in numbers_added)

        # 5. Sentence Length & Cadence
        ai_avg_words, _ = cls.compute_sentence_stats(draft_clean)
        final_avg_words, final_max_words = cls.compute_sentence_stats(final_clean)
        length_delta = round(final_avg_words - ai_avg_words, 2)

        # 6. Changed Spans & Word-Level Opcodes
        d_tokens = draft_clean.split()
        f_tokens = final_clean.split()
        token_matcher = difflib.SequenceMatcher(None, d_tokens, f_tokens)

        changed_spans: List[Dict[str, Any]] = []
        for tag, alo, ahi, blo, bhi in token_matcher.get_opcodes():
            if tag == "replace":
                changed_spans.append({
                    "change_type": "replace",
                    "original": " ".join(d_tokens[alo:ahi]),
                    "revised": " ".join(f_tokens[blo:bhi]),
                    "draft_span": [alo, ahi],
                    "final_span": [blo, bhi],
                })
            elif tag == "delete":
                changed_spans.append({
                    "change_type": "delete",
                    "original": " ".join(d_tokens[alo:ahi]),
                    "revised": "",
                    "draft_span": [alo, ahi],
                    "final_span": [blo, bhi],
                })
            elif tag == "insert":
                changed_spans.append({
                    "change_type": "insert",
                    "original": "",
                    "revised": " ".join(f_tokens[blo:bhi]),
                    "draft_span": [alo, ahi],
                    "final_span": [blo, bhi],
                })

        # 7. Evidence Citations (Inline Red/Green Diff and Before/After Snapshot)
        evidence_citation = cls._format_evidence_citation(draft_clean, final_clean, changed_spans)
        evidence_diff = cls._format_before_after(draft_clean, final_clean, changed_spans)
        diff_html = cls._format_diff_html(token_matcher, d_tokens, f_tokens)

        return DiffMetadata(
            ai_draft=draft_clean,
            creator_final=final_clean,
            similarity_ratio=similarity,
            added_words=added_words,
            removed_words=removed_words,
            changed_spans=changed_spans,
            emoji_removed=emoji_removed,
            emoji_added=emoji_added,
            numbers_added=numbers_added,
            numbers_removed=numbers_removed,
            number_in_hook=number_in_hook,
            sentence_length_delta=length_delta,
            ai_avg_sentence_length=ai_avg_words,
            creator_avg_sentence_length=final_avg_words,
            max_sentence_length_final=final_max_words,
            evidence_citation=evidence_citation,
            evidence_diff=evidence_diff,
            diff_html=diff_html,
        )

    @classmethod
    def _format_evidence_citation(
        cls,
        draft: str,
        final: str,
        changed_spans: List[Dict[str, Any]],
    ) -> str:
        """Create a punchy human-readable citation like '[-] old text [+] new text'."""
        if not changed_spans:
            return "[-] (no changes) [+] (identical)"

        # Find the most significant change (e.g. hook or longest span)
        primary_change = changed_spans[0]
        for span in changed_spans:
            if span["change_type"] == "replace" and len(span["original"]) > 10:
                primary_change = span
                break

        orig = primary_change["original"]
        rev = primary_change["revised"]

        # Truncate if excessively long
        orig_disp = orig if len(orig) <= 60 else orig[:57] + "..."
        rev_disp = rev if len(rev) <= 60 else rev[:57] + "..."

        if primary_change["change_type"] == "delete":
            return f"[-] {orig_disp}"
        if primary_change["change_type"] == "insert":
            return f"[+] {rev_disp}"
        return f"[-] {orig_disp} [+] {rev_disp}"

    @classmethod
    def _format_before_after(
        cls,
        draft: str,
        final: str,
        changed_spans: List[Dict[str, Any]],
    ) -> Dict[str, str]:
        """Produce structured before/after snippet pair for UI diff display."""
        if not changed_spans:
            return {"before": draft[:120], "after": final[:120]}

        # If short text, return full text
        if len(draft) < 180 and len(final) < 180:
            return {"before": draft, "after": final}

        # Otherwise highlight the primary edit
        primary = changed_spans[0]
        before_txt = primary["original"] or draft[:120]
        after_txt = primary["revised"] or final[:120]

        return {
            "before": before_txt[:140],
            "after": after_txt[:140],
        }

    @classmethod
    def _format_diff_html(
        cls,
        token_matcher: difflib.SequenceMatcher,
        d_tokens: List[str],
        f_tokens: List[str],
    ) -> str:
        """Produce inline HTML with <del> and <ins> tags."""
        fragments: List[str] = []
        for tag, alo, ahi, blo, bhi in token_matcher.get_opcodes():
            if tag == "equal":
                fragments.append(" ".join(d_tokens[alo:ahi]))
            elif tag == "delete":
                fragments.append(f"<del class='diff-del'>{' '.join(d_tokens[alo:ahi])}</del>")
            elif tag == "insert":
                fragments.append(f"<ins class='diff-ins'>{' '.join(f_tokens[blo:bhi])}</ins>")
            elif tag == "replace":
                fragments.append(f"<del class='diff-del'>{' '.join(d_tokens[alo:ahi])}</del>")
                fragments.append(f"<ins class='diff-ins'>{' '.join(f_tokens[blo:bhi])}</ins>")
        return " ".join(fragments)
