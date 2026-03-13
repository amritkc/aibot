import os
from typing import Any

from dotenv import load_dotenv
from groq import Groq

from app.utils.helpers import safe_json_parse
from app.services.prompts import EMOTION_SYSTEM_PROMPT, SUPPORT_SYSTEM_PROMPT

load_dotenv()

# Keep API key in env var for security: GROQ_API_KEY
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


class GroqService:
    def __init__(self, model: str = "llama-3.3-70b-versatile") -> None:
        self.model = model

    def _chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        if not os.getenv("GROQ_API_KEY"):
            raise RuntimeError("GROQ_API_KEY is missing. Add it to your environment.")

        response = client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content or ""

    def analyze_emotion(self, message: str) -> dict[str, Any]:
        raw = self._chat_completion(
            EMOTION_SYSTEM_PROMPT,
            f"Analyze this user text for emotional state: {message}",
        )
        parsed = safe_json_parse(raw)
        return {
            "primary_emotion": parsed.get("primary_emotion", "neutral"),
            "intensity": float(parsed.get("intensity", 0.35)),
            "risk_level": parsed.get("risk_level", "low"),
            "confidence": float(parsed.get("confidence", 0.5)),
            "rationale": parsed.get("rationale", "Insufficient signal; defaulted to low-risk supportive mode."),
        }

    def generate_support_reply(self, message: str, analysis: dict[str, Any]) -> str:
        user_prompt = (
            "User message:\n"
            f"{message}\n\n"
            "Emotion analysis:\n"
            f"{analysis}\n\n"
            "Respond with empathy and practical support."
        )
        return self._chat_completion(SUPPORT_SYSTEM_PROMPT, user_prompt)
