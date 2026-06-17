import requests

response = requests.post(
    "http://127.0.0.1:8000/start-interview",
    json={
        "message": "start",
        "role": "Backend Developer",
        "difficulty": "Medium"
    }
)

print("Status:", response.status_code)
print("Response:", response.text)