import base64
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, Type, Union

import httpx
from pydantic import BaseModel, ValidationError

from app.llm.fallbacks import (
    generate_fallback_chat_text,
    generate_fallback_embedding,
    generate_fallback_for_schema,
    generate_fallback_transcript,
)

logger = logging.getLogger("reel.llm.router")


class LLMCallLog(BaseModel):
    id: str
    timestamp: str
    provider: str
    task: str
    latency_ms: float
    fallback_used: bool
    success: bool
    model: str
    error: Optional[str] = None


class LLMRouter:
    """Primary Hugging Face Inference router with automatic Google Gemini and rule-based failover."""

    def __init__(
        self,
        hf_token: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        hf_chat_model: Optional[str] = None,
        hf_asr_model: Optional[str] = None,
        hf_embed_model: Optional[str] = None,
        gemini_model: Optional[str] = None,
        hf_router_url: Optional[str] = None,
        timeout: float = 25.0,
    ):
        self.hf_token = hf_token or os.getenv("HF_TOKEN")
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")

        # Models configurable via env
        self.hf_chat_model = (
            hf_chat_model
            or os.getenv("HF_CHAT_MODEL")
            or "Qwen/Qwen2.5-72B-Instruct"
        )
        self.hf_asr_model = (
            hf_asr_model
            or os.getenv("HF_ASR_MODEL")
            or "openai/whisper-large-v3"
        )
        self.hf_embed_model = (
            hf_embed_model
            or os.getenv("HF_EMBED_MODEL")
            or "BAAI/bge-small-en-v1.5"
        )
        self.gemini_model = (
            gemini_model or os.getenv("GEMINI_MODEL") or "gemini-2.0-flash"
        )

        # Primary OpenAI-compatible endpoint
        self.hf_router_url = (
            hf_router_url
            or os.getenv(
                "HF_ROUTER_URL",
                "https://router.huggingface.co/openai/v1/chat/completions",
            )
        )
        # Alternate fallback endpoint for HF
        self.hf_legacy_url = (
            "https://api-inference.huggingface.co/v1/chat/completions"
        )

        self.timeout = float(os.getenv("LLM_TIMEOUT", str(timeout)))
        self.force_fail_hf: bool = False
        self.llm_calls: list[dict[str, Any]] = []

    def log_call(
        self,
        provider: str,
        task: str,
        latency_ms: float,
        fallback_used: bool,
        success: bool,
        model: str,
        error: Optional[str] = None,
    ) -> dict[str, Any]:
        """Record structured metadata for in-memory LLM call observability."""
        call_record = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "provider": provider,
            "task": task,
            "latency_ms": round(latency_ms, 2),
            "fallback_used": fallback_used,
            "success": success,
            "model": model,
            "error": error,
        }
        self.llm_calls.append(call_record)
        return call_record

    def get_recent_calls(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return the most recent call logs."""
        return list(reversed(self.llm_calls[-limit:]))

    def clear_calls(self) -> None:
        """Clear recorded call logs."""
        self.llm_calls.clear()

    def set_force_fail_hf(self, fail: bool) -> None:
        """Toggle force_fail_hf flag."""
        self.force_fail_hf = fail

    @staticmethod
    def _clean_json_string(text: str) -> str:
        """Extract clean JSON substring stripped of markdown fences."""
        s = text.strip()
        if s.startswith("```"):
            lines = s.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            s = "\n".join(lines).strip()

        start_brace = s.find("{")
        start_bracket = s.find("[")
        if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
            end_brace = s.rfind("}")
            if end_brace != -1 and end_brace > start_brace:
                return s[start_brace : end_brace + 1]
        elif start_bracket != -1:
            end_bracket = s.rfind("]")
            if end_bracket != -1 and end_bracket > start_bracket:
                return s[start_bracket : end_bracket + 1]
        return s

    def _validate_schema_output(
        self, raw_text: str, schema: Type[BaseModel]
    ) -> BaseModel:
        """Attempt to parse and validate JSON against a Pydantic schema."""
        cleaned = self._clean_json_string(raw_text)
        try:
            data = json.loads(cleaned)
        except Exception as e:
            raise ValueError(f"JSON decode failed on output: {e}\nRaw output: {raw_text[:200]}") from e

        try:
            return schema.model_validate(data)
        except ValidationError as e:
            raise ValueError(f"Pydantic schema validation failed: {e}") from e

    async def _call_hf_chat(
        self,
        messages: list[dict[str, str]],
        schema: Optional[Type[BaseModel]] = None,
        attempt_repair_on_invalid: bool = True,
    ) -> tuple[str, Optional[BaseModel]]:
        """Call Hugging Face inference endpoint. Returns raw string and optional validated model."""
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json",
        }

        msgs = list(messages)
        if schema:
            schema_instruction = (
                f"\nIMPORTANT: Your response must be a single JSON object strictly matching this schema:\n"
                f"{json.dumps(schema.model_json_schema())}\n"
                "Return raw JSON only without markdown formatting or surrounding conversational text."
            )
            # Append instruction to last user message or add system prompt
            if msgs and msgs[-1].get("role") == "user":
                msgs[-1] = {
                    "role": "user",
                    "content": msgs[-1]["content"] + schema_instruction,
                }
            else:
                msgs.append({"role": "user", "content": schema_instruction})

        payload = {
            "model": self.hf_chat_model,
            "messages": msgs,
            "temperature": 0.7,
            "max_tokens": 2048,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # Try primary router URL first, then fallback to legacy endpoint
            target_url = self.hf_router_url
            try:
                resp = await client.post(target_url, headers=headers, json=payload)
                if resp.status_code in (404, 502) and target_url != self.hf_legacy_url:
                    target_url = self.hf_legacy_url
                    resp = await client.post(target_url, headers=headers, json=payload)
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                raise RuntimeError(f"HF network/timeout error: {exc}") from exc

            if resp.status_code == 429:
                raise RuntimeError("HF Rate limited (HTTP 429)")
            if resp.status_code >= 500:
                raise RuntimeError(f"HF Server Error (HTTP {resp.status_code}): {resp.text[:200]}")
            if resp.status_code != 200:
                raise RuntimeError(f"HF API returned status {resp.status_code}: {resp.text[:200]}")

            resp_json = resp.json()
            choices = resp_json.get("choices", [])
            if not choices:
                raise RuntimeError("HF returned empty choices list")

            raw_content = choices[0].get("message", {}).get("content", "").strip()
            if not raw_content:
                raise RuntimeError("HF returned empty content")

            if not schema:
                return raw_content, None

            # Validate schema
            try:
                validated = self._validate_schema_output(raw_content, schema)
                return raw_content, validated
            except ValueError as val_err:
                if not attempt_repair_on_invalid:
                    raise val_err

                logger.warning(f"HF output invalid against schema: {val_err}. Triggering 1 repair retry.")
                # Attempt 1 repair prompt to HF
                repair_msgs = list(msgs)
                repair_msgs.append({"role": "assistant", "content": raw_content})
                repair_msgs.append(
                    {
                        "role": "user",
                        "content": (
                            f"The output failed schema validation: {val_err}\n"
                            f"Please repair the response and output ONLY valid JSON adhering strictly to this schema:\n"
                            f"{json.dumps(schema.model_json_schema())}"
                        ),
                    }
                )
                repair_payload = {
                    "model": self.hf_chat_model,
                    "messages": repair_msgs,
                    "temperature": 0.3,
                    "max_tokens": 2048,
                }
                repair_resp = await client.post(target_url, headers=headers, json=repair_payload)
                if repair_resp.status_code != 200:
                    raise RuntimeError(f"HF schema repair failed with status {repair_resp.status_code}")

                repair_json = repair_resp.json()
                repair_content = (
                    repair_json.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                    .strip()
                )
                if not repair_content:
                    raise RuntimeError("HF repair returned empty content")

                validated = self._validate_schema_output(repair_content, schema)
                return repair_content, validated

    async def _call_gemini_chat(
        self,
        messages: list[dict[str, str]],
        schema: Optional[Type[BaseModel]] = None,
    ) -> tuple[str, Optional[BaseModel]]:
        """Call Google Gemini generateContent endpoint as fallback."""
        if not self.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"

        contents: list[dict[str, Any]] = []
        system_instruction_text = None

        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_instruction_text = content
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": content}]})
            else:
                contents.append({"role": "user", "parts": [{"text": content}]})

        if schema:
            schema_prompt = (
                f"\nOutput ONLY valid JSON strictly matching this schema:\n"
                f"{json.dumps(schema.model_json_schema())}"
            )
            if contents:
                contents[-1]["parts"][0]["text"] += schema_prompt
            else:
                contents.append({"role": "user", "parts": [{"text": schema_prompt}]})

        generation_config: dict[str, Any] = {
            "temperature": 0.7,
            "maxOutputTokens": 2048,
        }
        if schema:
            generation_config["responseMimeType"] = "application/json"

        body: dict[str, Any] = {
            "contents": contents,
            "generationConfig": generation_config,
        }
        if system_instruction_text:
            body["systemInstruction"] = {"parts": [{"text": system_instruction_text}]}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(url, json=body)
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                raise RuntimeError(f"Gemini network/timeout error: {exc}") from exc

            if resp.status_code == 429:
                raise RuntimeError("Gemini Rate limited (HTTP 429)")
            if resp.status_code >= 500:
                raise RuntimeError(f"Gemini Server Error (HTTP {resp.status_code}): {resp.text[:200]}")
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")

            resp_json = resp.json()
            candidates = resp_json.get("candidates", [])
            if not candidates:
                raise RuntimeError("Gemini returned empty candidates")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise RuntimeError("Gemini returned empty parts")

            raw_content = parts[0].get("text", "").strip()
            if not raw_content:
                raise RuntimeError("Gemini returned empty text")

            if not schema:
                return raw_content, None

            validated = self._validate_schema_output(raw_content, schema)
            return raw_content, validated

    async def chat(
        self,
        messages: list[dict[str, str]],
        schema: Optional[Type[BaseModel]] = None,
        task: str = "general",
        force_fail_hf: bool = False,
    ) -> Union[dict[str, Any], str]:
        """Execute chat completion with automatic failover chain: HF -> Gemini -> Rule-based fallback.

        Returns:
            dict: if schema is provided (matching Pydantic schema model_dump)
            str: if schema is None
        """
        start_time = time.perf_counter()
        should_fail_hf = force_fail_hf or self.force_fail_hf

        # 1. Attempt Primary: Hugging Face
        if not should_fail_hf and self.hf_token:
            try:
                raw_text, validated = await self._call_hf_chat(
                    messages=messages,
                    schema=schema,
                    attempt_repair_on_invalid=True,
                )
                latency_ms = (time.perf_counter() - start_time) * 1000
                self.log_call(
                    provider="huggingface",
                    task=task,
                    latency_ms=latency_ms,
                    fallback_used=False,
                    success=True,
                    model=self.hf_chat_model,
                )
                if schema and validated:
                    return validated.model_dump()
                return raw_text
            except Exception as hf_err:
                logger.warning(f"HF primary failed: {hf_err}. Attempting Gemini fallback.")
        else:
            reason = "force_fail_hf active" if should_fail_hf else "HF_TOKEN not configured"
            logger.info(f"Skipping HF primary: {reason}. Falling back to Gemini.")

        # 2. Attempt Fallback: Google Gemini
        if self.gemini_api_key:
            try:
                raw_text, validated = await self._call_gemini_chat(
                    messages=messages,
                    schema=schema,
                )
                latency_ms = (time.perf_counter() - start_time) * 1000
                self.log_call(
                    provider="gemini",
                    task=task,
                    latency_ms=latency_ms,
                    fallback_used=True,
                    success=True,
                    model=self.gemini_model,
                )
                if schema and validated:
                    return validated.model_dump()
                return raw_text
            except Exception as gemini_err:
                logger.warning(f"Gemini fallback failed: {gemini_err}. Attempting rule-based fallback.")
        else:
            logger.info("GEMINI_API_KEY not configured. Falling back to rule-based fallback.")

        # 3. Final Fallback: Realistic Rule-based Fallback
        latency_ms = (time.perf_counter() - start_time) * 1000
        self.log_call(
            provider="rule_fallback",
            task=task,
            latency_ms=latency_ms,
            fallback_used=True,
            success=True,
            model="rule-engine-v1",
        )

        if schema:
            fallback_model = generate_fallback_for_schema(schema)
            return fallback_model.model_dump()

        return generate_fallback_chat_text(task)

    async def transcribe(
        self, audio_path_or_bytes: Union[str, bytes, Path]
    ) -> dict[str, Any]:
        """Transcribe audio with failover: HF Whisper -> Gemini Multimodal -> Rule fallback."""
        start_time = time.perf_counter()

        # Resolve audio bytes
        if isinstance(audio_path_or_bytes, (str, Path)):
            p = Path(audio_path_or_bytes)
            if p.exists() and p.is_file():
                audio_bytes = p.read_bytes()
            else:
                audio_bytes = b""
        elif isinstance(audio_path_or_bytes, bytes):
            audio_bytes = audio_path_or_bytes
        else:
            audio_bytes = b""

        # 1. Primary: HF Whisper ASR
        if not self.force_fail_hf and self.hf_token and audio_bytes:
            url = f"https://api-inference.huggingface.co/models/{self.hf_asr_model}"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, headers=headers, content=audio_bytes)
                    if resp.status_code == 200:
                        data = resp.json()
                        latency_ms = (time.perf_counter() - start_time) * 1000
                        self.log_call(
                            provider="huggingface",
                            task="asr",
                            latency_ms=latency_ms,
                            fallback_used=False,
                            success=True,
                            model=self.hf_asr_model,
                        )
                        text = data.get("text", "")
                        chunks = data.get("chunks", [])
                        segments = []
                        for i, ch in enumerate(chunks):
                            ts = ch.get("timestamp", [0.0, 0.0])
                            segments.append({
                                "id": i,
                                "start": ts[0] or 0.0,
                                "end": ts[1] or 0.0,
                                "text": ch.get("text", ""),
                            })
                        return {
                            "text": text,
                            "segments": segments if segments else [{"id": 0, "start": 0.0, "end": 0.0, "text": text}],
                            "provider": "huggingface",
                        }
            except Exception as e:
                logger.warning(f"HF Whisper transcription failed: {e}")

        # 2. Fallback: Gemini Audio Multimodal
        if self.gemini_api_key and audio_bytes:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
            b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inlineData": {
                                    "mimeType": "audio/mp3",
                                    "data": b64_audio,
                                }
                            },
                            {
                                "text": (
                                    "Transcribe this audio verbatim. Return a JSON object with keys "
                                    "'text' and 'segments' (list of {id, start, end, text})."
                                )
                            },
                        ]
                    }
                ],
                "generationConfig": {"responseMimeType": "application/json"},
            }
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text_content = (
                            data.get("candidates", [{}])[0]
                            .get("content", {})
                            .get("parts", [{}])[0]
                            .get("text", "")
                        )
                        parsed = json.loads(self._clean_json_string(text_content))
                        latency_ms = (time.perf_counter() - start_time) * 1000
                        self.log_call(
                            provider="gemini",
                            task="asr",
                            latency_ms=latency_ms,
                            fallback_used=True,
                            success=True,
                            model=self.gemini_model,
                        )
                        parsed["provider"] = "gemini"
                        return parsed
            except Exception as e:
                logger.warning(f"Gemini audio transcription fallback failed: {e}")

        # 3. Rule fallback
        latency_ms = (time.perf_counter() - start_time) * 1000
        self.log_call(
            provider="rule_fallback",
            task="asr",
            latency_ms=latency_ms,
            fallback_used=True,
            success=True,
            model="rule-asr-v1",
        )
        return generate_fallback_transcript()

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate text embeddings with failover: HF Feature Extraction -> Rule fallback."""
        start_time = time.perf_counter()

        if not texts:
            return []

        # 1. Primary: Hugging Face Feature Extraction
        if not self.force_fail_hf and self.hf_token:
            url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{self.hf_embed_model}"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            payload = {"inputs": texts, "options": {"wait_for_model": True}}
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        raw_data = resp.json()
                        # Verify dimensionality
                        if isinstance(raw_data, list) and raw_data:
                            # If single embedding wrapped
                            if isinstance(raw_data[0], (int, float)):
                                embeddings = [raw_data]
                            elif isinstance(raw_data[0], list):
                                embeddings = raw_data
                            else:
                                embeddings = []

                            if embeddings:
                                latency_ms = (time.perf_counter() - start_time) * 1000
                                self.log_call(
                                    provider="huggingface",
                                    task="embed",
                                    latency_ms=latency_ms,
                                    fallback_used=False,
                                    success=True,
                                    model=self.hf_embed_model,
                                )
                                return embeddings
            except Exception as e:
                logger.warning(f"HF embed extraction failed: {e}")

        # 2. Rule-based deterministic embedding fallback (384-d normalized vector)
        latency_ms = (time.perf_counter() - start_time) * 1000
        self.log_call(
            provider="rule_fallback",
            task="embed",
            latency_ms=latency_ms,
            fallback_used=True,
            success=True,
            model="rule-embed-384",
        )
        return [generate_fallback_embedding(t, dim=384) for t in texts]


# Default singleton instance for application use
llm_router = LLMRouter()
