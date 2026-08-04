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
        json={
            "model": "openrouter/auto",
            "messages": messages
        }
    )

    print("Status Code:", response.status_code)
    print("Response Text:", response.text)

    result = response.json()

    if response.status_code != 200:
        return f"OpenRouter Error: {result}"

    if "choices" not in result:
        return f"Unexpected Response: {result}"

    return result["choices"][0]["message"]["content"]