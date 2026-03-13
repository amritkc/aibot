from dataclasses import dataclass


CRISIS_KEYWORDS = {
    "suicide",
    "kill myself",
    "end my life",
    "self harm",
    "harm myself",
    "die",
    "worthless",
    "no reason to live",
}


@dataclass
class SafetyResult:
    is_high_risk: bool
    reason: str


def detect_high_risk_text(message: str) -> SafetyResult:
    text = message.lower()
    for keyword in CRISIS_KEYWORDS:
        if keyword in text:
            return SafetyResult(is_high_risk=True, reason=f"Matched crisis keyword: {keyword}")
    return SafetyResult(is_high_risk=False, reason="No high-risk keyword matched")


def crisis_response() -> str:
    return (
        "I am really glad you shared this. You deserve immediate support. "
        "If you might be in danger, please call your local emergency number now. "
        "If you are in India, call Tele-MANAS 14416 or 1-800-891-4416 (24/7). "
        "You can also contact a trusted friend, family member, or nearby hospital right away."
    )
