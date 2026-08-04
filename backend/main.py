from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OPENROUTER_API_KEY")
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
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        data=json.dumps({
            "model": "openrouter/auto",
            "messages": messages
        })
    )
    result = response.json()
    print("Status Code:", response.status_code)
    print("OpenRouter Response:", result)
    return result["choices"][0]["message"]["content"]

@app.get("/")
async def root():
    return {"message": "Mock Interview AI Backend Running!"}

@app.post("/start-interview")
async def start_interview(data: UserMessage):
    global conversation_history
    conversation_history = []

    company_style = COMPANY_STYLES.get(data.company, COMPANY_STYLES["General"])

    system_prompt = f"""You are a strict technical interviewer for {data.company} company.
Role: {data.role}
Difficulty: {data.difficulty}
Topic: {data.topic}
Style: {company_style}

STRICT RULES:
- Ask EXACTLY 5 questions numbered Question 1 to Question 5
- After each answer give brief feedback (2-3 lines max)
- After Question 5 answer write INTERVIEW COMPLETE and give final score out of 10
- Do not ask questions outside the specified topic
- Do not ask Question 6 or beyond"""

    conversation_history.append({
        "role": "system",
        "content": system_prompt
    })

    conversation_history.append({
        "role": "user",
        "content": f"I am ready. Please start my {data.company} {data.role} interview."
    })

    ai_response = ask_ai(conversation_history)

    conversation_history.append({
        "role": "assistant",
        "content": ai_response
    })

    return {"question": ai_response}

@app.post("/submit-answer")
async def submit_answer(data: UserMessage):
    global conversation_history

    conversation_history.append({
        "role": "user",
        "content": data.message
    })

    ai_response = ask_ai(conversation_history)

    conversation_history.append({
        "role": "assistant",
        "content": ai_response
    })

    return {"response": ai_response}