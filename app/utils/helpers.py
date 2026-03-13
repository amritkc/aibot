import json
from typing import Any


def safe_json_parse(raw_text: str) -> dict[str, Any]:
    """Parse JSON safely from model output and return a dict fallback."""
    if not raw_text:
        return {}

    text = raw_text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}
