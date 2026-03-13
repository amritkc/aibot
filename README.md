# AI Mental Health Chatbot with Emotional Analysis

A FastAPI + JavaScript prototype for emotionally aware support conversations, built for the Build for Bengaluru 2.0 challenge.

## Features

- Emotion analysis from user text (primary emotion, intensity, risk, confidence)
- Optional browser voice-to-text input (Web Speech API)
- Supportive chatbot replies generated through Groq LLM
- Basic crisis keyword detection with immediate escalation messaging
- Frontend dashboard showing emotional analysis and resource suggestions
- Mobile-friendly and polished UI

## Tech Stack

- Backend: FastAPI
- LLM: Groq Python SDK
- Frontend: Vanilla JavaScript + CSS

## Project Structure

```text
app/
  main.py
  models.py
  services/
    groq_client.py
    prompts.py
    safety.py
  utils/
    helpers.py
frontend/
  index.html
  styles.css
  app.js
requirements.txt
.env.example
```

## Setup

1. Create a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create `.env` from `.env.example` and set your API key:

```bash
GROQ_API_KEY=your_real_key
```

If you accidentally exposed a real API key publicly, rotate it in your Groq dashboard.

4. Run the server:

```bash
uvicorn app.main:app --reload
```

5. Open in browser:

- http://127.0.0.1:8000/

## API Endpoints

- `GET /api/health`
- `POST /api/chat`
  - Request:
    ```json
    { "message": "I feel overwhelmed and anxious." }
    ```

## Safety Note

This prototype is not a medical device and does not provide diagnosis. It provides supportive guidance and suggests professional help where risk indicators are present.
