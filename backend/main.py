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
    return result["choices"][0]["message"]["content"]

@app.get("/")
async def root():
    return {"message": "Mock Interview AI Backend Running!"}

@app.post("/start-interview")
async def start_interview(data: UserMessage):
    global conversation_history
    conversation_history = []

    system_prompt = f"""You are a strict but encouraging technical interviewer
    for a software company interviewing for {data.role} role.
    Difficulty: {data.difficulty}.
    Topic Focus: {data.topic}.
    Rules:
    - Ask ONE question at a time
    - Questions must be specifically about {data.topic}
    - After candidate answers give brief feedback
    - Then ask next question
    - Ask total 5 questions only
    - After 5 questions say INTERVIEW COMPLETE and give final score out of 10"""

    conversation_history.append({
        "role": "system",
        "content": system_prompt
    })

    conversation_history.append({
        "role": "user",
        "content": f"I am ready. Please start my {data.role} interview focusing on {data.topic}."
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