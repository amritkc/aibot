from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class EmotionAnalysis(BaseModel):
    primary_emotion: str
    intensity: float
    risk_level: str
    confidence: float
    rationale: str


class ChatResponse(BaseModel):
    reply: str
    analysis: EmotionAnalysis
    resource_suggestion: str | None = None
    needs_human_support: bool = False
