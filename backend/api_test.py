import requests

# Step 1: Start interview
start = requests.post(
    "http://127.0.0.1:8000/start-interview",
    json={
        "message": "start",
        "role": "Backend Developer",
        "difficulty": "Medium"
    }
)
print("Question 1:", start.json()["question"])
print()

# Step 2: Submit answer
answer = requests.post(
    "http://127.0.0.1:8000/submit-answer",
    json={
        "message": "Monolithic is single unit, microservices is independent services",
        "role": "Backend Developer",
        "difficulty": "Medium"
    }
)
print("AI Feedback + Q2:", answer.json()["response"])