from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.models import ChatRequest, ChatResponse, EmotionAnalysis
from app.services.groq_client import GroqService
from app.services.safety import crisis_response, detect_high_risk_text

app = FastAPI(title="AI Mental Health Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "frontend"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

service = GroqService()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    safety = detect_high_risk_text(payload.message)

    if safety.is_high_risk:
        analysis = EmotionAnalysis(
            primary_emotion="distress",
            intensity=0.95,
            risk_level="high",
            confidence=0.95,
            rationale=safety.reason,
        )
        return ChatResponse(
            reply=crisis_response(),
            analysis=analysis,
            resource_suggestion="Seek immediate support via emergency services or 24/7 helplines.",
            needs_human_support=True,
        )

    analysis_dict = service.analyze_emotion(payload.message)
    reply = service.generate_support_reply(payload.message, analysis_dict)

    analysis = EmotionAnalysis(**analysis_dict)
    needs_human_support = analysis.risk_level in {"high", "moderate"} and analysis.intensity > 0.7

    resource = None
    if needs_human_support:
        resource = (
            "Consider speaking with a licensed mental health professional. "
            "In India, you may call Tele-MANAS at 14416 for 24/7 support."
        )

    return ChatResponse(
        reply=reply,
        analysis=analysis,
        resource_suggestion=resource,
        needs_human_support=needs_human_support,
    )


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")
