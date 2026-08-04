import requests

res = requests.post(
    "http://127.0.0.1:8000/start-interview",
    json={
        "message": "start",
        "role": "Backend Developer",
        "difficulty": "Medium",
        "topic": "General (Mixed)",
        "company": "General"
    }
)

print(res.status_code)
print(res.text)