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
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )

        return response.choices[0].message.content

    except Exception as e:
        print("Groq Error:", e)
        return f"Groq Error: {str(e)}"