# 🎯 Mock Interview AI

### AI-Powered Technical Interview Simulator for CS Students

![Mock Interview AI Demo](demo.png)

## 🔗 Links
- 🌐 Live Demo: (coming soon)
- 📹 Demo Video: (coming soon)

---

## 💡 What is This?

Most CS students prepare theory but never 
practice actual interview conversation — 
they freeze in real interviews.

**Mock Interview AI** simulates a real technical 
interview with an AI interviewer that:
- Asks role-specific questions
- Gives feedback on your answers
- Asks follow-up questions like a real interviewer
- Generates a final performance report

---

## ✨ Features

- 🤖 AI interviewer with real conversation flow
- 🎯 Role-specific questions (Backend/Frontend/Full Stack/DSA)
- 📊 Difficulty levels (Easy/Medium/Hard)
- 💬 Follow-up questions based on your answers
- 📈 Final performance score
- 🌙 Clean dark UI

---

## 🛠️ Tech Stack

**Frontend:**
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Backend:**
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

**AI:**
![OpenRouter](https://img.shields.io/badge/OpenRouter_AI-FF6B6B?style=for-the-badge)

---

## 📁 Project Structure

```
mock-interview-ai/
├── backend/
│   ├── main.py          # FastAPI server
│   ├── api_test.py      # API testing
│   └── .env             # API keys (not in repo)
├── frontend/
│   ├── src/
│   │   ├── App.js       # Main React component
│   │   └── index.css    # Tailwind styles
│   └── package.json
└── README.md
```

---

## 🚀 Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenRouter API Key (free at openrouter.ai)

### Backend Setup
```bash
cd backend
pip install fastapi uvicorn requests python-dotenv
```

Create `.env` file:
```
OPENROUTER_API_KEY=your-key-here
```

Run backend:
```bash
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

Open: `http://localhost:3000`

---

## 🎮 How to Use

```
1. Select your role (Backend/Frontend/DSA)
2. Choose difficulty (Easy/Medium/Hard)
3. Click "Start Interview"
4. Answer AI interviewer's questions
5. Get feedback + next question
6. Complete 5 questions → See final score
```

---

## 🤔 Why This Project?

Existing tools like InterviewBit give static 
question banks — no conversation flow.

This project simulates a **real interview** where:
- AI asks follow-up questions
- Evaluates your actual explanation
- Gives personalized feedback

---

## 👩‍💻 Developer

**M Varalakshmi**
- GitHub: [@Varalakshmi2746](https://github.com/Varalakshmi2746)
- 3rd Year CSE Student

---

## 📄 License

MIT License — feel free to use and modify!
