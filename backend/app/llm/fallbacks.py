import hashlib
import math
import random
from typing import Any, get_args, get_origin
from pydantic import BaseModel
from pydantic_core import PydanticUndefined


def generate_fallback_embedding(text: str, dim: int = 384) -> list[float]:
    """Generate a deterministic unit-normalized pseudo-embedding vector for text."""
    # Use sha256 to seed pseudo-random stream
    seed_bytes = hashlib.sha256(text.encode("utf-8")).digest()
    seed_int = int.from_bytes(seed_bytes[:8], "big")
    rng = random.Random(seed_int)
    
    vec = [rng.gauss(0.0, 1.0) for _ in range(dim)]
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def generate_fallback_transcript() -> dict[str, Any]:
    """Return realistic fallback transcription when providers are unavailable."""
    return {
        "text": (
            "Welcome to The Founder Files episode 42. Today we are breaking down "
            "how to turn a 60-minute podcast into a week of high-converting content "
            "with Brand Voice Memory."
        ),
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 4.5,
                "text": "Welcome to The Founder Files episode 42.",
                "speaker": "Host"
            },
            {
                "id": 1,
                "start": 4.5,
                "end": 12.8,
                "text": (
                    "Today we are breaking down how to turn a 60-minute podcast into "
                    "a week of high-converting content with Brand Voice Memory."
                ),
                "speaker": "Host"
            }
        ],
        "duration": 12.8,
        "provider": "rule_fallback"
    }


def _dummy_value_for_type(field_name: str, field_type: Any) -> Any:
    """Generate realistic dummy values for a given type annotation and field name."""
    origin = get_origin(field_type)
    args = get_args(field_type)

    # Handle Union/Optional
    if origin is not None and type(None) in args:
        # Get non-None types
        valid_types = [t for t in args if t is not type(None)]
        if valid_types:
            return _dummy_value_for_type(field_name, valid_types[0])
        return None

    # Handle Enums
    if isinstance(field_type, type) and hasattr(field_type, "__members__"):
        enum_values = list(field_type.__members__.values())
        return enum_values[0].value if enum_values else "default"

    # Handle nested BaseModel
    if isinstance(field_type, type) and issubclass(field_type, BaseModel):
        return generate_fallback_for_schema(field_type)

    # Handle List
    if origin in (list, list):
        item_type = args[0] if args else str
        if isinstance(item_type, type) and issubclass(item_type, BaseModel):
            return [generate_fallback_for_schema(item_type)]
        if item_type is str:
            lower = field_name.lower()
            if "tag" in lower:
                return ["#contentcreator", "#growth", "#saas"]
            if "reason" in lower:
                return [
                    "High emotional energy peak with contrarian insight",
                    "Strong stand-alone clarity without prior context",
                    "Concrete quote with actionable takeaway"
                ]
            return ["Item 1", "Item 2"]
        if item_type in (int, float):
            return [1, 2, 3]
        return []

    # Handle Dict
    if origin in (dict, dict):
        return {"key": "value"}

    # Handle primitive types
    if field_type is str or origin is str:
        lower = field_name.lower()
        if "clean_text" in lower:
            return "Pricing is a lie. Perceived value determines your margin."
        if "title" in lower:
            return "The Perceived Value Pricing Strategy"
        if "hook" in lower:
            return "Why 90% of SaaS founders are underpricing their product."
        if "caption" in lower:
            return "Stop leaving money on the table. Here are 3 pricing levers you can pull today."
        if "quote" in lower or "evidence" in lower:
            return "We doubled our price and conversion actually went up."
        if "reason" in lower:
            return "Strong hook with concrete numerical evidence and contrarian thesis."
        if "intent" in lower:
            return "create_brief"
        if "platform" in lower:
            return "linkedin"
        if "summary" in lower:
            return "Detailed analysis of value pricing vs cost-plus pricing."
        return f"Fallback {field_name}"

    if field_type is int or origin is int:
        lower = field_name.lower()
        if "count" in lower or "duration" in lower:
            return 45
        if "score" in lower:
            return 9
        return 1

    if field_type is float or origin is float:
        lower = field_name.lower()
        if "score" in lower or "confidence" in lower:
            return 0.92
        if "start" in lower:
            return 15.0
        if "end" in lower:
            return 45.0
        return 1.0

    if field_type is bool or origin is bool:
        return True

    return None


def generate_fallback_for_schema(schema: type[BaseModel]) -> BaseModel:
    """Recursively generate a valid Pydantic model instance with realistic mock data."""
    data: dict[str, Any] = {}
    for name, field in schema.model_fields.items():
        if field.default is not PydanticUndefined and field.default is not None:
            data[name] = field.default
        elif field.default_factory is not None:
            data[name] = field.default_factory()
        else:
            val = _dummy_value_for_type(name, field.annotation)
            data[name] = val

    return schema.model_validate(data)


def generate_fallback_chat_text(task: str = "general") -> str:
    """Return fallback text response when no schema is requested."""
    task_lower = task.lower()
    if "copy" in task_lower:
        return (
            "Most founders believe pricing is cost plus margin. "
            "The truth: pricing is purely the measure of perceived transformation. "
            "Double your price and watch customer conviction increase."
        )
    if "clip" in task_lower:
        return "Selected segment: 01:15 to 02:00. High emotional peak with strong contrarian hook."
    if "voice" in task_lower:
        return "Instruction parsed: remove filler words and make first sentence punchy."
    return "Rule-based fallback: operation completed with verified deterministic response."
