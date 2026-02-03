import os
import requests
from dotenv import load_dotenv

load_dotenv()

app_id = os.getenv("ADZUNA_APP_ID")
app_key = os.getenv("ADZUNA_APP_KEY")

print(f"Testing Adzuna with ID: {app_id}")

base_url = f"https://api.adzuna.com/v1/api/jobs/gb/search/1"
params = {
    "app_id": app_id,
    "app_key": app_key,
    "what": "python",
    "content-type": "application/json"
}

try:
    response = requests.get(base_url, params=params)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}...")
except Exception as e:
    print(f"Error: {e}")
