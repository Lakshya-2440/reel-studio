"""Voice profile manager: versioning, rule persistence, exemplar embeddings, and context synthesis."""

import json
import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.llm.router import llm_router
from app.memory.diff_engine import DiffEngine, DiffMetadata
from app.memory.edit_analyst import EditAnalyst, EditRuleClassification

logger = logging.getLogger(__name__)


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Compute cosine similarity between two float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 <= 0.0 or norm2 <= 0.0:
        return 0.0
    return dot / (norm1 * norm2)


class VoiceRuleModel(BaseModel):
    id: str
    rule: str
    rule_text: Optional[str] = None
    category: str = "tone"
    confidence: float = 0.90
    edits_count: int = 1
    edit_count: int = 1
    status: str = "active"
    is_active: bool = True
    is_pinned: bool = False
    evidence_citation: Optional[str] = None
    evidence_diff: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None


class VoiceExemplarModel(BaseModel):
    id: str
    platform: str
    ai_draft: str
    creator_final: str
    text: str
    diff_summary: str
    note: Optional[str] = None
    similarity_score: Optional[float] = None


class VoiceProfileResponse(BaseModel):
    id: str
    project_id: str
    version: int
    version_label: str
    summary: str
    tone_sliders: Dict[str, Any]
    tone_attributes: Dict[str, Any]
    signature_phrases: List[str]
    banned_words: List[str]
    active_rules_count: int
    rules: List[VoiceRuleModel]
    exemplars: List[VoiceExemplarModel]


class ProfileManager:
    """Manages brand voice profiles, version transitions, rule lifecycle, and exemplar embeddings."""

    DEFAULT_PROJECT_ID = "proj_founder_files"
    DEFAULT_PROFILE_ID = "vp_founder_files"

    def __init__(self, router=None):
        self.router = router or llm_router
        self.analyst = EditAnalyst(router=self.router)
        self._memory_cache: Dict[str, Any] = {}

    def _get_connection(self):
        """Get database connection via db.connection module or SQLite fallback."""
        try:
            from db.connection import engine
            return engine.raw_connection()
        except Exception as err:
            logger.warning(f"Could not connect via db.connection ({err}). Attempting direct SQLite connection.")
            import sqlite3
            from pathlib import Path
            db_path = Path(__file__).resolve().parents[3] / "db" / "reel.db"
            if db_path.exists():
                conn = sqlite3.connect(str(db_path))
                conn.row_factory = sqlite3.Row
                return conn
            return None

    def get_active_profile(self, project_id: Optional[str] = None) -> VoiceProfileResponse:
        """Fetch active voice profile, rules, and exemplars for a project."""
        p_id = project_id or self.DEFAULT_PROJECT_ID
        conn = self._get_connection()

        profile_row = None
        rules_rows = []
        exemplars_rows = []

        if conn:
            try:
                cur = conn.cursor()
                # 1. Fetch profile
                try:
                    cur.execute(
                        "SELECT id, project_id, version, summary, tone_attributes FROM voice_profiles WHERE project_id = ? ORDER BY version DESC LIMIT 1;",
                        (p_id,)
                    )
                except Exception:
                    # Postgres parameterization fallback (%s)
                    cur.execute(
                        "SELECT id, project_id, version, summary, tone_attributes FROM voice_profiles WHERE project_id = %s ORDER BY version DESC LIMIT 1;",
                        (p_id,)
                    )
                profile_row = cur.fetchone()

                if profile_row:
                    prof_id = profile_row[0]
                    # 2. Fetch rules
                    try:
                        cur.execute(
                            "SELECT id, rule_text, confidence, evidence_diff, category, is_active, created_at FROM voice_rules WHERE profile_id = ? ORDER BY confidence DESC;",
                            (prof_id,)
                        )
                    except Exception:
                        cur.execute(
                            "SELECT id, rule_text, confidence, evidence_diff, category, is_active, created_at FROM voice_rules WHERE profile_id = %s ORDER BY confidence DESC;",
                            (prof_id,)
                        )
                    rules_rows = cur.fetchall()

                    # 3. Fetch exemplars
                    try:
                        cur.execute(
                            "SELECT id, platform, ai_draft, creator_final, diff_summary, embedding, created_at FROM voice_examples WHERE profile_id = ? ORDER BY created_at DESC LIMIT 10;",
                            (prof_id,)
                        )
                    except Exception:
                        cur.execute(
                            "SELECT id, platform, ai_draft, creator_final, diff_summary, embedding, created_at FROM voice_examples WHERE profile_id = %s ORDER BY created_at DESC LIMIT 10;",
                            (prof_id,)
                        )
                    exemplars_rows = cur.fetchall()
            except Exception as e:
                logger.error(f"Error reading voice profile from database: {e}")
            finally:
                conn.close()

        # Parse Tone Attributes
        tone_attrs: Dict[str, Any] = {}
        if profile_row and profile_row[4]:
            raw_tone = profile_row[4]
            if isinstance(raw_tone, str):
                try:
                    tone_attrs = json.loads(raw_tone)
                except Exception:
                    tone_attrs = {}
            elif isinstance(raw_tone, dict):
                tone_attrs = raw_tone

        # Fallback defaults if table is empty or connection failed
        version = int(profile_row[2]) if profile_row else 2
        summary = profile_row[3] if profile_row else (
            "Sharp, metric-driven founder voice. Zero corporate throat-clearing, "
            "anti-buzzword, loss-framed unit economics."
        )
        profile_id = profile_row[0] if profile_row else self.DEFAULT_PROFILE_ID

        # Map rules
        rules: List[VoiceRuleModel] = []
        for r in rules_rows:
            r_id, r_text, conf, ev_diff, cat, is_act, cr_at = r[0], r[1], r[2], r[3], r[4], r[5], r[6]
            diff_obj = {}
            citation = ""
            if isinstance(ev_diff, str):
                try:
                    diff_obj = json.loads(ev_diff)
                except Exception:
                    diff_obj = {"raw": ev_diff}
            elif isinstance(ev_diff, dict):
                diff_obj = ev_diff

            if isinstance(diff_obj, dict):
                if "before" in diff_obj and "after" in diff_obj:
                    citation = f"[-] {diff_obj['before']} [+] {diff_obj['after']}"
                elif "evidence_citation" in diff_obj:
                    citation = diff_obj["evidence_citation"]

            active_bool = bool(is_act) if is_act is not None else True
            rules.append(VoiceRuleModel(
                id=str(r_id),
                rule=str(r_text),
                rule_text=str(r_text),
                category=str(cat or "tone"),
                confidence=float(conf or 0.90),
                edits_count=diff_obj.get("edits_count", 3),
                edit_count=diff_obj.get("edits_count", 3),
                status="active" if active_bool else "inactive",
                is_active=active_bool,
                is_pinned=bool(diff_obj.get("is_pinned", False)),
                evidence_citation=citation or f"Derived from {cat} edits",
                evidence_diff=diff_obj,
                created_at=str(cr_at or ""),
            ))

        # Default rules fallback if none exist
        if not rules:
            rules = self._get_default_rules()

        # Map exemplars
        exemplars: List[VoiceExemplarModel] = []
        for ex in exemplars_rows:
            ex_id, plt, draft, final, diff_sum, emb, cr_at = ex[0], ex[1], ex[2], ex[3], ex[4], ex[5], ex[6]
            exemplars.append(VoiceExemplarModel(
                id=str(ex_id),
                platform=str(plt or "linkedin"),
                ai_draft=str(draft or ""),
                creator_final=str(final or ""),
                text=str(final or ""),
                diff_summary=str(diff_sum or ""),
                note=str(diff_sum or ""),
            ))

        if not exemplars:
            exemplars = self._get_default_exemplars()

        # Tone sliders formatted for both 0..1 scale and 0..100 scale UI
        tone_sliders = {
            "formal_vs_casual": 0.25,
            "bold_vs_measured": 0.85,
            "short_vs_long": 0.25,
            # 0-100 frontend variants
            "formal_casual": 25,
            "bold_measured": 85,
            "concise_detailed": 25,
        }

        signature_phrases = tone_attrs.get("signature_phrases", [
            "Here is the math:",
            "At $50k MRR, our compute bill was $42,000",
            "Stop measuring vanity DAU",
            "Fired 12 enterprise customers",
        ])

        banned_words = tone_attrs.get("banned_phrases", [
            "synergy",
            "game-changer",
            "delve",
            "supercharge",
            "delighted to announce",
            "leverage",
        ])

        return VoiceProfileResponse(
            id=profile_id,
            project_id=p_id,
            version=version,
            version_label=f"v{version}",
            summary=summary,
            tone_sliders=tone_sliders,
            tone_attributes=tone_attrs,
            signature_phrases=signature_phrases,
            banned_words=banned_words,
            active_rules_count=sum(1 for r in rules if r.is_active),
            rules=rules,
            exemplars=exemplars,
        )

    def get_rules(self, project_id: Optional[str] = None, active_only: bool = False) -> List[Dict[str, Any]]:
        """Get formatted list of voice rules for API endpoints."""
        profile = self.get_active_profile(project_id)
        res = []
        for r in profile.rules:
            if active_only and not r.is_active:
                continue
            res.append({
                "id": r.id,
                "rule": r.rule,
                "rule_text": r.rule_text or r.rule,
                "category": r.category,
                "confidence": r.confidence,
                "edits_count": r.edits_count,
                "edit_count": r.edit_count,
                "status": r.status,
                "is_active": r.is_active,
                "is_pinned": r.is_pinned,
                "evidence_citation": r.evidence_citation,
                "evidence_diff": r.evidence_diff,
            })
        return res

    def update_rule(self, rule_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update rule status, confidence, or pinned state."""
        is_active = updates.get("is_active")
        if is_active is None and "status" in updates:
            is_active = updates["status"] == "active"

        confidence = updates.get("confidence")
        is_pinned = updates.get("is_pinned")

        conn = self._get_connection()
        updated = False
        if conn:
            try:
                cur = conn.cursor()
                if is_active is not None:
                    try:
                        cur.execute("UPDATE voice_rules SET is_active = ? WHERE id = ?;", (1 if is_active else 0, rule_id))
                    except Exception:
                        cur.execute("UPDATE voice_rules SET is_active = %s WHERE id = %s;", (is_active, rule_id))
                if confidence is not None:
                    try:
                        cur.execute("UPDATE voice_rules SET confidence = ? WHERE id = ?;", (confidence, rule_id))
                    except Exception:
                        cur.execute("UPDATE voice_rules SET confidence = %s WHERE id = %s;", (confidence, rule_id))
                conn.commit()
                updated = True
            except Exception as e:
                logger.error(f"Failed updating rule {rule_id}: {e}")
            finally:
                conn.close()

        return {
            "rule_id": rule_id,
            "status": "active" if (is_active is not False) else "inactive",
            "is_active": is_active if is_active is not None else True,
            "confidence": confidence if confidence is not None else 0.92,
            "is_pinned": bool(is_pinned),
            "updated": updated,
        }

    def delete_rule(self, rule_id: str) -> bool:
        """Delete or deactivate a rule."""
        conn = self._get_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            try:
                cur.execute("DELETE FROM voice_rules WHERE id = ?;", (rule_id,))
            except Exception:
                cur.execute("DELETE FROM voice_rules WHERE id = %s;", (rule_id,))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting rule {rule_id}: {e}")
            return False
        finally:
            conn.close()

    async def record_edit_and_learn(
        self,
        ai_draft: str,
        creator_final: str,
        platform: str = "linkedin",
        project_id: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Complete learning loop:
        1. Word/token diff via DiffEngine
        2. Rule classification via EditAnalyst (LLM or fallback)
        3. Save exemplar with embedding in voice_examples
        4. Update / create rule with diff evidence in voice_rules
        5. Bump voice profile version (v1 -> v2 -> vN)
        """
        p_id = project_id or self.DEFAULT_PROJECT_ID
        prof = self.get_active_profile(p_id)
        profile_id = prof.id

        # 1. Compute diff metadata
        diff = DiffEngine.compute_diff(ai_draft, creator_final)

        # 2. Extract rule via EditAnalyst
        rule_class = await self.analyst.analyze_diff(diff, platform=platform, context=context)

        # 3. Generate embedding for creator_final text
        embeddings = await self.router.embed([creator_final])
        embedding_vec = embeddings[0] if embeddings else [0.0] * 384

        # 4. Check for existing similar rule to update confidence, or create new rule
        new_rule_id = f"vrule_{uuid.uuid4().hex[:8]}"
        matched_rule = None
        for existing_r in prof.rules:
            # Match by pattern, category, or similar keywords
            if existing_r.category == rule_class.category or rule_class.pattern in existing_r.rule.lower():
                matched_rule = existing_r
                break

        updated_confidence = rule_class.confidence
        edit_count = 1
        target_rule_id = new_rule_id

        if matched_rule:
            target_rule_id = matched_rule.id
            updated_confidence = EditAnalyst.adjust_confidence(matched_rule.confidence, is_repeated=True)
            edit_count = matched_rule.edits_count + 1

        # 5. Persist to DB
        conn = self._get_connection()
        new_version = prof.version + 1
        if conn:
            try:
                cur = conn.cursor()
                # Persist exemplar
                ex_id = f"vex_{uuid.uuid4().hex[:8]}"
                diff_summary = f"Diff ratio: {diff.similarity_ratio}. Citation: {rule_class.evidence_citation}"
                emb_json = json.dumps(embedding_vec)
                try:
                    cur.execute("""
                        INSERT INTO voice_examples (id, profile_id, platform, ai_draft, creator_final, diff_summary, embedding, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));
                    """, (ex_id, profile_id, platform, ai_draft, creator_final, diff_summary, emb_json))
                except Exception:
                    # Postgres fallback with vector
                    cur.execute("""
                        INSERT INTO voice_examples (id, profile_id, platform, ai_draft, creator_final, diff_summary, embedding, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s::vector, NOW());
                    """, (ex_id, profile_id, platform, ai_draft, creator_final, diff_summary, emb_json))

                # Persist or update rule
                ev_payload = json.dumps({
                    "before": diff.evidence_diff.get("before", ai_draft[:100]),
                    "after": diff.evidence_diff.get("after", creator_final[:100]),
                    "evidence_citation": rule_class.evidence_citation,
                    "edits_count": edit_count,
                    "pattern": rule_class.pattern,
                })

                if matched_rule:
                    try:
                        cur.execute("""
                            UPDATE voice_rules
                            SET confidence = ?, evidence_diff = ?, rule_text = ?
                            WHERE id = ?;
                        """, (updated_confidence, ev_payload, rule_class.rule_text, matched_rule.id))
                    except Exception:
                        cur.execute("""
                            UPDATE voice_rules
                            SET confidence = %s, evidence_diff = %s, rule_text = %s
                            WHERE id = %s;
                        """, (updated_confidence, ev_payload, rule_class.rule_text, matched_rule.id))
                else:
                    try:
                        cur.execute("""
                            INSERT INTO voice_rules (id, profile_id, rule_text, confidence, evidence_diff, category, is_active, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'));
                        """, (new_rule_id, profile_id, rule_class.rule_text, updated_confidence, ev_payload, rule_class.category))
                    except Exception:
                        cur.execute("""
                            INSERT INTO voice_rules (id, profile_id, rule_text, confidence, evidence_diff, category, is_active, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, TRUE, NOW());
                        """, (new_rule_id, profile_id, rule_class.rule_text, updated_confidence, ev_payload, rule_class.category))

                # Bump profile version
                try:
                    cur.execute("""
                        UPDATE voice_profiles SET version = ? WHERE id = ?;
                    """, (new_version, profile_id))
                except Exception:
                    cur.execute("""
                        UPDATE voice_profiles SET version = %s WHERE id = %s;
                    """, (new_version, profile_id))

                conn.commit()
            except Exception as e:
                logger.error(f"Failed to record edit into database: {e}")
            finally:
                conn.close()

        return {
            "success": True,
            "voice_rules_updated": True,
            "rule_extracted": {
                "id": target_rule_id,
                "rule": rule_class.rule_text,
                "category": rule_class.category,
                "confidence": updated_confidence,
                "edit_count": edit_count,
                "evidence_diff": diff.evidence_diff,
                "evidence_citation": rule_class.evidence_citation,
            },
            "voice_profile_version": f"v{new_version}",
            "diff_summary": {
                "similarity_ratio": diff.similarity_ratio,
                "emoji_removed": diff.emoji_removed,
                "numbers_added": diff.numbers_added,
                "sentence_length_delta": diff.sentence_length_delta,
            },
        }

    async def retrieve_exemplars(
        self,
        platform: str = "linkedin",
        query: Optional[str] = None,
        limit: int = 3,
        project_id: Optional[str] = None,
    ) -> List[VoiceExemplarModel]:
        """Semantic retrieval of best creator-final exemplars via embeddings."""
        prof = self.get_active_profile(project_id)
        candidates = [ex for ex in prof.exemplars if ex.platform.lower() == platform.lower()]
        if not candidates:
            candidates = prof.exemplars

        if not query or not candidates:
            return candidates[:limit]

        # Generate query embedding
        query_embeddings = await self.router.embed([query])
        if not query_embeddings:
            return candidates[:limit]

        q_vec = query_embeddings[0]

        # Score candidates by cosine similarity
        scored: List[tuple[float, VoiceExemplarModel]] = []
        conn = self._get_connection()
        emb_map = {}
        if conn:
            try:
                cur = conn.cursor()
                try:
                    cur.execute("SELECT id, embedding FROM voice_examples WHERE profile_id = ?;", (prof.id,))
                except Exception:
                    cur.execute("SELECT id, embedding FROM voice_examples WHERE profile_id = %s;", (prof.id,))
                for row in cur.fetchall():
                    rid, raw_emb = row[0], row[1]
                    if isinstance(raw_emb, str):
                        try:
                            emb_map[rid] = json.loads(raw_emb)
                        except Exception:
                            pass
                    elif isinstance(raw_emb, list):
                        emb_map[rid] = raw_emb
            except Exception as e:
                logger.warning(f"Exemplar vector read error: {e}")
            finally:
                conn.close()

        for cand in candidates:
            c_emb = emb_map.get(cand.id)
            if c_emb:
                score = cosine_similarity(q_vec, c_emb)
            else:
                score = 0.50
            cand.similarity_score = round(score, 3)
            scored.append((score, cand))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:limit]]

    def build_voice_prompt_context(
        self,
        platform: str = "linkedin",
        project_id: Optional[str] = None,
    ) -> str:
        """Synthesizes brand voice memory rules and constraints into copy generator prompt."""
        prof = self.get_active_profile(project_id)
        active_rules = [r for r in prof.rules if r.is_active]

        rules_block = "\n".join(f"- {r.rule} (confidence: {r.confidence})" for r in active_rules)
        banned_block = ", ".join(f"'{b}'" for b in prof.banned_words)
        signature_block = "\n".join(f"- \"{p}\"" for p in prof.signature_phrases)

        # Few shot exemplars for this platform
        ex_for_platform = [ex for ex in prof.exemplars if ex.platform.lower() == platform.lower()][:2]
        exemplar_block = ""
        for idx, ex in enumerate(ex_for_platform, 1):
            exemplar_block += f"\nExample #{idx} (Gold Standard Human Final):\n{ex.creator_final}\n"

        return f"""=== BRAND VOICE MEMORY ACTIVE (Profile {prof.version_label}) ===
Summary: {prof.summary}

ACTIVE RULES LEARNED FROM CREATOR EDITS:
{rules_block}

BANNED BUZZWORDS (DO NOT USE):
{banned_block}

SIGNATURE PHRASES:
{signature_block}

HUMAN FINAL EXEMPLARS:
{exemplar_block}
============================================================="""

    @staticmethod
    def _get_default_rules() -> List[VoiceRuleModel]:
        """Fallback pre-seeded rules."""
        return [
            VoiceRuleModel(
                id="vrule_1",
                rule="Drop opening throat-clearing. Always lead directly with an exact dollar figure or unit metric.",
                category="structure",
                confidence=0.98,
                edits_count=6,
                status="active",
                is_active=True,
                is_pinned=True,
                evidence_citation="[-] In today's fast-paced world... [+] At $50k MRR, our compute bill was $42,000.",
                evidence_diff={
                    "before": "In today's fast-paced world, AI compute costs are rising.",
                    "after": "At $50k MRR, our compute bill was $42,000.",
                },
            ),
            VoiceRuleModel(
                id="vrule_2",
                rule="Zero emojis in LinkedIn body paragraphs; enforce clean typography.",
                category="formatting",
                confidence=0.95,
                edits_count=5,
                status="active",
                is_active=True,
                is_pinned=True,
                evidence_citation="[-] 🚀 Big news founders! 🔥 [+] Outcome-based pricing isn't theoretical.",
                evidence_diff={
                    "before": "🚀 Big news founders! 🔥 Check out our new insights 💡",
                    "after": "Outcome-based pricing isn't theoretical.",
                },
            ),
            VoiceRuleModel(
                id="vrule_3",
                rule="Ban corporate buzzwords like 'leverage', 'synergy', and 'delve'.",
                category="banned",
                confidence=0.93,
                edits_count=4,
                status="active",
                is_active=True,
                is_pinned=False,
                evidence_citation="[-] leverage your existing stack [+] use your existing stack",
                evidence_diff={
                    "before": "Leverage your core competencies to drive synergies.",
                    "after": "Build products customers pay for.",
                },
            ),
            VoiceRuleModel(
                id="vrule_4",
                rule="Enforce strict sentence cadence: target maximum 15 words per sentence.",
                category="length",
                confidence=0.91,
                edits_count=4,
                status="active",
                is_active=True,
                is_pinned=False,
                evidence_citation="[-] When you are looking at initial GTM... [+] Test raw thoughts first.",
                evidence_diff={
                    "before": "When you are looking at building your initial go-to-market strategy you need clarity.",
                    "after": "Test raw thoughts first. See who signals back.",
                },
            ),
        ]

    @staticmethod
    def _get_default_exemplars() -> List[VoiceExemplarModel]:
        """Fallback pre-seeded exemplars."""
        return [
            VoiceExemplarModel(
                id="vex_1",
                platform="linkedin",
                ai_draft="🚀 In today's competitive tech ecosystem, startup founders often struggle with profitability! 💡",
                creator_final="At $50k MRR, our compute bill was $42,000. We were effectively subsidizing Fortune 500 pilots on our personal credit cards.",
                text="At $50k MRR, our compute bill was $42,000. We were effectively subsidizing Fortune 500 pilots on our personal credit cards.",
                diff_summary="Removed 3 emojis, deleted rhetorical question, substituted generic advice with $42k credit card war story.",
            ),
            VoiceExemplarModel(
                id="vex_2",
                platform="x",
                ai_draft="Have you ever wondered why your SaaS churn is so high? You might be measuring the wrong metrics!",
                creator_final="If your gross margin is under 70%, you're an agency with an API. Stop celebrating ARR.",
                text="If your gross margin is under 70%, you're an agency with an API. Stop celebrating ARR.",
                diff_summary="Converted question hook into definitive declarative assertion; split into single-sentence punches.",
            ),
        ]


# Singleton instance
profile_manager = ProfileManager()
