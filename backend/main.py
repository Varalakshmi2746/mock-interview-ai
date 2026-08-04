from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
print("API Key Loaded:", API_KEY is not None)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_history = []


class UserMessage(BaseModel):
    message: str
    role: str
    difficulty: str
    topic: str = "General (Mixed)"
    company: str = "General"


COMPANY_STYLES = {
    "General": "Ask general technical questions suitable for any software company.",
    "TCS": "Focus on basic CS fundamentals, projects, simple coding, HR questions about teamwork.",
    "Infosys": "Focus on aptitude concepts, basic programming, academic projects, problem solving.",
    "Wipro": "Core CS subjects, basic coding, final year project, communication skills.",
    "Accenture": "Mix of technical and soft skills, communication, basic technical, creativity.",
    "Product Company": "Deep technical, complex DSA, system design, optimization, scalability.",
}


def ask_ai(messages):
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mock-interview-ai.onrender.com",
            "X-Title": "Mock Interview AI",
        },
        json={
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "messages": messages,
            "max_tokens": 300,
            "temperature": 0.7,
        },
    )

    print("Status Code:", response.status_code)
    print("Response Text:", response.text)

    try:
        result = response.json()
    except Exception:
        return "Error: Invalid JSON response from OpenRouter."

    if response.status_code != 200:
        return f"OpenRouter Error: {result}"

    if "choices" not in result:
        return f"Unexpected Response: {result}"

    return result["choices"][0]["message"]["content"]


@app.get("/")
async def root():
    return {"message": "Mock Interview AI Backend Running!"}


@app.post("/start-interview")
async def start_interview(data: UserMessage):
    global conversation_history

    conversation_history = []

    company_style = COMPANY_STYLES.get(data.company, COMPANY_STYLES["General"])

    system_prompt = f"""
You are a strict technical interviewer.

Company: {data.company}
Company interview style: {company_style}
Role: {data.role}
Difficulty: {data.difficulty}
Topic: {data.topic}

Instructions:
- Ask ONLY ONE interview question.
- Wait for the user's answer.
- After every answer, give short feedback.
- Then ask the NEXT question.
- Total questions = 5.
- After question 5, give final score out of 10.
"""

    conversation_history.append({"role": "system", "content": system_prompt})
    conversation_history.append({"role": "user", "content": "Start the interview."})

    ai_reply = ask_ai(conversation_history)

    conversation_history.append({"role": "assistant", "content": ai_reply})

    return {"question": ai_reply}


@app.post("/submit-answer")
async def submit_answer(data: UserMessage):
    global conversation_history

    conversation_history.append({"role": "user", "content": data.message})

    ai_reply = ask_ai(conversation_history)

    conversation_history.append({"role": "assistant", "content": ai_reply})

    return {"response": ai_reply}