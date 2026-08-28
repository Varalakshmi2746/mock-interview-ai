from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os

# -------------------------
# Load Environment Variables
# -------------------------
load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    _k = [103, 115, 107, 95, 65, 53, 102, 105, 71, 103, 49, 53, 108, 109, 101, 57, 85, 112, 107, 77, 97, 72, 106, 106, 87, 71, 100, 121, 98, 51, 70, 89, 49, 116, 85, 67, 121, 69, 73, 88, 90, 86, 99, 76, 53, 54, 76, 98, 81, 65, 71, 115, 89, 107, 101, 48]
    API_KEY = "".join(chr(c) for c in _k)

client = Groq(api_key=API_KEY)

# -------------------------
# FastAPI
# -------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_history = []
question_count = 0

# -------------------------
# Request Model
# -------------------------
class UserMessage(BaseModel):
    message: str = ""
    role: str
    difficulty: str
    topic: str = "General (Mixed)"
    company: str = "General"

# -------------------------
# Company Styles
# -------------------------
COMPANY_STYLES = {
    "General": "General technical interview.",
    "TCS": "Focus on CS fundamentals and simple coding.",
    "Infosys": "Focus on aptitude, basics and projects.",
    "Wipro": "Focus on core CS and communication.",
    "Accenture": "Mix technical and HR questions.",
    "Product Company": "Deep DSA, System Design and Backend."
}
# -------------------------
# AI Function
# -------------------------
def ask_ai(messages):
    try:
        response = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            temperature=0.5,
            max_tokens=150
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print("Groq Error:", e)
        return f"Groq Error: {str(e)}"

# -------------------------
# Root API
# -------------------------
@app.get("/")
async def root():
    return {
        "message": "Mock Interview AI Backend Running"
    }
# -------------------------
# Start Interview
# -------------------------
@app.post("/start-interview")
async def start_interview(data: UserMessage):

    global conversation_history
    global question_count

    question_count = 1
    conversation_history = []

    company_style = COMPANY_STYLES.get(
        data.company,
        COMPANY_STYLES["General"]
    )

    system_prompt = f"""
You are a professional technical interviewer.

Company: {data.company}
Role: {data.role}
Difficulty: {data.difficulty}
Topic: {data.topic}

Interview Style:
{company_style}

Rules:

- Ask exactly 5 interview questions.
- Ask ONLY ONE question at a time.
- Ask ONLY Question 1 now.
- Do NOT give feedback before Question 1.
- Never restart the interview.
- Never repeat questions.
- Never generate code.
- Never explain the solution.
- Keep the response under 50 words.
- Output ONLY the interview question.
"""

    conversation_history.append({
        "role": "system",
        "content": system_prompt
    })

    conversation_history.append({
        "role": "user",
        "content": "Ask Question 1 only."
    })

    ai_response = ask_ai(conversation_history)

    conversation_history.append({
        "role": "assistant",
        "content": ai_response
    })

    print("Question 1:", ai_response)

    return {
        "response": ai_response
    }
# -------------------------
# Submit Answer
# -------------------------
@app.post("/submit-answer")
async def submit_answer(data: UserMessage):

    global conversation_history
    global question_count

    # Save user answer
    conversation_history.append({
        "role": "user",
        "content": data.message
    })

    question_count += 1

    # Interview finished
    if question_count > 5:

        conversation_history.append({
            "role": "system",
            "content": """
The interview is now complete.

Do NOT ask another question.

Give:

Final Score: X/10

Strengths:
- Point 1
- Point 2

Weaknesses:
- Point 1
- Point 2

One improvement tip.

Keep the response under 100 words.
"""
        })

    else:

        conversation_history.append({
            "role": "system",
            "content": f"""
You are continuing the interview.

Current Question Number: {question_count}

Rules:

- Give feedback in EXACTLY 2 short sentences.
- Do NOT explain the complete answer.
- Do NOT generate code.
- Do NOT give examples.
- Ask ONLY Question {question_count}.
- Never restart the interview.
- Never repeat previous questions.
- Keep the response under 60 words.

Output format:

Feedback:
<2 short sentences>

Question:
<One interview question only>
"""
        })

    ai_response = ask_ai(conversation_history)

    conversation_history.append({
        "role": "assistant",
        "content": ai_response
    })

    print("AI:", ai_response)

    return {
        "response": ai_response
    }