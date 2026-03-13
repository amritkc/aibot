const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatLog = document.getElementById("chatLog");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const breathBtn = document.getElementById("breathBtn");
const avatar = document.getElementById("avatar");
const avatarStatus = document.getElementById("avatarStatus");
const chips = document.querySelectorAll(".chip[data-prompt]");

const emotion = document.getElementById("emotion");
const intensity = document.getElementById("intensity");
const risk = document.getElementById("risk");
const confidence = document.getElementById("confidence");
const rationale = document.getElementById("rationale");
const resource = document.getElementById("resource");

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
  div.innerHTML =
    '<span class="typing-indicator"><span></span><span></span><span></span></span>';
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById("typingMsg");
  if (typing) typing.remove();
}

function setAvatarState(mood, status, speaking = false, walking = false) {
  avatar.classList.remove("mood-calm", "mood-distress", "walking");
  avatar.classList.add(mood === "distress" ? "mood-distress" : "mood-calm");

  if (speaking) avatar.classList.add("speaking");
  else avatar.classList.remove("speaking");

  if (walking) avatar.classList.add("walking");

  avatarStatus.textContent = status;
}

function animateBotSpeaking(text) {
  const duration = Math.max(1200, Math.min(4200, text.length * 30));
  setAvatarState("calm", "Companion is speaking with care.", true, false);
  setTimeout(() => {
    setAvatarState("calm", "Companion is calm and listening.", false, false);
  }, duration);
}

function updateAnalysis(analysis, resourceSuggestion) {
  emotion.textContent = analysis.primary_emotion;
  intensity.textContent = Number(analysis.intensity).toFixed(2);
  risk.textContent = analysis.risk_level;
  confidence.textContent = Number(analysis.confidence).toFixed(2);
  rationale.textContent = analysis.rationale;
  resource.textContent = resourceSuggestion || "No specific referral needed right now";

  const distressMood =
    analysis.risk_level === "high" ||
    (analysis.risk_level === "moderate" && Number(analysis.intensity) > 0.7);

  if (distressMood) {
    setAvatarState("distress", "Companion senses distress and is focusing support.", false);
  } else {
    setAvatarState("calm", "Companion is calm and listening.", false);
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  sendBtn.disabled = true;
  sendBtn.textContent = "Thinking...";
  setAvatarState("calm", "Companion is pacing and analyzing how you feel...", false, true);
  addTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const data = await response.json();
    removeTypingIndicator();
    addMessage(data.reply, "bot");
    updateAnalysis(data.analysis, data.resource_suggestion);
    animateBotSpeaking(data.reply);
  } catch (error) {
    removeTypingIndicator();
    addMessage(
      "I could not process that right now. Please try again in a moment.",
      "bot"
    );
    setAvatarState("distress", "Companion hit a connection issue. Try once more.", false);
    console.error(error);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});

addMessage(
  "Hi, I am here to listen. You can share what has been on your mind today.",
  "bot"
);
setAvatarState("calm", "Companion is calm and listening.", false);

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    userInput.value = chip.dataset.prompt || "";
    userInput.focus();
  });
});

if (breathBtn) {
  breathBtn.addEventListener("click", async () => {
    const steps = [
      "Breathe in for 4 seconds.",
      "Hold for 4 seconds.",
      "Breathe out for 6 seconds.",
      "Nice work. Repeat this cycle 3 times.",
    ];

    setAvatarState("calm", "Companion is guiding a breathing pause.", true);
    for (const step of steps) {
      addMessage(step, "bot");
      await new Promise((resolve) => setTimeout(resolve, 1600));
    }
    setAvatarState("calm", "Companion is calm and listening.", false);
  });
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && voiceBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.addEventListener("click", () => {
    voiceBtn.disabled = true;
    voiceBtn.textContent = "Listening...";
    recognition.start();
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript || "";
    userInput.value = transcript;
    setAvatarState("calm", "Companion captured your voice input.", false);
  };

  recognition.onend = () => {
    voiceBtn.disabled = false;
    voiceBtn.textContent = "Use Voice";
  };

  recognition.onerror = () => {
    addMessage("Voice input failed. Please type your message instead.", "bot");
    setAvatarState("distress", "Companion could not hear clearly. Please type.", false);
  };
} else if (voiceBtn) {
  voiceBtn.disabled = true;
  voiceBtn.textContent = "Voice Not Supported";
}
