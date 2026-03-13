from __future__ import annotations

import asyncio
from pathlib import Path
import tempfile
from uuid import uuid4

import edge_tts

try:
    import pyttsx3
except Exception:  # pragma: no cover - optional runtime dependency
    pyttsx3 = None

DEFAULT_VOICE = "en-US-AriaNeural"


class TTSService:
    def __init__(self, voice: str = DEFAULT_VOICE) -> None:
        self.voice = voice

    async def synthesize(self, text: str) -> tuple[bytes, str]:
        try:
            communicate = edge_tts.Communicate(text=text, voice=self.voice)
            chunks: list[bytes] = []

            async for item in communicate.stream():
                if item["type"] == "audio":
                    chunks.append(item["data"])

            audio = b"".join(chunks)
            if audio:
                return audio, "audio/mpeg"
        except Exception:
            # Fall back to offline engine below.
            pass

        wav_audio = await asyncio.to_thread(self._synthesize_offline_wav, text)
        if wav_audio:
            return wav_audio, "audio/wav"

        raise RuntimeError("Failed to synthesize audio with both online and offline engines")

    def _synthesize_offline_wav(self, text: str) -> bytes:
        if pyttsx3 is None:
            return b""

        tmp_dir = Path(tempfile.gettempdir()) / "serenetalk_tts"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        out_file = tmp_dir / f"tts_{uuid4().hex}.wav"

        engine = pyttsx3.init()
        try:
            # Try selecting a female-like installed voice where available.
            for voice in engine.getProperty("voices"):
                voice_text = f"{voice.id} {voice.name}".lower()
                if any(k in voice_text for k in ["female", "zira", "susan", "hazel"]):
                    engine.setProperty("voice", voice.id)
                    break

            engine.setProperty("rate", 175)
            engine.save_to_file(text, str(out_file))
            engine.runAndWait()
            engine.stop()

            if out_file.exists():
                return out_file.read_bytes()
            return b""
        finally:
            if out_file.exists():
                out_file.unlink(missing_ok=True)
