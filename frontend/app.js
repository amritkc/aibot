// Cached DOM Elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatLog = document.getElementById("chatLog");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const audioToggleBtn = document.getElementById("audioToggleBtn");
const stopAudioBtn = document.getElementById("stopAudioBtn");
const pauseBtn = document.getElementById("pauseBtn");
const avatar = document.getElementById("avatar");
const avatarStatus = document.getElementById("avatarStatus");
const quickBtns = document.querySelectorAll(".quick-btn");

// Emotion Display Elements
const emotionEl = document.getElementById("emotion");
const riskEl = document.getElementById("risk");
const confidenceEl = document.getElementById("confidence");
const intensityEl = document.getElementById("intensity");
const rationaleEl = document.getElementById("rationale");
const resourceEl = document.getElementById("resource");

// State
let currentAudio = null;
let currentAudioUrl = null;
let currentUtterance = null;
let isSpeaking = false;
let audioEnabled = localStorage.getItem("serenetalk_audio_enabled") === "true";

function stopSpeech(status = "Speech stopped.") {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.onplay = null;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
  isSpeaking = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "⏸";
  if (stopAudioBtn) stopAudioBtn.disabled = true;
  setAvatarState("calm", status, false, false);
}

function updateAudioToggleUi() {
  if (!audioToggleBtn) return;
  audioToggleBtn.textContent = audioEnabled ? "Audio On" : "Audio Off";
  audioToggleBtn.setAttribute("aria-pressed", String(audioEnabled));
}

// Prevent queued audio from continuing after refresh/navigation.
window.addEventListener("beforeunload", () => {
  stopSpeech("Audio stopped.");
});
window.addEventListener("pagehide", () => {
  stopSpeech("Audio stopped.");
});

// ===== UTILITY FUNCTIONS =====
function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addTypingIndicator() {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "typingMsg";
  div.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function removeTypingIndicator() {
  const msg = document.getElementById("typingMsg");
  if (msg) msg.remove();
}

function setAvatarState(mood = "calm", status = "", speaking = false, walking = false) {
  avatar.classList.remove("mood-calm", "mood-distress", "mood-success", "walking", "speaking");
  
  if (mood === "distress") {
    avatar.classList.add("mood-distress");
  } else if (mood === "success") {
    avatar.classList.add("mood-success");
  } else {
    avatar.classList.add("mood-calm");
  }

  if (speaking) avatar.classList.add("speaking");
  if (walking) avatar.classList.add("walking");

  if (window.avatar3dController) {
    window.avatar3dController.setMood(mood);
    window.avatar3dController.setSpeaking(Boolean(speaking));
    window.avatar3dController.setWalking(Boolean(walking));
  }

  if (status) avatarStatus.textContent = status;
}

function updateEmotionDisplay(analysis, resource) {
  emotionEl.textContent = analysis.primary_emotion || "-";
  riskEl.textContent = analysis.risk_level || "-";
  confidenceEl.textContent = (Number(analysis.confidence) * 100).toFixed(0) + "%";
  intensityEl.textContent = (Number(analysis.intensity) * 10).toFixed(1) + "/10";
  rationaleEl.textContent = analysis.rationale || "Analyzing your emotional state...";
  resourceEl.textContent = resource || "No specific referral needed right now.";

  // Update mood based on analysis
  const isDistress = analysis.risk_level === "high" || 
    (analysis.risk_level === "moderate" && Number(analysis.intensity) > 0.7);
  
  if (isDistress) {
    setAvatarState("distress", "I sense you need support...", false);
  } else if (analysis.risk_level === "low") {
    setAvatarState("success", "You're in a good place.", false);
  } else {
    setAvatarState("calm", "I'm here to listen.", false);
  }
}

// ===== BACKEND TTS AUDIO =====
async function speakText(text) {
  if (!audioEnabled) {
    setAvatarState("calm", "Audio is off. Turn on Audio to hear voice.", false, false);
    return;
  }

  stopSpeech("Preparing audio...");

  try {
    const ttsResponse = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS failed: ${ttsResponse.status}`);
    }

    const audioBlob = await ttsResponse.blob();
    currentAudioUrl = URL.createObjectURL(audioBlob);
    currentAudio = new Audio(currentAudioUrl);

    currentAudio.onplay = () => {
      isSpeaking = true;
      setAvatarState("calm", "Speaking to you with care...", true, false);
      pauseBtn.disabled = false;
      if (stopAudioBtn) stopAudioBtn.disabled = false;
    };

    currentAudio.onended = () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
      }
      currentAudio = null;
      isSpeaking = false;
      setAvatarState("calm", "I'm listening...", false, false);
      pauseBtn.disabled = true;
      pauseBtn.textContent = "⏸";
      if (stopAudioBtn) stopAudioBtn.disabled = true;
    };

    currentAudio.onerror = () => {
      stopSpeech("Audio playback failed.");
    };

    await currentAudio.play();
  } catch (error) {
    console.error("Backend audio error:", error);
    speakWithBrowserFallback(text);
  }
}

function getFemaleVoice() {
  const voices = window.speechSynthesis.getVoices();
  const femaleKeywords = ["female", "woman", "samantha", "karen", "moira", "victoria", "fiona", "zira"];
  let femaleVoice = voices.find((v) =>
    femaleKeywords.some((keyword) => v.name.toLowerCase().includes(keyword))
  );
  if (!femaleVoice && voices.length > 1) {
    femaleVoice = voices.find((v) => !v.name.includes("Male"));
  }
  return femaleVoice || voices[0];
}

function speakWithBrowserFallback(text) {
  if (!audioEnabled) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.15;
    utterance.volume = 1;

    const v = getFemaleVoice();
    if (v) utterance.voice = v;

    utterance.onstart = () => {
      isSpeaking = true;
      currentUtterance = utterance;
      setAvatarState("calm", "Speaking (fallback mode)...", true, false);
      pauseBtn.disabled = false;
      if (stopAudioBtn) stopAudioBtn.disabled = false;
    };

    utterance.onend = () => {
      isSpeaking = false;
      currentUtterance = null;
      pauseBtn.disabled = true;
      pauseBtn.textContent = "⏸";
      if (stopAudioBtn) stopAudioBtn.disabled = true;
      setAvatarState("calm", "I'm listening...", false, false);
    };

    utterance.onerror = () => {
      stopSpeech("Audio unavailable right now.");
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    stopSpeech("Audio unavailable right now.");
  }
}

// ===== EVENT LISTENERS =====

// Chat Form Submit
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  sendBtn.disabled = true;
  setAvatarState("calm", "Thinking carefully about what you said...", false, true);
  addTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    removeTypingIndicator();
    addMessage(data.reply, "bot");
    updateEmotionDisplay(data.analysis, data.resource_suggestion);

    // Give a short delay before speaking
    await new Promise((resolve) => setTimeout(resolve, 250));
    await speakText(data.reply);
  } catch (error) {
    removeTypingIndicator();
    addMessage("I had trouble processing that. Please try again.", "bot");
    setAvatarState("distress", "Connection issue. Please retry.", false);
    console.error("Error:", error);
  } finally {
    sendBtn.disabled = false;
  }
});

// Pause/Resume Button
pauseBtn.addEventListener("click", (event) => {
  event.preventDefault();
  
  if (!isSpeaking) return;

  if (currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play().catch(() => {
        stopSpeech("Unable to resume audio.");
      });
      pauseBtn.textContent = "⏸";
      setAvatarState("calm", "Continuing...", true, false);
    } else {
      currentAudio.pause();
      pauseBtn.textContent = "▶";
      setAvatarState("calm", "Paused.", false, false);
    }
    return;
  }

  if (currentUtterance) {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      pauseBtn.textContent = "⏸";
      setAvatarState("calm", "Continuing...", true, false);
    } else {
      window.speechSynthesis.pause();
      pauseBtn.textContent = "▶";
      setAvatarState("calm", "Paused.", false, false);
    }
  } else {
    pauseBtn.disabled = true;
  }
});

if (audioToggleBtn) {
  audioToggleBtn.addEventListener("click", (event) => {
    event.preventDefault();
    audioEnabled = !audioEnabled;
    localStorage.setItem("serenetalk_audio_enabled", String(audioEnabled));
    updateAudioToggleUi();

    if (!audioEnabled) {
      stopSpeech("Audio is off.");
    } else {
      setAvatarState("calm", "Audio is on. I can speak now.", false, false);
    }
  });
}

if (stopAudioBtn) {
  stopAudioBtn.addEventListener("click", (event) => {
    event.preventDefault();
    stopSpeech("Speech stopped.");
  });
}

// Voice Input Button
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && voiceBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  voiceBtn.addEventListener("click", (event) => {
    event.preventDefault();
    
    if (isSpeaking) {
      // Stop current speech if speaking
      stopSpeech("Speech stopped.");
    } else {
      // Start voice recognition
      voiceBtn.textContent = "...";
      voiceBtn.disabled = true;
      setAvatarState("calm", "Tell me what's on your mind...", false, false);
      recognition.start();
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript || "";
    userInput.value = transcript;
    setAvatarState("calm", "Got it! Ready to send?", false, false);
  };

  recognition.onend = () => {
    voiceBtn.textContent = "🎤";
    voiceBtn.disabled = false;
  };

  recognition.onerror = (event) => {
    addMessage("Couldn't hear that clearly. Please type instead.", "bot");
    setAvatarState("distress", "Voice recognition failed.", false);
    voiceBtn.textContent = "🎤";
    voiceBtn.disabled = false;
  };
} else if (voiceBtn) {
  voiceBtn.disabled = true;
  voiceBtn.textContent = "🎤 Not Supported";
}

// Quick Prompt Buttons
quickBtns.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    userInput.value = btn.dataset.prompt || "";
    userInput.focus();
  });
});

// Welcome Message
addMessage("Hi there! 👋 I'm here to listen and support you. Tell me what's on your mind.", "bot");
setAvatarState("calm", "Ready to listen...", false);
updateAudioToggleUi();

// Auto-grow textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});