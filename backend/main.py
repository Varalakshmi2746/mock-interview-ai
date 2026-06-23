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
    "TCS": """You are a TCS interviewer. TCS interview style:
    - Focus on basic CS fundamentals (OOPs, DBMS, OS, Networks)
    - Ask about projects and internships
    - Simple coding questions
    - HR questions about teamwork and adaptability
    - Questions about TCS values and culture fit""",
    "Infosys": """You are an Infosys interviewer. Infosys interview style:
    - Focus on aptitude and logical reasoning concepts
    - Basic programming and data structures
    - Ask about academic projects
    - Questions about problem solving approach
    - Behavioral questions about work ethics""",
    "Wipro": """You are a Wipro interviewer. Wipro interview style:
    - Core CS subjects focus
    - Basic coding and algorithms
    - Ask about final year project
    - Communication skills assessment
    - Questions about flexibility and learning ability""",
    "Accenture": """You are an Accenture interviewer. Accenture interview style:
    - Mix of technical and soft skills
    - Focus on communication and presentation
    - Basic technical questions
    - Case study approach
    - Questions about innovation and creativity""",
    "Product Company": """You are a product company interviewer. Style:
    - Deep technical questions
    - Complex DSA and algorithms
    - System design questions
    - Problem solving approach matters
    - Focus on optimization and scalability""",
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
    return result["choices"][0]["message"]["content"]

@app.get("/")
async def root():
    return {"message": "Mock Interview AI Backend Running!"}

@app.post("/start-interview")
async def start_interview(data: UserMessage):
    global conversation_history
    conversation_history = []

    company_style = COMPANY_STYLES.get(data.company, COMPANY_STYLES["General"])

    system_prompt = f"""You are a strict but encouraging technical interviewer
    for {data.company} company interviewing for {data.role} role.
    Difficulty: {data.difficulty}.
    Topic Focus: {data.topic}.
    
    Company Interview Style:
    {company_style}
    
    Rules:
    - Ask ONE question at a time
    - Questions must match {data.company} interview style
    - Questions must be related to {data.topic}
    - After candidate answers give brief feedback
    - Then ask next question
    - Ask total 5 questions only
    - After 5 questions say INTERVIEW COMPLETE and give final score out of 10
    - In final feedback mention if candidate is ready for {data.company}"""

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